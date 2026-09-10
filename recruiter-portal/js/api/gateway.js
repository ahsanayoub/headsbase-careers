import { assertApiConfiguration, portalConfig } from "../config.js";
import { HttpClient } from "./http-client.js";

function normalizeUser(value) {
  if (!value) return null;
  return { ...value, name: value.name || [value.firstName, value.lastName].filter(Boolean).join(" ").trim() };
}
function normalizeSession(payload) {
  const value = payload?.data ?? payload;
  if (!value) return null;
  if (value.user) return { ...value, user: normalizeUser(value.user) };
  return { user: normalizeUser(value), organization: { name: value.organizationName || "" }, onboardingComplete: Boolean(value.emailVerified) };
}
function normalizeProfile(payload) {
  const value = payload?.data ?? payload;
  if (!value) return null;
  if (value.user) return value;
  return { user: normalizeUser(value), organization: { name: value.organizationName || "" } };
}
function normalizeDashboard(payload) {
  const value = payload?.data ?? payload ?? {};
  const raw = value.metrics || {};
  const metrics = Array.isArray(raw) ? raw : [
    { label: "Active jobs", value: Number(raw.activeJobs || 0), detail: "Jobs currently available to you" },
    { label: "Applications", value: Number(raw.applications || 0), detail: "Applications across accessible jobs" },
    { label: "Candidates", value: Number(raw.candidates || 0), detail: "Candidates represented in submissions" },
    { label: "Interviews", value: Number(raw.interviews || 0), detail: "Applications currently at interview stage" },
  ];
  return { ...value, metrics, jobs: Array.isArray(value.jobs) ? value.jobs : [], activity: Array.isArray(value.activity) ? value.activity : [] };
}

class HtnApiGateway {
  constructor(client) { this.client = client; }
  async getSession() { return normalizeSession(await this.client.request("/auth/me", { allowUnauthorized: true })); }
  async login(credentials) {
    const session = normalizeSession(await this.client.request("/auth/login", { method: "POST", body: credentials, allowUnauthorized: true }));
    if (session?.user && !session.user.emailVerified) await this.resendVerification(session.user.email);
    return session;
  }
  async signup(details) {
    const name = String(details.name || "").trim(); const parts = name.split(/\s+/).filter(Boolean);
    const firstName = parts.shift() || "Recruiter"; const lastName = parts.join(" ") || "User";
    return normalizeSession(await this.client.request("/auth/signup", { method: "POST", body: { ...details, firstName, lastName }, allowUnauthorized: true }));
  }
  logout() { return this.client.request("/auth/logout", { method: "POST", allowUnauthorized: true }); }
  requestPasswordReset(email) { return this.client.request("/auth/forgot-password", { method: "POST", body: { email }, allowUnauthorized: true }); }
  resendVerification(email) { return this.client.request("/auth/resend-verification", { method: "POST", body: { email }, allowUnauthorized: true }); }
  async verifyEmail(token) { return normalizeSession(await this.client.request("/auth/verify-email", { method: "POST", body: { token }, allowUnauthorized: true })); }
  resetPassword(token, password) { return this.client.request("/auth/reset-password", { method: "POST", body: { token, password }, allowUnauthorized: true }); }
  async getDashboard() { return normalizeDashboard(await this.client.request("/recruiter/dashboard")); }
  getJobs(filters) { return this.client.request(`/recruiter/jobs${toQuery(filters)}`); }
  getJob(jobId) { return this.client.request(`/recruiter/jobs/${encodeURIComponent(jobId)}`); }
  getCandidates(filters) { return this.client.request(`/recruiter/candidates${toQuery(filters)}`); }
  getSubmissions(filters) { return this.client.request(`/recruiter/submissions${toQuery(filters)}`); }
  async getProfile() { return normalizeProfile(await this.client.request("/recruiter/profile")); }
  async updateProfile(patch) {
    const userPatch = patch?.user || patch || {}; const nameParts = String(userPatch.name || "").trim().split(/\s+/).filter(Boolean); const body = {};
    if (nameParts.length) { body.firstName = nameParts.shift(); body.lastName = nameParts.join(" ") || "User"; }
    if (userPatch.phone !== undefined) body.phone = userPatch.phone; if (userPatch.jobTitle !== undefined) body.jobTitle = userPatch.jobTitle;
    return normalizeSession(await this.client.request("/recruiter/profile", { method: "PATCH", body }));
  }
  updateSession(patch) { const userPatch = patch?.user || {}; return this.updateProfile({ user: { name: userPatch.name, phone: userPatch.phone, jobTitle: userPatch.jobTitle } }); }
  completeOnboarding() { return this.getSession(); }
}
function toQuery(filters = {}) { const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") query.set(key, value); }); const value = query.toString(); return value ? `?${value}` : ""; }
export function createRecruiterGateway() { assertApiConfiguration(); return new HtnApiGateway(new HttpClient({ origin: portalConfig.apiOrigin })); }
export function apiValue(payload) { return payload?.data ?? payload; }
