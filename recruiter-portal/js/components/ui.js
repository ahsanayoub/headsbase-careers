const iconPaths = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  briefcase: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14.5a4.7 4.7 0 0 1 3.5 5.5"/>',
  send: '<path d="m21 3-7 18-4-8-7-4 18-6Z"/><path d="m10 13 4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55v.09h-3v-.09a1.7 1.7 0 0 0-1.03-1.55A1.7 1.7 0 0 0 8.8 19l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.55-1.03h-.09v-3h.09A1.7 1.7 0 0 0 7 9.94a1.7 1.7 0 0 0-.34-1.88L6.6 8 8.72 5.9l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.55v-.09h3v.09a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03h.09v3h-.09A1.7 1.7 0 0 0 19.4 15Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.6 1.9c-1.25 1.1-2.1 1.55-2.1 3.1"/><path d="M12 17h.01"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  arrowLeft: '<path d="m15 18-6-6 6-6M9 12h11"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  external: '<path d="M14 3h7v7M21 3l-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};

export function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || ""}</svg>`;
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

export function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, options).format(new Date(`${value}T12:00:00`));
}

export function initials(name = "") {
  return String(name).split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "RP";
}

export function statusBadge(value) {
  const tone = String(value || "").toLowerCase().replace(/\s+/g, "-");
  return `<span class="status-badge ${tone}">${escapeHtml(value)}</span>`;
}

export function loadingBlock(label = "Loading workspace") {
  return `<section class="content-state loading-state" aria-busy="true"><span class="spinner" aria-hidden="true"></span><p>${escapeHtml(label)}…</p></section>`;
}

export function emptyState({ title, message, actionLabel, actionRoute } = {}) {
  return `<section class="content-state empty-state"><div class="empty-mark">${icon("briefcase", 24)}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${actionLabel ? `<a class="button button-secondary" href="#${escapeHtml(actionRoute || "/dashboard")}">${escapeHtml(actionLabel)}</a>` : ""}</section>`;
}

export function errorState({ title = "Something needs attention", message, actionLabel = "Try again" } = {}) {
  return `<section class="content-state error-state"><div class="empty-mark">${icon("help", 24)}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><button class="button button-secondary" type="button" data-action="retry">${escapeHtml(actionLabel)}</button></section>`;
}

export function clientName(job) {
  return job.clientVisibility?.startsWith("Client identity") ? "Confidential client" : job.client;
}
