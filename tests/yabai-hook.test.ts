import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { runYabaiHook } from "../src/js/yabai-hook";
const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  created: vi.fn(),
  destroyed: vi.fn(),
  start: vi.fn(),
  options: vi.fn(),
}));
vi.mock("node:child_process", () => ({
  execFile: Object.assign(mocks.execute, {
    [Symbol.for("nodejs.util.promisify.custom")]: (...args: unknown[]) => mocks.execute(...args),
  }),
}));
vi.mock("yabai-master-stack-plugin", () => ({
  YMSP: class {
    config = { yabaiPath: "/custom/yabai" };
    constructor(options: unknown) {
      mocks.options(options);
    }
    tasksMap = {
      "window-created": mocks.created,
      "window-destroyed": mocks.destroyed,
      "on-yabai-start": mocks.start,
    };
    withTaskLock(callback: () => Promise<void>) {
      return callback();
    }
  },
}));
let root: string, filename: string;
beforeEach(() => {
  vi.resetAllMocks();
  root = fs.mkdtempSync(path.join(os.tmpdir(), "ymsp-yabai-hook-"));
  filename = path.join(root, "yabai-settings.json");
  fs.writeFileSync(
    filename,
    JSON.stringify({ enabled: true, options: { lockfilePath: "/shared/lock" } }),
  );
  mocks.execute.mockResolvedValue({ stdout: "[]" });
});
afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(root, { recursive: true, force: true });
});
describe("yabai callbacks", () => {
  it("dispatches explicit window IDs and destruction with shared options", async () => {
    vi.stubEnv("YABAI_WINDOW_ID", "321");
    await runYabaiHook(filename, "window-created");
    await runYabaiHook(filename, "window-destroyed");
    expect(mocks.created).toHaveBeenCalledExactlyOnceWith(321);
    expect(mocks.destroyed).toHaveBeenCalledOnce();
    expect(mocks.options).toHaveBeenCalledWith(
      expect.objectContaining({ windowManager: "yabai", lockfilePath: "/shared/lock" }),
    );
    expect(mocks.options.mock.calls[0][0].environment.YABAI_WINDOW_ID).toBeUndefined();
  });
  it("ignores invalid IDs and disabled settings", async () => {
    vi.stubEnv("YABAI_WINDOW_ID", "bad");
    await runYabaiHook(filename, "window-created");
    expect(mocks.created).not.toHaveBeenCalled();
    fs.writeFileSync(filename, '{"enabled":false,"options":{}}');
    await runYabaiHook(filename, "register");
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("replaces owned signals in descending index order, preserving unrelated callbacks", async () => {
    mocks.execute.mockResolvedValueOnce({
      stdout: JSON.stringify([
        { index: 0, label: "user", event: "window_created", action: "custom command" },
        { index: 1, label: "chords-ymsp-window_created" },
        {
          index: 2,
          label: "",
          event: "window_destroyed",
          action: 'hs -c "return MasterStackLayout:handleWindowDestroyed()"',
        },
      ]),
    });
    await runYabaiHook(filename, "register");
    const args = mocks.execute.mock.calls.map((c) => c[1]);
    expect(args.slice(0, 3)).toEqual([
      ["-m", "signal", "--list"],
      ["-m", "signal", "--remove", "2"],
      ["-m", "signal", "--remove", "1"],
    ]);
    expect(args[3]).toContain("label=chords-ymsp-window_created");
    expect(args[4]).toContain("label=chords-ymsp-window_destroyed");
    expect(mocks.start).toHaveBeenCalledOnce();
  });
  it("propagates registration failure without claiming initialization succeeded", async () => {
    mocks.execute.mockRejectedValueOnce(new Error("not running"));
    await expect(runYabaiHook(filename, "register")).rejects.toThrow("not running");
    expect(mocks.start).not.toHaveBeenCalled();
  });
});
