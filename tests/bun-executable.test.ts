import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vite-plus/test";
import { resolveBunExecutable } from "../src/lib/bun-executable";

describe("standalone Bun resolution", () => {
  it("finds Bun even when the host executable is Node", () => {
    const bun = resolveBunExecutable();
    expect(
      execFileSync(bun, ["-e", "process.stdout.write(process.versions.bun)"], { encoding: "utf8" }),
    ).toMatch(/^\d+\./);
    expect(resolveBunExecutable(bun)).toBe(bun);
  });
  it("rejects a missing executable, a non-runtime, and relative paths", () => {
    expect(() => resolveBunExecutable("/does-not-exist/bun")).toThrow("standalone Bun");
    expect(() => resolveBunExecutable("/usr/bin/true")).toThrow("standalone Bun");
    expect(() => resolveBunExecutable("bun")).toThrow("absolute");
  });
});
