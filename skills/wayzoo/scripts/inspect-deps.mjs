#!/usr/bin/env node
// Usage: node inspect-deps.mjs <project-dir>
// Prints a compact list of the @rbxts packages (and other direct deps) a project can import,
// without ever dumping node_modules. One line per package: name@version  types=<entry>
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const dir = resolve(process.argv[2] ?? ".");
const readJson = (p) => {
	try {
		return JSON.parse(readFileSync(p, "utf8"));
	} catch {
		return undefined;
	}
};

const pkg = readJson(join(dir, "package.json"));
if (!pkg) {
	console.log("ERR: no package.json (run setup first)");
	process.exit(2);
}

const direct = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
const scopeDir = join(dir, "node_modules", "@rbxts");
const installed = existsSync(scopeDir) ? readdirSync(scopeDir).map((n) => `@rbxts/${n}`) : [];

const names = [...new Set([...installed, ...[...direct].filter((n) => n.startsWith("@rbxts/"))])].sort();
const rows = [];
for (const name of names) {
	const p = readJson(join(dir, "node_modules", name, "package.json"));
	if (!p) {
		rows.push(`${name}  NOT INSTALLED (declared in package.json)`);
		continue;
	}
	const types = p.types ?? p.typings ?? (existsSync(join(dir, "node_modules", name, "index.d.ts")) ? "index.d.ts" : "?");
	const tag = direct.has(name) ? "" : " (transitive)";
	rows.push(`${name}@${p.version}  types=${types}${tag}`);
}

const tools = ["roblox-ts", "typescript"].map((n) => {
	const p = readJson(join(dir, "node_modules", n, "package.json"));
	return p ? `${n}@${p.version}` : `${n}  NOT INSTALLED`;
});

console.log(`toolchain: ${tools.join(", ")}`);
console.log(`packages (${rows.length}):`);
for (const r of rows) console.log(`  ${r}`);

// Global/ambient types (typeRoots) the project relies on.
const ts = readJson(join(dir, "tsconfig.json"));
if (ts?.compilerOptions?.typeRoots) console.log(`typeRoots: ${ts.compilerOptions.typeRoots.join(", ")}`);
if (existsSync(join(dir, "wally.toml"))) console.log("wally.toml present: Wally packages need hand-written .d.ts files");
