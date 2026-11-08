#!/usr/bin/env node
// Usage: node build.mjs <project-dir> [max-error-lines]
// Compiles TS -> Luau with rbxtsc. Prints ONE line on success (with the list of
// changed .luau files), or only the first N lines of errors on failure.
// Import/module-resolution errors (TS2307...) are shown first, with a Rojo/tsconfig hint.
// Goal: never flood the conversation with compiler output.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, relative, dirname, sep } from "node:path";
import { run } from "./_util.mjs";

const dir = resolve(process.argv[2] ?? ".");
const max = Number.parseInt(process.argv[3] ?? "25", 10) || 25;

if (!existsSync(dir)) {
	console.log(`ERR: directory not found: ${dir}`);
	process.exit(2);
}
if (!existsSync(join(dir, "node_modules", "roblox-ts"))) {
	console.log("ERR: roblox-ts not installed, run setup first (node scripts/wayzoo.mjs setup <dir>)");
	process.exit(2);
}

function snapshot() {
	const out = join(dir, "out");
	const map = new Map();
	if (!existsSync(out)) return map;
	const walk = (d) => {
		for (const name of readdirSync(d)) {
			const p = join(d, name);
			if (statSync(p).isDirectory()) walk(p);
			else if (/\.luau?$/.test(name)) {
				map.set(relative(dir, p).split(sep).join("/"), createHash("md5").update(readFileSync(p)).digest("hex"));
			}
		}
	};
	walk(out);
	return map;
}

mkdirSync(join(dir, "out"), { recursive: true });
const before = snapshot();

const r = run("npx", ["--no-install", "rbxtsc"], { cwd: dir });

if (r.status === 0) {
	const after = snapshot();
	const changed = [...after].filter(([k, v]) => before.get(k) !== v).map(([k]) => k);
	console.log(`OK build (${changed.length} file(s) changed): ${changed.length ? changed.join(" ") : "none"}`);
	if (existsSync(join(dir, "wally.toml"))) {
		console.log("WARN wally.toml found: Wally packages need hand-written .d.ts declarations in roblox-ts");
	}
	process.exit(0);
}

// ---- failure path ----
const raw = `${r.stdout ?? ""}${r.stderr ?? ""}`.replace(/\x1b\[[0-9;]*m/g, "");
const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");

// Group error blocks: a block starts at a line containing "error TS" and runs until the next one.
const blocks = [];
let cur = null;
for (const l of lines) {
	if (/error TS\d+/.test(l) || /^\s*(Error|error)\b/.test(l)) {
		cur = [l];
		blocks.push(cur);
	} else if (cur) cur.push(l);
	else blocks.push([l]);
}

// Priority: module resolution errors first (the usual cause of hallucinated import paths).
const RESOLUTION = /TS2307|TS2792|TS2306|TS6059|TS6307|TS18003/;
const importBlocks = blocks.filter((b) => RESOLUTION.test(b[0]));
const otherBlocks = blocks.filter((b) => !RESOLUTION.test(b[0]));

const out = [];
if (importBlocks.length) {
	out.push(`ERR build failed: ${importBlocks.length} import/resolution error(s) first, then others (first ${max} lines):`);
	out.push(...resolutionHints(importBlocks));
} else {
	out.push(`ERR build failed (first ${max} lines):`);
}
const flat = [...importBlocks, ...otherBlocks].flat();
const budget = Math.max(0, max - (out.length - 1));
out.push(...flat.slice(0, budget));
if (flat.length > budget) out.push(`... (${flat.length - budget} more lines hidden)`);
console.log(out.join("\n"));
process.exit(1);

// Build a short hint per unresolved module: the faulty specifier, and what Rojo/tsconfig expect.
function resolutionHints(blocksIn) {
	const hints = [];
	let rojoNote = "";
	try {
		const rojo = JSON.parse(readFileSync(join(dir, "default.project.json"), "utf8"));
		const paths = [];
		(function walk(n) {
			if (n && typeof n === "object") {
				if (typeof n.$path === "string") paths.push(n.$path);
				Object.values(n).forEach(walk);
			}
		})(rojo.tree);
		rojoNote = `Rojo maps: ${paths.filter((p) => p.startsWith("out")).join(", ") || "none under out/"}`;
	} catch {
		rojoNote = "default.project.json missing or invalid";
	}
	let baseUrl = "src";
	try {
		const ts = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
		baseUrl = ts.compilerOptions?.baseUrl ?? "(unset)";
	} catch {}

	const seen = new Set();
	for (const b of blocksIn) {
		const spec = (b[0].match(/module '([^']+)'/) ?? b[0].match(/'([^']+)'/) ?? [])[1];
		if (!spec || seen.has(spec)) continue;
		seen.add(spec);
		// File part of "path:line:col - error ..." or "path(line,col): error ..." (also handles "C:\..." paths).
		const file = (b[0].match(/^(.+?)(?:\(\d+,\d+\)|:\d+:\d+)/) ?? [])[1] ?? b[0].split(/[:(]/)[0];
		let expected = "";
		if (spec.startsWith(".")) {
			const target = resolve(dirname(join(dir, file)), spec);
			const found = [".ts", ".tsx", "/index.ts", ".d.ts"].some((e) => existsSync(target + e));
			expected = found ? "file exists, check extension/case" : `no file at ${relative(dir, target)}(.ts|/index.ts)`;
		} else if (spec.startsWith("@rbxts/")) {
			expected = existsSync(join(dir, "node_modules", spec))
				? "package installed, check its types entry"
				: `not installed: npm i ${spec}`;
		} else {
			const target = join(dir, baseUrl === "(unset)" ? "src" : baseUrl, spec);
			expected = [".ts", ".tsx", "/index.ts"].some((e) => existsSync(target + e))
				? "file exists, check case"
				: `no file at ${relative(dir, target)}(.ts|/index.ts) (baseUrl=${baseUrl})`;
		}
		hints.push(`HINT ${file}: cannot resolve '${spec}' -> ${expected}`);
		if (hints.length >= 5) break;
	}
	if (hints.length) hints.push(`HINT ${rojoNote}`);
	return hints;
}
