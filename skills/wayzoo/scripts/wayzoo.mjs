#!/usr/bin/env node
// Wayzoo CLI: one entry point for every platform.
//   node wayzoo.mjs setup <dir>
//   node wayzoo.mjs build <dir> [N]
//   node wayzoo.mjs deps  <dir>
//   node wayzoo.mjs doctor [dir]
// On Windows without Bash, use the wayzoo.cmd wrapper at the repo root, or call this file with node.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const commands = {
	setup: "setup.mjs",
	build: "build.mjs",
	deps: "inspect-deps.mjs",
	"inspect-deps": "inspect-deps.mjs",
	doctor: "doctor.mjs",
};

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h" || !commands[cmd]) {
	const known = Object.keys(commands).filter((c) => c !== "inspect-deps").join(" | ");
	console.log(`usage: wayzoo <${known}> [args]`);
	console.log("  setup <dir>        create a roblox-ts project");
	console.log("  build <dir> [N]    compile; one line on success, first N error lines on failure");
	console.log("  deps  <dir>        list installed @rbxts packages");
	console.log("  doctor [dir]       check OS, Node, npm, Rojo, the project (default.project.json) and Windows entry points");
	process.exit(cmd && !commands[cmd] && cmd !== "help" && !cmd.startsWith("-") ? 2 : 0);
}

const r = spawnSync(process.execPath, [join(here, commands[cmd]), ...rest], { stdio: "inherit" });
process.exit(r.status ?? 1);
