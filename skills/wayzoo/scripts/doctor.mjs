#!/usr/bin/env node
// Usage: node doctor.mjs [project-dir]
// Short environment check: OS, Node, npm, Rojo, the state of the project (including the Rojo project file
// used for Roblox Studio sync) and, in a repo checkout, the Windows entry points. Keeps output to a few lines.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { release } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hasCommand, isWin, run } from "./_util.mjs";

const dir = resolve(process.argv[2] ?? ".");
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const lines = [];
let bad = 0;
const ok = (m) => lines.push(`OK      ${m}`);
const miss = (m) => (lines.push(`MISSING ${m}`), bad++);
const note = (m) => lines.push(`NOTE    ${m}`);

// OS
const osName = { win32: "Windows", darwin: "macOS", linux: "Linux" }[process.platform] ?? process.platform;
ok(`OS ${osName} ${release()} (${process.arch})${isWin ? " -> use wayzoo.cmd or node, no Bash needed" : ""}`);

// Node / npm / Rojo
const major = Number(process.versions.node.split(".")[0]);
major >= 18 ? ok(`Node ${process.versions.node}`) : miss(`Node 18+ required (found ${process.versions.node})`);

const npmV = run("npm", ["--version"]);
npmV.status === 0 ? ok(`npm ${String(npmV.stdout).trim()}`) : miss("npm not found (comes with Node.js)");

hasCommand("rojo")
	? ok("Rojo found (live sync available)")
	: note("Rojo not found: optional, but it is the biggest token saving (https://rojo.space)");

// Project (a package.json counts only if it belongs to a roblox-ts project)
const pkg = join(dir, "package.json");
const isRbxts = existsSync(pkg) && /"(roblox-ts|@rbxts\/[^"]+)"/.test(readFileSync(pkg, "utf8"));
if (isRbxts) {
	existsSync(join(dir, "node_modules", "roblox-ts")) ? ok("roblox-ts installed") : miss("roblox-ts not installed -> run: wayzoo setup <dir>");
	existsSync(join(dir, "tsconfig.json")) ? ok("tsconfig.json") : miss("tsconfig.json");

	// Rojo project file: default.project.json is what `rojo serve` uses; other *.project.json work with an explicit path.
	// rojo.json is the pre-0.6 Rojo format and is no longer read by current Rojo.
	const projectFiles = readdirSync(dir).filter((n) => n.endsWith(".project.json"));
	if (projectFiles.includes("default.project.json")) ok("default.project.json (Rojo sync to Roblox Studio ready)");
	else if (projectFiles.length) note(`no default.project.json; run: rojo serve ${projectFiles[0]}`);
	else miss("default.project.json (needed for Rojo sync to Roblox Studio)");
	if (existsSync(join(dir, "rojo.json"))) note("rojo.json is the old Rojo 0.5 format: current Rojo needs default.project.json");

	if (existsSync(join(dir, "wally.toml"))) note("wally.toml present: Wally packages need hand-written .d.ts files");
} else {
	note(`no project in ${dir} yet -> run: wayzoo setup <dir>`);
}

// Windows entry points (only meaningful in a clone of the wayzoo-skill repo, not in an installed skill)
if (existsSync(join(repoRoot, "install.mjs"))) {
	const absent = ["install.cmd", "wayzoo.cmd"].filter((f) => !existsSync(join(repoRoot, f)));
	absent.length ? miss(`Windows entry point(s): ${absent.join(", ")}`) : ok("Windows entry points: install.cmd, wayzoo.cmd");
}

console.log(lines.join("\n"));
process.exit(bad ? 1 : 0);
