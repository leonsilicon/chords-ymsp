# chords-ymsp

The `ymsp` JavaScript action selects AeroSpace by default. Chord initializes the
action with the settings in `chords/com/koekeishiya/yabai/macos.toml`:

```toml
[on.ymsp]
type = "js"
file = "ymsp.js"
args = [{ windowManager = "aerospace", aerospacePath = "/opt/homebrew/bin/aerospace" }]
```

On initialization, setup augments `~/.aerospace.toml` or
`${XDG_CONFIG_HOME:-~/.config}/aerospace/aerospace.toml`. If both exist, specify
`aerospaceSetup = { configPath = "/absolute/path/aerospace.toml" }` inside the
settings object. Also specify this when launching AeroSpace with `--config-path`.
Set `aerospaceSetup = false` to manage hooks yourself. Select
`windowManager = "yabai"` to stop the managed watcher and make its callbacks inert.

Setup uses **toml-eslint-parser** to edit source ranges instead of rewriting the
document. Existing comments, formatting, bindings, app rules, environment, gaps,
and callbacks are preserved. Both inline callback arrays (including TOML 1.1)
and legacy `[[on-window-detected]]` rules are supported. Changed configs receive
a sibling `.chords-ymsp.<id>.bak` backup. Symlinks remain symlinks, writes are
atomic, and repeated setup does not duplicate handlers or backups.

The only overridden layout settings are `default-root-container-layout = "tiles"`
and the two `enable-normalization-*` settings, set to `true` for YMSP's columns.
Your other layout preferences remain intact.

The installed handlers provide:

- `on-window-detected`: dispatch `window-created` with `AEROSPACE_WINDOW_ID`.
  The added rule runs first and permits all existing rules to continue.
- `after-startup-command`: start `watch-aerospace`, including initial layout repair.
- `on-focus-changed`: ensure the watcher is running after focus or workspace
  changes. The shared watcher lock prevents duplicate polling loops.
- The watcher checks once per second for closing, minimizing, hiding, restoring,
  and workspace/monitor membership changes, which AeroSpace does not expose as
  equivalent yabai signals. Manual divider resizing does not trigger a repair loop.

The existing `exec-on-workspace-change` and monitor callbacks remain intact.
These hooks target AeroSpace **0.21.3-Beta**. The event model and window ID context
are documented in the [AeroSpace guide](https://nikitabobko.github.io/AeroSpace/guide#callbacks).
Layout behavior comes from `yabai-master-stack-plugin`, with MasterStackLayout.spoon
as the behavioral reference; the polling fallback can introduce up to a second of delay.

Setup generates a launcher and private settings file in `~/.config/chords-ymsp`.
The launcher uses `js/aerospace-hook.js` and a validated standalone Bun executable.
Setup searches PATH and common Bun installation directories and resolves version-manager
shims to the actual executable. It never assumes embedded Bun's `process.execPath`
is Bun (inside Chord that path is the Chord application).
`aerospaceSetup.bunPath` can override the executable with an absolute path.
The callbacks share the Chord action's YMSP settings, state file, and locks.
Environment overrides are supported; the full Chord process environment is not
written to disk. Runtime functions (`spawn`, `logger`) require opting out of setup.
Settings changes restart the existing watcher automatically. Callback errors are
appended to `~/.config/chords-ymsp/aerospace.log`.

AeroSpace must be running during initialization. Setup checks that it uses the
selected config, validates with `reload-config --dry-run`, reloads it, and starts
the watcher immediately (reload alone does not run startup callbacks). Activation waits
for the watcher to acknowledge successful initial repair or an existing watcher;
an early exit is reported instead of being mistaken for successful setup. Errors
are reported by Chord and propagated to actions; the backup remains available.
Failed activation is retried on the next hotkey, so Chord can start before AeroSpace.

When `windowManager = "yabai"`, setup registers labelled `window_created` and
`window_destroyed` signals immediately and appends an idempotent managed block to
`${XDG_CONFIG_HOME:-~/.config}/yabai/yabairc` (or an existing `~/.yabairc`).
The block re-registers callbacks and repairs visible layouts on yabai restart.
Use `yabaiSetup = { configPath = "/custom/yabairc", bunPath = "/absolute/bun" }`
for custom startup paths or runtimes; `yabaiSetup = false` opts out. Set `yabaiPath`
to your installed yabai executable. Setup preserves shell code, symlinks and file
permissions, and backs up changed configs. The managed block must execute: place
it before any early `exit`/`exec` in a custom yabairc.

Callbacks share Chord's options and task lock. Registration replaces only its own
labels and the exact two legacy `hs -c` MasterStackLayout callbacks from the reference
yabairc, avoiding duplicate layout controllers while preserving other signals.
Switching managers disables the other manager's callbacks through their settings
file. Yabai callback errors go to `~/.config/chords-ymsp/yabai.log`.

AeroSpace geometry uses YMSP's Swift NodeSwift addon in-process. Keep the
`yabai-master-stack-plugin` dependency installed alongside its `target` directory;
it is intentionally external to the bundled chord handlers. In a source checkout,
build YMSP (`vp pack`) before installing/rebuilding chords-ymsp. Warm geometry reads
measured about 2–4 ms locally; embedded initialization measured about 64–70 ms,
compared with 345–376 ms before replacing the script interpreter.

Development uses Vite+ and Vitest:

```sh
vp install
vp check
vp test
vp run build
```

The opt-in native config test runs AeroSpace's real schema validator against an
augmented copy of the active config. If AeroSpace is stopped, it starts a temporary
server in read-only mode and validates a copy of `~/.aerospace.toml` there, then
stops that server. For an already running server, it requires auto-reload to be disabled,
temporarily stages the candidate at the active path for `--dry-run`, and restores
the original bytes without applying the candidate:

```sh
YMSP_AEROSPACE_CONFIG_TEST=1 vp test tests/aerospace-native.test.ts
```
