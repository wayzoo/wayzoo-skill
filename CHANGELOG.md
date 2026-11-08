# Changelog

## 0.2.0
- **Windows native**: `setup`, `build`, `deps` and `doctor` are Node scripts (`.mjs`) behind one CLI (`wayzoo.mjs`). They run in cmd and PowerShell with Node 18+ only: no WSL, Git Bash or Bash. `wayzoo.cmd` launcher at the repo root. The `.sh` files are optional thin wrappers, existing commands keep working.
- **Easy install in Claude (web and desktop)**: `node install.mjs` (or `install.cmd` / `install.ps1` on Windows) builds `dist/wayzoo.skill` with a dependency-free ZIP packer and prints the Customize > Skills upload steps. `--open` shows the file.
- **Claude Code install**: `node install.mjs --claude-code [--project]`.
- **`deps`**: compact list of the `@rbxts` packages a project can import (name, version, types entry) without dumping `node_modules`.
- **Smarter build errors**: on failure, import/module-resolution errors (TS2307 and friends) are shown first, with a one-line hint per unresolved module (faulty path, expected path, Rojo mapping, `baseUrl`).
- **`doctor`**: short check of the OS, Node, npm, Rojo and the project, including the Rojo project file for Roblox Studio sync (`default.project.json`; warns about the old `rojo.json`) and, in a repo checkout, the Windows entry points (`install.cmd`, `wayzoo.cmd`). A `package.json` only counts as a project when it uses roblox-ts, so running `doctor` at the repo root no longer fails.
- **Wally detection**: if `wally.toml` exists, `setup` and `build` print a one-line warning that Wally packages need hand-written `.d.ts` declarations in roblox-ts.
- Benchmark ported to Node (`benchmarks/measure.mjs`), same numbers.
- `setup` now writes a `.gitignore` for generated folders, and shows the npm error tail if an install fails.
- CI runs on Linux, Windows and macOS (smoke tests, pack check, example build, benchmark).
- Skill instructions: use `node` (never `bash`), run `deps` before using libraries, say where work happens (Claude chat vs local project).
- **Roblox Studio & MCP Integration** section in the skill: the Studio MCP is for real-time telemetry only (Output window, instance inspection during playtests). Reading compiled Luau back out of Studio, or editing synced scripts there, is forbidden: local TypeScript stays the only source of truth, compiled by `wayzoo build` and synced by Rojo.
- README: token-usage chart (naive loop vs Wayzoo + Studio MCP vs Wayzoo + Rojo) and benchmark table focused on Roblox Studio and Rojo.
- INSTALL: per-environment guide (Claude Desktop UI on Windows/macOS, claude.ai, Claude Code CLI).
- `docs/community/`: ready-to-post DevForum, Discord and Reddit announcements.

## 0.1.0
- First release: Claude skill, `setup.sh`, `build.sh`, MCP/Studio reference, reproducible benchmark.
