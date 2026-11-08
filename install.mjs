#!/usr/bin/env node
// Wayzoo installer. Works the same on Windows (native, no WSL), macOS and Linux. Needs Node 18+ only.
//
//   node install.mjs                  build dist/wayzoo.skill and print the Claude upload steps
//   node install.mjs --open           same, and show the file in Explorer / Finder / your file manager
//   node install.mjs --claude-code    copy the skill into ~/.claude/skills/wayzoo (Claude Code, personal)
//   node install.mjs --claude-code --project   copy into ./.claude/skills/wayzoo (this project only)
//   node install.mjs --doctor         check Node, npm and Rojo
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { packSkill } from "./tools/pack.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const major = Number(process.versions.node.split(".")[0]);

if (major < 18) {
	console.log(`ERR Node 18+ is required (found ${process.versions.node}). Install it from https://nodejs.org`);
	process.exit(1);
}

if (args.has("--help") || args.has("-h")) {
	console.log("usage: node install.mjs [--open] [--claude-code [--project]] [--doctor]");
	process.exit(0);
}

if (args.has("--doctor")) {
	const r = spawnSync(process.execPath, [join(root, "skills", "wayzoo", "scripts", "doctor.mjs")], { stdio: "inherit" });
	process.exit(r.status ?? 1);
}

function reveal(file) {
	const cmd = process.platform === "win32" ? ["explorer.exe", [`/select,${file}`]] : process.platform === "darwin" ? ["open", ["-R", file]] : ["xdg-open", [dirname(file)]];
	try {
		spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).on("error", () => {}).unref();
	} catch {
		/* showing the folder is a convenience only */
	}
}

if (args.has("--claude-code")) {
	const target = args.has("--project") ? resolve(".claude", "skills", "wayzoo") : join(homedir(), ".claude", "skills", "wayzoo");
	rmSync(target, { recursive: true, force: true });
	mkdirSync(dirname(target), { recursive: true });
	cpSync(join(root, "skills", "wayzoo"), target, {
		recursive: true,
		filter: (src) => !/node_modules|__pycache__|\.DS_Store/.test(src),
	});
	console.log(`OK installed for Claude Code: ${target}`);
	console.log("   Restart Claude Code (or run /skills) to see it.");
	process.exit(0);
}

// Default: build the .skill file for Claude (web and desktop).
const outFile = join(root, "dist", "wayzoo.skill");
const { buf, count } = packSkill();
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, buf);
console.log(`OK built ${outFile} (${count} files, ${buf.length} bytes)`);
console.log("");
console.log("Install in Claude (web or desktop app, Windows/macOS/Linux):");
console.log("  1. Open Customize > Skills");
console.log("  2. Click +, then Create skill > Upload a skill");
console.log("  3. Pick dist/wayzoo.skill, then switch the skill on");
console.log("  Code execution / file creation must be enabled in your Claude settings.");
if (args.has("--open")) reveal(outFile);
