import { getStaticTOMLValue, parseTOML, type AST } from "toml-eslint-parser";

const parse = (source: string) => parseTOML(source, { tomlVersion: "1.1" });
const keyName = (key: AST.TOMLKey) =>
  key.keys.map((part) => (part.type === "TOMLBare" ? part.name : part.value));

/** Edit parsed source ranges, leaving every unrelated byte (including comments) intact. */
export function augmentAerospaceConfig(source: string, hookCommand: string): string {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  let output = source;
  const command = (task: string) => `exec-and-forget ${hookCommand} ${task}`;
  const insert = (start: number, end: number, text: string) => {
    output = output.slice(0, start) + text + output.slice(end);
  };
  const rootKey = (name: string) =>
    parse(output).body[0].body.find(
      (node): node is AST.TOMLKeyValue =>
        node.type === "TOMLKeyValue" &&
        keyName(node.key).length === 1 &&
        keyName(node.key)[0] === name,
    );
  const addRoot = (name: string, value: string) => insert(0, 0, `${name} = ${value}${newline}`);
  for (const [name, value] of Object.entries({
    "enable-normalization-flatten-containers": true,
    "enable-normalization-opposite-orientation-for-nested-containers": true,
    "default-root-container-layout": "tiles",
  })) {
    const node = rootKey(name);
    if (!node) addRoot(name, JSON.stringify(value));
    else if (getStaticTOMLValue(node.value) !== value)
      insert(...node.value.range, JSON.stringify(value));
  }

  for (const name of ["after-startup-command", "on-focus-changed"]) {
    const value = command("watch-aerospace");
    const node = rootKey(name);
    if (!node) addRoot(name, `[${JSON.stringify(value)}]`);
    else if (node.value.type === "TOMLArray") {
      const values = getStaticTOMLValue(node.value);
      if (!Array.isArray(values) || values.some((item) => typeof item !== "string"))
        throw new Error(`${name} must contain commands`);
      if (!values.includes(value))
        insert(
          node.value.range[0] + 1,
          node.value.range[0] + 1,
          `${JSON.stringify(value)}${values.length ? ", " : ""}`,
        );
    } else if (node.value.type === "TOMLValue" && node.value.kind === "string") {
      if (node.value.value !== value)
        insert(
          ...node.value.range,
          `[${JSON.stringify(value)}, ${output.slice(...node.value.range)}]`,
        );
    } else throw new Error(`${name} must be a command or command array`);
  }

  const value = command("window-created");
  const callback = `{ check-further-callbacks = true, run = ${JSON.stringify(value)} }`;
  const ast = parse(output);
  const config = getStaticTOMLValue(ast);
  const callbacks = config["on-window-detected"];
  if (callbacks !== undefined && !Array.isArray(callbacks))
    throw new Error("on-window-detected must be an array of callbacks");
  const installed = callbacks?.some(
    (item) =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      !(item instanceof Date) &&
      item["check-further-callbacks"] === true &&
      (item.run === value || (Array.isArray(item.run) && item.run.includes(value))),
  );
  if (!installed) {
    const node = rootKey("on-window-detected");
    if (node?.value.type === "TOMLArray") {
      insert(
        node.value.range[0] + 1,
        node.value.range[0] + 1,
        `${newline}  ${callback}${node.value.elements.length ? "," : ""}${newline}`,
      );
    } else {
      const first = ast.body[0].body.find(
        (item) =>
          item.type === "TOMLTable" &&
          item.kind === "array" &&
          keyName(item.key).join(".") === "on-window-detected",
      );
      if (first)
        insert(
          first.range[0],
          first.range[0],
          `[[on-window-detected]]${newline}check-further-callbacks = true${newline}run = ${JSON.stringify(value)}${newline}${newline}`,
        );
      else addRoot("on-window-detected", `[${callback}]`);
    }
  }
  parse(output); // Never return an invalid edit.
  return output;
}
