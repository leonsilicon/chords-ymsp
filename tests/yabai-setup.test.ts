import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { resolveBunExecutable } from "../src/lib/bun-executable";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  augmentYabaiConfig,
  installYabaiHooks,
  activateYabaiHooks,
  disableYabaiHooks,
  findYabaiConfig,
} from "../src/lib/yabai-setup";

let root: string;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-yabai-' "));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
describe("yabai setup", () => {
  it("preserves existing shell code and installs an idempotent managed block", () => {
    const original = "#!/bin/sh\nyabai -m config layout bsp\n";
    const updated = augmentYabaiConfig(original, "/a path/it's/hook.sh");
    expect(updated.startsWith(original)).toBe(true);
    expect(augmentYabaiConfig(updated, "/a path/it's/hook.sh")).toBe(updated);
    expect(() => augmentYabaiConfig("# BEGIN chords-ymsp managed hooks", "/hook")).toThrow(
      "Malformed",
    );
  });
  it("preserves symlinks and executable permissions, backs up, and launches literal arguments", () => {
    const target = path.join(root, "dotfile");
    const configPath = path.join(root, "yabairc");
    const hook = path.join(root, "hook.js");
    fs.writeFileSync(target, "#!/bin/sh\n# user config\n", { mode: 0o755 });
    fs.symlinkSync(target, configPath);
    fs.writeFileSync(hook, "console.log(JSON.stringify(process.argv.slice(2)))");
    const options = { windowManager: "yabai" as const, lockfilePath: "/shared/task.lock" };
    const result = installYabaiHooks(options, { configPath }, hook, root);
    expect(fs.lstatSync(configPath).isSymbolicLink()).toBe(true);
    expect(fs.statSync(target).mode & 0o777).toBe(0o755);
    expect(fs.readFileSync(result.backupPath!, "utf8")).toBe("#!/bin/sh\n# user config\n");
    expect(installYabaiHooks(options, { configPath }, hook, root).backupPath).toBeUndefined();
    expect(
      JSON.parse(execFileSync("/bin/sh", [result.runner, "window-created"], { encoding: "utf8" })),
    ).toEqual([result.settingsPath, "window-created"]);
    const source = fs.readFileSync(configPath, "utf8");
    disableYabaiHooks(root);
    expect(JSON.parse(fs.readFileSync(result.settingsPath, "utf8")).enabled).toBe(false);
    expect(fs.readFileSync(configPath, "utf8")).toBe(source);
  });
  it("registers idempotently through the shipped Bun hook and real subprocesses", async () => {
    const fake = path.join(root, "yabai");
    const signals = path.join(root, "signals.json");
    fs.writeFileSync(
      signals,
      JSON.stringify([
        { index: 0, label: "user", event: "window_created", action: "user callback" },
      ]),
    );
    fs.writeFileSync(
      fake,
      `#!${resolveBunExecutable()}
import fs from "node:fs";
const file = ${JSON.stringify(signals)};
const args = process.argv.slice(2);
if (args[1] === "query") { console.log("[]"); process.exit(0); }
let signals = JSON.parse(fs.readFileSync(file, "utf8"));
if (args[2] === "--list") console.log(JSON.stringify(signals));
else if (args[2] === "--remove") signals.splice(Number(args[3]), 1);
else if (args[2] === "--add") signals.push(Object.fromEntries(args.slice(3).map(arg => {const i = arg.indexOf("="); return [arg.slice(0, i), arg.slice(i + 1)];})));
else process.exit(1);
fs.writeFileSync(file, JSON.stringify(signals.map((signal, index) => ({ ...signal, index }))));
`,
      { mode: 0o755 },
    );
    const installation = installYabaiHooks(
      { windowManager: "yabai", yabaiPath: fake, lockfilePath: path.join(root, "task.lock") },
      { configPath: path.join(root, "yabairc") },
      path.resolve(import.meta.dirname, "../js/yabai-hook.js"),
      root,
    );
    await activateYabaiHooks(installation);
    await activateYabaiHooks(installation);
    const registered = JSON.parse(fs.readFileSync(signals, "utf8"));
    expect(registered.map((signal: { label: string }) => signal.label)).toEqual([
      "user",
      "chords-ymsp-window_created",
      "chords-ymsp-window_destroyed",
    ]);
    expect(registered[1].action).toContain("window-created");
    expect(fs.existsSync(path.join(root, "task.lock"))).toBe(false);
  });
  it("discovers XDG before the legacy config", () => {
    fs.writeFileSync(path.join(root, ".yabairc"), "");
    expect(findYabaiConfig(root, "")).toBe(path.join(root, ".yabairc"));
    const file = path.join(root, "xdg/yabai/yabairc");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "");
    expect(findYabaiConfig(root, path.join(root, "xdg"))).toBe(file);
  });
});
