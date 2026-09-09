import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

/** Embedded Bun's process.execPath is the host app, not a script runner. */
export function resolveBunExecutable(explicit?: string): string {
  if (explicit && !path.isAbsolute(explicit)) throw new Error("bunPath must be absolute");
  const candidates = explicit
    ? [explicit]
    : [
        ...(/^(bun|bun-debug)$/.test(path.basename(process.execPath)) ? [process.execPath] : []),
        ...(process.env.PATH ?? "")
          .split(path.delimiter)
          .filter(Boolean)
          .map((dir) => path.resolve(dir, "bun")),
        path.join(os.homedir(), ".bun/bin/bun"),
        path.join(os.homedir(), ".proto/shims/bun"),
        "/opt/homebrew/bin/bun",
        "/usr/local/bin/bun",
      ];
  for (const candidate of new Set(candidates)) {
    if (!fs.existsSync(candidate)) continue;
    try {
      // Resolve version-manager shims as well, so callbacks do not depend on PATH.
      const actual = execFileSync(
        candidate,
        [
          "-e",
          "if (!process.versions.bun) process.exit(1); process.stdout.write(process.execPath)",
        ],
        {
          encoding: "utf8",
          timeout: 5000,
          stdio: ["ignore", "pipe", "pipe"],
        },
      ).trim();
      if (path.isAbsolute(actual) && fs.existsSync(actual)) return actual;
    } catch {
      /* Try the next installed Bun. */
    }
  }
  throw new Error(
    "Cannot find a standalone Bun executable; set aerospaceSetup.bunPath or yabaiSetup.bunPath",
  );
}
