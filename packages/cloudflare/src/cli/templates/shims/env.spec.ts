import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";
import { describe, expect, it } from "vitest";

// The compiled shim lives in dist/cli/templates/shims/env.js (tsc mirrors src/).
// From this spec (dist/cli/templates/shims/env.spec.js at runtime) it is ../../../..
// up to the package root, then into dist. Resolve it the same way bundle-server.ts
// does: packageDistDir = <dist>/cli/build/../.. -> package root.
const here = path.dirname(fileURLToPath(import.meta.url)); // dist/cli/templates/shims
const packageRoot = path.resolve(here, "../../../..");
const envShim = path.join(packageRoot, "dist/cli/templates/shims/env.js");

describe("@next/env shim", () => {
	async function bundle(entrySource: string) {
		const work = mkdtempSync(path.join(tmpdir(), "env-shim-"));
		const entry = path.join(work, "entry.mjs");
		writeFileSync(entry, entrySource);
		const result = await build({
			entryPoints: [entry],
			bundle: true,
			write: false,
			format: "esm",
			platform: "node",
			// Mirrors the alias in bundle-server.ts:148
			alias: { "@next/env": envShim },
			logLevel: "silent",
		});
		const out = path.join(work, "out.mjs");
		writeFileSync(out, result.outputFiles[0].text);
		return out;
	}

	it("compiled shim exists and exposes both a named and a default export", () => {
		expect(existsSync(envShim), `shim not found at ${envShim} — run pnpm build first`).toBe(true);
		const src = readFileSync(envShim, "utf8");
		expect(src).toMatch(/export function loadEnvConfig/);
		expect(src).toMatch(/export default \{[^}]*loadEnvConfig[^}]*\}/);
	});

	it("satisfies a named import (Next's own usage)", async () => {
		const out = await bundle(
			[
				"import { loadEnvConfig } from '@next/env';",
				"if (typeof loadEnvConfig !== 'function') throw new Error('named export missing');",
				"loadEnvConfig(process.cwd(), false, true);",
				"globalThis.__namedOk = true;",
			].join("\n")
		);
		await import(pathToFileURL(out).href);
		expect((globalThis as Record<string, unknown>).__namedOk).toBe(true);
	});

	it("satisfies a default import destructured by the consumer (Payload's loadEnv.js, #1461)", async () => {
		// Payload's dist/bin/loadEnv.js shape: default import, then destructure.
		const out = await bundle(
			[
				"import nextEnvImport from '@next/env';",
				"const { loadEnvConfig } = nextEnvImport;",
				"if (typeof loadEnvConfig !== 'function') throw new Error('default export missing loadEnvConfig');",
				"loadEnvConfig(process.cwd(), false, true);",
				"globalThis.__defaultOk = true;",
			].join("\n")
		);
		await import(pathToFileURL(out).href);
		expect((globalThis as Record<string, unknown>).__defaultOk).toBe(true);
	});
});
