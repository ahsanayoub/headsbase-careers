import { clientName, emptyState, escapeHtml, formatDate, loadingBlock, statusBadge } from "../components/ui.js?v=20261117partner1";

function activityWhen(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw) || Number.isFinite(Date.parse(raw))) {
    return formatDate(raw, { month: "short", day: "numeric" });
  }
  return raw;
}

function humanizeActivityDetail(value) {
  return String(value || "").replace(/\b([A-Z]{2,}(?:_[A-Z]+)*)\b/g, (match) =>
    match
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  );
}

function recentJobsList(jobs) {
  return `<ul class="recent-jobs-list">${jobs.map((job) => {
    const meta = [
      job.location && job.location !== "Not specified" ? job.location : "",
      formatDate(job.assignedAt, { month: "short", day: "numeric" }),
      `${job.candidatesSubmitted} candidate${Number(job.candidatesSubmitted) === 1 ? "" : "s"}`,
    ].filter(Boolean);
    return `<li>
      <div class="recent-job-copy">
        <a class="table-primary-link" href="#/jobs/${encodeURIComponent(job.id)}">${escapeHtml(job.title)}</a>
        <small>${escapeHtml(clientName(job))}</small>
        <p class="recent-job-meta">${meta.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}</p>
      </div>
      <div class="recent-job-aside">
        <span class="priority ${String(job.priority || "Standard").toLowerCase()}">${escapeHtml(job.priority || "Standard")}</span>
        ${statusBadge(job.status)}
      </div>
    </li>`;
  }).join("")}</ul>`;
}

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
          ${dashboard.jobs.length
            ? recentJobsList(dashboard.jobs)
            : emptyState({ title: "No jobs assigned yet", message: "Headsbase will share roles here when your organization has been granted access.", actionLabel: "Review your profile", actionRoute: "/profile" })}
        </article>
        <article class="panel activity-panel">
          <div class="panel-heading"><div><h2>Recent activity</h2><p>Updates related to your shared work.</p></div></div>
          ${dashboard.activity.length
            ? `<ol class="activity-list">${dashboard.activity.map((activity) => `<li><span class="activity-dot"></span><div><strong>${escapeHtml(activity.title)}</strong><p>${escapeHtml(humanizeActivityDetail(activity.detail))}</p></div><time>${escapeHtml(activityWhen(activity.when))}</time></li>`).join("")}</ol>`
            : emptyState({ title: "No activity yet", message: "When Headsbase shares a job or reviews a submission, updates will appear here." })}
        </article>
      </section>`;
  },
};
