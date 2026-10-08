---
"@opennextjs/cloudflare": patch
---

fix: delete the persisted `failed_state` row when a route leaves the failed state

A route that stopped failing (it revalidated successfully, returned 404, hit the `FatalError` branch,
or exhausted its retries) was removed from the in-memory `routeInFailedState` map only; its row stayed
in the durable object's `failed_state` table. `initState()` restores every row of that table on each
durable object start and `alarm()` replays a `HEAD` self-revalidation for each of them without checking
whether the route has already been revalidated. The rows only accumulated, so the number of replayed
revalidations per restart grew with the age of the deployment and dropped only when a new build id
cleared the table — extra `HEAD` self-requests, incremental cache writes and billable durable object
duration after every idle eviction or runtime restart.
