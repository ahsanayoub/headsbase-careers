import { escapeHtml, formatDate, icon, initials } from "../components/ui.js?v=20261116nav1";

const navigation = [
  ["/dashboard", "Dashboard", "dashboard", "Dashboard"],
  ["/jobs", "My Jobs", "briefcase", "Jobs"],
  ["/candidates", "Candidates", "users", "Candidates"],
  ["/submissions", "Submissions", "send", "Submissions"],
  ["/profile", "Profile / Organization", "settings", "Profile"],
  ["/help", "Help", "help", "Help"],
];

function notificationWhen(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw) || Number.isFinite(Date.parse(raw))) {
    return formatDate(raw, { month: "short", day: "numeric" });
  }
  return raw;
}

export function notificationsPanel({ items = [], unreadCount = 0, loading = false, error = "" } = {}) {
  if (loading) {
    return `<div class="notifications-panel" id="notifications-panel" role="dialog" aria-label="Notifications"><div class="notifications-heading"><strong>Notifications</strong></div><p class="notifications-empty">Loading updates…</p></div>`;
  }
  if (error) {
    return `<div class="notifications-panel" id="notifications-panel" role="dialog" aria-label="Notifications"><div class="notifications-heading"><strong>Notifications</strong></div><p class="notifications-empty">${escapeHtml(error)}</p></div>`;
  }
  return `<div class="notifications-panel" id="notifications-panel" role="dialog" aria-label="Notifications">
    <div class="notifications-heading">
      <div><strong>Notifications</strong><small>${unreadCount ? `${unreadCount} unread` : "You're up to date"}</small></div>
      ${items.length ? `<button type="button" class="text-link" data-action="mark-all-notifications-read">Mark all read</button>` : ""}
    </div>
    ${items.length
      ? `<ul class="notifications-list">${items.map((item) => `
        <li class="${item.unread ? "is-unread" : ""}">
          <button type="button" class="notification-item" data-action="open-notification" data-notification-id="${escapeHtml(item.id)}" data-href="${escapeHtml(item.href || "")}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.detail)}</span>
            <time>${escapeHtml(notificationWhen(item.createdAt))}</time>
          </button>
        </li>`).join("")}</ul>`
      : `<p class="notifications-empty">No notifications yet. Job assignments and submission updates will appear here.</p>`}
  </div>`;
}

export function workspaceLayout({ session, route, page, notifications = { items: [], unreadCount: 0 } }) {
  const user = session.user;
  const organization = session.organization;
  const activePath = route.name === "job-detail" ? "/jobs" : route.pattern;
  const unreadCount = Number(notifications.unreadCount || 0);

  return `
    <div class="portal-shell">
      <aside class="portal-sidebar" aria-label="Recruiter navigation">
        <a class="portal-brand" href="#/dashboard" aria-label="Headsbase recruiter portal home">
          <img src="../htn.svg" alt="Headsbase Talent Network" />
          <span>Recruiter portal</span>
        </a>
        <nav class="portal-nav" aria-label="Primary">
          ${navigation.map(([path, label, iconName, shortLabel]) => `
            <a class="portal-nav-link ${activePath === path ? "is-active" : ""}" href="#${path}" title="${escapeHtml(label)}">
              ${icon(iconName)}
              <span class="nav-label-full">${escapeHtml(label)}</span>
              <span class="nav-label-short">${escapeHtml(shortLabel || label)}</span>
            </a>`).join("")}
        </nav>
        <div class="sidebar-account">
          <button class="sidebar-account-button" type="button" data-action="toggle-account" aria-expanded="false">
            <span class="avatar avatar-small">${initials(user.name)}</span>
            <span class="sidebar-account-copy"><strong>${escapeHtml(organization.name)}</strong><small>${escapeHtml(user.name)}</small></span>
            <span class="sidebar-account-chevron">⌄</span>
          </button>
          <div class="account-popover" id="account-popover" hidden>
            <p>${escapeHtml(user.email)}</p>
            <a href="#/profile">Profile &amp; organization</a>
            <button type="button" data-action="logout">${icon("logout", 16)} Log out</button>
          </div>
        </div>
      </aside>
      <div class="portal-workspace">
        <header class="portal-header">
          <div>
            <p class="page-kicker">Headsbase partner workspace</p>
            <h1>${escapeHtml(page.title)}</h1>
            <p class="page-description">${escapeHtml(page.description)}</p>
          </div>
          <div class="header-actions">
            <div class="notifications-anchor">
              <button class="icon-control" type="button" data-action="toggle-notifications" aria-label="Notifications" aria-expanded="false" aria-controls="notifications-panel" title="Notifications">
                ${icon("bell", 19)}
                <span class="notification-dot" data-notification-dot ${unreadCount > 0 ? "" : "hidden"} aria-hidden="true"></span>
              </button>
              <div id="notifications-slot" hidden></div>
            </div>
            <button class="avatar account-trigger" type="button" data-action="toggle-account" aria-label="Open account menu">${initials(user.name)}</button>
          </div>
        </header>
        <main id="portal-main" class="portal-main" tabindex="-1">
          <div id="portal-page-content">${page.initial}</div>
        </main>
      </div>
      <div id="portal-toast" class="portal-toast" role="status" aria-live="polite"></div>
    </div>`;
}
