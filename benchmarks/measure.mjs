#!/usr/bin/env node
// Reproduces the numbers in the README. Works on Windows, macOS and Linux.
// Usage: node benchmarks/measure.mjs
// Needs: Node.js 18+, npm, internet (to install roblox-ts). Sizes are bytes of text;
// tokens scale roughly with bytes, so percentages are a good proxy.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { run } from "../skills/wayzoo/scripts/_util.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sk = join(root, "skills", "wayzoo", "scripts");
const T = mkdtempSync(join(tmpdir(), "wayzoo-bench-"));
const node = (script, ...a) => spawnSync(process.execPath, [join(sk, script), ...a], { encoding: "utf8" });
const size = (r) => Buffer.byteLength(`${r.stdout ?? ""}${r.stderr ?? ""}`.replace(/\x1b\[[0-9;]*m/g, ""));

try {
	node("setup.mjs", T);
	mkdirSync(join(T, "src", "server"), { recursive: true });

	// A realistic-ish server file: 12 small functions
	let ts = 'import { Players } from "@rbxts/services";\n';
	ts += "interface PlayerData { coins: number; gems: number; pets: string[]; world: number; }\n";
	ts += "const store = new Map<number, PlayerData>();\n";
	for (let i = 1; i <= 12; i++) {
		ts += `
function addCoins${i}(player: Player, amount: number): number {
	const data = store.get(player.UserId);
	if (data === undefined) return 0;
	data.coins += amount * ${i};
	for (const pet of data.pets) {
		if (pet === "Nova${i}") data.gems += 1;
	}
	return data.coins;
}
`;
	}
	ts += "Players.PlayerAdded.Connect((p) => print(p.Name));\n";
	const economy = join(T, "src", "server", "economy.ts");
	writeFileSync(economy, ts);

	// 25 deliberate type errors
	const bad = join(T, "src", "server", "bad.ts");
	writeFileSync(bad, Array.from({ length: 25 }, (_, i) => `const e${i + 1}: number = "oops${i + 1}";`).join("\n") + "\n");

	const RAW_ERR = size(run("npx", ["--no-install", "rbxtsc"], { cwd: T }));
	const WAY_ERR = size(node("build.mjs", T, "25"));

	rmSync(bad);
	node("build.mjs", T);
	const TS = readFileSync(economy).length;
	const LUAU = readFileSync(join(T, "out", "server", "economy.luau")).length;
	appendFileSync(economy, "// touch\n");
	const OK_LINE = size(node("build.mjs", T));

	const NAIVE = TS + LUAU + LUAU; // write TS + read Luau back + push Luau to Studio
	const MCP = TS + LUAU; // write TS + push changed Luau once
	const ROJO = TS + OK_LINE; // write TS + one status line
	const pct = (a, b) => `${Math.round(((a - b) / a) * 100)}%`;
	const row = (name, a, b) => `${name.padEnd(48)} ${String(a).padStart(8)} ${String(b).padStart(8)} ${pct(a, b).padStart(7)}`;

	console.log(`TypeScript source : ${TS} B`);
	console.log(`Compiled Luau     : ${LUAU} B\n`);
	console.log(`${"Scenario".padEnd(48)} ${"Naive".padStart(8)} ${"Wayzoo".padStart(8)} ${"Saving".padStart(7)}`);
	console.log(row("Compiler output, 25 errors", RAW_ERR, WAY_ERR));
	console.log(row("Code to Studio via Rojo", NAIVE, ROJO));
	console.log(row("Code to Studio via MCP (no Rojo)", NAIVE, MCP));
} finally {
	rmSync(T, { recursive: true, force: true });
}
