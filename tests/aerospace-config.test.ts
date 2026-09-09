import { describe, expect, it } from "vite-plus/test";
import { getStaticTOMLValue, parseTOML } from "toml-eslint-parser";
import { augmentAerospaceConfig } from "../src/lib/aerospace-config";

const hook = "/bin/sh '/Users/test/.config/chords-ymsp/aerospace-hook.sh'";
const watch = `exec-and-forget ${hook} watch-aerospace`;
const created = `exec-and-forget ${hook} window-created`;
const parse = (source: string) => getStaticTOMLValue(parseTOML(source));
export const existingConfig = `# My window manager\nconfig-version = 2
after-startup-command = [
  'exec-and-forget aerotag server', # keep the bar
]
exec-on-workspace-change = ['/bin/bash', '-c', 'aerotag hook']
on-focus-changed = ['move-mouse window-lazy-center'] # follow focus
on-window-detected = [
  { # TOML 1.1 multiline inline table
    if = 'true', check-further-callbacks = true,
    run = ['exec-and-forget aerotag hook'],
  },
  { if = 'test %{app-bundle-id} = com.apple.systempreferences', run = 'layout floating' },
]
default-root-container-orientation = 'auto'
automatically-unhide-macos-hidden-apps = false
persistent-workspaces = ['1', 'work space']
[exec.env-vars]
PATH = '/opt/homebrew/bin:\${HOME}/.cargo/bin:\${PATH}'
[gaps]
inner.horizontal = 5 # retain spacing
[mode.main.binding]
alt-enter = '''exec-and-forget osascript -e 'tell application "Terminal" to activate' '''
`;

describe("AeroSpace config augmentation", () => {
  it("preserves existing settings, callback order, comments, and custom commands", () => {
    const result = augmentAerospaceConfig(existingConfig, hook);
    const before = parse(existingConfig);
    const after = parse(result);
    expect(after).toMatchObject({
      ...before,
      "after-startup-command": [watch, ...(before["after-startup-command"] as string[])],
      "on-focus-changed": [watch, ...(before["on-focus-changed"] as string[])],
      "on-window-detected": [
        { "check-further-callbacks": true, run: created },
        ...(before["on-window-detected"] as object[]),
      ],
    });
    for (const comment of parseTOML(existingConfig).comments)
      expect(result).toContain(existingConfig.slice(...comment.range));
    expect(result).toContain(existingConfig.slice(existingConfig.indexOf("[exec.env-vars]")));
    expect(result).toContain("exec-on-workspace-change = ['/bin/bash', '-c', 'aerotag hook']");
  });

  it.each([
    "",
    existingConfig,
    "after-startup-command = []\non-window-detected = []\n",
    "after-startup-command = 'exec-and-forget echo hello'\n",
    '[[on-window-detected]]\nif.app-id = "com.apple.Terminal"\nrun = "layout floating"\n',
    existingConfig.replaceAll("\n", "\r\n"),
  ])("is byte-for-byte idempotent (%#)", (source) => {
    const result = augmentAerospaceConfig(source, hook);
    expect(augmentAerospaceConfig(result, hook)).toBe(result);
  });

  it("prepends a non-blocking callback before legacy array-of-table rules", () => {
    const source = `config-version = 1
[[on-window-detected]]
if.app-id = "com.apple.Terminal"
run = "layout floating" # terminal
[[on-window-detected]]
run = "move-node-to-workspace 2"
[mode.main.binding]
alt-h = 'focus left'
`;
    const result = augmentAerospaceConfig(source, hook);
    expect(result).toContain(source.slice(source.indexOf("[[on-window-detected]]")));
    expect(parse(result)["on-window-detected"]).toEqual([
      { "check-further-callbacks": true, run: created },
      { if: { "app-id": "com.apple.Terminal" }, run: "layout floating" },
      { run: "move-node-to-workspace 2" },
    ]);
    expect(parse(result)["config-version"]).toBe(1);
  });

  it("updates only required layout values, preserving attached comments", () => {
    const result = augmentAerospaceConfig(
      `'enable-normalization-flatten-containers' = false # flatten
enable-normalization-opposite-orientation-for-nested-containers = false
default-root-container-layout = 'accordion' # layout
accordion-padding = 12
`,
      hook,
    );
    expect(result).toContain("'enable-normalization-flatten-containers' = true # flatten");
    expect(result).toContain('default-root-container-layout = "tiles" # layout');
    expect(parse(result)["accordion-padding"]).toBe(12);
  });

  it("preserves CRLF line endings", () => {
    expect(
      augmentAerospaceConfig(existingConfig.replaceAll("\n", "\r\n"), hook).replaceAll("\r\n", ""),
    ).not.toContain("\n");
  });

  it.each([
    "broken = [",
    "on-window-detected = {}",
    "on-focus-changed = 4",
    "after-startup-command = [42]",
  ])("rejects malformed settings without producing replacement TOML: %s", (source) => {
    expect(() => augmentAerospaceConfig(source, hook)).toThrow();
  });
});
