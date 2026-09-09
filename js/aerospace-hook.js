import fs from "node:fs";
import { YMSP } from "yabai-master-stack-plugin";
//#region src/js/aerospace-hook.ts
/** Each callback uses exactly the Chord instance's serialized settings and shared locks. */
async function runAerospaceHook(filename, task) {
	if (task !== "window-created" && task !== "watch-aerospace") throw new Error(`Unknown hook: ${task}`);
	let contents = fs.readFileSync(filename, "utf8");
	while (true) {
		const settings = JSON.parse(contents);
		if (!settings.enabled) return;
		const environment = {
			...process.env,
			...settings.options.environment
		};
		const windowId = process.env.AEROSPACE_WINDOW_ID;
		delete environment.AEROSPACE_WINDOW_ID;
		delete environment.AEROSPACE_WORKSPACE;
		const ymsp = new YMSP({
			...settings.options,
			environment,
			windowManager: "aerospace"
		});
		if (task === "window-created") {
			if (!windowId || !/^\d+$/.test(windowId) || Number(windowId) < 1) return;
			await ymsp.tasksMap["window-created"](Number(windowId));
			return;
		}
		const controller = new AbortController();
		let next = contents;
		const stop = () => controller.abort();
		process.once("SIGINT", stop);
		process.once("SIGTERM", stop);
		const timer = setInterval(() => {
			try {
				next = fs.readFileSync(filename, "utf8");
			} catch {
				next = "";
			}
			if (next !== contents) controller.abort();
		}, 1e3);
		try {
			await ymsp.tasksMap["watch-aerospace"](controller.signal, () => {
				if (process.env.CHORD_YMSP_READY !== "1") return;
				process.stdout.write("chords-ymsp:ready\n");
			});
		} finally {
			clearInterval(timer);
			process.off("SIGINT", stop);
			process.off("SIGTERM", stop);
		}
		if (!next || next === contents) return;
		contents = next;
	}
}
if (import.meta.main) try {
	if (!process.argv[2] || !process.argv[3]) throw new Error("Expected settings path and hook task");
	await runAerospaceHook(process.argv[2], process.argv[3]);
} catch (error) {
	console.error("chords-ymsp AeroSpace hook:", error);
	process.exitCode = 1;
}
//#endregion
export { runAerospaceHook };
