import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { activateAerospaceHooks, installAerospaceHooks } from "../src/lib/aerospace-setup";

const mocked = vi.hoisted(() => ({ execute: vi.fn(), spawn: vi.fn() }));
vi.mock("node:child_process", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:child_process")>()),
  execFile: Object.assign(mocked.execute, {
    [Symbol.for("nodejs.util.promisify.custom")]: (...args: unknown[]) =>
      new Promise((resolve, reject) =>
        mocked.execute(...args, (error: Error | null, stdout: string) =>
          error ? reject(error) : resolve({ stdout }),
        ),
      ),
  }),
  spawn: mocked.spawn,
}));
let root: string;
let installation: ReturnType<typeof installAerospaceHooks>;
beforeEach(() => {
  vi.resetAllMocks();
  root = fs.mkdtempSync(path.join(os.tmpdir(), "chords-ymsp-activation-"));
  const module = path.join(root, "hook.js");
  fs.writeFileSync(module, "");
  installation = installAerospaceHooks(
    {},
    { configPath: path.join(root, "aerospace.toml") },
    module,
    root,
  );
  mocked.execute.mockImplementation((_exe, args, _options, callback) =>
    callback(null, args[0] === "config" ? installation.configPath : ""),
  );
  mocked.spawn.mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), {
      unref: vi.fn(),
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      kill: vi.fn(),
    });
    queueMicrotask(() => {
      child.emit("spawn");
      child.stdout.write("chords-ymsp:ready\n");
    });
    return child;
  });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("AeroSpace hook activation", () => {
  it("verifies the active path, dry-runs, reloads, then starts the watcher", async () => {
    await activateAerospaceHooks(installation, "/custom/aerospace");
    expect(mocked.execute.mock.calls.map((call) => call[1])).toEqual([
      ["config", "--config-path"],
      ["reload-config", "--dry-run", "--no-gui"],
      ["reload-config", "--no-gui"],
    ]);
    expect(mocked.execute.mock.calls.every((call) => call[0] === "/custom/aerospace")).toBe(true);
    expect(mocked.spawn).toHaveBeenCalledWith("/bin/sh", [installation.runner, "watch-aerospace"], {
      detached: true,
      env: expect.objectContaining({ CHORD_YMSP_READY: "1" }),
      stdio: ["ignore", "pipe", "pipe"],
    });
  });
  it("does not reload or launch if AeroSpace uses another config", async () => {
    const other = path.join(root, "other.toml");
    fs.writeFileSync(other, "");
    mocked.execute.mockImplementation((_exe, _args, _options, callback) => callback(null, other));
    await expect(activateAerospaceHooks(installation, "/custom/aerospace")).rejects.toThrow(
      "set aerospaceSetup.configPath",
    );
    expect(mocked.execute).toHaveBeenCalledOnce();
    expect(mocked.spawn).not.toHaveBeenCalled();
  });
  it("does not activate handlers if AeroSpace rejects their config", async () => {
    mocked.execute.mockImplementation((_exe, args, _options, callback) => {
      if (args.includes("--dry-run")) callback(new Error("config rejected"));
      else callback(null, installation.configPath);
    });
    await expect(activateAerospaceHooks(installation, "/custom/aerospace")).rejects.toThrow(
      "config rejected",
    );
    expect(mocked.execute).toHaveBeenCalledTimes(2);
    expect(mocked.spawn).not.toHaveBeenCalled();
  });
  it("propagates a stopped-server failure", async () => {
    mocked.execute.mockImplementation((_exe, _args, _options, callback) =>
      callback(new Error("connection refused")),
    );
    await expect(activateAerospaceHooks(installation, "/custom/aerospace")).rejects.toThrow(
      "connection refused",
    );
    expect(mocked.spawn).not.toHaveBeenCalled();
  });
  it("rejects a watcher that exits after spawn but before readiness", async () => {
    mocked.spawn.mockImplementation(() => {
      const child = Object.assign(new EventEmitter(), {
        stdout: new PassThrough(),
        stderr: new PassThrough(),
      });
      queueMicrotask(() => {
        child.emit("spawn");
        child.emit("exit", 1);
      });
      return child;
    });
    await expect(activateAerospaceHooks(installation, "/custom/aerospace")).rejects.toThrow(
      "exited before ready",
    );
  });
  it("propagates watcher launch errors", async () => {
    mocked.spawn.mockImplementation(() => {
      const child = new EventEmitter();
      queueMicrotask(() => child.emit("error", new Error("spawn failed")));
      return child;
    });
    await expect(activateAerospaceHooks(installation, "/custom/aerospace")).rejects.toThrow(
      "spawn failed",
    );
  });
});
