---
"@opennextjs/cloudflare": patch
---

fix: add a default export to the `@next/env` shim

Some packages (e.g. Payload's `dist/bin/loadEnv.js`) consume `@next/env` via a
default import and destructure `loadEnvConfig` off it. The shim only provided a
named export, so esbuild failed the server bundle with
`No matching export in ".../shims/env.js" for import "default"`. The shim now
also exports `{ loadEnvConfig }` as its default so both import styles resolve.
