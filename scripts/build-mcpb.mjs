#!/usr/bin/env node
// Build an MCPB bundle (server.mcpb) for Smithery's local (stdio) publishing.
//
//   npm run build && npm run mcpb
//
// Stages a bundle directory (<repo>/mcpb-build) with the compiled server, a
// minimal package.json, the production dependencies, and manifest.json, then
// packs it with the official @anthropic-ai/mcpb CLI.
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

const MCPB_VERSION = "2.1.2";

const out = "mcpb-build";
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "server"), { recursive: true });

// Compiled server.
cpSync("dist", join(out, "server"), { recursive: true });

// Manifest + a minimal package.json (so node treats server/ as ESM).
cpSync("manifest.json", join(out, "manifest.json"));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const minimal = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  type: pkg.type,
  license: pkg.license,
  dependencies: pkg.dependencies,
};
writeFileSync(join(out, "package.json"), JSON.stringify(minimal, null, 2) + "\n");

// Bundle production dependencies.
execSync("npm install --omit=dev --no-audit --no-fund --no-package-lock", {
  cwd: out,
  stdio: "inherit",
});

const mcpb = `npx -y @anthropic-ai/mcpb@${MCPB_VERSION}`;
execSync(`${mcpb} validate mcpb-build/manifest.json`, { stdio: "inherit" });
execSync(`${mcpb} pack mcpb-build server.mcpb`, { stdio: "inherit" });

console.log("\nBuilt server.mcpb");
