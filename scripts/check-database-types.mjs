import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import process from "node:process";

const generated = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["supabase", "gen", "types", "typescript", "--local", "--schema", "app"],
  { encoding: "utf8" },
);

if (generated.status !== 0) {
  process.stderr.write(generated.stderr);
  process.exit(generated.status ?? 1);
}

const normalized = `${generated.stdout.trimEnd()}\n`;
if (process.argv.includes("--write")) {
  await writeFile("src/database.types.ts", normalized);
  process.stdout.write("Updated src/database.types.ts.\n");
  process.exit(0);
}

const committed = await readFile("src/database.types.ts", "utf8");
if (committed !== normalized) {
  process.stderr.write(
    "src/database.types.ts is stale. Run `npm run db:types` and commit the result.\n",
  );
  process.exit(1);
}

process.stdout.write("Supabase database types are up to date.\n");
