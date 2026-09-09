import { YMSP, type YMSPOptions } from "yabai-master-stack-plugin";
import { hasOwn } from "@voxpelli/typed-utils";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  installAerospaceHooks,
  activateAerospaceHooks,
  disableAerospaceHooks,
  type AerospaceSetupOptions,
} from "../lib/aerospace-setup";

import {
  installYabaiHooks,
  activateYabaiHooks,
  disableYabaiHooks,
  type YabaiSetupOptions,
} from "../lib/yabai-setup";

export type ChordYMSPOptions = YMSPOptions & {
  aerospaceSetup?: AerospaceSetupOptions | false;
  yabaiSetup?: YabaiSetupOptions | false;
};

export default function buildAction({
  aerospaceSetup = {},
  yabaiSetup = {},
  ...settings
}: ChordYMSPOptions = {}) {
  const { windowManager = "aerospace" } = settings;
  // Chord explicitly opts into sharing persisted counts and coordination with the CLI.
  const directory = path.join(os.homedir(), ".config/ymsp");
  const options: YMSPOptions = {
    windowManager,
    stateFilePath: path.join(
      directory,
      windowManager === "aerospace" ? "state.aerospace.json" : "state.json",
    ),
    lockfilePath: path.join(directory, "task.lock"),
    watcherLockfilePath: path.join(directory, "aerospace-watcher.lock"),
    environment: process.env,
    ...settings,
  };
  const ymsp = new YMSP(options);
  let ready: Promise<void> | undefined;
  let activate = () => Promise.resolve();
  const ensureReady = () => {
    if (!ready) {
      ready = activate();
      void ready.catch((error) => {
        ready = undefined; // Retry on the next hotkey if Chord started before AeroSpace.
        console.error(`chords-ymsp ${windowManager} setup failed:`, error);
      });
    }
    return ready;
  };
  const extension = import.meta.url.endsWith(".ts") ? "ts" : "js";
  if (windowManager === "aerospace") disableYabaiHooks();
  else disableAerospaceHooks();
  if (windowManager === "aerospace" && aerospaceSetup !== false) {
    // Do not persist the entire environment (which may contain credentials).
    const installation = installAerospaceHooks(
      { ...options, environment: settings.environment },
      aerospaceSetup,
      fileURLToPath(new URL(`./aerospace-hook.${extension}`, import.meta.url)),
    );
    activate = () => activateAerospaceHooks(installation, ymsp.config.aerospacePath);
    void ensureReady();
  } else if (windowManager === "yabai" && yabaiSetup !== false) {
    const installation = installYabaiHooks(
      { ...options, environment: settings.environment },
      yabaiSetup,
      fileURLToPath(new URL(`./yabai-hook.${extension}`, import.meta.url)),
    );
    activate = () => activateYabaiHooks(installation);
    void ensureReady();
  }
  const { tasksMap } = ymsp;

  return async function action(taskSlug: string, ...args: unknown[]) {
    if (!hasOwn(tasksMap, taskSlug)) {
      throw new Error(`ymsp task ${taskSlug} not found`);
    }

    const task = tasksMap[taskSlug];
    await ensureReady();
    await Reflect.apply(task, null, args);
  };
}
