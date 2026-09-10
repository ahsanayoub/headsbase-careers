/*
  Runtime configuration for a deployed recruiter portal. This file contains no
  credentials and should be supplied by the hosting environment before app.js.
  The API must issue Secure, HttpOnly session cookies for the portal origin.
*/
window.__HTN_RECRUITER_PORTAL_CONFIG__ = {
  mode: "api",
  apiOrigin: "https://your-htn-api.example",
};
