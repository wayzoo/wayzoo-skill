---
name: wayzoo
description: Write Roblox game code in TypeScript and compile it to Luau with roblox-ts (rbxtsc), fast and with minimal tokens. Use whenever the user wants to write, convert, fix or extend Roblox scripts in TypeScript/roblox-ts, mentions rbxtsc, "TS vers Lua/Luau", or wants to push code into Roblox Studio (with or without an MCP connection) cheaply. Also use when they ask to turn existing Luau into TypeScript. Make sure to use it even if they only say "écris-moi ça en TypeScript pour Roblox".
---

# Wayzoo: Roblox TypeScript → Luau workflow

The goal: Claude writes TypeScript, a script compiles it, and the Luau reaches Studio without Claude re-reading or re-typing it. Tokens are spent on writing the TS once, not on shuttling compiled output around.

## Scripts (Node 18+; Windows, macOS and Linux, no Bash needed)

One entry point: `node scripts/wayzoo.mjs <command>`. Use `node` directly, never `bash`, so the same instructions work on Windows. (`.sh` files exist only as optional wrappers for Linux/macOS.)

| Command | Use |
|---|---|
| `setup <dir>` | Create the roblox-ts project |
| `build <dir> [N]` | Compile; one line on success, first N error lines on failure |
| `deps <dir>` | List installed `@rbxts` packages and their types entry |
| `doctor [dir]` | Check OS, Node, npm, Rojo, the project and its `default.project.json` |

## Where the work happens

- **Claude chat (web or desktop app):** the project lives in Claude's own workspace. Build there, then hand the user the changed file(s) with SendUserFile, or the whole `out/` folder zipped once. The user's Rojo setup is on their machine, so tell them to drop the files in their project.
- **Claude Code or a connected local folder:** work directly in the user's project folder. Rojo live sync then picks up every build.

Do not assume Bash or Linux paths in what you tell the user: on Windows they use `wayzoo.cmd` (or `node` with the same arguments) and backslash paths.

## Rules that save tokens (and why)

- **Never print or re-read compiled `.luau`.** It is a build artifact; reading it costs tokens and teaches nothing. Trust the compiler, and only open a `.luau` file if a runtime bug looks compiler-related.
- **Compile with `build`, not raw `npx rbxtsc`.** It prints one line on success and only the first errors on failure, so a failed build never floods the context.
- **Never list or read `node_modules`.** Run `deps` instead.
- **Edit with small diffs.** Use Edit on the TS file rather than rewriting whole files. Only the changed file is recompiled (incremental build).
- **Write once, compile once.** Fix all errors from one build before building again.

## First time in a project

Run `setup <project-dir>` if there is no `package.json` with `roblox-ts`. It installs the compiler and types and creates `tsconfig.json` and `default.project.json` with the standard layout:

- `src/server` → ServerScriptService.TS
- `src/client` → StarterPlayerScripts.TS
- `src/shared` → ReplicatedStorage.TS

If something fails, run `doctor` once and read its few lines before trying anything else.

## Daily loop

1. **Before using any library**, run `deps <project-dir>` once and only import packages it lists. If a package is missing, `npm i @rbxts/<name>` first; never invent an API.
2. Write or edit TS in `src/...` (services come from `@rbxts/services`).
3. `build <project-dir>` → fix any reported errors.
4. Get the code into Studio (see below).

## Reading build errors

On failure, import/resolution errors (TS2307...) come first, each followed by a `HINT` line giving the faulty path and what exists on disk. Fix these before anything else: other errors are often a consequence. Imports from `src/shared` use the `baseUrl` form (`import { x } from "shared/file"`), not a relative path from client or server.

## Wally

If `wally.toml` exists, packages installed through Wally have no automatic types in roblox-ts. Write a minimal `.d.ts` declaration for each one you use, and tell the user once. Do not try to sync types automatically.

## Getting code into Studio

Pick the cheapest route that works:

1. **Rojo live sync (best, zero tokens).** The user runs `rojo serve` once and connects the Studio plugin. Every build is then synced automatically. Claude never sends code through the conversation. Prefer this whenever Rojo is installed and the project is on the user's machine.
2. **Roblox Studio MCP connected, no Rojo.** Use the MCP only for what files cannot do: creating instances, reading Output/errors, running a playtest. If a script must be pushed through the MCP, send only the files listed by `build` as changed, never the whole project. See `references/mcp-studio.md`.
3. **No Rojo, no MCP.** Give the user the path of `out/` and tell them to drag the files in, or hand over the single changed `.luau` file with SendUserFile.

## Roblox Studio & MCP Integration

Two channels, two jobs. Never mix them.

| Channel | Job | Token cost |
|---|---|---|
| Local TypeScript + `node scripts/wayzoo.mjs build` + Rojo | Source code: write, compile, sync | One status line per build |
| Roblox Studio MCP | Real-time telemetry only | Only the lines you ask for |

**The TypeScript files in `src/` are the only source of truth.** Code goes TS → `build` (silent compile) → `out/` → Rojo → Studio. Nothing else carries code.

Allowed MCP uses (telemetry):
- Read the Output window after a sync or during a playtest (errors, warnings, `print`).
- Inspect instances while playtesting: does the Remote exist, what is this property right now, what did the player's inventory folder end up with.
- Start and stop a playtest to reproduce a bug.
- Create instances that code expects but files do not produce (Remotes, folders, UI), when Rojo does not own that part of the tree.

Forbidden:
- **Never read compiled Luau back out of Studio** (no script read, script grep or script search on synced scripts). The TS in `src/` already says what the code does; the Luau is a build artifact that costs tokens twice and teaches nothing.
- Never edit synced scripts in Studio through the MCP. Rojo overwrites them at the next build, and the TS stays wrong. Fix the TS, then `build`.
- Never dump the whole Output window or the whole game tree. Ask for the latest lines or one instance path.

When an Output error names a compiled script (for example `ServerScriptService.TS.economy:42`), map it back to `src/server/economy.ts` and fix the TS. Do not open the `.luau` to find the line unless the bug looks compiler-related.

MCP tool names differ between servers. Check the tools actually present (ToolSearch if needed) before calling one.

Always give the user cross-platform commands: `node scripts/wayzoo.mjs <command>` (or `wayzoo.cmd <command>` on Windows). They work the same in Windows cmd/PowerShell, macOS and Linux. Never tell the user to run a `.sh` file or use `bash`.

## Roblox-specific gotchas in roblox-ts

- Arrays are 0-indexed in TS and compiled to 1-indexed Luau; never mix raw Luau indexing in.
- Use `task.wait`, `task.spawn` directly (types come from `@rbxts/types`).
- Remotes: define the names in `src/shared` once and import them on both sides to avoid typos.
- Strings that look like Lua patterns need `string.find` from the Roblox API, not JS regex.
- `LuaTuple` returns need destructuring: `const [ok, err] = pcall(...)`.

## When converting existing Luau

Port one script at a time, keep behavior identical, then build. Do not redesign during conversion; improvements come after it compiles and works.
