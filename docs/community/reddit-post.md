<!--
Subreddit: r/robloxgamedev
Flair: Resource (or Discussion)
Title: I made a free tool so Claude writes Roblox code in TypeScript without wasting ~68% of its tokens on compiled Luau
-->

If you use Claude (or any AI) to write Roblox code with roblox-ts, you've probably watched it do this:

1. write the TypeScript,
2. read the compiled Luau back "just to check",
3. paste that Luau into Studio.

Same code, paid for three times. Plus a wall of compiler errors every time a build fails, plus imports from `@rbxts` packages that don't exist.

So I built **Wayzoo**, a free, open-source (MIT) Claude skill plus a few small Node scripts:

- **TypeScript is the only source of truth.** Claude writes TS, `wayzoo build` compiles it silently (one line on success, only the first errors on failure), and **Rojo** syncs it into Studio.
- **Roblox Studio MCP for telemetry only.** If you connect it, Claude uses it to read the Output window and inspect instances during playtests, never to read compiled Luau back.
- **No more invented imports.** `wayzoo deps` lists the `@rbxts` packages you actually have installed.
- **Works everywhere.** Native Windows (cmd/PowerShell, no WSL), macOS, Linux. Claude Desktop app, browser, or Claude Code. Only needs Node 18+.

**Context used per build cycle (lower is better):**

```text
Naive AI loop               [████████████████████████████████████████] 10.6 KB
Wayzoo + Roblox Studio MCP  [██████████████████████████              ]  7.0 KB  -34%
Wayzoo + Rojo sync          [█████████████                           ]  3.4 KB  -68%
```

| Scenario | Naive | Wayzoo | Saving |
|---|---|---|---|
| Code to Studio via Rojo | ~10.6 KB | ~3.4 KB | ~68% |
| Code to Studio via MCP (no Rojo) | ~10.6 KB | ~7.0 KB | ~34% |
| Compiler output, 25 errors | ~3.4 KB | ~1.2 KB | ~65% |

Honest caveat: that's measured on one synthetic 3.3 KB file, and it only covers the code and build-output part of a session. You can rerun it with `node benchmarks/measure.mjs`.

**Install:**

- Claude Desktop / claude.ai: download `dist/wayzoo.skill`, then Customize > Skills > + > Upload a skill.
- Claude Code: `node install.mjs --claude-code`

GitHub: https://github.com/wayzoo/wayzoo-skill

It's v0.2.0, so I'd really like feedback: your own token numbers, which Studio MCP server you use, and whether the Windows setup works for you.
