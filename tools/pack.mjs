#!/usr/bin/env node
// Usage: node tools/pack.mjs [--check]
// Builds dist/wayzoo.skill from skills/wayzoo (a ZIP with the folder "wayzoo/" at its root, SKILL.md inside).
// With --check, exits 1 if dist/wayzoo.skill is out of date (used by CI).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildZip, collectDir } from "./zip.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillDir = join(root, "skills", "wayzoo");
const outFile = join(root, "dist", "wayzoo.skill");

export function packSkill() {
	const skillMd = join(skillDir, "SKILL.md");
	if (!existsSync(skillMd)) throw new Error(`SKILL.md not found in ${skillDir}`);
	const head = readFileSync(skillMd, "utf8");
	const name = (head.match(/^name:\s*(.+)$/m) ?? [])[1]?.trim();
	if (name !== "wayzoo") throw new Error(`SKILL.md name must be "wayzoo" (found "${name}")`);
	// Normalize line endings so the archive is identical whether the repo was checked out on Windows or Linux.
	const entries = collectDir(skillDir, "wayzoo").map((e) =>
		/\.(md|mjs|sh|json|txt)$/.test(e.name) ? { ...e, data: Buffer.from(e.data.toString("utf8").replace(/\r\n/g, "\n")) } : e,
	);
	return { buf: buildZip(entries), count: entries.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const { buf, count } = packSkill();
	if (process.argv.includes("--check")) {
		const same = existsSync(outFile) && readFileSync(outFile).equals(buf);
		console.log(same ? "OK dist/wayzoo.skill is up to date" : "ERR dist/wayzoo.skill is out of date: run `node tools/pack.mjs`");
		process.exit(same ? 0 : 1);
	}
	mkdirSync(dirname(outFile), { recursive: true });
	writeFileSync(outFile, buf);
	console.log(`OK packed ${count} file(s) -> ${outFile} (${buf.length} bytes)`);
}
