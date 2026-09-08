import * as fs$1 from "node:fs";
import fs from "node:fs";
import os from "node:os";
import * as util from "node:util";
import path$1 from "node:path";
import process$1 from "node:process";
//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region node_modules/yabai-master-stack-plugin/dist/rolldown-runtime-D7D4PA-g.mjs
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region node_modules/mimic-fn/index.js
const copyProperty = (to, from, property, ignoreNonConfigurable) => {
	if (property === "length" || property === "prototype") return;
	if (property === "arguments" || property === "caller") return;
	const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
	const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);
	if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) return;
	Object.defineProperty(to, property, fromDescriptor);
};
const canCopyProperty = function(toDescriptor, fromDescriptor) {
	return toDescriptor === void 0 || toDescriptor.configurable || toDescriptor.writable === fromDescriptor.writable && toDescriptor.enumerable === fromDescriptor.enumerable && toDescriptor.configurable === fromDescriptor.configurable && (toDescriptor.writable || toDescriptor.value === fromDescriptor.value);
};
const changePrototype = (to, from) => {
	const fromPrototype = Object.getPrototypeOf(from);
	if (fromPrototype === Object.getPrototypeOf(to)) return;
	Object.setPrototypeOf(to, fromPrototype);
};
const wrappedToString = (withName, fromBody) => `/* Wrapped ${withName}*/\n${fromBody}`;
const toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, "toString");
const toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name");
const changeToString = (to, from, name) => {
	const withName = name === "" ? "" : `with ${name.trim()}() `;
	const newToString = wrappedToString.bind(null, withName, from.toString());
	Object.defineProperty(newToString, "name", toStringName);
	Object.defineProperty(to, "toString", {
		...toStringDescriptor,
		value: newToString
	});
};
function mimicFunction(to, from, { ignoreNonConfigurable = false } = {}) {
	const { name } = to;
	for (const property of Reflect.ownKeys(from)) copyProperty(to, from, property, ignoreNonConfigurable);
	changePrototype(to, from);
	changeToString(to, from, name);
	return to;
}
//#endregion
//#region node_modules/onetime/index.js
const calledFunctions = /* @__PURE__ */ new WeakMap();
const onetime = (function_, options = {}) => {
	if (typeof function_ !== "function") throw new TypeError("Expected a function");
	let returnValue;
	let callCount = 0;
	const functionName = function_.displayName || function_.name || "<anonymous>";
	const onetime = function(...arguments_) {
		calledFunctions.set(onetime, ++callCount);
		if (callCount === 1) {
			returnValue = function_.apply(this, arguments_);
			function_ = null;
		} else if (options.throw === true) throw new Error(`Function \`${functionName}\` can only be called once`);
		return returnValue;
	};
	mimicFunction(onetime, function_);
	calledFunctions.set(onetime, callCount);
	return onetime;
};
onetime.callCount = (function_) => {
	if (!calledFunctions.has(function_)) throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
	return calledFunctions.get(function_);
};
//#endregion
//#region node_modules/pathe/dist/shared/pathe.ff20891b.mjs
const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
	if (!input) return input;
	return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _UNC_REGEX = /^[/\\]{2}/;
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
const _ROOT_FOLDER_RE = /^\/([A-Za-z]:)?$/;
const normalize = function(path) {
	if (path.length === 0) return ".";
	path = normalizeWindowsPath(path);
	const isUNCPath = path.match(_UNC_REGEX);
	const isPathAbsolute = isAbsolute(path);
	const trailingSeparator = path[path.length - 1] === "/";
	path = normalizeString(path, !isPathAbsolute);
	if (path.length === 0) {
		if (isPathAbsolute) return "/";
		return trailingSeparator ? "./" : ".";
	}
	if (trailingSeparator) path += "/";
	if (_DRIVE_LETTER_RE.test(path)) path += "/";
	if (isUNCPath) {
		if (!isPathAbsolute) return `//./${path}`;
		return `//${path}`;
	}
	return isPathAbsolute && !isAbsolute(path) ? `/${path}` : path;
};
const join = function(...arguments_) {
	if (arguments_.length === 0) return ".";
	let joined;
	for (const argument of arguments_) if (argument && argument.length > 0) {
		if (joined === void 0) joined = argument;
		else joined += `/${argument}`;
	}
	if (joined === void 0) return ".";
	return normalize(joined.replace(/\/\/+/g, "/"));
};
function cwd() {
	if (typeof process !== "undefined" && typeof process.cwd === "function") return process.cwd().replace(/\\/g, "/");
	return "/";
}
const resolve = function(...arguments_) {
	arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
	let resolvedPath = "";
	let resolvedAbsolute = false;
	for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
		const path = index >= 0 ? arguments_[index] : cwd();
		if (!path || path.length === 0) continue;
		resolvedPath = `${path}/${resolvedPath}`;
		resolvedAbsolute = isAbsolute(path);
	}
	resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
	if (resolvedAbsolute && !isAbsolute(resolvedPath)) return `/${resolvedPath}`;
	return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let char = null;
	for (let index = 0; index <= path.length; ++index) {
		if (index < path.length) char = path[index];
		else if (char === "/") break;
		else char = "/";
		if (char === "/") {
			if (lastSlash === index - 1 || dots === 1);
			else if (dots === 2) {
				if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf("/");
						if (lastSlashIndex === -1) {
							res = "";
							lastSegmentLength = 0;
						} else {
							res = res.slice(0, lastSlashIndex);
							lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
						}
						lastSlash = index;
						dots = 0;
						continue;
					} else if (res.length > 0) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = index;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					res += res.length > 0 ? "/.." : "..";
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += `/${path.slice(lastSlash + 1, index)}`;
				else res = path.slice(lastSlash + 1, index);
				lastSegmentLength = index - lastSlash - 1;
			}
			lastSlash = index;
			dots = 0;
		} else if (char === "." && dots !== -1) ++dots;
		else dots = -1;
	}
	return res;
}
const isAbsolute = function(p) {
	return _IS_ABSOLUTE_RE.test(p);
};
const toNamespacedPath = function(p) {
	return normalizeWindowsPath(p);
};
const _EXTNAME_RE = /.(\.[^./]+)$/;
const extname = function(p) {
	const match = _EXTNAME_RE.exec(normalizeWindowsPath(p));
	return match && match[1] || "";
};
const relative = function(from, to) {
	const _from = resolve(from).replace(_ROOT_FOLDER_RE, "$1").split("/");
	const _to = resolve(to).replace(_ROOT_FOLDER_RE, "$1").split("/");
	if (_to[0][1] === ":" && _from[0][1] === ":" && _from[0] !== _to[0]) return _to.join("/");
	const _fromCopy = [..._from];
	for (const segment of _fromCopy) {
		if (_to[0] !== segment) break;
		_from.shift();
		_to.shift();
	}
	return [..._from.map(() => ".."), ..._to].join("/");
};
const dirname = function(p) {
	const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
	if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) segments[0] += "/";
	return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};
const format = function(p) {
	const segments = [
		p.root,
		p.dir,
		p.base ?? p.name + p.ext
	].filter(Boolean);
	return normalizeWindowsPath(p.root ? resolve(...segments) : segments.join("/"));
};
const basename = function(p, extension) {
	const lastSegment = normalizeWindowsPath(p).split("/").pop();
	return extension && lastSegment.endsWith(extension) ? lastSegment.slice(0, -extension.length) : lastSegment;
};
const parse$1 = function(p) {
	const root = normalizeWindowsPath(p).split("/").shift() || "/";
	const base = basename(p);
	const extension = extname(base);
	return {
		root,
		dir: dirname(p),
		base,
		ext: extension,
		name: base.slice(0, base.length - extension.length)
	};
};
const path = {
	__proto__: null,
	basename,
	delimiter: ":",
	dirname,
	extname,
	format,
	isAbsolute,
	join,
	normalize,
	normalizeString,
	parse: parse$1,
	relative,
	resolve,
	sep: "/",
	toNamespacedPath
};
//#endregion
//#region node_modules/shell-quote/quote.js
var require_quote = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** @import { ControlOperator } from './parse' */
	/** @type {ControlOperator['op'][]} */
	var OPS = [
		"||",
		"&&",
		";;",
		"|&",
		"<(",
		"<<<",
		">>",
		">&",
		"<&",
		"&",
		";",
		"(",
		")",
		"|",
		"<",
		">"
	];
	var LINE_TERMINATORS = /[\n\r\u2028\u2029]/;
	var GLOB_SHELL_SPECIAL = /[\s#!"$&'():;<=>@\\^`|]/g;
	/** @type {typeof import('./quote')} */
	module.exports = function quote(xs) {
		return xs.map(function(s) {
			if (s === "") return "''";
			if (s && typeof s === "object") {
				if ("op" in s && s.op === "glob") {
					if (typeof s.pattern !== "string") throw new TypeError("glob token requires a string `pattern`");
					if (LINE_TERMINATORS.test(s.pattern)) throw new TypeError("glob `pattern` must not contain line terminators");
					return s.pattern.replace(GLOB_SHELL_SPECIAL, "\\$&");
				}
				if ("op" in s && typeof s.op === "string") {
					if (OPS.indexOf(s.op) < 0) throw new TypeError("invalid `op` value: " + JSON.stringify(s.op));
					return s.op.replace(/[\s\S]/g, "\\$&");
				}
				if ("comment" in s && typeof s.comment === "string") {
					if (LINE_TERMINATORS.test(s.comment)) throw new TypeError("`comment` must not contain line terminators");
					return "#" + s.comment;
				}
				throw new TypeError("unrecognized object token shape");
			}
			if (/["\s\\]/.test(s) && !/'/.test(s)) return "'" + s.replace(/(['])/g, "\\$1") + "'";
			if (/["'\s]/.test(s)) return "\"" + s.replace(/(["\\$`!])/g, "\\$1") + "\"";
			return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}~])/g, "$1\\$2");
		}).join(" ");
	};
}));
//#endregion
//#region node_modules/shell-quote/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* @import {
	* 	ControlOperator,
	* 	Env,
	* 	GlobPattern,
	* 	ParseEntry,
	* } from './parse' */
	var CONTROL = "(?:" + [
		"\\|\\|",
		"\\&\\&",
		";;",
		"\\|\\&",
		"\\<\\(",
		"\\<\\<\\<",
		">>",
		">\\&",
		"<\\&",
		"[&;()|<>]"
	].join("|") + ")";
	var controlRE = new RegExp("^" + CONTROL + "$");
	var META = "|&;()<> \\t";
	var SINGLE_QUOTE = "'([^']*?)'";
	var DOUBLE_QUOTE = "\"((\\\\\"|[^\"])*?)\"";
	var hash = /^#$/;
	var SQ = "'";
	var DQ = "\"";
	var DS = "$";
	var TOKEN = "";
	var mult = 4294967296;
	for (var i = 0; i < 4; i++) TOKEN += (mult * Math.random()).toString(16);
	var startsWithToken = new RegExp("^" + TOKEN);
	/**
	* @param {string} s
	* @param {RegExp} r
	*/
	function matchAll(s, r) {
		var origIndex = r.lastIndex;
		var matches = [];
		var matchObj;
		while (matchObj = r.exec(s)) {
			matches[matches.length] = matchObj;
			if (r.lastIndex === matchObj.index) r.lastIndex += 1;
		}
		r.lastIndex = origIndex;
		return matches;
	}
	/**
	* @param {Env} env
	* @param {string} pre
	* @param {string} key
	*/
	function getVar(env, pre, key) {
		var r = typeof env === "function" ? env(key) : env[key];
		if (typeof r === "undefined" && key != "") r = "";
		else if (typeof r === "undefined") r = "$";
		if (typeof r === "object") return pre + TOKEN + JSON.stringify(r) + TOKEN;
		return pre + r;
	}
	/**
	* @param {string} string
	* @param {Env} [env]
	* @param {{ escape?: string, splitUnquoted?: boolean | string }} [opts]
	* @returns {ParseEntry[]}
	*/
	function parseInternal(string, env, opts) {
		if (!opts) opts = {};
		var BS = opts.escape || "\\";
		var ifs = opts.splitUnquoted === true ? " 	\n" : typeof opts.splitUnquoted === "string" ? opts.splitUnquoted : "";
		var BAREWORD = "(\\" + BS + "['\"" + META + "]|[^\\s'\"" + META + "])+";
		var matches = matchAll(string, new RegExp(["(" + CONTROL + ")", "(" + BAREWORD + "|" + DOUBLE_QUOTE + "|" + SINGLE_QUOTE + ")+"].join("|"), "g"));
		if (matches.length === 0) return [];
		if (!env) env = {};
		var commented = false;
		return matches.map(function(match) {
			var s = match[0];
			if (!s || commented) return;
			if (controlRE.test(s)) return { op: s };
			/** @type {string | boolean} */
			var quote = false;
			var esc = false;
			var out = "";
			/** @type {string[]} */
			var words = [];
			var sawQuote = false;
			/** @type {number | null} */
			var pendingNw = null;
			var isGlob = false;
			/** @type {number} */
			var i;
			function parseEnvVar() {
				i += 1;
				/** @type {number | RegExpMatchArray | null} */
				var varend;
				/** @type {string} */
				var varname;
				var char = s.charAt(i);
				if (char === "{") {
					i += 1;
					if (s.charAt(i) === "}") throw new Error("Bad substitution: " + s.slice(i - 2, i + 1));
					var depth = 1;
					varend = i;
					while (depth > 0 && varend < s.length) {
						if (s.charAt(varend) === "{" && s.charAt(varend - 1) === "$") depth += 1;
						else if (s.charAt(varend) === "}") depth -= 1;
						varend += 1;
					}
					if (depth !== 0) throw new Error("Bad substitution: " + s.slice(i));
					varend -= 1;
					varname = s.slice(i, varend);
					i = varend;
				} else if (/[*@#?$!_-]/.test(char)) {
					varname = char;
					i += 1;
				} else {
					var slicedFromI = s.slice(i);
					varend = slicedFromI.match(/[^\w\d_]/);
					if (!varend) {
						varname = slicedFromI;
						i = s.length;
					} else {
						varname = slicedFromI.slice(0, varend.index);
						i += varend.index - 1;
					}
				}
				return getVar(env, "", varname);
			}
			function flushRun() {
				if (pendingNw === null) return;
				if (pendingNw === 0) {
					if (out !== "") {
						words[words.length] = out;
						out = "";
					}
				} else {
					words[words.length] = out;
					out = "";
					for (var fe = 1; fe < pendingNw; fe += 1) words[words.length] = "";
				}
				pendingNw = null;
			}
			for (i = 0; i < s.length; i++) {
				var c = s.charAt(i);
				if (ifs && c !== DS) flushRun();
				isGlob = isGlob || !quote && (c === "*" || c === "?");
				if (esc) {
					out += c;
					esc = false;
				} else if (quote) {
					if (c === quote) quote = false;
					else if (quote == SQ) out += c;
					else if (c === BS) {
						i += 1;
						c = s.charAt(i);
						if (c === DQ || c === BS || c === DS) out += c;
						else out += BS + c;
					} else if (c === DS) out += parseEnvVar();
					else out += c;
				} else if (c === DQ || c === SQ) {
					quote = c;
					sawQuote = true;
				} else if (controlRE.test(c)) return { op: s };
				else if (hash.test(c)) {
					commented = true;
					var commentObj = { comment: string.slice(match.index + i + 1) };
					if (out.length) return [out, commentObj];
					return [commentObj];
				} else if (c === BS) esc = true;
				else if (c === DS) {
					var value = parseEnvVar();
					if (!ifs) out += value;
					else for (var vi = 0; vi < value.length; vi += 1) {
						var vc = value.charAt(vi);
						if (ifs.indexOf(vc) < 0) {
							flushRun();
							out += vc;
						} else if (pendingNw === null) pendingNw = vc === " " || vc === "	" || vc === "\n" ? 0 : 1;
						else if (vc !== " " && vc !== "	" && vc !== "\n") pendingNw += 1;
					}
				} else out += c;
			}
			if (isGlob) return {
				op: "glob",
				pattern: out
			};
			if (ifs) {
				if (pendingNw !== null && pendingNw > 0) {
					words[words.length] = out;
					out = "";
					for (var te = 1; te < pendingNw; te += 1) words[words.length] = "";
				}
				if (out !== "" || sawQuote && words.length === 0) words[words.length] = out;
				return words;
			}
			return out;
		}).reduce(function(prev, arg) {
			if (typeof arg === "undefined") return prev;
			/** @type {ParseEntry[]} */ [].concat(arg).forEach(function(entry) {
				prev[prev.length] = entry;
			});
			return prev;
		}, []);
	}
	/** @type {typeof import('./parse')} */
	module.exports = function parse(s, env, opts) {
		var mapped = parseInternal(s, env, opts);
		if (typeof env !== "function") return mapped;
		return mapped.reduce(function(acc, s) {
			if (typeof s === "object") {
				acc[acc.length] = s;
				return acc;
			}
			var xs = s.split(RegExp("(" + TOKEN + ".*?" + TOKEN + ")", "g"));
			if (xs.length === 1) {
				acc[acc.length] = xs[0];
				return acc;
			}
			xs.filter(Boolean).forEach(function(x) {
				acc[acc.length] = startsWithToken.test(x) ? JSON.parse(x.split(TOKEN)[1]) : x;
			});
			return acc;
		}, []);
	};
}));
//#endregion
//#region node_modules/tiny-invariant/dist/esm/tiny-invariant.js
var import_shell_quote = (/* @__PURE__ */ __commonJSMin(((exports) => {
	exports.quote = require_quote();
	exports.parse = require_parse();
})))();
var isProduction = process.env.NODE_ENV === "production";
var prefix = "Invariant failed";
function invariant(condition, message) {
	if (condition) return;
	if (isProduction) throw new Error(prefix);
	var provided = typeof message === "function" ? message() : message;
	var value = provided ? "".concat(prefix, ": ").concat(provided) : prefix;
	throw new Error(value);
}
//#endregion
//#region node_modules/yabai-master-stack-plugin/dist/tasks-map-Cu1D765k.mjs
const getConfig = onetime(() => {
	try {
		const configPath = path.join(os.homedir(), ".config/ymsp/ymsp.config.json");
		return {
			masterPosition: "right",
			moveNewWindowsToMaster: false,
			debug: false,
			yabaiPath: "/usr/local/bin/yabai",
			...JSON.parse(fs$1.readFileSync(configPath).toString())
		};
	} catch (error) {
		const err = error;
		if (err.code === "ENOENT") throw new Error("The config file at ~/.config/ymsp/ymsp.config.json file was not found.");
		else throw err;
	}
});
function debug(cb) {
	const { debug: isDebugOn } = getConfig();
	if (isDebugOn) {
		fs.appendFileSync(path.join(os.homedir(), ".ymsp-log"), util.inspect(cb()) + "\n");
		console.error(cb());
	}
}
const ymspConfigDirpath$1 = path$1.join(os.homedir(), ".config/ymsp");
const lockFilepath = path$1.join(ymspConfigDirpath$1, "ymsp.lock");
function defineTask(cb) {
	return async () => {
		fs.rmSync(lockFilepath, {
			force: true,
			recursive: true
		});
		fs.writeFileSync(lockFilepath, process.pid.toString());
		return cb().catch(handleMasterError);
	};
}
function handleMasterError(error) {
	if (error.code === "ELOCKED") debug(() => "Lock found...aborting");
	else console.error(error);
}
/** Read stdout from a yabai subprocess created with piped output. */
async function getYabaiOutput(yabaiProcess) {
	return new Response(yabaiProcess.stdout).text();
}
async function getDisplays() {
	const { yabaiPath } = getConfig();
	const yabaiOutput = await getYabaiOutput(Bun.spawn([
		yabaiPath,
		"-m",
		"query",
		"--displays"
	]));
	return JSON.parse(yabaiOutput);
}
async function getFocusedDisplay() {
	const { yabaiPath } = getConfig();
	const yabaiOutput = await getYabaiOutput(Bun.spawn([
		yabaiPath,
		"-m",
		"query",
		"--displays",
		"--display"
	]));
	return JSON.parse(yabaiOutput);
}
async function getSpaces() {
	const { yabaiPath } = getConfig();
	const yabaiOutput = await getYabaiOutput(Bun.spawn([
		yabaiPath,
		"-m",
		"query",
		"--spaces"
	], { stdout: "pipe" }));
	return JSON.parse(yabaiOutput);
}
async function getFocusedSpace() {
	const { yabaiPath } = getConfig();
	const yabaiOutput = await getYabaiOutput(Bun.spawn([
		yabaiPath,
		"-m",
		"query",
		"--spaces",
		"--space"
	], { stdout: "pipe" }));
	return JSON.parse(yabaiOutput);
}
const stateFilePath = path.join(os.homedir(), ".config/ymsp/state.json");
function writeState(state) {
	fs.writeFileSync(stateFilePath, JSON.stringify(state));
}
async function readState() {
	if (fs.existsSync(stateFilePath)) {
		const data = JSON.parse(fs.readFileSync(stateFilePath).toString());
		const spaces = await getSpaces();
		for (const space of spaces) if (data[space.id.toString()] === void 0) data[space.id.toString()] = { numMasterWindows: 1 };
		for (const spaceId of Object.keys(spaces)) if (!spaces.some((space) => space.id.toString() === spaceId)) data[spaceId] = void 0;
		return data;
	} else {
		const defaultState = {};
		const spaces = await getSpaces();
		for (const space of spaces) defaultState[space.id] = { numMasterWindows: 1 };
		const defaultStateJson = JSON.stringify(defaultState);
		fs.writeFileSync(stateFilePath, defaultStateJson);
		return defaultState;
	}
}
const ymspConfigDirpath = path.join(os.homedir(), ".config/ymsp");
const lockfilePath = path.join(ymspConfigDirpath, "ymsp.lock");
async function executeYabaiCommand(command) {
	const { yabaiPath } = getConfig();
	try {
		if (fs.readFileSync(lockfilePath, "utf8") !== process.pid.toString()) throw Object.assign(/* @__PURE__ */ new Error("Lockfile is no longer owned by this process"), { code: "ELOCKED" });
	} catch {
		throw Object.assign(/* @__PURE__ */ new Error("Lockfile is no longer owned by this process"), { code: "ELOCKED" });
	}
	const yabaiOutput = await getYabaiOutput(Bun.spawn([yabaiPath, ...(0, import_shell_quote.parse)(command)]));
	await this.refreshWindowsData();
	return yabaiOutput;
}
/**
There is always a "line" dividing the master windows from the secondary windows. To find this line, we use two observations (the following apply for a master position on the right):
1. The top-right window is always on the right side of the dividing line.
2. If there is more than one master window, the dividing line must cross the left side of two windows.
Using these observations, we can loop through the windows in descending x-coordinate starting from the top-right window and for each pair of windows that share x-coordinates, we check if the numMasterWindows is less than the number of windows we've iterated through, and if so, return the x-coordinate of the currently processed window.

If the master position is on the left, then we start searching starting from the top-left window.
*/
function getDividingLineXCoordinate() {
	if (getConfig().masterPosition === "right") {
		const topRightWindow = this.getTopRightWindow();
		if (topRightWindow === void 0) throw new Error("getDividngLineXCoordinate() was called when there are no windows.");
		debug(() => `Top-right window: ${topRightWindow.app}`);
		if (this.expectedCurrentNumMasterWindows === 1) return topRightWindow.frame.x;
		const nonStackWindows = this.windowsData.filter((window) => !this.isStackWindow(window));
		const eligibleWindows = nonStackWindows.filter((window) => window.frame.x <= topRightWindow.frame.x).sort((window1, window2) => window2.frame.x - window1.frame.x);
		const numWindowsToRightOfTopRightWindow = nonStackWindows.length - eligibleWindows.length;
		if (numWindowsToRightOfTopRightWindow >= this.expectedCurrentNumMasterWindows) return topRightWindow.frame.x;
		for (let i = 0; i < eligibleWindows.length - 1; i += 1) {
			const curWindow = eligibleWindows[i];
			const nextWindow = eligibleWindows[i + 1];
			invariant(curWindow);
			invariant(nextWindow);
			if (curWindow.frame.x === nextWindow.frame.x && numWindowsToRightOfTopRightWindow + i + 2 >= this.expectedCurrentNumMasterWindows) return curWindow.frame.x;
		}
		return topRightWindow.frame.x;
	} else {
		const topLeftWindow = this.getTopLeftWindow();
		if (topLeftWindow === void 0) throw new Error("getDividingLineXCoordinate() was called when there are no windows.");
		debug(() => `Top-left window: ${topLeftWindow.app}`);
		const nonMasterWindows = this.windowsData.filter((window) => !this.isWindowTouchingLeftEdge(window)).sort((window1, window2) => window1.frame.x - window2.frame.x);
		if (nonMasterWindows.length === 0) return this.display.frame.x;
		const numMasterWindows = this.windowsData.length - nonMasterWindows.length;
		if (numMasterWindows >= this.expectedCurrentNumMasterWindows) {
			invariant(nonMasterWindows[0]);
			return nonMasterWindows[0].frame.x;
		}
		for (let i = 0; i < nonMasterWindows.length - 1; i += 1) {
			const curWindow = nonMasterWindows[i];
			const nextWindow = nonMasterWindows[i + 1];
			invariant(curWindow);
			invariant(nextWindow);
			if (curWindow.frame.x === nextWindow.frame.x && numMasterWindows + i + 2 >= this.expectedCurrentNumMasterWindows) return curWindow.frame.x;
		}
		invariant(nonMasterWindows[0]);
		return nonMasterWindows[0].frame.x;
	}
}
async function isValidLayout(args) {
	debug(() => "Starting valid layout check...");
	if (this.windowsData.length === 0) return { status: true };
	const targetNumMasterWindows = args?.targetNumMasterWindows ?? this.expectedCurrentNumMasterWindows;
	if (targetNumMasterWindows > this.windowsData.length && !this.windowsData.every((window) => this.isWindowTouchingLeftEdge(window))) return {
		status: false,
		reason: "The number of master windows is greater than the number of windows and not all windows are touching the left edge."
	};
	else {
		const curNumMasterWindows = this.getMasterWindows().length;
		if (targetNumMasterWindows !== curNumMasterWindows) return {
			status: false,
			reason: `Number of master windows does not equal expected number of master windows (${curNumMasterWindows}/${targetNumMasterWindows})`
		};
		for (const window of this.windowsData) if (this.isMiddleWindow(window)) return {
			status: false,
			reason: `A middle window (${window.app}) was detected.`
		};
		return { status: true };
	}
}
async function updateWindows({ targetNumMasterWindows }) {
	debug(() => `updateWindows() called with targetNumMasterWindows = ${targetNumMasterWindows}`);
	await this.columnizeMasterWindows();
	await this.columnizeStackWindows();
	const layoutValidity = await this.isValidLayout({ targetNumMasterWindows });
	if (layoutValidity.status) {
		debug(() => "Valid layout detected; no changes were made.");
		return;
	} else debug(() => `Invalid layout detected: ${layoutValidity.reason}. Updating windows...`);
	const numWindows = this.windowsData.length;
	if (targetNumMasterWindows !== numWindows && !this.doesStackExist()) {
		debug(() => "Stack does not exist, creating it...");
		await this.createStack();
	}
	if (targetNumMasterWindows === numWindows) {
		for (const window of this.windowsData) if (window["split-type"] === "vertical") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
	}
	if (numWindows > 1) {
		const masterWindows = this.getMasterWindows();
		debug(() => `Master windows: ${masterWindows.map((window) => window.app).join(",")}`);
		let curNumMasterWindows = masterWindows.length;
		if (curNumMasterWindows > targetNumMasterWindows) {
			debug(() => `Too many master windows (${curNumMasterWindows}/${targetNumMasterWindows}).`);
			masterWindows.sort((window1, window2) => window1.frame.y === window2.frame.y ? window1.frame.x - window2.frame.x : window1.frame.y - window2.frame.y);
			while (curNumMasterWindows > targetNumMasterWindows) {
				const masterWindow = masterWindows.pop();
				debug(() => `Moving master window ${masterWindow.app} to stack.`);
				await this.moveWindowToStack(masterWindow);
				curNumMasterWindows -= 1;
			}
		}
		let middleWindows;
		while ((middleWindows = this.getMiddleWindows()).length > 0) {
			const middleWindow = middleWindows[0];
			invariant(middleWindow);
			debug(() => `Middle window ${middleWindow.app} detected.`);
			if (curNumMasterWindows < targetNumMasterWindows) {
				debug(() => `Moving middle window ${middleWindow.app} to master.`);
				await this.moveWindowToMaster(middleWindow);
				curNumMasterWindows += 1;
			} else {
				debug(() => `Moving middle window ${middleWindow.app} to stack.`);
				await this.moveWindowToStack(middleWindow);
			}
		}
		const stackWindows = this.getStackWindows();
		stackWindows.sort((window1, window2) => window1.frame.x === window2.frame.x ? window2.frame.y - window1.frame.y : window2.frame.x - window1.frame.x);
		while (curNumMasterWindows < targetNumMasterWindows) {
			console.info(`Not enough master windows (${curNumMasterWindows}/${targetNumMasterWindows})`);
			const stackWindow = stackWindows.pop();
			debug(() => `Moving stack window ${stackWindow.app} to master.`);
			await this.moveWindowToMaster(stackWindow);
			curNumMasterWindows += 1;
		}
	}
	if ((await this.isValidLayout({ targetNumMasterWindows })).status) debug(() => "updateWindows() was successful.");
	else throw new Error(`updateWindows() ended with an invalid layout; reason: ${layoutValidity.reason}`);
	this.expectedCurrentNumMasterWindows = targetNumMasterWindows;
}
/**
If the master position is on the right, a window which is to the right of the dividing line is considered a master window.
If the master position is on the left, a window that is touching the left edge is considered a master window.
*/
function isMasterWindow(window) {
	if (getConfig().masterPosition === "right") {
		const dividingLineXCoordinate = this.getDividingLineXCoordinate();
		return window.frame.x >= dividingLineXCoordinate;
	} else return this.isWindowTouchingLeftEdge(window);
}
function getMasterWindows() {
	if (getConfig().masterPosition === "right") {
		const dividingLineXCoordinate = this.getDividingLineXCoordinate();
		return this.windowsData.filter((window) => window.frame.x >= dividingLineXCoordinate);
	} else return this.windowsData.filter((window) => this.isWindowTouchingLeftEdge(window));
}
function getTopMasterWindow() {
	return this.getTopWindow(this.getMasterWindows());
}
function getBottomMasterWindow() {
	return this.getBottomWindow(this.getMasterWindows());
}
function getWidestMasterWindow() {
	let widestMasterWindow;
	for (const window of this.getMasterWindows()) if (widestMasterWindow === void 0 || window.frame.w > widestMasterWindow.frame.w) widestMasterWindow = window;
	return widestMasterWindow;
}
async function moveWindowToMaster$1(window) {
	debug(() => `Moving window ${window.app} to master.`);
	if (this.expectedCurrentNumMasterWindows < this.windowsData.length) try {
		if (getConfig().masterPosition === "right") await this.executeYabaiCommand(`-m window ${window.id} --warp east`);
		else await this.executeYabaiCommand(`-m window ${window.id} --warp west`);
	} catch {}
	if (this.isMasterWindow(window)) return;
	const masterWindow = this.getWidestMasterWindow();
	if (masterWindow === void 0 || masterWindow.id === window.id) return;
	await this.executeYabaiCommand(`-m window ${window.id} --warp ${masterWindow.id}`);
	window = this.getUpdatedWindowData(window);
	if (window["split-type"] === "vertical") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
}
/**
Turns the master into a column by making sure the split direction of all the master windows
is horizontal.
*/
async function columnizeMasterWindows() {
	const masterWindows = this.getMasterWindows();
	if (masterWindows.length > 1) for (const masterWindow of masterWindows) {
		const window = this.getUpdatedWindowData(masterWindow);
		if (window["split-type"] === "vertical") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
	}
}
async function moveWindowToStack(window) {
	if (this.expectedCurrentNumMasterWindows === this.windowsData.length) {
		debug(() => `Skipped moving window ${window.app} to stack because there is no stack.`);
		return;
	}
	debug(() => `Moving window ${window.app} to stack.`);
	await this.columnizeStackWindows();
	if (this.windowsData.length === 2) {
		if (window["split-type"] === "horizontal") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
		return;
	}
	if (this.isStackWindow(window)) return;
	const stackWindow = this.getWidestStackWindow();
	if (stackWindow === void 0 || stackWindow.id === window.id) return;
	await this.executeYabaiCommand(`-m window ${window.id} --warp ${stackWindow.id}`);
	window = this.getUpdatedWindowData(window);
	const splitType = window["split-type"];
	if (this.windowsData.length === 2) {
		if (splitType === "horizontal") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
	} else if (splitType === "vertical") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
}
function getTopWindow(windows) {
	if (windows.length === 0) return;
	let topWindow = windows[0];
	invariant(topWindow);
	for (const w of windows) if (w.frame.y < topWindow.frame.y) topWindow = w;
	return topWindow;
}
function isTopWindow(windows, window) {
	return this.getTopWindow(windows)?.id === window.id;
}
function getBottomWindow(windows) {
	if (windows.length === 0) return;
	let bottomWindow = windows[0];
	invariant(bottomWindow);
	for (const w of windows) if (w.frame.y > bottomWindow.frame.y) bottomWindow = w;
	return bottomWindow;
}
function isBottomWindow(windows, window) {
	return this.getBottomWindow(windows)?.id === window.id;
}
/**
The top-left window is the window with the lowest y-coordinate and the lowest x-coordinate.
*/
function getTopLeftWindow() {
	const leftWindows = this.windowsData.filter((window) => this.isWindowTouchingLeftEdge(window));
	if (leftWindows.length === 0) return;
	let topLeftWindow = leftWindows[0];
	invariant(topLeftWindow);
	for (const window of leftWindows) if (window.frame.y <= topLeftWindow.frame.y) topLeftWindow = window;
	return topLeftWindow;
}
/**
The top-right window is the rightmost window with the lowest y-coordinate.
*/
function getTopRightWindow() {
	if (this.windowsData.length === 0) return;
	invariant(this.windowsData[0]);
	let lowestYCoordinate = this.windowsData[0].frame.y;
	for (const window of this.windowsData) if (window.frame.y < lowestYCoordinate) lowestYCoordinate = window.frame.y;
	const topWindows = this.windowsData.filter((window) => window.frame.y === lowestYCoordinate);
	let topRightWindow = topWindows[0];
	invariant(topRightWindow);
	for (const window of topWindows) if (window.frame.x > topRightWindow.frame.x) topRightWindow = window;
	return topRightWindow;
}
function isMiddleWindow(window) {
	return !this.isStackWindow(window) && !this.isMasterWindow(window);
}
function getMiddleWindows() {
	return this.windowsData.filter((window) => this.isMiddleWindow(window));
}
function isWindowTouchingLeftEdge(window) {
	return window.frame.x === this.display.frame.x;
}
/**
If the window's frame has an x equal to the x of the display, it is a stack window
*/
function isStackWindow(window) {
	if (getConfig().masterPosition === "right") return this.isWindowTouchingLeftEdge(window);
	else {
		const dividingLineXCoordinate = this.getDividingLineXCoordinate();
		return window.frame.x === dividingLineXCoordinate;
	}
}
function getWidestStackWindow() {
	let widestStackWindow;
	for (const window of this.getStackWindows()) if (widestStackWindow === void 0 || window.frame.w > widestStackWindow.frame.w) widestStackWindow = window;
	return widestStackWindow;
}
function getTopStackWindow() {
	return this.getTopWindow(this.getStackWindows());
}
function getBottomStackWindow() {
	return this.getBottomWindow(this.getStackWindows());
}
/**
In the event that the windows get badly rearranged, we force all windows to become vertically split to ensure that there exists a stack.
*/
async function createStack() {
	debug(() => "Creating stack...");
	for (const window of this.windowsData) if (window["split-type"] === "horizontal") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
	await this.columnizeStackWindows();
	await this.columnizeMasterWindows();
}
/**
If the top-right window has a x-coordinate of 0, or if the stack dividing line is equal to 0, then the stack does not exist. This applies to master positions on the left and on the right.
*/
function doesStackExist() {
	const topRightWindow = this.getTopRightWindow();
	if (topRightWindow === void 0) return false;
	return topRightWindow.frame.x !== 0;
}
/**
Turns the stack into a column by making sure the split direction of all the stack windows
is horizontal
*/
async function columnizeStackWindows() {
	if (this.expectedCurrentNumMasterWindows === this.windowsData.length) {
		debug(() => "Skipped columnizing stack windows because there is no stack.");
		return;
	}
	const stackWindows = this.getStackWindows();
	if (stackWindows.length > 1) for (const stackWindow of stackWindows) {
		const window = this.getUpdatedWindowData(stackWindow);
		if (window["split-type"] === "vertical") await this.executeYabaiCommand(`-m window ${window.id} --toggle split`);
	}
}
function getStackWindows() {
	return this.windowsData.filter((window) => this.isStackWindow(window));
}
function validateState(state) {
	const spaceState = state[this.space.id];
	invariant(spaceState);
	if (this.windowsData.length < this.expectedCurrentNumMasterWindows) {
		this.expectedCurrentNumMasterWindows = this.windowsData.length;
		spaceState.numMasterWindows = this.windowsData.length;
	}
	if (spaceState.numMasterWindows <= 0) spaceState.numMasterWindows = 1;
	writeState(state);
}
async function getWindowsData() {
	const { yabaiPath } = getConfig();
	const yabaiOutput = await getYabaiOutput(Bun.spawn([
		yabaiPath,
		"-m",
		"query",
		"--windows"
	], { stdout: "pipe" }));
	return JSON.parse(yabaiOutput).filter((window) => {
		if (window["is-floating"] || window.display !== this.display.index || window.space !== this.space.index) return false;
		const isMinimized = window["is-minimized"];
		const isHidden = window["is-hidden"];
		const isVisible = window["is-visible"];
		if (isMinimized || isHidden || !isVisible) return false;
		return true;
	});
}
async function refreshWindowsData() {
	const newWindowsData = await this.getWindowsData();
	this.windowsData = newWindowsData;
}
async function initialize() {
	this.windowsData = await this.getWindowsData();
}
function getUpdatedWindowData(window) {
	return this.windowsData.find((win) => window.id === win.id);
}
function getWindowData({ processId, windowId }) {
	if (processId === void 0 && windowId === void 0) throw new Error("Must provide at least one of processId or windowId");
	const windowData = this.windowsData.find((window) => window.pid === Number(processId) || window.id === Number(windowId));
	if (windowData === void 0) {
		if (processId === void 0) {
			invariant(windowId);
			throw new Error(`Window with id ${windowId} not found.`);
		} else throw new Error(`Window with pid ${processId} not found.`);
	}
	return windowData;
}
function getFocusedWindow() {
	return this.windowsData.find((w) => w["has-focus"]);
}
var methods_exports = /* @__PURE__ */ __exportAll({
	columnizeMasterWindows: () => columnizeMasterWindows,
	columnizeStackWindows: () => columnizeStackWindows,
	createStack: () => createStack,
	doesStackExist: () => doesStackExist,
	executeYabaiCommand: () => executeYabaiCommand,
	getBottomMasterWindow: () => getBottomMasterWindow,
	getBottomStackWindow: () => getBottomStackWindow,
	getBottomWindow: () => getBottomWindow,
	getDividingLineXCoordinate: () => getDividingLineXCoordinate,
	getFocusedWindow: () => getFocusedWindow,
	getMasterWindows: () => getMasterWindows,
	getMiddleWindows: () => getMiddleWindows,
	getStackWindows: () => getStackWindows,
	getTopLeftWindow: () => getTopLeftWindow,
	getTopMasterWindow: () => getTopMasterWindow,
	getTopRightWindow: () => getTopRightWindow,
	getTopStackWindow: () => getTopStackWindow,
	getTopWindow: () => getTopWindow,
	getUpdatedWindowData: () => getUpdatedWindowData,
	getWidestMasterWindow: () => getWidestMasterWindow,
	getWidestStackWindow: () => getWidestStackWindow,
	getWindowData: () => getWindowData,
	getWindowsData: () => getWindowsData,
	initialize: () => initialize,
	isBottomWindow: () => isBottomWindow,
	isMasterWindow: () => isMasterWindow,
	isMiddleWindow: () => isMiddleWindow,
	isStackWindow: () => isStackWindow,
	isTopWindow: () => isTopWindow,
	isValidLayout: () => isValidLayout,
	isWindowTouchingLeftEdge: () => isWindowTouchingLeftEdge,
	moveWindowToMaster: () => moveWindowToMaster$1,
	moveWindowToStack: () => moveWindowToStack,
	refreshWindowsData: () => refreshWindowsData,
	updateWindows: () => updateWindows,
	validateState: () => validateState
});
var WindowManagerClass = class {
	display;
	space;
	expectedCurrentNumMasterWindows;
	windowsData = [];
	constructor({ display, expectedCurrentNumMasterWindows, space }) {
		this.display = display;
		this.space = space;
		this.expectedCurrentNumMasterWindows = expectedCurrentNumMasterWindows;
		Object.assign(this, methods_exports);
	}
};
const WindowsManager = WindowManagerClass;
async function createInitializedWindowsManager() {
	const state = await readState();
	const display = await getFocusedDisplay();
	const space = await getFocusedSpace();
	const spaceState = state[space.id];
	invariant(spaceState);
	const wm = new WindowsManager({
		display,
		space,
		expectedCurrentNumMasterWindows: spaceState.numMasterWindows
	});
	await wm.initialize();
	wm.validateState(state);
	return {
		wm,
		state,
		display,
		space
	};
}
const closeFocusedWindow = defineTask(async () => {
	const { wm } = await createInitializedWindowsManager();
	const windowToClose = wm.getFocusedWindow();
	if (windowToClose === void 0) return;
	const masterWindows = wm.getMasterWindows().sort((w1, w2) => w1.frame.y - w2.frame.y);
	const stackWindows = wm.getStackWindows().sort((w1, w2) => w1.frame.y - w2.frame.y);
	let windowToFocus;
	if (wm.isStackWindow(windowToClose)) {
		if (stackWindows.length === 1) windowToFocus = masterWindows[0];
		else {
			const windowPosition = stackWindows.findIndex((w) => w.id === windowToClose.id);
			if (windowPosition === 0) windowToFocus = stackWindows[1];
			else windowToFocus = stackWindows[windowPosition - 1];
		}
	} else if (wm.isMasterWindow(windowToClose)) {
		if (masterWindows.length === 1 && stackWindows.length > 0) windowToFocus = stackWindows[stackWindows.length - 1];
		else {
			const windowPosition = masterWindows.findIndex((w) => w.id === windowToClose.id);
			if (windowPosition === 0) windowToFocus = masterWindows[1];
			else windowToFocus = masterWindows[windowPosition - 1];
		}
	}
	await wm.executeYabaiCommand(`-m window --close`);
	if (windowToFocus !== void 0) await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
});
const decreaseMasterWindowCount = defineTask(async () => {
	const { wm, state, space } = await createInitializedWindowsManager();
	const spaceState = state[space.id];
	invariant(spaceState);
	if (spaceState.numMasterWindows > 1) {
		spaceState.numMasterWindows -= 1;
		writeState(state);
		debug(() => "Decreasing master window count.");
		await wm.updateWindows({ targetNumMasterWindows: spaceState.numMasterWindows });
	}
});
const focusDownWindow = defineTask(async () => {
	const { wm } = await createInitializedWindowsManager();
	const focusedWindow = wm.getFocusedWindow();
	if (focusedWindow !== void 0) {
		if (wm.isMasterWindow(focusedWindow) && wm.isBottomWindow(wm.getMasterWindows(), focusedWindow)) {
			const windowToFocus = wm.getTopStackWindow() ?? wm.getTopMasterWindow();
			if (windowToFocus === void 0) debug(() => `Now window to focus on`);
			else {
				debug(() => `Focusing on the window ${windowToFocus.app}`);
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else if (wm.isStackWindow(focusedWindow) && wm.isBottomWindow(wm.getStackWindows(), focusedWindow)) {
			const windowToFocus = wm.getTopMasterWindow();
			if (windowToFocus === void 0) debug(() => `No window to focus on`);
			else {
				debug(() => `Focusing on the window ${windowToFocus.app}`);
				await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
			}
		} else await wm.executeYabaiCommand(`-m window --focus south`);
	} else await wm.executeYabaiCommand(`-m window --focus first`);
});
const focusMasterWindow = defineTask(async () => {
	const config = getConfig();
	switch (config.masterPosition) {
		case "right":
			await Bun.spawn([
				config.yabaiPath,
				"-m",
				"window",
				"--focus",
				"east"
			]).exited;
			break;
		case "left":
			await Bun.spawn([
				config.yabaiPath,
				"-m",
				"window",
				"--focus",
				"west"
			]).exited;
			break;
		default: throw new Error(`Unsupported master position: ${String(config.masterPosition)}`);
	}
});
const focusNextDisplay = defineTask(async () => {
	const displays = await getDisplays();
	const focusedDisplay = await getFocusedDisplay();
	const sortedDisplays = displays.sort((d1, d2) => d1.frame.x - d2.frame.x);
	console.log(sortedDisplays);
	const nextFocusedDisplay = sortedDisplays[(sortedDisplays.findIndex((display) => display.id === focusedDisplay.id) + 1) % sortedDisplays.length];
	const { yabaiPath } = getConfig();
	await Bun.spawn([
		yabaiPath,
		"-m",
		"display",
		"--focus",
		nextFocusedDisplay.index.toString()
	]).exited;
});
const focusPreviousDisplay = defineTask(async () => {
	const displays = await getDisplays();
	const focusedDisplay = await getFocusedDisplay();
	const sortedDisplays = displays.sort((d1, d2) => d1.frame.x - d2.frame.x);
	const previousFocusedDisplay = sortedDisplays[(sortedDisplays.findIndex((display) => display.id === focusedDisplay.id) - 1 + sortedDisplays.length) % sortedDisplays.length];
	const { yabaiPath } = getConfig();
	await Bun.spawn([
		yabaiPath,
		"-m",
		"display",
		"--focus",
		previousFocusedDisplay.index.toString()
	]).exited;
});
const moveWindowToNextDisplay = defineTask(async () => {
	const displays = await getDisplays();
	const focusedDisplay = await getFocusedDisplay();
	const sortedDisplays = displays.sort((d1, d2) => d1.frame.x - d2.frame.x);
	console.log(sortedDisplays);
	const nextFocusedDisplay = sortedDisplays[(sortedDisplays.findIndex((display) => display.id === focusedDisplay.id) + 1) % sortedDisplays.length];
	const { yabaiPath } = getConfig();
	await Bun.spawn([
		yabaiPath,
		"-m",
		"window",
		"--display",
		nextFocusedDisplay.index.toString()
	]).exited;
});
const moveWindowToPreviousDisplay = defineTask(async () => {
	const displays = await getDisplays();
	const focusedDisplay = await getFocusedDisplay();
	const sortedDisplays = displays.sort((d1, d2) => d1.frame.x - d2.frame.x);
	const previousFocusedDisplay = sortedDisplays[(sortedDisplays.findIndex((display) => display.id === focusedDisplay.id) - 1 + sortedDisplays.length) % sortedDisplays.length];
	const { yabaiPath } = getConfig();
	await Bun.spawn([
		yabaiPath,
		"-m",
		"window",
		"--display",
		previousFocusedDisplay.index.toString()
	]).exited;
});
const moveWindowToMaster = defineTask(async () => {
	const config = getConfig();
	switch (config.masterPosition) {
		case "right":
			await Bun.spawn([
				config.yabaiPath,
				"-m",
				"window",
				"--swap",
				"east"
			]).exited;
			break;
		case "left":
			await Bun.spawn([
				config.yabaiPath,
				"-m",
				"window",
				"--swap",
				"west"
			]).exited;
			break;
		default: throw new Error(`Unsupported master position: ${String(config.masterPosition)}`);
	}
});
const tasksMap = {
	"close-focused-window": closeFocusedWindow,
	"decrease-master-window-count": decreaseMasterWindowCount,
	"focus-down-window": focusDownWindow,
	"focus-up-window": defineTask(async () => {
		const { wm } = await createInitializedWindowsManager();
		const focusedWindow = wm.getFocusedWindow();
		if (focusedWindow !== void 0) {
			if (wm.isMasterWindow(focusedWindow) && wm.isTopWindow(wm.getMasterWindows(), focusedWindow)) {
				const windowToFocus = wm.getBottomStackWindow() ?? wm.getBottomMasterWindow();
				if (windowToFocus === void 0) debug(() => `No window to focus on`);
				else {
					debug(() => `Focusing on the window ${windowToFocus.app}`);
					await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
				}
			} else if (wm.isStackWindow(focusedWindow) && wm.isTopWindow(wm.getStackWindows(), focusedWindow)) {
				const windowToFocus = wm.getBottomMasterWindow();
				if (windowToFocus === void 0) debug(() => `No window to focus on`);
				else {
					debug(() => `Focusing on the window ${windowToFocus.app}`);
					await wm.executeYabaiCommand(`-m window --focus ${windowToFocus.id}`);
				}
			} else await wm.executeYabaiCommand(`-m window --focus north`);
		}
	}),
	"increase-master-window-count": defineTask(async () => {
		const { wm, space, state } = await createInitializedWindowsManager();
		const spaceState = state[space.id];
		invariant(spaceState);
		if (spaceState.numMasterWindows < wm.windowsData.length) {
			spaceState.numMasterWindows += 1;
			writeState(state);
			debug(() => "Increasing master window count.");
			await wm.updateWindows({ targetNumMasterWindows: spaceState.numMasterWindows });
		}
	}),
	"on-yabai-start": defineTask(async () => {
		const { wm, state, space } = await createInitializedWindowsManager();
		const spaceState = state[space.id];
		invariant(spaceState);
		await wm.updateWindows({ targetNumMasterWindows: spaceState.numMasterWindows });
	}),
	"window-created": defineTask(async () => {
		const { wm, state, space } = await createInitializedWindowsManager();
		debug(() => "Starting to handle window_created.");
		if ((await wm.isValidLayout()).status) {
			debug(() => "Valid layout detected; no changes were made.");
			return;
		}
		const processId = process$1.env.YABAI_PROCESS_ID;
		const windowId = process$1.env.YABAI_WINDOW_ID;
		const curNumMasterWindows = wm.getMasterWindows().length;
		const window = wm.getWindowData({
			windowId,
			processId
		});
		const spaceState = state[space.id];
		invariant(spaceState);
		if (getConfig().moveNewWindowsToMaster) {
			if (curNumMasterWindows >= spaceState.numMasterWindows) {
				const oldMasterWindow = wm.getMasterWindows()[0];
				invariant(oldMasterWindow);
				await wm.moveWindowToMaster(window);
				await wm.moveWindowToStack(oldMasterWindow);
			} else await wm.moveWindowToMaster(window);
		} else if (curNumMasterWindows > 1 && curNumMasterWindows <= spaceState.numMasterWindows) {
			debug(() => "Moving newly created window to master.");
			await wm.moveWindowToMaster(window);
		} else {
			debug(() => "Moving newly created window to stack.");
			await wm.moveWindowToStack(window);
		}
		await wm.updateWindows({ targetNumMasterWindows: spaceState.numMasterWindows });
		debug(() => "Finished handling window_created.");
	}),
	"window-moved": defineTask(async () => {
		const { wm, space, state } = await createInitializedWindowsManager();
		debug(() => "Starting to handle window_moved.");
		const spaceState = state[space.id];
		invariant(spaceState);
		await wm.updateWindows({ targetNumMasterWindows: spaceState.numMasterWindows });
		debug(() => "Finished handling window_moved.");
	}),
	"focus-next-display": focusNextDisplay,
	"focus-previous-display": focusPreviousDisplay,
	"move-window-to-next-display": moveWindowToNextDisplay,
	"move-window-to-previous-display": moveWindowToPreviousDisplay,
	"move-window-to-master": moveWindowToMaster,
	"focus-master-window": focusMasterWindow
};
//#endregion
//#region node_modules/@voxpelli/typed-utils/lib/is.js
/**
* @param {unknown} value
* @returns {value is PropertyKey}
*/
function isPropertyKey(value) {
	switch (typeof value) {
		case "string":
		case "number":
		case "symbol": return true;
	}
	return false;
}
//#endregion
//#region node_modules/@voxpelli/typed-utils/lib/object.js
/**
* @template {object} T
* @param {T} collection
* @param {unknown} key
* @returns {key is keyof T}
*/
function hasOwn(collection, key) {
	return isPropertyKey(key) ? Object.hasOwn(collection, key) : false;
}
//#endregion
//#region src/js/ymsp.ts
function buildAction() {
	return async function action(taskSlug) {
		if (!hasOwn(tasksMap, taskSlug)) throw new Error(`ymsp task ${taskSlug} not found`);
		const task = tasksMap[taskSlug];
		await task();
	};
}
//#endregion
export { buildAction as default };
