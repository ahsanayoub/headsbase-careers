const routes = [
  { pattern: "/login", name: "login", public: true },
  { pattern: "/signup", name: "signup", public: true },
  { pattern: "/forgot-password", name: "forgot-password", public: true },
  { pattern: "/verify-email", name: "verify-email", public: true, requiresSession: true },
  { pattern: "/onboarding", name: "onboarding", public: true, requiresSession: true },
  { pattern: "/dashboard", name: "dashboard", protected: true },
  { pattern: "/jobs", name: "jobs", protected: true },
  { pattern: "/jobs/:jobId", name: "job-detail", protected: true },
  { pattern: "/candidates", name: "candidates", protected: true },
  { pattern: "/submissions", name: "submissions", protected: true },
  { pattern: "/profile", name: "profile", protected: true },
  { pattern: "/help", name: "help", protected: true },
];

function decodeHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/dashboard";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function matchRoute(path) {
  const pathParts = path.split("/").filter(Boolean);
  for (const route of routes) {
    const parts = route.pattern.split("/").filter(Boolean);
    if (parts.length !== pathParts.length) continue;
    const params = {};
    const matches = parts.every((part, index) => {
      if (!part.startsWith(":")) return part === pathParts[index];
      params[part.slice(1)] = decodeURIComponent(pathParts[index]);
      return true;
    });
    if (matches) return { ...route, path, params };
  }
  return null;
}

export class Router {
  constructor(onRoute) {
    this.onRoute = onRoute;
  }

  start() {
    window.addEventListener("hashchange", () => this.handle());
    this.handle();
  }

  handle() {
    const route = matchRoute(decodeHash());
    this.onRoute(route);
  }

  navigate(path, { replace = false } = {}) {
    const hash = `#${path}`;
    if (window.location.hash === hash) return this.handle();
    if (replace) {
      window.history.replaceState(null, "", hash);
      this.handle();
    } else {
      window.location.hash = hash;
    }
  }
}

export function routeFor(path) {
  return matchRoute(path);
}
