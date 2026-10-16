import { afterAll, beforeEach, describe, expect, it } from "vitest";

import cache, { CACHE_DIR } from "./static-assets-incremental-cache.js";

// `getAssetUrl` is `protected`; reach it through the default export's type.
const exposed = cache as unknown as {
	getAssetUrl: (
		key: string,
		cacheType?: "cache" | "fetch" | "pages" | "app" | "redirect" | "composable"
	) => string;
};

const buildId = "test-build-id";
const prevBuildId = process.env.OPEN_NEXT_BUILD_ID;

beforeEach(() => {
	process.env.OPEN_NEXT_BUILD_ID = buildId;
});

afterAll(() => {
	if (prevBuildId === undefined) delete process.env.OPEN_NEXT_BUILD_ID;
	else process.env.OPEN_NEXT_BUILD_ID = prevBuildId;
});

describe("static-assets-incremental-cache getAssetUrl", () => {
	it("encodes the `$` segment that Next.js >=15.5.27 puts in route-cache keys", () => {
		const key =
			"/route-cache/APP_PAGE/4ae1299898b11405025c37a282850f6aa4202abb0d7f59eb79481f3532577daf/$/journal/hello-world";
		const url = exposed.getAssetUrl(key, "cache");
		expect(url).toBe(
			`http://assets.local/${CACHE_DIR}/${buildId}/route-cache/APP_PAGE/4ae1299898b11405025c37a282850f6aa4202abb0d7f59eb79481f3532577daf/%24/journal/hello-world.cache`
		);
		// The raw `$` must not appear anywhere in the path
		expect(new URL(url).pathname).not.toContain("$");
	});

	it("encodes fetch-cache keys too", () => {
		const key = "route-cache/APP_PAGE/abc/$/some page";
		const url = exposed.getAssetUrl(key, "fetch");
		expect(new URL(url).pathname).toBe(
			`/${CACHE_DIR}/__fetch/${buildId}/route-cache/APP_PAGE/abc/%24/some%20page`
		);
	});

	it("leaves already-safe segments untouched", () => {
		const url = exposed.getAssetUrl("/route-cache/APP_PAGE/abc/$/index", "cache");
		expect(url).toContain(`/${CACHE_DIR}/${buildId}/`);
		expect(url).toContain("/route-cache/APP_PAGE/abc/%24/index.cache");
	});

	it("still throws for composable cache", () => {
		expect(() => exposed.getAssetUrl("/anything", "composable")).toThrowError(
			/Composable cache is not supported/
		);
	});
});
