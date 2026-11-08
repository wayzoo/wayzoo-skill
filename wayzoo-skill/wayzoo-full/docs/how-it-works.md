# How Wayzoo works

```
 Claude writes TS ──► build.sh (roblox-ts) ──► out/*.luau ──► Rojo ──► Roblox Studio
        ▲                     │
        └── only errors ──────┘   (never the compiled Luau)
```

1. **Write**: Claude edits `src/**/*.ts` with small diffs instead of rewriting files.
2. **Build**: `build.sh` runs `rbxtsc` and reduces its output to one line (success) or the first N lines (failure).
3. **Sync**: Rojo watches `out/` and updates Studio. No source code travels through the chat.
4. **Check live state**: if a Studio MCP is connected, it reads errors and runs playtests; it does not carry source.

## Why not read the Luau?

It is generated. If the TS type-checks, the Luau is what the compiler promises. Reading it costs tokens and rarely finds anything. Open it only when a runtime bug looks compiler-related.

## Without Rojo

Send only the files listed by `build.sh` as changed, once each. See [mcp-studio.md](../skills/wayzoo/references/mcp-studio.md).
