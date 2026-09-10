import { assertApiConfiguration, portalConfig } from "../config.js";
import { HttpClient } from "./http-client.js";

class HtnApiGateway {
  constructor(client) {
    this.client = client;
  }

  getSession() {
    return this.client.request("/auth/me", { allowUnauthorized: true });
  }

  login(credentials) {
    return this.client.request("/auth/login", {
      method: "POST",
      body: credentials,
      allowUnauthorized: true,
    });
  }

  signup(details) {
    return this.client.request("/auth/signup", {
      method: "POST",
      body: details,
      allowUnauthorized: true,
    });
  }

  logout() {
    return this.client.request("/auth/logout", {
      method: "POST",
      allowUnauthorized: true,
    });
  }

  requestPasswordReset(email) {
    return this.client.request("/auth/forgot-password", {
      method: "POST",
      body: { email },
      allowUnauthorized: true,
    });
  }

  verifyEmail(code) {
    return this.client.request("/auth/verify-email", {
      method: "POST",
      body: { code },
    });
  }

  resetPassword(token, password) {
    return this.client.request("/auth/reset-password", {
      method: "POST",
      body: { token, password },
      allowUnauthorized: true,
    });
  }

  getDashboard() {
    return this.client.request("/recruiter/dashboard");
  }

  getJobs(filters) {
    return this.client.request(`/recruiter/jobs${toQuery(filters)}`);
  }

  getJob(jobId) {
    return this.client.request(`/recruiter/jobs/${encodeURIComponent(jobId)}`);
  }

  getCandidates(filters) {
    return this.client.request(`/recruiter/candidates${toQuery(filters)}`);
  }

  getSubmissions(filters) {
    return this.client.request(`/recruiter/submissions${toQuery(filters)}`);
  }

  getProfile() {
    return this.client.request("/recruiter/profile");
  }

  updateProfile(patch) {
    return this.client.request("/recruiter/profile", {
      method: "PATCH",
      body: patch,
    });
  }

  updateSession(patch) {
    return this.updateProfile(patch);
  }

  completeOnboarding() {
    return this.getProfile();
  }
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

export function apiValue(payload) {
  return payload?.data ?? payload;
}
