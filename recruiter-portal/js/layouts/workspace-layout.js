import { escapeHtml, icon, initials } from "../components/ui.js";

const navigation = [
  ["/dashboard", "Dashboard", "dashboard"],
  ["/jobs", "My Jobs", "briefcase"],
  ["/candidates", "Candidates", "users"],
  ["/submissions", "Submissions", "send"],
  ["/profile", "Profile / Organization", "settings"],
  ["/help", "Help", "help"],
];

export function workspaceLayout({ session, route, page }) {
  const user = session.user;
  const organization = session.organization;
  const activePath = route.name === "job-detail" ? "/jobs" : route.pattern;

  return `
    <div class="portal-shell">
      <aside class="portal-sidebar" aria-label="Recruiter navigation">
        <a class="portal-brand" href="#/dashboard" aria-label="Headsbase recruiter portal home">
          <img src="../htn.svg" alt="Headsbase Talent Network" />
          <span>Recruiter portal</span>
        </a>
        <nav class="portal-nav">
          ${navigation.map(([path, label, iconName]) => `
            <a class="portal-nav-link ${activePath === path ? "is-active" : ""}" href="#${path}">
              ${icon(iconName)}<span>${label}</span>
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
            <button class="icon-control" type="button" aria-label="Notifications" title="Notifications coming soon">${icon("bell", 19)}<span class="notification-dot" aria-hidden="true"></span></button>
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
