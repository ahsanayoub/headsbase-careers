import { emptyState, escapeHtml, icon, loadingBlock, statusBadge } from "../components/ui.js";

function submissionTable(items) {
  if (!items.length) return emptyState({ title: "No submissions yet", message: "When candidate submission is connected to HTN, you’ll be able to track each submission and its next step here." });
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Candidate</th><th>Job</th><th>Submitted</th><th>Status</th><th>Latest feedback</th><th>Next action</th></tr></thead><tbody>${items.map((submission) => `<tr><td class="table-primary">${escapeHtml(submission.candidate)}</td><td>${escapeHtml(submission.job)}</td><td>${escapeHtml(submission.submitted)}</td><td>${statusBadge(submission.status)}</td><td>${escapeHtml(submission.feedback)}</td><td>${escapeHtml(submission.nextAction)}</td></tr>`).join("")}</tbody></table></div>`;
}

export const submissionsPage = {
  title: "Submissions",
  description: "Follow submitted candidates, Headsbase feedback, and the next action without exposing internal recruiting operations.",
  initial: loadingBlock("Loading submissions"),
  async load(container, api) {
    const render = async () => {
      const form = container.querySelector("#submission-filters");
      const result = await api.getSubmissions(Object.fromEntries(new FormData(form).entries()));
      container.querySelector("#submission-list").innerHTML = submissionTable(result.items);
    };
    container.innerHTML = `<section class="panel"><div class="panel-heading"><div><h2>Candidate submissions</h2><p>External-facing progress and feedback for your organization.</p></div></div><form class="filter-toolbar" id="submission-filters"><label class="search-field"><span class="visually-hidden">Search submissions</span>${icon("search", 17)}<input name="search" type="search" placeholder="Search candidate or job" /></label><label><span class="visually-hidden">Submission status</span><select name="status"><option value="">All statuses</option><option>Submitted</option><option>Under Review</option><option>Shortlisted</option><option>Interview</option><option>Offer</option><option>Hired</option><option>Rejected</option></select></label></form><div id="submission-list">${loadingBlock("Loading submissions")}</div></section>`;
    const form = container.querySelector("#submission-filters");
    form.addEventListener("input", () => render().catch((error) => { container.querySelector("#submission-list").innerHTML = emptyState({ title: "Submissions are unavailable", message: error.message }); }));
    form.addEventListener("change", () => render().catch((error) => { container.querySelector("#submission-list").innerHTML = emptyState({ title: "Submissions are unavailable", message: error.message }); }));
    await render();
  },
};
