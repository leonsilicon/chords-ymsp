import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  disableAerospaceHooks,
  findAerospaceConfig,
  installAerospaceHooks,
  shellQuote,
} from "../src/lib/aerospace-setup";

let root: string;
let configPath: string;
let modulePath: string;
let directory: string;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "chords-ymsp-'$ spaces-"));
  configPath = path.join(root, "aerospace.toml");
  modulePath = path.join(root, "hook.js");
  directory = path.join(root, "managed");
  fs.writeFileSync(modulePath, "");
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
const install = () =>
  installAerospaceHooks(
    { windowManager: "aerospace", resizeIncrement: 2 },
    { configPath },
    modulePath,
    directory,
  );

describe("setup filesystem integration", () => {
  it("writes a backup, preserves permissions, and does not rewrite files on repeat setup", () => {
    fs.writeFileSync(configPath, "# original config\n", { mode: 0o640 });
    const first = install();
    expect(fs.readFileSync(first.backupPath!, "utf8")).toBe("# original config\n");
    expect(fs.statSync(configPath).mode & 0o777).toBe(0o640);
    const files = [configPath, first.runner, first.settingsPath];
    const times = files.map((file) => fs.statSync(file).mtimeMs);
    const second = install();
    expect(second.changed).toBe(false);
    expect(second.backupPath).toBeUndefined();
    expect(files.map((file) => fs.statSync(file).mtimeMs)).toEqual(times);
    expect(fs.statSync(first.settingsPath).mode & 0o777).toBe(0o600);
  });

  it("updates a symlink's target without replacing the symlink", () => {
    const target = path.join(root, "dotfiles.toml");
    fs.writeFileSync(target, "# dotfiles\n");
    fs.symlinkSync(target, configPath);
    const result = install();
    expect(fs.lstatSync(configPath).isSymbolicLink()).toBe(true);
    expect(result.configPath).toBe(fs.realpathSync(target));
    expect(fs.readFileSync(target, "utf8")).toContain("on-window-detected");
  });

  it("creates a missing config and serializes the actual instance options", () => {
    const result = install();
    expect(result.backupPath).toBeUndefined();
    expect(JSON.parse(fs.readFileSync(result.settingsPath, "utf8"))).toEqual({
      enabled: true,
      options: { windowManager: "aerospace", resizeIncrement: 2 },
    });
  });

  it("leaves invalid TOML and all other files untouched", () => {
    fs.writeFileSync(configPath, "broken = [");
    expect(install).toThrow();
    expect(fs.readFileSync(configPath, "utf8")).toBe("broken = [");
    expect(fs.existsSync(directory)).toBe(false);
    expect(fs.readdirSync(root)).toHaveLength(2);
  });

  it("rejects an unbuilt hook before writing config or settings", () => {
    fs.unlinkSync(modulePath);
    expect(install).toThrow("Missing AeroSpace hook module");
    expect(fs.existsSync(configPath)).toBe(false);
    expect(fs.existsSync(directory)).toBe(false);
  });

  it("disables installed hooks without editing user TOML", () => {
    const result = install();
    const source = fs.readFileSync(configPath, "utf8");
    disableAerospaceHooks(directory);
    expect(JSON.parse(fs.readFileSync(result.settingsPath, "utf8")).enabled).toBe(false);
    expect(fs.readFileSync(configPath, "utf8")).toBe(source);
  });

  it("executes the generated launcher with literal paths and separate arguments", () => {
    fs.writeFileSync(modulePath, "console.log(JSON.stringify(process.argv.slice(2)))");
    const result = install();
    const output = execFileSync("/bin/sh", [result.runner, "window-created"], { encoding: "utf8" });
    expect(JSON.parse(output)).toEqual([result.settingsPath, "window-created"]);
  });

  it("runs the shipped Bun hook and respects disabled settings without contacting a window manager", () => {
    const settings = path.join(root, "disabled.json");
    fs.writeFileSync(settings, '{"enabled":false,"options":{}}');
    const hook = path.resolve(import.meta.dirname, "../js/aerospace-hook.js");
    expect(execFileSync("bun", [hook, settings, "watch-aerospace"], { encoding: "utf8" })).toBe("");
    expect(() =>
      execFileSync("bun", [hook, settings, "unknown-task"], { stdio: "pipe" }),
    ).toThrow();
  });

  it("quotes shell metacharacters without evaluation", () => {
    const value = "hello ' \" $HOME `whoami` $(id)\nworld";
    expect(
      execFileSync("/bin/sh", ["-c", `printf %s ${shellQuote(value)}`], { encoding: "utf8" }),
    ).toBe(value);
  });
});

describe("config discovery", () => {
  it("defaults to ~/.aerospace.toml", () =>
    expect(findAerospaceConfig(root, "")).toBe(path.join(root, ".aerospace.toml")));
  it("finds the XDG config", () => {
    const xdg = path.join(root, "xdg");
    const file = path.join(xdg, "aerospace/aerospace.toml");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "");
    expect(findAerospaceConfig(root, xdg)).toBe(file);
    fs.writeFileSync(path.join(root, ".aerospace.toml"), "");
    expect(() => findAerospaceConfig(root, xdg)).toThrow("Multiple AeroSpace configs");
  });
});
