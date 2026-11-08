# Using this workflow with a Roblox Studio MCP connection

Read this only when the user is connected to Roblox Studio through an MCP server.

## Principle

Files are the source of truth (`src/**/*.ts`). The MCP is for **live state**, not for carrying source code back and forth.

## What the MCP is good for here

- Reading Studio's Output panel and script errors after a sync.
- Creating or inspecting instances (Remotes, folders, UI) that code expects to exist.
- Starting/stopping a playtest and reading results.

## What to avoid

- Don't read a script out of Studio to "see what's there": the TS project already has it. Script read/grep/search tools on synced scripts are off-limits; they return compiled Luau, which is a build artifact.
- Don't edit synced scripts through the MCP: Rojo overwrites them at the next build. Fix the TS and run `build`.
- Don't re-send unchanged scripts. Use the list printed by `build` ("file(s) changed") and send only those.
- Don't paste compiled Luau into the conversation. If a script must go through the MCP, read the `.luau` file inside the tool call flow only if the MCP requires the content as an argument, and do it once per changed file.

## Tool names

MCP tool names differ between Roblox MCP servers. Check the tools actually present in the session (ToolSearch if needed) instead of assuming names.

## Recommended combo

Rojo live sync for code (free in tokens) + MCP for runtime checks. If Rojo is not installed, suggest it once; it removes the need to push code through the MCP at all.
