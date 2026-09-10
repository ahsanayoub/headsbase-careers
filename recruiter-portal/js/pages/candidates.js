import { emptyState, escapeHtml, icon, loadingBlock, statusBadge } from "../components/ui.js";

function candidatesTable(items) {
  if (!items.length) return emptyState({ title: "No candidates yet", message: "Candidate records will appear after secure submission through the HTN API is enabled." });
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Candidate</th><th>Job</th><th>Submitted</th><th>Status</th><th>Last activity</th><th></th></tr></thead><tbody>${items.map((candidate) => `<tr><td class="table-primary">${escapeHtml(candidate.name)}</td><td>${escapeHtml(candidate.job)}</td><td>${escapeHtml(candidate.submitted)}</td><td>${statusBadge(candidate.status)}</td><td>${escapeHtml(candidate.activity)}</td><td><button class="row-action" type="button" disabled title="Candidate detail will be enabled with submission integration">View</button></td></tr>`).join("")}</tbody></table></div>`;
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
