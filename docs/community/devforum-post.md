<!--
Roblox DevForum, category: Resources > Community Resources
Title: Wayzoo: write Roblox in TypeScript with Claude and cut AI token usage by up to ~68% (Rojo + Studio MCP)
Tags: roblox-ts, typescript, rojo, ai, open-source
Before posting: check the GitHub link, and add a screenshot or GIF of a build cycle if you have one.
-->

# Wayzoo: write Roblox in TypeScript with Claude, burn far fewer AI tokens

Hi everyone!

**Wayzoo** is a free, open-source (MIT) skill for [Claude](https://claude.ai) plus a few tiny Node scripts. Claude writes your game code in TypeScript, [roblox-ts](https://roblox-ts.com) compiles it to Luau, and [Rojo](https://rojo.space) syncs it into Roblox Studio. The AI never reads or retypes the compiled Luau.

It runs natively on **Windows** (cmd and PowerShell, no WSL, no Bash), **macOS** and **Linux**, in the **Claude Desktop app**, in the browser and in **Claude Code**. All you need is Node.js 18+.

**GitHub:** https://github.com/wayzoo/wayzoo-skill

---

## The problem

If you use an AI assistant with roblox-ts, a typical loop pays for the same code **three times**:

1. the AI writes the TypeScript,
2. it reads the compiled Luau back "to check it",
3. it pastes that Luau into Studio.

On top of that, one failed build dumps a wall of compiler output into the chat, and the AI often guesses which `@rbxts` packages exist and invents import paths. On a real game, your context (and your usage limits) disappear fast.

## The solution

Wayzoo splits the work into two channels, and never mixes them:

| Channel | Job |
|---|---|
| **TypeScript files + `wayzoo build` + Rojo** | Source code. The TS in `src/` is the only source of truth. It is compiled silently and Rojo syncs it into Studio. |
| **Roblox Studio MCP** (optional) | Real-time telemetry only: reading the Output window, inspecting instances during a playtest, starting and stopping playtests. |

What that changes in practice:

- `build` prints **one line** on success, and only the first N error lines on failure. Import errors (TS2307) come first, with the faulty path and what actually exists on disk.
- `deps` lists your installed `@rbxts` packages in a few lines, so the AI only imports packages that really exist and never reads `node_modules`.
- Compiled `.luau` is never printed, never re-read, and **never read back out of Studio** through the MCP.
- Studio errors that name a compiled script (for example `ServerScriptService.TS.economy:42`) are mapped back to the `.ts` file and fixed there.

## Token usage per build cycle (lower is better)

```text
Naive AI loop               [████████████████████████████████████████] 10.6 KB  baseline
Wayzoo + Roblox Studio MCP  [██████████████████████████              ]  7.0 KB  -34%
Wayzoo + Rojo sync          [█████████████                           ]  3.4 KB  -68%
```

## Benchmarks

Measured on a generated 12-function TypeScript file (about 3.3 KB, compiling to about 3.6 KB of Luau). Sizes are bytes of text; tokens scale roughly with bytes.

| Scenario | Naive loop | Wayzoo | Saving |
|---|---|---|---|
| **Code to Roblox Studio via Rojo** | ~10.6 KB | **~3.4 KB** | **about 68%** |
| **Code to Roblox Studio via MCP, no Rojo** | ~10.6 KB | **~7.0 KB** | **about 34%** |
| TS compiler output with 25 type errors | ~3.4 KB | ~1.2 KB | about 65% |

**To be transparent:** this is one synthetic file on one machine. It measures the code-handling and build-output part of a session, not a whole conversation, and the "naive loop" is an assumption about a typical workflow. You can reproduce it with `node benchmarks/measure.mjs`, and I would love to see your real numbers.

## Installation

You need **Node.js 18+** ([nodejs.org](https://nodejs.org), or `winget install OpenJS.NodeJS.LTS` on Windows). Rojo is optional but gives the biggest saving.

**Claude Desktop app (Windows / macOS) or claude.ai**

1. Download `dist/wayzoo.skill` from the repo (or build it with `node install.mjs`; on Windows, double-click `install.cmd`).
2. In Claude, open **Customize > Skills**, click **+**, then **Create skill > Upload a skill**, and pick the file.
3. Switch the skill on and make sure code execution is enabled in your settings.
4. Ask: *"Write my Roblox code in TypeScript."*

**Claude Code CLI**

```
git clone https://github.com/wayzoo/wayzoo-skill.git
cd wayzoo-skill
node install.mjs --claude-code
```

**Start a project (any OS)**

```
node skills/wayzoo/scripts/wayzoo.mjs setup my-game
node skills/wayzoo/scripts/wayzoo.mjs build my-game
cd my-game
rojo serve
```

On Windows you can use `.\wayzoo.cmd setup my-game` instead. If anything looks off, `wayzoo doctor my-game` checks your OS, Node, npm, Rojo and whether `default.project.json` is ready for Rojo sync.

## Feedback wanted

This is an early release (v0.2.0). The most useful things right now:

- your own token numbers on real projects,
- which Roblox Studio MCP servers you tried it with,
- Windows feedback.

Issues and pull requests are welcome on GitHub. If it saves you tokens, a star helps other developers find it.

Thanks for reading!
