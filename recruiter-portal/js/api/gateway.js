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
function normalizeJob(job) {
  if (!job) return null;
  return {
    ...job,
    location: job.location || [job.city, job.country].filter(Boolean).join(", ") || "Not specified",
    employmentType: job.employmentType || "Not specified",
    priority: job.priority || "Standard",
    assignedAt: job.assignedAt || job.postedAt || job.createdAt,
    candidatesSubmitted: Number(job.candidatesSubmitted ?? job.applicationCount ?? 0),
    clientVisibility: job.clientVisibility || "Shared assignment",
    experienceLevel: job.experienceLevel || "Not specified",
    compensation: job.compensation || "Not specified",
    requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
    preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
    instructions: job.instructions || "Follow the submission expectations provided by Headsbase.",
    expectations: job.expectations || "Submit qualified candidates through the approved Headsbase workflow.",
    description: job.description || "No job description provided.",
  };
}
function normalizeJobs(payload) {
  const value = payload?.data ?? payload;
  const items = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  const pagination = Array.isArray(value) ? { page: 1, limit: items.length || 20, total: items.length, totalPages: items.length ? 1 : 0, hasMore: false } : (value?.pagination || {});
  return { items: items.map(normalizeJob), pagination };
}
function normalizeCandidates(payload) {
  const value = payload?.data ?? payload;
  const items = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  const pagination = Array.isArray(value) ? { page: 1, limit: items.length || 20, total: items.length, totalPages: items.length ? 1 : 0, hasMore: false } : (value?.pagination || {});
  return { items: items.map((candidate) => ({ ...candidate, name: candidate.name || [candidate.firstName, candidate.lastName].filter(Boolean).join(" ").trim(), job: candidate.job || candidate.currentTitle || "—", submitted: candidate.submitted || candidate.createdAt || "—", activity: candidate.activity || candidate.updatedAt || "—", status: candidate.status || "Submitted" })), pagination };
}
function normalizeSubmissions(payload) {
  const value = payload?.data ?? payload;
  const items = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  return { items: items.map((submission) => ({ ...submission, candidate: submission.candidate || [submission.firstName, submission.lastName].filter(Boolean).join(" ").trim(), job: submission.job || submission.jobTitle || "—", submitted: submission.submitted || submission.submittedAt || submission.createdAt || "—", status: submission.status || "Submitted", feedback: submission.feedback || "No feedback yet", nextAction: submission.nextAction || "Awaiting review" })) };
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
  async getJobs(filters) { return normalizeJobs(await this.client.request(`/recruiter/jobs${toQuery(filters)}`)); }
  async getJob(jobId) { return normalizeJob((await this.client.request(`/recruiter/jobs/${encodeURIComponent(jobId)}`))?.data); }
  async getCandidates(filters) { return normalizeCandidates(await this.client.request(`/recruiter/candidates${toQuery(filters)}`)); }
  async getSubmissions(filters) { return normalizeSubmissions(await this.client.request(`/recruiter/submissions${toQuery(filters)}`)); }
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
