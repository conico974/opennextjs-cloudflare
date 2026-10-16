---
"@opennextjs/cloudflare": patch
---

fix: encode path segments in `staticAssetsIncrementalCache` asset URLs

Since Next.js 15.5.27 / 16.3.8, incremental-cache keys contain a literal `$` segment (`/route-cache/<kind>/<sha256>/$<path>`). `StaticAssetsIncrementalCache.getAssetUrl` interpolated the key into the `http://assets.local/...` URL unencoded, and the Workers asset server answers a **307** redirect to the canonical `%24` URL when its per-segment `encodeURIComponent` differs from the request path. In production `assets.fetch` does not follow that redirect, so `get()` returned `null` for every prerendered route and the pages fell through to a runtime render (404 when the render depends on build-time-only data). `opennextjs-cloudflare preview` follows the redirect locally, which is why the bug was invisible in local dev.

`getAssetUrl` now encodes each path segment with `encodeURIComponent`, matching the asset server's canonical form and removing the redirect round-trip entirely.
