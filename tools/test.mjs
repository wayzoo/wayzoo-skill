#!/usr/bin/env node
// Offline smoke tests (no npm install, no network). Run: node tools/test.mjs
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { crc32, readZip } from "./zip.mjs";
import { packSkill } from "./pack.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const check = (name, cond, extra = "") => {
	console.log(`${cond ? "ok  " : "FAIL"} ${name}${!cond && extra ? ` -> ${extra}` : ""}`);
	if (!cond) failed++;
};
const node = (args, env = {}) => spawnSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, ...env } });

// 1. every .mjs parses
const mjs = [];
(function walk(d) {
	for (const n of readdirSync(d)) {
		if (n === "node_modules" || n === ".git") continue;
		const p = join(d, n);
		statSync(p).isDirectory() ? walk(p) : n.endsWith(".mjs") && mjs.push(p);
	}
})(root);
for (const f of mjs) {
	const r = node(["--check", f]);
	check(`syntax ${f.slice(root.length + 1)}`, r.status === 0, r.stderr.split("\n")[0]);
}

// 2. crc32 known vector
check("crc32 vector", crc32(Buffer.from("123456789")) === 0xcbf43926);

// 3. pack: valid zip, right layout, nothing unwanted
const { buf } = packSkill();
const entries = readZip(buf);
const names = entries.map((e) => e.name);
check("zip has wayzoo/SKILL.md", names.includes("wayzoo/SKILL.md"));
for (const f of ["build.mjs", "setup.mjs", "inspect-deps.mjs", "doctor.mjs", "wayzoo.mjs", "_util.mjs"]) {
	check(`zip has scripts/${f}`, names.includes(`wayzoo/scripts/${f}`));
}
check("zip has no node_modules / absolute / backslash names", names.every((n) => !/node_modules|^\/|\\/.test(n)));
check("zip is reproducible", packSkill().buf.equals(buf));
check("SKILL.md starts with frontmatter", entries.find((e) => e.name === "wayzoo/SKILL.md").data.toString().startsWith("---\nname: wayzoo\n"));

// 4. dist is up to date (only when it exists)
if (existsSync(join(root, "dist", "wayzoo.skill"))) {
	const r = node([join(root, "tools", "pack.mjs"), "--check"]);
	check("dist/wayzoo.skill up to date", r.status === 0, r.stdout.trim());
}

// 5. CLI
check("wayzoo help exits 0", node([join(root, "skills", "wayzoo", "scripts", "wayzoo.mjs"), "help"]).status === 0);
check("wayzoo unknown command exits 2", node([join(root, "skills", "wayzoo", "scripts", "wayzoo.mjs"), "nope"]).status === 2);
const empty = mkdtempSync(join(tmpdir(), "wayzoo-test-"));
const doc = node([join(root, "skills", "wayzoo", "scripts", "wayzoo.mjs"), "doctor", empty]);
check("doctor reports Node", /OK\s+Node/.test(doc.stdout), doc.stdout);
check("doctor reports the OS", /OK\s+OS /.test(doc.stdout), doc.stdout);
check("doctor reports Windows entry points", /Windows entry points/.test(doc.stdout), doc.stdout);
const atRoot = node([join(root, "skills", "wayzoo", "scripts", "wayzoo.mjs"), "doctor", root]);
check("doctor at repo root does not treat it as a project", atRoot.status === 0, atRoot.stdout);
writeFileSync(join(empty, "package.json"), '{"devDependencies":{"roblox-ts":"*"}}');
const proj = node([join(root, "skills", "wayzoo", "scripts", "wayzoo.mjs"), "doctor", empty]);
check("doctor flags a missing default.project.json", /MISSING default\.project\.json/.test(proj.stdout), proj.stdout);
writeFileSync(join(empty, "default.project.json"), "{}");
check("doctor sees default.project.json", /OK\s+default\.project\.json/.test(node([join(root, "skills", "wayzoo", "scripts", "wayzoo.mjs"), "doctor", empty]).stdout));
check("docs/community has the 3 posts", ["devforum-post.md", "discord-message.md", "reddit-post.md"].every((f) => existsSync(join(root, "docs", "community", f))));

// 6. installer for Claude Code into a throwaway home
const home = mkdtempSync(join(tmpdir(), "wayzoo-home-"));
const inst = node([join(root, "install.mjs"), "--claude-code"], { HOME: home, USERPROFILE: home });
check("install --claude-code copies the skill", inst.status === 0 && existsSync(join(home, ".claude", "skills", "wayzoo", "SKILL.md")), inst.stdout + inst.stderr);
check("install --claude-code copies scripts", existsSync(join(home, ".claude", "skills", "wayzoo", "scripts", "build.mjs")));

// 7. Windows entry points are present, and .cmd files use CRLF in the repo checkout rules
for (const f of ["install.cmd", "install.ps1", "wayzoo.cmd"]) check(`${f} present`, existsSync(join(root, f)));
check(".gitattributes forces CRLF for .cmd", /\*\.cmd\s+text eol=crlf/.test(readFileSync(join(root, ".gitattributes"), "utf8")));

rmSync(empty, { recursive: true, force: true });
rmSync(home, { recursive: true, force: true });
console.log(failed ? `\n${failed} test(s) failed` : "\nall tests passed");
process.exit(failed ? 1 : 0);
