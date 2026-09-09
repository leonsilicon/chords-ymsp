import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { augmentAerospaceConfig } from "../src/lib/aerospace-config";
import { getStaticTOMLValue, parseTOML } from "toml-eslint-parser";

// Opt-in: dry-run reads the active config path. Temporarily stage the candidate
// there only with auto-reload disabled, and restore the exact original in finally.
describe.skipIf(process.env.YMSP_AEROSPACE_CONFIG_TEST !== "1")(
  "AeroSpace native config validation",
  () => {
    const aerospace = process.env.YMSP_AEROSPACE_PATH ?? "/opt/homebrew/bin/aerospace";
    const run = (...args: string[]) =>
      execFileSync(aerospace, args, {
        encoding: "utf8",
        timeout: 15000,
        stdio: ["ignore", "pipe", "pipe"],
      });
    let server: ChildProcess | undefined;
    let directory: string | undefined;
    beforeAll(async () => {
      try {
        run("config", "--config-path");
      } catch {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), "chords-ymsp-native-"));
        const config = path.join(directory, "aerospace.toml");
        fs.writeFileSync(config, "config-version = 2\n");
        server = spawn(
          "/Applications/AeroSpace.app/Contents/MacOS/AeroSpace",
          ["--read-only", "--config-path", config],
          { stdio: "ignore" },
        );
        await vi.waitFor(() => expect(run("config", "--config-path").trim()).toBe(config), {
          timeout: 10000,
        });
      }
    });
    afterAll(async () => {
      if (server && server.exitCode === null && server.signalCode === null) {
        const stopped = new Promise<void>((resolve) => server!.once("exit", () => resolve()));
        server.kill("SIGTERM");
        await stopped;
      }
      if (directory) fs.rmSync(directory, { recursive: true, force: true });
    });
    it.each(["user", "legacy", "empty"])(
      "accepts augmented %s config in AeroSpace 0.21.3 without loading it",
      (variant) => {
        expect(run("--version")).toContain("0.21.3-Beta");
        const filename = fs.realpathSync(run("config", "--config-path").trim());
        const original = fs.readFileSync(filename, "utf8");
        expect(getStaticTOMLValue(parseTOML(original))["auto-reload-config"]).not.toBe(true);
        const userConfig = path.join(os.homedir(), ".aerospace.toml");
        let source =
          server && fs.existsSync(userConfig) ? fs.readFileSync(userConfig, "utf8") : original;
        if (variant === "empty") source = "";
        if (variant === "legacy")
          source =
            '[[on-window-detected]]\nif.app-id = "com.apple.Terminal"\nrun = "layout floating"\n';
        const candidate = augmentAerospaceConfig(
          source,
          "/bin/sh '/tmp/chords-ymsp-validation-only.sh'",
        );
        const backup = path.join(os.tmpdir(), `chords-ymsp-native-${crypto.randomUUID()}.toml`);
        fs.copyFileSync(filename, backup, fs.constants.COPYFILE_EXCL);
        try {
          fs.writeFileSync(filename, candidate);
          expect(run("reload-config", "--dry-run", "--no-gui")).toBe("");
        } finally {
          if (fs.readFileSync(filename, "utf8") === candidate) {
            fs.writeFileSync(filename, original);
            fs.unlinkSync(backup);
          } else console.error(`Config edited concurrently; original preserved at ${backup}`);
        }
        expect(fs.readFileSync(filename, "utf8")).toBe(original);
      },
    );
  },
);
