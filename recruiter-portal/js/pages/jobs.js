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
  return `<div class="table-scroll"><table class="data-table jobs-table"><thead><tr><th>Job</th><th>Location</th><th>Employment</th><th>Priority</th><th>Assigned</th><th>Candidates</th><th>Status</th></tr></thead><tbody>${items.map((job) => `<tr><td><a class="table-primary-link" href="#/jobs/${encodeURIComponent(job.id)}">${escapeHtml(job.title)}</a><small>${escapeHtml(clientName(job))}<span class="privacy-note">${escapeHtml(job.clientVisibility)}</span></small></td><td>${escapeHtml(job.location)}</td><td>${escapeHtml(job.employmentType)}</td><td><span class="priority ${String(job.priority || "Standard").toLowerCase()}">${escapeHtml(job.priority)}</span></td><td>${formatDate(job.assignedAt)}</td><td>${job.candidatesSubmitted}</td><td>${statusBadge(job.status)}</td></tr>`).join("")}</tbody></table></div>`;
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

function skillList(skills) { return `<div class="skill-list">${skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>`; }

function submissionDialog() {
  return `<dialog class="submission-dialog" id="submission-dialog"><form method="dialog" class="dialog-card" id="submission-form"><div class="dialog-heading"><div><p class="page-kicker">Candidate submission</p><h2>Submit a candidate</h2><p>Send a qualified candidate to Headsbase for this assignment.</p></div><button class="icon-control" value="cancel" aria-label="Close dialog">×</button></div><div class="form-grid"><label>First name<input name="firstName" required autocomplete="given-name" /></label><label>Last name<input name="lastName" required autocomplete="family-name" /></label><label>Candidate email<input name="email" type="email" required autocomplete="email" /></label><label>Phone<input name="phone" type="tel" autocomplete="tel" /></label><label>Current title<input name="currentTitle" /></label><label>Current company<input name="currentCompany" /></label><label>Years of experience<input name="yearsExperience" type="number" min="0" step="0.5" /></label><label>Location<input name="location" /></label><label>LinkedIn URL<input name="linkedinUrl" type="url" /></label><label>Desired salary<input name="desiredSalary" type="number" min="0" step="1" /></label><label class="full-width">Additional notes<textarea name="additionalNotes" rows="4" placeholder="Why is this candidate a strong fit?"></textarea></label><label class="full-width">Resume <input name="resume" type="file" accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" required /><small>PDF, DOC or DOCX. Maximum 10 MB.</small></label></div><div id="submission-error" class="form-error" hidden></div><div id="submission-success" class="pending-callout" hidden></div><div class="dialog-actions"><button class="button button-secondary" value="cancel">Cancel</button><button class="button button-primary" id="submit-candidate" type="submit">Submit candidate</button></div></form></dialog>`;
}

export function jobDetailPage(jobId) {
  return {
    title: "Job details",
    description: "Everything you need to work this Headsbase assignment responsibly.",
    initial: loadingBlock("Loading shared job details"),
    async load(container, api) {
      const job = await api.getJob(jobId);
      container.innerHTML = `<a class="back-link" href="#/jobs">${icon("arrowLeft", 17)} Back to my jobs</a><article class="job-detail"><header class="job-detail-hero"><div><p class="page-kicker">${escapeHtml(job.clientVisibility)}</p><h2>${escapeHtml(job.title)}</h2><p class="job-client">${escapeHtml(clientName(job))}</p><div class="detail-meta"><span>${escapeHtml(job.location)}</span><span>${escapeHtml(job.employmentType)}</span><span>${escapeHtml(job.experienceLevel)}</span></div></div><div class="job-detail-actions">${statusBadge(job.status)}<button class="button button-primary" type="button" data-action="open-submission-shell">${icon("plus", 17)} Submit candidate</button></div></header><div class="job-detail-body"><section><h3>About the role</h3><p>${escapeHtml(job.description)}</p></section><section class="detail-facts"><div><span>Priority</span><strong class="priority ${String(job.priority || "Standard").toLowerCase()}">${escapeHtml(job.priority)}</strong></div><div><span>Date assigned</span><strong>${formatDate(job.assignedAt)}</strong></div><div><span>Compensation</span><strong>${escapeHtml(job.compensation)}</strong></div><div><span>Candidates submitted</span><strong>${job.candidatesSubmitted}</strong></div></section><section><h3>Required skills</h3>${skillList(job.requiredSkills)}</section><section><h3>Preferred skills</h3>${skillList(job.preferredSkills)}</section><section class="instructions-section"><h3>Recruiter instructions</h3><p>${escapeHtml(job.instructions)}</p></section><section><h3>Submission expectations</h3><p>${escapeHtml(job.expectations)}</p></section></div></article>${submissionDialog()}`;
      const dialog = container.querySelector("#submission-dialog");
      const form = container.querySelector("#submission-form");
      const submitButton = container.querySelector("#submit-candidate");
      const errorBox = container.querySelector("#submission-error");
      const successBox = container.querySelector("#submission-success");
      container.querySelector('[data-action="open-submission-shell"]').addEventListener("click", () => { errorBox.hidden = true; successBox.hidden = true; form.reset(); dialog.showModal(); });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorBox.hidden = true; successBox.hidden = true; submitButton.disabled = true; submitButton.textContent = "Submitting…";
        try {
          const data = Object.fromEntries(new FormData(form).entries());
          const file = data.resume;
          if (!(file instanceof File) || !file.size) throw new Error("Please attach the candidate's resume.");
          if (file.size > 10 * 1024 * 1024) throw new Error("Resume must be 10 MB or smaller.");
          const upload = await api.uploadResume(file);
          const result = await api.submitCandidate({ jobId: job.id, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, currentTitle: data.currentTitle, currentCompany: data.currentCompany, yearsExperience: data.yearsExperience ? Number(data.yearsExperience) : undefined, location: data.location, linkedinUrl: data.linkedinUrl, desiredSalary: data.desiredSalary ? Number(data.desiredSalary) : undefined, additionalNotes: data.additionalNotes, resume: upload });
          successBox.textContent = `Candidate submitted successfully. Submission ID: ${result.submissionId || result.applicationId || "created"}.`;
          successBox.hidden = false;
          submitButton.textContent = "Submitted";
          setTimeout(() => dialog.close(), 1600);
        } catch (error) {
          errorBox.textContent = error?.message || "Unable to submit candidate.";
          errorBox.hidden = false;
          submitButton.disabled = false;
          submitButton.textContent = "Submit candidate";
        }
      });
    },
  };
}
