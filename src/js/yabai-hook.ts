import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { YMSP } from "yabai-master-stack-plugin";
import { shellQuote, type HookSettings } from "../lib/aerospace-setup";

const events = { window_created: "window-created", window_destroyed: "window-destroyed" } as const;
interface Signal {
  index: number;
  label: string;
  event: string;
  action: string;
}

export async function runYabaiHook(filename: string, task: string) {
  if (!["register", "window-created", "window-destroyed"].includes(task))
    throw new Error(`Unknown hook: ${task}`);
  const settings = JSON.parse(fs.readFileSync(filename, "utf8")) as HookSettings;
  if (!settings.enabled) return;
  const environment = { ...process.env, ...settings.options.environment };
  const windowId = process.env.YABAI_WINDOW_ID;
  delete environment.YABAI_WINDOW_ID;
  delete environment.YABAI_PROCESS_ID;
  const ymsp = new YMSP({ ...settings.options, environment, windowManager: "yabai" });
  if (task === "window-created") {
    if (!windowId || !/^\d+$/.test(windowId) || Number(windowId) < 1) return;
    await ymsp.tasksMap["window-created"](Number(windowId));
  } else if (task === "window-destroyed") {
    await ymsp.tasksMap["window-destroyed"]();
  } else {
    const execute = promisify(execFile);
    const command = (...args: string[]) =>
      execute(ymsp.config.yabaiPath, ["-m", "signal", ...args], {
        env: environment,
        timeout: 5000,
      });
    await ymsp.withTaskLock(async () => {
      const { stdout } = await command("--list");
      const signals = JSON.parse(stdout) as Signal[];
      // Adopt only these exact legacy MasterStackLayout handlers. Leave every
      // other user signal alone. The managed block runs after existing yabairc.
      const legacy = new Map([
        [
          "window_created",
          'hs -c "return MasterStackLayout:handleWindowCreated(\\"$YABAI_WINDOW_ID\\")"',
        ],
        ["window_destroyed", 'hs -c "return MasterStackLayout:handleWindowDestroyed()"'],
      ]);
      for (const signal of [...signals].sort((a, b) => b.index - a.index)) {
        if (
          signal.label === "chords-ymsp-window_created" ||
          signal.label === "chords-ymsp-window_destroyed" ||
          legacy.get(signal.event) === signal.action
        )
          await command("--remove", String(signal.index));
      }
      const runner = path.join(path.dirname(filename), "yabai-hook.sh");
      for (const [event, callback] of Object.entries(events)) {
        await command(
          "--add",
          `event=${event}`,
          `label=chords-ymsp-${event}`,
          `action=/bin/sh ${shellQuote(runner)} ${callback}`,
        );
      }
      await ymsp.tasksMap["on-yabai-start"]();
    });
  }
}

if (import.meta.main) {
  try {
    if (!process.argv[2] || !process.argv[3])
      throw new Error("Expected settings path and hook task");
    await runYabaiHook(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error("chords-ymsp yabai hook:", error);
    process.exitCode = 1;
  }
}
