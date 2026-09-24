/*
  Runtime configuration for a deployed recruiter portal. This file contains no
  credentials and should be supplied by the hosting environment before app.js.
  The API must issue Secure, HttpOnly session cookies for the portal origin.
*/
window.__HTN_RECRUITER_PORTAL_CONFIG__ = {
  mode: "api",
  // Recruiter service only — not careers/Micro1 (c3a4). Portal JS ignores overrides of this host.
  apiOrigin: "https://htn-api-production-2a68.up.railway.app",
};
