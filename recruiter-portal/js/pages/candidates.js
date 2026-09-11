import { emptyState, escapeHtml, icon, loadingBlock, statusBadge } from "../components/ui.js";

function candidatesTable(items) {
  if (!items.length) return emptyState({ title: "No candidates yet", message: "Candidate records will appear after secure submission through the HTN API is enabled." });
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Candidate</th><th>Job</th><th>Submitted</th><th>Status</th><th>Last activity</th><th></th></tr></thead><tbody>${items.map((candidate) => `<tr><td class="table-primary">${escapeHtml(candidate.name)}</td><td>${escapeHtml(candidate.job || "—")}</td><td>${escapeHtml(candidate.submitted)}</td><td>${statusBadge(candidate.status)}</td><td>${escapeHtml(candidate.activity)}</td><td><a class="row-action" href="#/candidates/${encodeURIComponent(candidate.id)}">View</a></td></tr>`).join("")}</tbody></table></div>`;
}

export const candidatesPage = {
  title: "Candidates",
  description: "Candidates your organization has submitted to Headsbase. External-facing statuses are distinct from internal ATS workflow.",
  initial: loadingBlock("Loading candidate workspace"),
  async load(container, api) {
    const render = async () => {
      const form = container.querySelector("#candidate-filters");
      const result = await api.getCandidates(Object.fromEntries(new FormData(form).entries()));
      container.querySelector("#candidate-list").innerHTML = candidatesTable(result.items);
    };
    container.innerHTML = `<section class="panel"><div class="panel-heading"><div><h2>Submitted candidates</h2><p>Candidate records are visible only to your organization.</p></div><span class="assignment-key">${icon("lock", 15)} Organization-scoped</span></div><form class="filter-toolbar" id="candidate-filters"><label class="search-field"><span class="visually-hidden">Search candidates</span>${icon("search", 17)}<input name="search" type="search" placeholder="Search candidate or job" /></label><label><span class="visually-hidden">Candidate status</span><select name="status"><option value="">All statuses</option><option>Submitted</option><option>Under Review</option><option>Shortlisted</option><option>Interview</option><option>Offer</option><option>Hired</option><option>Rejected</option></select></label></form><div id="candidate-list">${loadingBlock("Loading candidates")}</div></section>`;
    const form = container.querySelector("#candidate-filters");
    form.addEventListener("input", () => render().catch((error) => { container.querySelector("#candidate-list").innerHTML = emptyState({ title: "Candidates are unavailable", message: error.message }); }));
    form.addEventListener("change", () => render().catch((error) => { container.querySelector("#candidate-list").innerHTML = emptyState({ title: "Candidates are unavailable", message: error.message }); }));
    await render();
  },
};

export const candidateDetailPage = (candidateId) => ({
  title: "Candidate",
  description: "Candidate profile and submission history available to your organization.",
  initial: loadingBlock("Loading candidate"),
  async load(container, api) {
    try {
      const candidate = await api.getCandidate(candidateId);
      const applications = Array.isArray(candidate.applications) ? candidate.applications : [];
      container.innerHTML = `<section class="panel"><div class="panel-heading"><div><a class="row-action" href="#/candidates">← Back to candidates</a><h2>${escapeHtml(candidate.name || [candidate.firstName, candidate.lastName].filter(Boolean).join(" "))}</h2><p>${escapeHtml(candidate.email || "")}</p></div></div><div class="detail-grid"><div><strong>Phone</strong><span>${escapeHtml(candidate.phone || "—")}</span></div><div><strong>Location</strong><span>${escapeHtml(candidate.location || "—")}</span></div><div><strong>Current title</strong><span>${escapeHtml(candidate.currentTitle || "—")}</span></div><div><strong>Experience</strong><span>${candidate.yearsExperience != null ? escapeHtml(String(candidate.yearsExperience)) + " years" : "—"}</span></div><div><strong>LinkedIn</strong><span>${candidate.linkedinUrl ? `<a href="${escapeHtml(candidate.linkedinUrl)}" target="_blank" rel="noreferrer">Profile</a>` : "—"}</span></div></div></section><section class="panel"><div class="panel-heading"><div><h2>Submission history</h2><p>Jobs this candidate has been submitted to.</p></div></div>${applications.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Job</th><th>Submitted</th><th>Status</th></tr></thead><tbody>${applications.map((application) => `<tr><td class="table-primary">${escapeHtml(application.jobTitle || "—")}</td><td>${escapeHtml(application.submittedAt || application.createdAt || "—")}</td><td>${statusBadge(application.status || "Submitted")}</td></tr>`).join("")}</tbody></table></div>` : emptyState({ title: "No submissions", message: "This candidate has no accessible submissions." })}</section>`;
    } catch (error) {
      container.innerHTML = emptyState({ title: "Candidate is unavailable", message: error.message || "Please try again." });
    }
  },
});
