//#region package.json
var type = "module";
var scripts = {
	"test": "vp test",
	"check": "vp check",
	"build": "vp pack"
};
var dependencies = {
	"@voxpelli/typed-utils": "^5.0.0",
	"toml-eslint-parser": "^1.0.3",
	"ts-extras": "^1.3.0",
	"yabai-master-stack-plugin": "file:../yabai-master-stack-plugin"
};
var devDependencies = {
	"@keychord/config": "^0.0.9",
	"@types/bun": "^1.4.2",
	"@types/node": "^26.5.0",
	"vite-plus": "^0.3.1"
};
var devEngines = { "packageManager": {
	"name": "bun",
	"version": "1.4.2",
	"onFail": "download"
} };
var package_default = {
	type,
	scripts,
	dependencies,
	devDependencies,
	devEngines
};
//#endregion
export { package_default as default, dependencies, devDependencies, devEngines, scripts, type };
