<h1 align="center">Wayzoo</h1>

<p align="center">
  <b>Write Roblox in TypeScript. Compile to Luau. Burn far fewer AI tokens.</b>
</p>

<p align="center">
  <a href="https://github.com/wayzoo/wayzoo/stargazers"><img src="https://img.shields.io/github/stars/wayzoowayzoo?style=flat" alt="stars"></a>
  <a href="https://github.com/wayzoo/wayzoo/actions/workflows/ci.yml"><img src="https://github.com/wayzoo/wayzoo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT"></a>
  <img src="https://img.shields.io/badge/roblox--ts-3.x-red" alt="roblox-ts">
</p>

Wayzoo is a [Claude](https://claude.ai) skill plus two small shell scripts. Claude writes the TypeScript once, [roblox-ts](https://roblox-ts.com) compiles it, and the Luau reaches Roblox Studio without the AI ever reading or retyping it.

**Install in 30 seconds:** download [`dist/wayzoo.skill`](dist/wayzoo.skill), open it in Claude, click **Save skill**, then ask Claude to write your Roblox code in TypeScript.

---

## Contents

[The problem](#the-problem) · [How Wayzoo helps](#how-wayzoo-helps) · [Measured savings](#measured-savings) · [Install](#install) · [Commands](#commands) · [Roblox Studio and MCP](#roblox-studio-and-mcp) · [Repo layout](#repo-layout) · [FAQ](docs/faq.md) · [Contributing](#contributing)

## The problem

A naive AI + roblox-ts loop pays for the same code three times:

1. the AI writes the TypeScript,
2. it reads the compiled Luau back to check it,
3. it pastes that Luau into Studio.

Failed builds also dump a wall of compiler output into the chat. On a big game this adds up fast.

## How Wayzoo helps

| Trick | Effect |
|---|---|
| `build.sh` prints one line on success, only the first N lines on failure | Failed builds don't flood the context |
| Compiled `.luau` is never printed or re-read | It is a build artifact, not something to review |
| Only changed files are reported and sent | No re-sending the whole project |
| Rojo live sync | Code reaches Studio without passing through the chat |
| Studio MCP used for live state only | Errors, instances, playtests, not source code |

More detail in [docs/how-it-works.md](docs/how-it-works.md).

## Measured savings

Run on a generated 12-function TypeScript file (about 3.3 KB, compiling to about 3.6 KB of Luau). Sizes are bytes of text; tokens scale roughly with that.

| Scenario | Naive loop | Wayzoo | Saving |
|---|---|---|---|
| Compiler output with 25 type errors | ~3.4 KB | ~1.2 KB | **about 65%** |
| Code to Studio with Rojo | ~10.6 KB | ~3.4 KB | **about 68%** |
| Code to Studio through MCP, no Rojo | ~10.6 KB | ~7.0 KB | **about 34%** |

Reproduce it yourself:

```bash
bash benchmarks/measure.sh
```

> **Honest caveats.** One synthetic file, one machine. It covers the code-handling and build-output part of a session, not your whole conversation, and the naive baseline is an assumption of a typical loop. Please [share your own numbers](../../issues/new?template=token_report.md).

## Install

**As a Claude skill**

1. Download `dist/wayzoo.skill`.
2. Open it in Claude and click **Save skill**.

**As plain scripts** (no Claude needed). Requires Node.js 18+, and [Rojo](https://rojo.space) for live sync.

```bash
git clone https://github.com/wayzoo/wayzoo.git
cd wayzoo-skill
bash skills/wayzoo/scripts/setup.sh my-game
bash skills/wayzoo/scripts/build.sh my-game
cd my-game && rojo serve
```

Full details in [INSTALL.md](INSTALL.md).

## Commands

| Command | What it does |
|---|---|
| `setup.sh <dir>` | Creates a roblox-ts project: `src/server`, `src/client`, `src/shared` |
| `build.sh <dir> [N]` | Compiles. One line on success, first N error lines on failure (default 25) |
| `rojo serve` | Syncs the compiled output into Studio |
| `bash benchmarks/measure.sh` | Reproduces the benchmark |

Example output:

```
OK build (1 file(s) changed): out/server/main.server.luau
```

```
ERR build failed (first 4 lines):
src/server/bad.ts:1:7 - error TS2322: Type 'string' is not assignable to type 'number'.
1 const z: number = "x";
        ~
... (1 more lines hidden)
```

## Roblox Studio and MCP

Files are the source of truth. If you connect a Roblox Studio MCP, use it for **live state** (Output errors, creating instances, playtests), not for carrying source back and forth. The MCP part has not been tested against specific servers yet. Tell us what you tried in an issue.

Details: [skills/wayzoo/references/mcp-studio.md](skills/wayzoo/references/mcp-studio.md).

## Repo layout

```
skills/wayzoo/        the Claude skill (SKILL.md, scripts, references)
dist/wayzoo.skill     ready-to-install skill
examples/hello-game/  tiny project to try it on
benchmarks/           reproducible token measurement
docs/                 how it works, FAQ
.github/              issue templates, PR template, CI
```

## Contributing

Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md). The most useful things right now: real token numbers from your projects and reports on which Studio MCP servers work.

If Wayzoo saves you tokens, a star helps others find it.

## License

[MIT](LICENSE)
