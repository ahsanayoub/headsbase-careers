function readRuntimeConfig() {
  const configured = window.__HTN_RECRUITER_PORTAL_CONFIG__;

  if (!configured) {
    return { mode: "api", apiOrigin: "https://htn-api-production-ab6d.up.railway.app" };
  }

  return {
    mode: configured.mode === "api" ? "api" : "development",
    apiOrigin: String(configured.apiOrigin || "").replace(/\/$/, ""),
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
