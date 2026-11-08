# Benchmarks

`measure.sh` reproduces the table in the main README on your machine:

```bash
bash benchmarks/measure.sh
```

## Method

- A generated 12-function TypeScript file is compiled with roblox-ts.
- **Naive loop** = write the TS, read the compiled Luau back to check it, push that Luau to Studio. The Luau is paid for twice.
- **Wayzoo + Rojo** = write the TS, get one status line back, Rojo syncs the rest.
- **Wayzoo + MCP, no Rojo** = write the TS, push the changed Luau once.
- Compiler-output comparison uses 25 deliberate type errors: raw `rbxtsc` output vs. `build.sh` output.
- Sizes are bytes of text. Tokens scale roughly with bytes, so percentages are a reasonable proxy, not an exact token count.

## Limits

One synthetic file, one machine. It measures the code-handling and build-output part of a session only, and the naive baseline is an assumption. Please share your own numbers in an issue.
