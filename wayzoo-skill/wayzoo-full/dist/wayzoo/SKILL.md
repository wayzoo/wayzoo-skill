---
name: wayzoo
description: Write Roblox game code in TypeScript and compile it to Luau with roblox-ts (rbxtsc), fast and with minimal tokens. Use whenever the user wants to write, convert, fix or extend Roblox scripts in TypeScript/roblox-ts, mentions rbxtsc, "TS vers Lua/Luau", or wants to push code into Roblox Studio (with or without an MCP connection) cheaply. Also use when they ask to turn existing Luau into TypeScript. Make sure to use it even if they only say "écris-moi ça en TypeScript pour Roblox".
---

# Wayzoo: Roblox TypeScript → Luau workflow

The goal: Claude writes TypeScript, a script compiles it, and the Luau reaches Studio without Claude re-reading or re-typing it. Tokens are spent on writing the TS once, not on shuttling compiled output around.

## Rules that save tokens (and why)

- **Never print or re-read compiled `.luau`.** It is a build artifact; reading it costs tokens and teaches nothing. Trust the compiler, and only open a `.luau` file if a runtime bug looks compiler-related.
- **Compile with `scripts/build.sh`, not raw `npx rbxtsc`.** It prints one line on success and only the first errors on failure, so a failed build never floods the context.
- **Edit with small diffs.** Use Edit on the TS file rather than rewriting whole files. Only the changed file is recompiled (incremental build).
- **Write once, compile once.** Fix all errors from one build before building again.

## First time in a project

Run `scripts/setup.sh <project-dir>` if there is no `package.json` with `roblox-ts`. It installs the compiler and types and creates `tsconfig.json` and `default.project.json` with the standard layout:

- `src/server` → ServerScriptService.TS
- `src/client` → StarterPlayerScripts.TS
- `src/shared` → ReplicatedStorage.TS

## Daily loop

1. Write or edit TS in `src/...` (use `import { Players } from "@rbxts/services"` style; services come from `@rbxts/services`, install it with `npm i @rbxts/services`).
2. `scripts/build.sh <project-dir>` → fix any reported errors.
3. Get the code into Studio (see below).

## Getting code into Studio

Pick the cheapest route that works:

1. **Rojo live sync (best, zero tokens).** The user runs `rojo serve` once and connects the Studio plugin. Every build is then synced automatically. Claude never sends code through the conversation. Prefer this whenever Rojo is installed.
2. **Roblox Studio MCP connected, no Rojo.** Use the MCP only for what files cannot do: creating instances, reading Output/errors, running a playtest. If a script must be pushed through the MCP, send only the files listed by `build.sh` as changed, never the whole project. See `references/mcp-studio.md`.
3. **No Rojo, no MCP.** Give the user the path of `out/` and tell them to drag the files in, or hand over the single changed `.luau` file with SendUserFile.

## Roblox-specific gotchas in roblox-ts

- Arrays are 0-indexed in TS and compiled to 1-indexed Luau; never mix raw Luau indexing in.
- Use `task.wait`, `task.spawn` directly (types come from `@rbxts/types`).
- Remotes: define the names in `src/shared` once and import them on both sides to avoid typos.
- Strings that look like Lua patterns need `string.find` from the Roblox API, not JS regex.
- `LuaTuple` returns need destructuring: `const [ok, err] = pcall(...)`.

## When converting existing Luau

Port one script at a time, keep behavior identical, then build. Do not redesign during conversion; improvements come after it compiles and works.
