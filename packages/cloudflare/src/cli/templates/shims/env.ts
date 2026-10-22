export function loadEnvConfig() {}

// Some packages (e.g. Payload's `dist/bin/loadEnv.js`) consume `@next/env` via a
// default import and destructure off it. Provide one so both import styles resolve.
export default { loadEnvConfig };
