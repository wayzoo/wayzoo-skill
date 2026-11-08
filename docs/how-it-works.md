# How Wayzoo works

```
 Claude writes TS ──► wayzoo build (roblox-ts) ──► out/*.luau ──► Rojo ──► Roblox Studio
        ▲                        │
        └── only errors ─────────┘   (never the compiled Luau)
```

1. **Know the tools**: `wayzoo deps` lists the installed `@rbxts` packages, so Claude only imports what exists.
2. **Write**: Claude edits `src/**/*.ts` with small diffs instead of rewriting files.
3. **Build**: `wayzoo build` runs `rbxtsc` and reduces its output to one line (success) or the first N lines (failure). Import errors come first, with the faulty and expected path.
4. **Sync**: Rojo watches `out/` and updates Studio. No source code travels through the chat.
5. **Check live state**: if a Studio MCP is connected, it reads errors and runs playtests; it does not carry source.

## Why not read the Luau?

It is generated. If the TS type-checks, the Luau is what the compiler promises. Reading it costs tokens and rarely finds anything. Open it only when a runtime bug looks compiler-related.

## Why Node scripts?

roblox-ts already requires Node, so Node scripts add no dependency and run the same on Windows (cmd, PowerShell), macOS and Linux. One implementation to maintain; the `.sh` files are thin wrappers.

## Where it runs

- **Claude chat (web/desktop)**: the project lives in Claude's own workspace. Claude builds there and hands you the changed files.
- **Claude Code / local folder**: Claude works in your project, so Rojo live sync picks up each build.

## Without Rojo

Send only the files listed by `build` as changed, once each. See [mcp-studio.md](../skills/wayzoo/references/mcp-studio.md).
