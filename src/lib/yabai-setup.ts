import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { YMSPOptions } from "yabai-master-stack-plugin";
import { shellQuote, writeIfChanged, type HookSettings } from "./aerospace-setup";
import { resolveBunExecutable } from "./bun-executable";

export interface YabaiSetupOptions {
  /** Set when yabai is launched with a custom --config path. */
  configPath?: string;
  bunPath?: string;
}

export function findYabaiConfig(home = os.homedir(), xdg = process.env.XDG_CONFIG_HOME) {
  const candidates = [
    path.join(xdg || path.join(home, ".config"), "yabai/yabairc"),
    path.join(home, ".yabairc"),
  ];
  return candidates.find((file) => fs.existsSync(file)) ?? candidates[0]!;
}

const start = "# BEGIN chords-ymsp managed hooks";
const end = "# END chords-ymsp managed hooks";
export function augmentYabaiConfig(source: string, runner: string): string {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const block = [start, `/bin/sh ${shellQuote(runner)} register`, end].join(newline);
  const first = source.indexOf(start),
    last = source.indexOf(end);
  if (first < 0 && last < 0)
    return source + (source && !source.endsWith("\n") ? newline : "") + block + newline;
  if (
    first < 0 ||
    last < first ||
    source.indexOf(start, first + start.length) !== -1 ||
    source.indexOf(end, last + end.length) !== -1
  )
    throw new Error("Malformed chords-ymsp managed block in yabairc");
  return source.slice(0, first) + block + source.slice(last + end.length);
}

export function installYabaiHooks(
  options: YMSPOptions,
  setup: YabaiSetupOptions,
  hookModule: string,
  directory = path.join(os.homedir(), ".config/chords-ymsp"),
) {
  const requested = path.resolve(setup.configPath ?? findYabaiConfig());
  const filename = fs.existsSync(requested) ? fs.realpathSync(requested) : requested;
  const original = fs.existsSync(filename)
    ? fs.readFileSync(filename, "utf8")
    : "#!/usr/bin/env sh\n";
  const runner = path.join(directory, "yabai-hook.sh");
  const settingsPath = path.join(directory, "yabai-settings.json");
  const updated = augmentYabaiConfig(original, runner);
  const bun = resolveBunExecutable(setup.bunPath);
  if (!fs.existsSync(hookModule))
    throw new Error(`Missing yabai hook module: ${hookModule}; run vp pack`);
  if (options.spawn || options.logger)
    throw new Error("yabai setup cannot serialize spawn/logger; use yabaiSetup: false");
  writeIfChanged(
    settingsPath,
    JSON.stringify({ enabled: true, options } satisfies HookSettings, null, 2) + "\n",
  );
  writeIfChanged(
    runner,
    `#!/bin/sh\numask 077\nexec ${shellQuote(bun)} ${shellQuote(hookModule)} ${shellQuote(settingsPath)} "$@" 2>>${shellQuote(path.join(directory, "yabai.log"))}\n`,
  );
  let backupPath: string | undefined;
  if (updated !== original || !fs.existsSync(filename)) {
    if (fs.existsSync(filename)) {
      backupPath = `${filename}.chords-ymsp.${crypto.randomUUID()}.bak`;
      fs.copyFileSync(filename, backupPath, fs.constants.COPYFILE_EXCL);
      if (fs.readFileSync(filename, "utf8") !== original)
        throw new Error("yabairc changed during setup; retry setup");
    }
    writeIfChanged(
      filename,
      updated,
      fs.existsSync(filename) ? fs.statSync(filename).mode & 0o777 : 0o755,
    );
  }
  return { configPath: filename, runner, settingsPath, backupPath };
}

export async function activateYabaiHooks(installation: ReturnType<typeof installYabaiHooks>) {
  // Wait for registration and the initial repair to finish, not just shell spawn.
  await promisify(execFile)("/bin/sh", [installation.runner, "register"], { timeout: 15000 });
}

export function disableYabaiHooks(directory = path.join(os.homedir(), ".config/chords-ymsp")) {
  const filename = path.join(directory, "yabai-settings.json");
  if (fs.existsSync(filename))
    writeIfChanged(filename, JSON.stringify({ enabled: false, options: {} }));
}
