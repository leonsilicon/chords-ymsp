import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { YMSP } from "yabai-master-stack-plugin";
//#region node_modules/eslint-visitor-keys/lib/visitor-keys.js
/**
* @typedef {{ readonly [type: string]: ReadonlyArray<string> }} VisitorKeys
*/
/**
* @type {VisitorKeys}
*/
const KEYS$1 = {
	ArrayExpression: ["elements"],
	ArrayPattern: ["elements"],
	ArrowFunctionExpression: ["params", "body"],
	AssignmentExpression: ["left", "right"],
	AssignmentPattern: ["left", "right"],
	AwaitExpression: ["argument"],
	BinaryExpression: ["left", "right"],
	BlockStatement: ["body"],
	BreakStatement: ["label"],
	CallExpression: ["callee", "arguments"],
	CatchClause: ["param", "body"],
	ChainExpression: ["expression"],
	ClassBody: ["body"],
	ClassDeclaration: [
		"id",
		"superClass",
		"body"
	],
	ClassExpression: [
		"id",
		"superClass",
		"body"
	],
	ConditionalExpression: [
		"test",
		"consequent",
		"alternate"
	],
	ContinueStatement: ["label"],
	DebuggerStatement: [],
	DoWhileStatement: ["body", "test"],
	EmptyStatement: [],
	ExperimentalRestProperty: ["argument"],
	ExperimentalSpreadProperty: ["argument"],
	ExportAllDeclaration: [
		"exported",
		"source",
		"attributes"
	],
	ExportDefaultDeclaration: ["declaration"],
	ExportNamedDeclaration: [
		"declaration",
		"specifiers",
		"source",
		"attributes"
	],
	ExportSpecifier: ["local", "exported"],
	ExpressionStatement: ["expression"],
	ForInStatement: [
		"left",
		"right",
		"body"
	],
	ForOfStatement: [
		"left",
		"right",
		"body"
	],
	ForStatement: [
		"init",
		"test",
		"update",
		"body"
	],
	FunctionDeclaration: [
		"id",
		"params",
		"body"
	],
	FunctionExpression: [
		"id",
		"params",
		"body"
	],
	Identifier: [],
	IfStatement: [
		"test",
		"consequent",
		"alternate"
	],
	ImportAttribute: ["key", "value"],
	ImportDeclaration: [
		"specifiers",
		"source",
		"attributes"
	],
	ImportDefaultSpecifier: ["local"],
	ImportExpression: ["source", "options"],
	ImportNamespaceSpecifier: ["local"],
	ImportSpecifier: ["imported", "local"],
	JSXAttribute: ["name", "value"],
	JSXClosingElement: ["name"],
	JSXClosingFragment: [],
	JSXElement: [
		"openingElement",
		"children",
		"closingElement"
	],
	JSXEmptyExpression: [],
	JSXExpressionContainer: ["expression"],
	JSXFragment: [
		"openingFragment",
		"children",
		"closingFragment"
	],
	JSXIdentifier: [],
	JSXMemberExpression: ["object", "property"],
	JSXNamespacedName: ["namespace", "name"],
	JSXOpeningElement: ["name", "attributes"],
	JSXOpeningFragment: [],
	JSXSpreadAttribute: ["argument"],
	JSXSpreadChild: ["expression"],
	JSXText: [],
	LabeledStatement: ["label", "body"],
	Literal: [],
	LogicalExpression: ["left", "right"],
	MemberExpression: ["object", "property"],
	MetaProperty: ["meta", "property"],
	MethodDefinition: ["key", "value"],
	NewExpression: ["callee", "arguments"],
	ObjectExpression: ["properties"],
	ObjectPattern: ["properties"],
	PrivateIdentifier: [],
	Program: ["body"],
	Property: ["key", "value"],
	PropertyDefinition: ["key", "value"],
	RestElement: ["argument"],
	ReturnStatement: ["argument"],
	SequenceExpression: ["expressions"],
	SpreadElement: ["argument"],
	StaticBlock: ["body"],
	Super: [],
	SwitchCase: ["test", "consequent"],
	SwitchStatement: ["discriminant", "cases"],
	TaggedTemplateExpression: ["tag", "quasi"],
	TemplateElement: [],
	TemplateLiteral: ["quasis", "expressions"],
	ThisExpression: [],
	ThrowStatement: ["argument"],
	TryStatement: [
		"block",
		"handler",
		"finalizer"
	],
	UnaryExpression: ["argument"],
	UpdateExpression: ["argument"],
	VariableDeclaration: ["declarations"],
	VariableDeclarator: ["id", "init"],
	WhileStatement: ["test", "body"],
	WithStatement: ["object", "body"],
	YieldExpression: ["argument"]
};
const NODE_TYPES = Object.keys(KEYS$1);
for (const type of NODE_TYPES) Object.freeze(KEYS$1[type]);
Object.freeze(KEYS$1);
//#endregion
//#region node_modules/eslint-visitor-keys/lib/index.js
/**
* @author Toru Nagashima <https://github.com/mysticatea>
* See LICENSE file in root directory for full license.
*/
/**
* Make the union set with `KEYS` and given keys.
* @param {VisitorKeys} additionalKeys The additional keys.
* @returns {VisitorKeys} The union set.
*/
function unionWith(additionalKeys) {
	const retv = Object.assign({}, KEYS$1);
	for (const type of Object.keys(additionalKeys)) if (Object.hasOwn(retv, type)) {
		const keys = new Set(additionalKeys[type]);
		for (const key of retv[type]) keys.add(key);
		retv[type] = Object.freeze(Array.from(keys));
	} else retv[type] = Object.freeze(Array.from(additionalKeys[type]));
	return Object.freeze(retv);
}
var TOMLVerImpl = class {
	constructor(major, minor) {
		this.major = major;
		this.minor = minor;
	}
	lt(major, minor) {
		return this.major < major || this.major === major && this.minor < minor;
	}
	gte(major, minor) {
		return this.major > major || this.major === major && this.minor >= minor;
	}
};
new TOMLVerImpl(1, 0);
new TOMLVerImpl(1, 1);
const CodePoint = {
	EOF: -1,
	NULL: 0,
	SOH: 1,
	BACKSPACE: 8,
	TABULATION: 9,
	LINE_FEED: 10,
	FORM_FEED: 12,
	CARRIAGE_RETURN: 13,
	ESCAPE: 27,
	SO: 14,
	US: 31,
	SPACE: 32,
	QUOTATION_MARK: 34,
	HASH: 35,
	SINGLE_QUOTE: 39,
	PLUS_SIGN: 43,
	COMMA: 44,
	DASH: 45,
	DOT: 46,
	DIGIT_0: 48,
	DIGIT_1: 49,
	DIGIT_2: 50,
	DIGIT_3: 51,
	DIGIT_7: 55,
	DIGIT_9: 57,
	COLON: 58,
	EQUALS_SIGN: 61,
	LATIN_CAPITAL_A: 65,
	LATIN_CAPITAL_E: 69,
	LATIN_CAPITAL_F: 70,
	LATIN_CAPITAL_T: 84,
	LATIN_CAPITAL_U: 85,
	LATIN_CAPITAL_Z: 90,
	LEFT_BRACKET: 91,
	BACKSLASH: 92,
	RIGHT_BRACKET: 93,
	UNDERSCORE: 95,
	LATIN_SMALL_A: 97,
	LATIN_SMALL_B: 98,
	LATIN_SMALL_E: 101,
	LATIN_SMALL_F: 102,
	LATIN_SMALL_I: 105,
	LATIN_SMALL_L: 108,
	LATIN_SMALL_N: 110,
	LATIN_SMALL_O: 111,
	LATIN_SMALL_R: 114,
	LATIN_SMALL_S: 115,
	LATIN_SMALL_T: 116,
	LATIN_SMALL_U: 117,
	LATIN_SMALL_X: 120,
	LATIN_SMALL_Z: 122,
	LEFT_BRACE: 123,
	RIGHT_BRACE: 125,
	TILDE: 126,
	DELETE: 127,
	PAD: 128,
	SUPERSCRIPT_TWO: 178,
	SUPERSCRIPT_THREE: 179,
	SUPERSCRIPT_ONE: 185,
	VULGAR_FRACTION_ONE_QUARTER: 188,
	VULGAR_FRACTION_THREE_QUARTERS: 190,
	LATIN_CAPITAL_LETTER_A_WITH_GRAVE: 192,
	LATIN_CAPITAL_LETTER_O_WITH_DIAERESIS: 214,
	LATIN_CAPITAL_LETTER_O_WITH_STROKE: 216,
	LATIN_SMALL_LETTER_O_WITH_DIAERESIS: 246,
	LATIN_SMALL_LETTER_O_WITH_STROKE: 248,
	GREEK_SMALL_REVERSED_DOTTED_LUNATE_SIGMA_SYMBOL: 891,
	GREEK_CAPITAL_LETTER_YOT: 895,
	CP_1FFF: 8191,
	ZERO_WIDTH_NON_JOINER: 8204,
	ZERO_WIDTH_JOINER: 8205,
	UNDERTIE: 8255,
	CHARACTER_TIE: 8256,
	SUPERSCRIPT_ZERO: 8304,
	CP_218F: 8591,
	CIRCLED_DIGIT_ONE: 9312,
	NEGATIVE_CIRCLED_DIGIT_ZERO: 9471,
	GLAGOLITIC_CAPITAL_LETTER_AZU: 11264,
	CP_2FEF: 12271,
	IDEOGRAPHIC_COMMA: 12289,
	CP_D7FF: 55295,
	CP_E000: 57344,
	CJK_COMPATIBILITY_IDEOGRAPH_F900: 63744,
	ARABIC_LIGATURE_SALAAMUHU_ALAYNAA: 64975,
	ARABIC_LIGATURE_SALLA_USED_AS_KORANIC_STOP_SIGN_ISOLATED_FORM: 65008,
	REPLACEMENT_CHARACTER: 65533,
	LINEAR_B_SYLLABLE_B008_A: 65536,
	CP_EFFFF: 983039,
	CP_10FFFF: 1114111
};
CodePoint.QUOTATION_MARK, CodePoint.QUOTATION_MARK, CodePoint.BACKSLASH, CodePoint.BACKSLASH, CodePoint.LATIN_SMALL_B, CodePoint.BACKSPACE, CodePoint.LATIN_SMALL_F, CodePoint.FORM_FEED, CodePoint.LATIN_SMALL_N, CodePoint.LINE_FEED, CodePoint.LATIN_SMALL_R, CodePoint.CARRIAGE_RETURN, CodePoint.LATIN_SMALL_T, CodePoint.TABULATION, CodePoint.LATIN_SMALL_E, CodePoint.ESCAPE;
unionWith({
	Program: ["body"],
	TOMLTopLevelTable: ["body"],
	TOMLTable: ["key", "body"],
	TOMLKeyValue: ["key", "value"],
	TOMLKey: ["keys"],
	TOMLArray: ["elements"],
	TOMLInlineTable: ["body"],
	TOMLBare: [],
	TOMLQuoted: [],
	TOMLValue: []
});
//#endregion
//#region src/lib/aerospace-setup.ts
const shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
//#endregion
//#region src/js/yabai-hook.ts
const events = {
	window_created: "window-created",
	window_destroyed: "window-destroyed"
};
async function runYabaiHook(filename, task) {
	if (![
		"register",
		"window-created",
		"window-destroyed"
	].includes(task)) throw new Error(`Unknown hook: ${task}`);
	const settings = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (!settings.enabled) return;
	const environment = {
		...process.env,
		...settings.options.environment
	};
	const windowId = process.env.YABAI_WINDOW_ID;
	delete environment.YABAI_WINDOW_ID;
	delete environment.YABAI_PROCESS_ID;
	const ymsp = new YMSP({
		...settings.options,
		environment,
		windowManager: "yabai"
	});
	if (task === "window-created") {
		if (!windowId || !/^\d+$/.test(windowId) || Number(windowId) < 1) return;
		await ymsp.tasksMap["window-created"](Number(windowId));
	} else if (task === "window-destroyed") await ymsp.tasksMap["window-destroyed"]();
	else {
		const execute = promisify(execFile);
		const command = (...args) => execute(ymsp.config.yabaiPath, [
			"-m",
			"signal",
			...args
		], {
			env: environment,
			timeout: 5e3
		});
		await ymsp.withTaskLock(async () => {
			const { stdout } = await command("--list");
			const signals = JSON.parse(stdout);
			const legacy = /* @__PURE__ */ new Map([["window_created", "hs -c \"return MasterStackLayout:handleWindowCreated(\\\"$YABAI_WINDOW_ID\\\")\""], ["window_destroyed", "hs -c \"return MasterStackLayout:handleWindowDestroyed()\""]]);
			for (const signal of [...signals].sort((a, b) => b.index - a.index)) if (signal.label === "chords-ymsp-window_created" || signal.label === "chords-ymsp-window_destroyed" || legacy.get(signal.event) === signal.action) await command("--remove", String(signal.index));
			const runner = path.join(path.dirname(filename), "yabai-hook.sh");
			for (const [event, callback] of Object.entries(events)) await command("--add", `event=${event}`, `label=chords-ymsp-${event}`, `action=/bin/sh ${shellQuote(runner)} ${callback}`);
			await ymsp.tasksMap["on-yabai-start"]();
		});
	}
}
if (import.meta.main) try {
	if (!process.argv[2] || !process.argv[3]) throw new Error("Expected settings path and hook task");
	await runYabaiHook(process.argv[2], process.argv[3]);
} catch (error) {
	console.error("chords-ymsp yabai hook:", error);
	process.exitCode = 1;
}
//#endregion
export { runYabaiHook };
