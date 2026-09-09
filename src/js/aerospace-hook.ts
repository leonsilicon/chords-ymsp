import fs from "node:fs";
import { YMSP } from "yabai-master-stack-plugin";
import type { HookSettings } from "../lib/aerospace-setup";

/** Each callback uses exactly the Chord instance's serialized settings and shared locks. */
export async function runAerospaceHook(filename: string, task: string) {
  if (task !== "window-created" && task !== "watch-aerospace")
    throw new Error(`Unknown hook: ${task}`);
  let contents = fs.readFileSync(filename, "utf8");
  while (true) {
    const settings: HookSettings = JSON.parse(contents);
    if (!settings.enabled) return;
    // Callback context must not leak into the watcher's future subprocess commands.
    const environment = { ...process.env, ...settings.options.environment };
    const windowId = process.env.AEROSPACE_WINDOW_ID;
    delete environment.AEROSPACE_WINDOW_ID;
    delete environment.AEROSPACE_WORKSPACE;
    const ymsp = new YMSP({ ...settings.options, environment, windowManager: "aerospace" });
    if (task === "window-created") {
      if (!windowId || !/^\d+$/.test(windowId) || Number(windowId) < 1) return;
      await ymsp.tasksMap["window-created"](Number(windowId));
      return;
    }
    const controller = new AbortController();
    let next = contents;
    const stop = () => controller.abort();
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    const timer = setInterval(() => {
      try {
        next = fs.readFileSync(filename, "utf8");
      } catch {
        next = "";
      }
      if (next !== contents) controller.abort();
    }, 1000);
    try {
      await ymsp.tasksMap["watch-aerospace"](controller.signal, () => {
        if (process.env.CHORD_YMSP_READY !== "1") return;
        process.stdout.write("chords-ymsp:ready\n");
      });
    } finally {
      clearInterval(timer);
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
    }
    if (!next || next === contents) return;
    contents = next;
  }
}

if (import.meta.main) {
  try {
    if (!process.argv[2] || !process.argv[3])
      throw new Error("Expected settings path and hook task");
    await runAerospaceHook(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error("chords-ymsp AeroSpace hook:", error);
    process.exitCode = 1;
  }
}
