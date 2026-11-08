// Shared helpers for the Wayzoo scripts. Node 18+, no dependencies.
// Runs the same on Windows (cmd, PowerShell), macOS and Linux: no Bash needed.
import { spawnSync } from "node:child_process";

export const isWin = process.platform === "win32";

// Run a command and capture its output.
// On Windows, npm/npx/rojo-style shims are .cmd files: Node refuses to spawn those without a shell,
// so on Windows we go through the shell with a plain command string. Arguments passed here are
// fixed tokens (never user text), and the project folder goes through `cwd`, so no quoting issue.
export function run(cmd, args = [], opts = {}) {
	const base = { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true, ...opts };
	if (isWin) return spawnSync([cmd, ...args].join(" "), { ...base, shell: true });
	return spawnSync(cmd, args, base);
}

// True if `cmd --version` runs.
export function hasCommand(cmd) {
	const r = run(cmd, ["--version"]);
	return r.status === 0;
}

// Last N non-empty lines of a text blob (for short error excerpts).
export function tail(text, n = 8) {
	return String(text ?? "")
		.replace(/\x1b\[[0-9;]*m/g, "")
		.split(/\r?\n/)
		.filter((l) => l.trim() !== "")
		.slice(-n)
		.join("\n");
}
