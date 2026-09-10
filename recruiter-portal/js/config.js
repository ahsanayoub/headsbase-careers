function readRuntimeConfig() {
  const configured = window.__HTN_RECRUITER_PORTAL_CONFIG__;

  if (!configured) {
    // The portal is a labelled demo until the HTN API authentication service is
    // explicitly configured. This avoids calling any host or accidentally
    // presenting the current public careers API as recruiter data.
    return { mode: "development", apiOrigin: "" };
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
