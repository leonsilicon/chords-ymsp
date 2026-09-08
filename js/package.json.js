//#region package.json
var type = "module";
var devEngines = { "packageManager": {
	"name": "bun",
	"version": "1.4.2",
	"onFail": "download"
} };
var dependencies = {
	"@voxpelli/typed-utils": "^5.0.0",
	"ts-extras": "^1.3.0",
	"yabai-master-stack-plugin": "^4.2.0"
};
var devDependencies = { "@keychord/config": "^0.0.9" };
var package_default = {
	type,
	devEngines,
	dependencies,
	devDependencies
};
//#endregion
export { package_default as default, dependencies, devDependencies, devEngines, type };
