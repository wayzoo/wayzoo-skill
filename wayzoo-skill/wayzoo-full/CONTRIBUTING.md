# Contributing

Thanks for helping! Issues and pull requests are welcome.

- Keep the scripts POSIX-friendly bash and keep their output **short**: that is the whole point.
- Run `bash -n skills/wayzoo/scripts/*.sh` (and `shellcheck` if you have it) before opening a PR.
- If you change behaviour, run `bash benchmarks/measure.sh` and paste the table in the PR.
- If you change `skills/wayzoo/`, rebuild `dist/wayzoo.skill` and mention it in `CHANGELOG.md`.
- Real-world token numbers and Studio MCP reports are the most valuable contributions right now.
