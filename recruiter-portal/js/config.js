/** Recruiter portal API — separate from careers/Micro1 (c3a4). Do not change. */
export const RECRUITER_API_ORIGIN = "https://htn-api-production-2a68.up.railway.app";

function readRuntimeConfig() {
  const configured = window.__HTN_RECRUITER_PORTAL_CONFIG__;

  // Always use the recruiter Railway service. Ignore alternate origins so
  // careers cutovers (c3a4) or stale portal-config cannot break login.
  return {
    mode: configured?.mode === "development" ? "development" : "api",
    apiOrigin: RECRUITER_API_ORIGIN,
  };
}

export const portalConfig = Object.freeze(readRuntimeConfig());

export function isDevelopmentMode() {
  return portalConfig.mode === "development";
}

export function assertApiConfiguration() {
  if (portalConfig.mode === "api" && portalConfig.apiOrigin) return;

  throw new Error(
    "The recruiter portal has not been configured with an HTN API origin. No remote service was contacted.",
  );
}
