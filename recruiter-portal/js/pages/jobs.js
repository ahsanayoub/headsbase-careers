import { clientName, emptyState, escapeHtml, formatDate, icon, loadingBlock, statusBadge } from "../components/ui.js";

function jobFilters() {
  return `<form class="filter-toolbar" id="jobs-filters" role="search">
    <label class="search-field"><span class="visually-hidden">Search shared jobs</span>${icon("search", 17)}<input name="search" type="search" placeholder="Search shared jobs" autocomplete="off" /></label>
    <label><span class="visually-hidden">Status</span><select name="status"><option value="">All statuses</option><option>New</option><option>Active</option><option>Paused</option><option>Closed</option></select></label>
    <label><span class="visually-hidden">Location</span><select name="location"><option value="">All locations</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
    <label><span class="visually-hidden">Assignment date</span><select name="assigned"><option value="">Any assignment date</option><option value="recent">Assigned in the last 7 days</option></select></label>
    <label><span class="visually-hidden">Sort</span><select name="sort"><option value="newest">Recently assigned</option><option value="priority">Priority</option><option value="oldest">Oldest assignment</option></select></label>
  </form>`;
}

function jobRows(items) {
  if (!items.length) return emptyState({ title: "No shared jobs match these filters", message: "Try a different search or clear your filters. Jobs only appear after Headsbase shares them with your organization." });
  return `<div class="table-scroll"><table class="data-table jobs-table"><thead><tr><th>Job</th><th>Location</th><th>Employment</th><th>Priority</th><th>Assigned</th><th>Candidates</th><th>Status</th></tr></thead><tbody>${items.map((job) => `<tr><td><a class="table-primary-link" href="#/jobs/${encodeURIComponent(job.id)}">${escapeHtml(job.title)}</a><small>${escapeHtml(clientName(job))}<span class="privacy-note">${escapeHtml(job.clientVisibility)}</span></small></td><td>${escapeHtml(job.location)}</td><td>${escapeHtml(job.employmentType)}</td><td><span class="priority ${job.priority.toLowerCase()}">${escapeHtml(job.priority)}</span></td><td>${formatDate(job.assignedAt)}</td><td>${job.candidatesSubmitted}</td><td>${statusBadge(job.status)}</td></tr>`).join("")}</tbody></table></div>`;
}

export const jobsPage = {
  title: "My Jobs",
  description: "Roles Headsbase has shared with your organization or assigned to you. This is not a view of the internal job inventory.",
  initial: loadingBlock("Loading shared jobs"),
  async load(container, api) {
    const render = async () => {
      const form = container.querySelector("#jobs-filters");
      const filters = form ? Object.fromEntries(new FormData(form).entries()) : { sort: "newest" };
      const result = await api.getJobs(filters);
      const listing = container.querySelector("#jobs-listing");
      if (listing) listing.innerHTML = `${jobRows(result.items)}<div class="pagination-ready"><span>Showing ${result.items.length} of ${result.pagination.total} shared jobs</span><span>Pagination is ready for the HTN API response.</span></div>`;
    };

    container.innerHTML = `<section class="panel jobs-workspace"><div class="panel-heading jobs-heading"><div><h2>Shared jobs</h2><p>Focus only on assignments that are available to your organization.</p></div><span class="assignment-key">${icon("lock", 15)} Access controlled by Headsbase</span></div>${jobFilters()}<div id="jobs-listing">${loadingBlock("Finding shared jobs")}</div></section>`;
    const form = container.querySelector("#jobs-filters");
    form.addEventListener("input", () => render().catch((error) => { container.querySelector("#jobs-listing").innerHTML = emptyState({ title: "Jobs are unavailable", message: error.message }); }));
    form.addEventListener("change", () => render().catch((error) => { container.querySelector("#jobs-listing").innerHTML = emptyState({ title: "Jobs are unavailable", message: error.message }); }));
    await render();
  },
};

function skillList(skills) {
  return `<div class="skill-list">${skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>`;
}

export function jobDetailPage(jobId) {
  return {
    title: "Job details",
    description: "Everything you need to work this Headsbase assignment responsibly.",
    initial: loadingBlock("Loading shared job details"),
    async load(container, api) {
      const job = await api.getJob(jobId);
      container.innerHTML = `<a class="back-link" href="#/jobs">${icon("arrowLeft", 17)} Back to my jobs</a><article class="job-detail"><header class="job-detail-hero"><div><p class="page-kicker">${escapeHtml(job.clientVisibility)}</p><h2>${escapeHtml(job.title)}</h2><p class="job-client">${escapeHtml(clientName(job))}</p><div class="detail-meta"><span>${escapeHtml(job.location)}</span><span>${escapeHtml(job.employmentType)}</span><span>${escapeHtml(job.experienceLevel)}</span></div></div><div class="job-detail-actions">${statusBadge(job.status)}<button class="button button-primary" type="button" data-action="open-submission-shell">${icon("plus", 17)} Submit candidate</button></div></header><div class="job-detail-body"><section><h3>About the role</h3><p>${escapeHtml(job.description)}</p></section><section class="detail-facts"><div><span>Priority</span><strong class="priority ${job.priority.toLowerCase()}">${escapeHtml(job.priority)}</strong></div><div><span>Date assigned</span><strong>${formatDate(job.assignedAt)}</strong></div><div><span>Compensation</span><strong>${escapeHtml(job.compensation)}</strong></div><div><span>Candidates submitted</span><strong>${job.candidatesSubmitted}</strong></div></section><section><h3>Required skills</h3>${skillList(job.requiredSkills)}</section><section><h3>Preferred skills</h3>${skillList(job.preferredSkills)}</section><section class="instructions-section"><h3>Recruiter instructions</h3><p>${escapeHtml(job.instructions)}</p></section><section><h3>Submission expectations</h3><p>${escapeHtml(job.expectations)}</p></section></div></article><dialog class="submission-dialog" id="submission-dialog"><form method="dialog" class="dialog-card" id="submission-shell"><div class="dialog-heading"><div><p class="page-kicker">Candidate submission</p><h2>Prepare a submission</h2><p>Candidate submission is intentionally not connected to the HTN API in this phase.</p></div><button class="icon-control" value="cancel" aria-label="Close dialog">×</button></div><label>Candidate name<input disabled placeholder="Submission integration pending" /></label><label>Candidate email<input disabled placeholder="Submission integration pending" /></label><label>Resume<input disabled type="file" /></label><p class="pending-callout">No candidate information entered here will be stored or sent. The secure submission workflow will be enabled after the HTN API contract is available.</p><div class="dialog-actions"><button class="button button-secondary" value="cancel">Close</button><button class="button button-primary" type="button" disabled>Submission integration pending</button></div></form></dialog>`;
      const dialog = container.querySelector("#submission-dialog");
      container.querySelector('[data-action="open-submission-shell"]').addEventListener("click", () => dialog.showModal());
    },
  };
}
