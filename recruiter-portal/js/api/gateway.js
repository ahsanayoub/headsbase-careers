import { assertApiConfiguration, portalConfig } from "../config.js";
import { HttpClient } from "./http-client.js";

function normalizeSession(payload) {
  const value = payload?.data ?? payload;
  if (!value) return null;
  if (value.user) return value;
  return {
    user: value,
    organization: {
      name: value.organizationName || "",
    },
    onboardingComplete: Boolean(value.emailVerified),
  };
}

class HtnApiGateway {
  constructor(client) { this.client = client; }

  async getSession() {
    const value = await this.client.request("/auth/me", { allowUnauthorized: true });
    return normalizeSession(value);
  }

  async login(credentials) {
    return normalizeSession(await this.client.request("/auth/login", { method: "POST", body: credentials, allowUnauthorized: true }));
  }

  async signup(details) {
    const name = String(details.name || "").trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const firstName = parts.shift() || "Recruiter";
    const lastName = parts.join(" ") || "User";
    return normalizeSession(await this.client.request("/auth/signup", {
      method: "POST",
      body: { ...details, firstName, lastName },
      allowUnauthorized: true,
    }));
  }

  logout() { return this.client.request("/auth/logout", { method: "POST", allowUnauthorized: true }); }

  requestPasswordReset(email) {
    return this.client.request("/auth/forgot-password", { method: "POST", body: { email }, allowUnauthorized: true });
  }

  async verifyEmail(token) {
    return normalizeSession(await this.client.request("/auth/verify-email", { method: "POST", body: { token } }));
  }

  resetPassword(token, password) {
    return this.client.request("/auth/reset-password", { method: "POST", body: { token, password }, allowUnauthorized: true });
  }

  getDashboard() { return this.client.request("/recruiter/dashboard"); }
  getJobs(filters) { return this.client.request(`/recruiter/jobs${toQuery(filters)}`); }
  getJob(jobId) { return this.client.request(`/recruiter/jobs/${encodeURIComponent(jobId)}`); }
  getCandidates(filters) { return this.client.request(`/recruiter/candidates${toQuery(filters)}`); }
  getSubmissions(filters) { return this.client.request(`/recruiter/submissions${toQuery(filters)}`); }
  getProfile() { return this.client.request("/recruiter/profile"); }

  async updateProfile(patch) {
    const value = await this.client.request("/recruiter/profile", { method: "PATCH", body: patch });
    return normalizeSession(value);
  }

  updateSession(patch) {
    const userPatch = patch?.user || {};
    return this.updateProfile({ firstName: userPatch.name?.split(/\s+/)[0], lastName: userPatch.name?.split(/\s+/).slice(1).join(" "), phone: userPatch.phone });
  }

  completeOnboarding() { return this.getSession(); }
}

function toQuery(filters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

export function createRecruiterGateway() {
  assertApiConfiguration();
  return new HtnApiGateway(new HttpClient({ origin: portalConfig.apiOrigin }));
}

export function apiValue(payload) { return payload?.data ?? payload; }
