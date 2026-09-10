import { assertApiConfiguration, isDevelopmentMode, portalConfig } from "../config.js";
import { DevelopmentGateway } from "./development-gateway.js";
import { HttpClient } from "./http-client.js";

function unwrap(data) {
  return data?.data ?? data;
}

class HtnApiGateway {
  constructor(client) {
    this.client = client;
  }

  getSession() { return this.client.request("/auth/me", { allowUnauthorized: true }); }
  login(credentials) { return this.client.request("/auth/login", { method: "POST", body: credentials, allowUnauthorized: true }); }
  signup(details) { return this.client.request("/auth/signup", { method: "POST", body: details, allowUnauthorized: true }); }
  logout() { return this.client.request("/auth/logout", { method: "POST", allowUnauthorized: true }); }
  requestPasswordReset(email) { return this.client.request("/auth/forgot-password", { method: "POST", body: { email }, allowUnauthorized: true }); }
  verifyEmail(code) { return this.client.request("/auth/verify-email", { method: "POST", body: { code } }); }
  updateSession() { throw new Error("Onboarding updates will be enabled when the authenticated HTN profile endpoint is available."); }
  completeOnboarding() { throw new Error("Onboarding completion will be enabled when the authenticated HTN profile endpoint is available."); }
  getDashboard() { return this.client.request("/recruiter/dashboard"); }
  getJobs(filters) { return this.client.request(`/recruiter/jobs${toQuery(filters)}`); }
  getJob(jobId) { return this.client.request(`/recruiter/jobs/${encodeURIComponent(jobId)}`); }
  getCandidates(filters) { return this.client.request(`/recruiter/candidates${toQuery(filters)}`); }
  getSubmissions(filters) { return this.client.request(`/recruiter/submissions${toQuery(filters)}`); }
  getProfile() { return this.client.request("/recruiter/profile"); }
  updateProfile(patch) { return this.client.request("/recruiter/profile", { method: "PATCH", body: patch }); }
}

function toQuery(filters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

export function createRecruiterGateway() {
  if (isDevelopmentMode()) return new DevelopmentGateway();
  assertApiConfiguration();
  return new HtnApiGateway(new HttpClient({ origin: portalConfig.apiOrigin }));
}

export function apiValue(payload) {
  return unwrap(payload);
}
