---
"@opennextjs/cloudflare": patch
---

fix: render server action redirects for the host of the request

A worker serving several hostnames rendered the target of a relative `redirect()` from a Server Action for the host of the first request handled by the isolate. `init()` set `process.env.__NEXT_PRIVATE_ORIGIN` once per isolate from that request, and Next fetches the redirect target from that origin, so a user of one host could be served the page of another (in production, another tenant's login page).

The variable is no longer set. Next falls back to the request's `initURL`, whose protocol the `attachRequestMeta` patch already corrects, so the origin is per request and preview over `http` keeps working.
