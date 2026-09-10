import { clientName, emptyState, escapeHtml, formatDate, loadingBlock, statusBadge } from "../components/ui.js";

export const dashboardPage = {
  title: "Dashboard",
  description: "A clear view of the searches and candidate activity Headsbase has shared with your organization.",
  initial: loadingBlock("Loading your recruiter workspace"),
  async load(container, api) {
    const dashboard = await api.getDashboard();
    container.innerHTML = `
      <section class="metrics-grid" aria-label="Recruiter workspace metrics">
        ${dashboard.metrics.map((metric) => `<article class="metric"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong><small>${escapeHtml(metric.detail)}</small></article>`).join("")}
      </section>
      <section class="workspace-grid">
        <article class="panel recent-jobs-panel">
          <div class="panel-heading"><div><h2>Recent jobs</h2><p>Jobs shared with your organization or assigned to you.</p></div><a class="text-link" href="#/jobs">View all jobs</a></div>
          ${dashboard.jobs.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Job</th><th>Location</th><th>Priority</th><th>Assigned</th><th>Candidates</th><th>Status</th></tr></thead><tbody>${dashboard.jobs.map((job) => `<tr><td><a class="table-primary-link" href="#/jobs/${encodeURIComponent(job.id)}">${escapeHtml(job.title)}</a><small>${escapeHtml(clientName(job))}</small></td><td>${escapeHtml(job.location)}</td><td><span class="priority ${job.priority.toLowerCase()}">${escapeHtml(job.priority)}</span></td><td>${formatDate(job.assignedAt, { month: "short", day: "numeric" })}</td><td>${job.candidatesSubmitted}</td><td>${statusBadge(job.status)}</td></tr>`).join("")}</tbody></table></div>` : emptyState({ title: "No jobs assigned yet", message: "Headsbase will share roles here when your organization has been granted access.", actionLabel: "Review your profile", actionRoute: "/profile" })}
        </article>
        <article class="panel activity-panel">
          <div class="panel-heading"><div><h2>Recent activity</h2><p>Updates related to your shared work.</p></div></div>
          ${dashboard.activity.length ? `<ol class="activity-list">${dashboard.activity.map((activity) => `<li><span class="activity-dot"></span><div><strong>${escapeHtml(activity.title)}</strong><p>${escapeHtml(activity.detail)}</p></div><time>${escapeHtml(activity.when)}</time></li>`).join("")}</ol>` : emptyState({ title: "No activity yet", message: "When Headsbase shares a job or reviews a submission, updates will appear here." })}
        </article>
      </section>`;
  },
};
