# hello-game

A tiny example to try Wayzoo on (from the repo root, any OS):

```
node skills/wayzoo/scripts/wayzoo.mjs setup examples/hello-game
node skills/wayzoo/scripts/wayzoo.mjs build examples/hello-game
node skills/wayzoo/scripts/wayzoo.mjs deps examples/hello-game
cd examples/hello-game
rojo serve
```

On Windows, replace the first part with `.\wayzoo.cmd setup examples\hello-game`, and so on.
