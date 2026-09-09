import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import buildAction from "../src/js/ymsp";

const mocks = vi.hoisted(() => ({
  yabaiInstall: vi.fn(),
  yabaiActivate: vi.fn(),
  yabaiDisable: vi.fn(),
  install: vi.fn(),
  activate: vi.fn(),
  disable: vi.fn(),
  task: vi.fn(),
  options: vi.fn(),
}));
vi.mock("../src/lib/aerospace-setup", () => ({
  installAerospaceHooks: mocks.install,
  activateAerospaceHooks: mocks.activate,
  disableAerospaceHooks: mocks.disable,
}));
vi.mock("../src/lib/yabai-setup", () => ({
  installYabaiHooks: mocks.yabaiInstall,
  activateYabaiHooks: mocks.yabaiActivate,
  disableYabaiHooks: mocks.yabaiDisable,
}));
vi.mock("yabai-master-stack-plugin", () => ({
  YMSP: class {
    config = { aerospacePath: "/opt/homebrew/bin/aerospace" };
    constructor(options: unknown) {
      mocks.options(options);
    }
    tasksMap = { "focus-space": mocks.task };
  },
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.activate.mockResolvedValue(undefined);
  mocks.yabaiActivate.mockResolvedValue(undefined);
});
describe("Chord initialization", () => {
  it("sets up AeroSpace by default using the same shared state as hotkeys", async () => {
    const action = buildAction({ masterPosition: "left" });
    expect(mocks.install).toHaveBeenCalledOnce();
    expect(mocks.install.mock.calls[0][0]).toMatchObject({
      windowManager: "aerospace",
      masterPosition: "left",
      stateFilePath: expect.stringContaining("state.aerospace.json"),
      lockfilePath: expect.stringContaining("task.lock"),
      watcherLockfilePath: expect.stringContaining("aerospace-watcher.lock"),
    });
    expect(mocks.install.mock.calls[0][0].environment).toBeUndefined();
    expect(mocks.install.mock.calls[0][2]).toMatch(/aerospace-hook\.ts$/);
    await action("focus-space", "work space");
    expect(mocks.task).toHaveBeenCalledExactlyOnceWith("work space");
  });
  it("awaits activation before dispatching a hotkey", async () => {
    let resolve!: () => void;
    mocks.activate.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const pending = buildAction()("focus-space", "2");
    expect(mocks.task).not.toHaveBeenCalled();
    resolve();
    await pending;
    expect(mocks.task).toHaveBeenCalledOnce();
  });
  it("allows callers to opt out", async () => {
    await buildAction({ aerospaceSetup: false })("focus-space", "2");
    expect(mocks.install).not.toHaveBeenCalled();
    expect(mocks.activate).not.toHaveBeenCalled();
  });

  it("retries activation when AeroSpace starts after Chord", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.activate.mockRejectedValueOnce(new Error("server stopped"));
      const action = buildAction();
      await expect(action("focus-space", "2")).rejects.toThrow("server stopped");
      expect(mocks.task).not.toHaveBeenCalled();
      await action("focus-space", "2");
      expect(mocks.activate).toHaveBeenCalledTimes(2);
      expect(mocks.task).toHaveBeenCalledOnce();
    } finally {
      log.mockRestore();
    }
  });
  it("disables managed AeroSpace hooks when selecting yabai", async () => {
    await buildAction({ windowManager: "yabai" })("focus-space", 2);
    expect(mocks.install).not.toHaveBeenCalled();
    expect(mocks.disable).toHaveBeenCalledOnce();
    expect(mocks.yabaiInstall).toHaveBeenCalledOnce();
    expect(mocks.yabaiInstall.mock.calls[0][0].environment).toBeUndefined();
    expect(mocks.yabaiInstall.mock.calls[0][2]).toMatch(/yabai-hook\.ts$/);
    expect(mocks.yabaiActivate).toHaveBeenCalledOnce();
  });
  it("allows yabai auto-setup to be disabled", async () => {
    await buildAction({ windowManager: "yabai", yabaiSetup: false })("focus-space", 2);
    expect(mocks.yabaiInstall).not.toHaveBeenCalled();
    expect(mocks.yabaiActivate).not.toHaveBeenCalled();
  });
  it("rejects unknown task names", async () => {
    await expect(buildAction({ aerospaceSetup: false })("unknown")).rejects.toThrow("not found");
    expect(mocks.task).not.toHaveBeenCalled();
  });
});
