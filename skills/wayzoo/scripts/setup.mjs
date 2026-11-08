#!/usr/bin/env node
// Usage: node setup.mjs <project-dir>
// Creates a minimal non-interactive roblox-ts project. Safe to re-run (won't overwrite existing files).
// Cross-platform: only needs Node.js 18+ and npm.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { run, tail } from "./_util.mjs";

const dir = resolve(process.argv[2] ?? ".");
for (const sub of ["server", "client", "shared"]) {
	mkdirSync(join(dir, "src", sub), { recursive: true });
}

function npm(args) {
	const r = run("npm", args, { cwd: dir });
	if (r.status !== 0) {
		console.log(`ERR npm ${args.join(" ")} failed (exit ${r.status})`);
		const why = tail(`${r.stderr ?? ""}\n${r.stdout ?? ""}`, 6);
		if (why) console.log(why);
		process.exit(1);
	}
}

if (!existsSync(join(dir, "package.json"))) npm(["init", "-y"]);
npm(["i", "-D", "roblox-ts", "typescript", "@rbxts/types", "@rbxts/compiler-types"]);
npm(["i", "@rbxts/services"]);

function writeOnce(name, content) {
	const p = join(dir, name);
	if (!existsSync(p)) writeFileSync(p, content);
}

writeOnce(
	"tsconfig.json",
	JSON.stringify(
		{
			compilerOptions: {
				allowSyntheticDefaultImports: true,
				downlevelIteration: true,
				module: "commonjs",
				moduleResolution: "Node",
				moduleDetection: "force",
				noLib: true,
				resolveJsonModule: true,
				experimentalDecorators: true,
				forceConsistentCasingInFileNames: true,
				strict: true,
				target: "ESNext",
				typeRoots: ["node_modules/@rbxts"],
				rootDir: "src",
				outDir: "out",
				baseUrl: "src",
				incremental: true,
				tsBuildInfoFile: "out/tsconfig.tsbuildinfo",
			},
		},
		null,
		2,
	) + "\n",
);

writeOnce(
	"default.project.json",
	JSON.stringify(
		{
			name: "game",
			globIgnorePaths: ["**/package.json", "**/tsconfig.json"],
			tree: {
				$className: "DataModel",
				ReplicatedStorage: {
					$className: "ReplicatedStorage",
					rbxts_include: {
						$path: "include",
						node_modules: {
							$className: "Folder",
							"@rbxts": { $path: "node_modules/@rbxts" },
						},
					},
					TS: { $path: "out/shared" },
				},
				ServerScriptService: {
					$className: "ServerScriptService",
					TS: { $path: "out/server" },
				},
				StarterPlayer: {
					$className: "StarterPlayer",
					StarterPlayerScripts: {
						$className: "StarterPlayerScripts",
						TS: { $path: "out/client" },
					},
				},
				SoundService: {
					$className: "SoundService",
					$properties: { RespectFilteringEnabled: true },
				},
			},
		},
		null,
		2,
	) + "\n",
);

writeOnce(".gitignore", "node_modules/\nout/\ninclude/\n*.tsbuildinfo\n");

// Wally detection: roblox-ts has no automatic type sync for Wally packages.
if (existsSync(join(dir, "wally.toml"))) {
	console.log("WARN wally.toml found: Wally packages need hand-written .d.ts declarations in roblox-ts (not synced automatically)");
}

console.log(`OK setup done in ${dir}`);
