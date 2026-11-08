# Contributing

Thanks for helping! Issues and pull requests are welcome.

- Scripts are plain Node 18+ (`.mjs`), no dependencies, and must run on Windows, macOS and Linux. Keep their output **short**: that is the whole point.
- Run `node tools/test.mjs` before opening a PR.
- If you change behaviour, run `node benchmarks/measure.mjs` and paste the table in the PR.
- If you change `skills/wayzoo/`, run `node tools/pack.mjs` to rebuild `dist/wayzoo.skill` and mention it in `CHANGELOG.md`.
- Real-world token numbers, Windows feedback and Studio MCP reports are the most valuable contributions right now.
