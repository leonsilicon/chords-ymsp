import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { runAerospaceHook } from "../src/js/aerospace-hook";

const mocked = vi.hoisted(() => ({ created: vi.fn(), watch: vi.fn(), options: vi.fn() }));
vi.mock("yabai-master-stack-plugin", () => ({
  YMSP: class {
    constructor(options: unknown) {
      mocked.options(options);
    }
    tasksMap = { "window-created": mocked.created, "watch-aerospace": mocked.watch };
  },
}));
let root: string;
let filename: string;
beforeEach(() => {
  vi.resetAllMocks();
  root = fs.mkdtempSync(path.join(os.tmpdir(), "chords-ymsp-hook-"));
  filename = path.join(root, "settings.json");
  fs.writeFileSync(
    filename,
    JSON.stringify({
      enabled: true,
      options: {
        resizeIncrement: 3,
        stateFilePath: "/shared/state",
        lockfilePath: "/shared/lock",
        watcherLockfilePath: "/shared/watcher",
      },
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  fs.rmSync(root, { recursive: true, force: true });
});

describe("callback dispatch", () => {
  it("passes the creating window ID and shares the Chord state and locks", async () => {
    vi.stubEnv("AEROSPACE_WINDOW_ID", "123");
    await runAerospaceHook(filename, "window-created");
    expect(mocked.created).toHaveBeenCalledExactlyOnceWith(123);
    expect(mocked.options).toHaveBeenCalledWith(
      expect.objectContaining({
        windowManager: "aerospace",
        resizeIncrement: 3,
        stateFilePath: "/shared/state",
        lockfilePath: "/shared/lock",
        watcherLockfilePath: "/shared/watcher",
      }),
    );
    expect(mocked.options.mock.calls[0][0].environment.AEROSPACE_WINDOW_ID).toBeUndefined();
  });
  it.each(["", "bad", "0", "-1", "1; touch /tmp/oops"])(
    "ignores invalid window ID %s",
    async (id) => {
      vi.stubEnv("AEROSPACE_WINDOW_ID", id);
      await runAerospaceHook(filename, "window-created");
      expect(mocked.created).not.toHaveBeenCalled();
    },
  );
  it("does nothing when disabled", async () => {
    fs.writeFileSync(filename, '{"enabled":false,"options":{}}');
    await runAerospaceHook(filename, "watch-aerospace");
    expect(mocked.options).not.toHaveBeenCalled();
  });
  it("does not leak callback targeting into the long-lived watcher", async () => {
    vi.stubEnv("AEROSPACE_WINDOW_ID", "42");
    vi.stubEnv("AEROSPACE_WORKSPACE", "work");
    await runAerospaceHook(filename, "watch-aerospace");
    const environment = mocked.options.mock.calls[0][0].environment;
    expect(environment.AEROSPACE_WINDOW_ID).toBeUndefined();
    expect(environment.AEROSPACE_WORKSPACE).toBeUndefined();
    expect(mocked.watch).toHaveBeenCalledOnce();
  });
  it("stops the watcher after switching to yabai", async () => {
    vi.useFakeTimers();
    mocked.watch.mockImplementation(
      (signal: AbortSignal) =>
        new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve())),
    );
    const running = runAerospaceHook(filename, "watch-aerospace");
    fs.writeFileSync(filename, '{"enabled":false,"options":{}}');
    await vi.advanceTimersByTimeAsync(1000);
    await running;
    expect(mocked.watch).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("restarts with changed instance settings", async () => {
    vi.useFakeTimers();
    mocked.watch.mockImplementationOnce(
      (signal: AbortSignal) =>
        new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve())),
    );
    const running = runAerospaceHook(filename, "watch-aerospace");
    fs.writeFileSync(filename, '{"enabled":true,"options":{"resizeIncrement":5}}');
    await vi.advanceTimersByTimeAsync(1000);
    await running;
    expect(mocked.options).toHaveBeenLastCalledWith(
      expect.objectContaining({ resizeIncrement: 5 }),
    );
    expect(mocked.watch).toHaveBeenCalledTimes(2);
  });
  it("rejects arbitrary tasks", async () => {
    await expect(runAerospaceHook(filename, "close-window")).rejects.toThrow("Unknown hook");
  });
});
