import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { YMSPOptions } from "yabai-master-stack-plugin";
import { resolveBunExecutable } from "./bun-executable";
import { augmentAerospaceConfig } from "./aerospace-config";

export interface AerospaceSetupOptions {
  /** Required when AeroSpace was launched with --config-path. */
  configPath?: string;
  /** Absolute Bun executable, when Chord's process.execPath is not Bun. */
  bunPath?: string;
}

export function findAerospaceConfig(
  home = os.homedir(),
  xdg = process.env.XDG_CONFIG_HOME,
): string {
  const candidates = [
    path.join(home, ".aerospace.toml"),
    path.join(xdg || path.join(home, ".config"), "aerospace/aerospace.toml"),
  ];
  const existing = candidates.filter((candidate) => fs.existsSync(candidate));
  if (existing.length > 1)
    throw new Error("Multiple AeroSpace configs found; set aerospaceSetup.configPath explicitly");
  return existing[0] ?? candidates[0]!;
}

export const shellQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

export function writeIfChanged(filename: string, content: string, mode = 0o600): boolean {
  if (fs.existsSync(filename) && fs.readFileSync(filename, "utf8") === content) return false;
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, content, { mode, flag: "wx" });
    fs.renameSync(temporary, filename);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  return true;
}

export interface HookSettings {
  enabled: boolean;
  options: YMSPOptions;
}

/** Install files first; reload and start the watcher separately so setup failures are observable. */
export function installAerospaceHooks(
  options: YMSPOptions,
  setup: AerospaceSetupOptions,
  hookModule: string,
  directory = path.join(os.homedir(), ".config/chords-ymsp"),
) {
  // Resolve symlinks so dotfile-manager links survive atomic replacement.
  const requested = path.resolve(setup.configPath ?? findAerospaceConfig());
  const filename = fs.existsSync(requested) ? fs.realpathSync(requested) : requested;
  const original = fs.existsSync(filename) ? fs.readFileSync(filename, "utf8") : "";
  const runner = path.join(directory, "aerospace-hook.sh");
  const settingsPath = path.join(directory, "aerospace-settings.json");
  const updated = augmentAerospaceConfig(original, `/bin/sh ${shellQuote(runner)}`);
  const bun = resolveBunExecutable(setup.bunPath);
  if (!path.isAbsolute(bun)) throw new Error("aerospaceSetup.bunPath must be absolute");
  if (!fs.existsSync(hookModule))
    throw new Error(`Missing AeroSpace hook module: ${hookModule}; run vp pack`);
  // Runtime-only dependencies cannot be reproduced in callback subprocesses.
  if (options.spawn || options.logger)
    throw new Error(
      "AeroSpace setup cannot serialize spawn/logger; use aerospaceSetup: false for an embedded runtime",
    );
  const settings =
    JSON.stringify({ enabled: true, options } satisfies HookSettings, null, 2) + "\n";
  writeIfChanged(settingsPath, settings);
  writeIfChanged(
    runner,
    `#!/bin/sh\numask 077\nexec ${shellQuote(bun)} ${shellQuote(hookModule)} ${shellQuote(settingsPath)} "$@" 2>>${shellQuote(path.join(directory, "aerospace.log"))}\n`,
  );
  let backupPath: string | undefined;
  if (updated !== original) {
    if (fs.existsSync(filename)) {
      backupPath = `${filename}.chords-ymsp.${crypto.randomUUID()}.bak`;
      fs.copyFileSync(filename, backupPath, fs.constants.COPYFILE_EXCL);
    }
    // Avoid overwriting edits made while setup was preparing the hooks.
    if ((fs.existsSync(filename) ? fs.readFileSync(filename, "utf8") : "") !== original)
      throw new Error("AeroSpace config changed during setup; retry setup");
    writeIfChanged(
      filename,
      updated,
      fs.existsSync(filename) ? fs.statSync(filename).mode & 0o777 : 0o600,
    );
  }
  return { configPath: filename, backupPath, changed: updated !== original, runner, settingsPath };
}

export async function activateAerospaceHooks(
  installation: ReturnType<typeof installAerospaceHooks>,
  aerospacePath: string,
) {
  const execute = promisify(execFile);
  const { stdout } = await execute(aerospacePath, ["config", "--config-path"], { timeout: 15_000 });
  const active = stdout.trim();
  if (!active || fs.realpathSync(active) !== fs.realpathSync(installation.configPath))
    throw new Error(
      `AeroSpace is using ${active || "its default config"}; set aerospaceSetup.configPath to its active config`,
    );
  // Check AeroSpace's schema as well as TOML syntax before activating any handlers.
  await execute(aerospacePath, ["reload-config", "--dry-run", "--no-gui"], { timeout: 15_000 });
  // Always reload: a previous setup may have written the file while AeroSpace was stopped.
  await execute(aerospacePath, ["reload-config", "--no-gui"], { timeout: 15_000 });
  const child = spawn("/bin/sh", [installation.runner, "watch-aerospace"], {
    detached: true,
    env: { ...process.env, CHORD_YMSP_READY: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(new Error("AeroSpace watcher did not become ready; see aerospace.log"));
    }, 15000);
    const finish = (error?: Error) => {
      clearTimeout(timer);
      child.off("error", onError);
      child.off("exit", onExit);
      child.stdout?.off("data", onData);
      child.stdout?.destroy();
      child.stderr?.destroy();
      if (error) reject(error);
      else resolve();
    };
    const onError = (error: Error) => finish(error);
    const onExit = (code: number | null) =>
      finish(new Error(`AeroSpace watcher exited before ready (${code}); see aerospace.log`));
    const onData = (data: Buffer) => {
      output += data.toString();
      if (output.includes("chords-ymsp:ready\n")) finish();
    };
    child.once("error", onError);
    child.once("exit", onExit);
    child.stdout?.on("data", onData);
  });
  child.unref();
}

export function disableAerospaceHooks(directory = path.join(os.homedir(), ".config/chords-ymsp")) {
  const filename = path.join(directory, "aerospace-settings.json");
  if (fs.existsSync(filename))
    writeIfChanged(filename, JSON.stringify({ enabled: false, options: {} }));
}
