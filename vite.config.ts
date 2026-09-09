import { config } from "@keychord/config";
import { defineConfig } from "vite-plus";

const chordConfig = config();

export default defineConfig({
  ...chordConfig,
  // Keep YMSP beside its native target directory; do not inline it into handlers.
  pack: chordConfig.pack.map((entry) => ({
    ...entry,
    ...("deps" in entry
      ? {
          deps: {
            ...entry.deps,
            neverBundle: [...entry.deps.neverBundle, "yabai-master-stack-plugin"],
          },
        }
      : {}),
  })),
  test: { include: ["tests/**/*.test.ts"] },
  lint: { ignorePatterns: ["js/**"], options: { typeCheck: true, typeAware: true } },
  fmt: { ignorePatterns: ["js/**", "chords/**"] },
});
