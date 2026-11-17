import { createRecruiterGateway } from "./api/gateway.js?v=20261117partner1";
import { AuthStore, isWorkspaceReady } from "./auth/auth-store.js?v=20261117partner1";
import { forgotPasswordView, loginView, onboardingView, resetPasswordView, signupView, verifyEmailView } from "./auth/auth-views.js?v=20261117partner1";
import { errorState, loadingBlock } from "./components/ui.js?v=20261117partner1";
import { notificationsPanel, workspaceLayout } from "./layouts/workspace-layout.js?v=20261117partner1";
import { candidateDetailPage, candidatesPage } from "./pages/candidates.js?v=20261117partner1";
import { dashboardPage } from "./pages/dashboard.js?v=20261117partner1";
import { helpPage } from "./pages/help.js?v=20261117partner1";
import { jobDetailPage, jobsPage } from "./pages/jobs.js?v=20261117partner1";
import { profilePage } from "./pages/profile.js?v=20261117partner1";
import { submissionsPage } from "./pages/submissions.js?v=20261117partner1";
import { Router } from "./router.js?v=20261117partner1";

const root = document.querySelector("#portal-root");
let api = null;
let auth = null;
let configurationError = null;
try {
  api = createRecruiterGateway();
  auth = new AuthStore(api);
} catch (error) {
  configurationError = error;
}

let renderVersion = 0;
let onboardingStep = 0;
let notificationState = { items: [], unreadCount: 0, loaded: false };
const pages = {
  dashboard: dashboardPage,
  jobs: jobsPage,
  candidates: candidatesPage,
  submissions: submissionsPage,
  profile: profilePage,
  help: helpPage,
};
const router = new Router((route) => renderRoute(route));

function protectedDestination(session) {
  if (!session) return "/login";
  if (!session.user?.emailVerified) return "/verify-email";
  return "/dashboard";
}

function queryToken() {
  const fromHash = window.location.hash.includes("?")
    ? new URLSearchParams(window.location.hash.split("?")[1]).get("token")
    : null;
  return fromHash || new URLSearchParams(window.location.search).get("token") || "";
}

function renderAuth(route) {
  if (route.name === "login") root.innerHTML = loginView({});
  else if (route.name === "signup") root.innerHTML = signupView();
  else if (route.name === "forgot-password") root.innerHTML = forgotPasswordView();
  else if (route.name === "reset-password") root.innerHTML = resetPasswordView(queryToken());
  else if (route.name === "verify-email") root.innerHTML = verifyEmailView(auth.session, queryToken());
  else if (route.name === "onboarding") root.innerHTML = onboardingView(auth.session, onboardingStep);
}

function updateNotificationDot() {
  const dot = document.querySelector("[data-notification-dot]");
  if (!dot) return;
  if (notificationState.unreadCount > 0) dot.removeAttribute("hidden");
  else dot.setAttribute("hidden", "");
}

async function refreshNotifications({ renderPanel = false } = {}) {
  if (!api || !auth?.session) return notificationState;
  try {
    const payload = await api.getNotifications({ limit: 20 });
    notificationState = { ...payload, loaded: true };
    updateNotificationDot();
    if (renderPanel) {
      const slot = document.querySelector("#notifications-slot");
      if (slot && !slot.hidden) slot.innerHTML = notificationsPanel(notificationState);
    }
  } catch (error) {
    if (renderPanel) {
      const slot = document.querySelector("#notifications-slot");
      if (slot) slot.innerHTML = notificationsPanel({ error: error.message || "Unable to load notifications." });
    }
  }
  return notificationState;
}

function closeNotificationsPanel() {
  const slot = document.querySelector("#notifications-slot");
  const button = document.querySelector('[data-action="toggle-notifications"]');
  if (slot) slot.hidden = true;
  if (button) button.setAttribute("aria-expanded", "false");
}

async function openNotificationsPanel() {
  const slot = document.querySelector("#notifications-slot");
  const button = document.querySelector('[data-action="toggle-notifications"]');
  if (!slot || !button) return;
  slot.hidden = false;
  button.setAttribute("aria-expanded", "true");
  slot.innerHTML = notificationsPanel({ loading: true });
  await refreshNotifications({ renderPanel: true });
}

async function renderRoute(route) {
  const version = ++renderVersion;
  const session = auth.session;
  if (!route) {
    router.navigate(protectedDestination(session), { replace: true });
    return;
  }
  if (route.protected && !isWorkspaceReady(session)) {
    router.navigate(protectedDestination(session), { replace: true });
    return;
  }
  if (route.requiresSession && !session) {
    router.navigate("/login", { replace: true });
    return;
  }
  if (route.name === "verify-email" && session?.user?.emailVerified) {
    router.navigate("/dashboard", { replace: true });
    return;
  }
  if (route.name === "onboarding" && session?.onboardingComplete) {
    router.navigate("/dashboard", { replace: true });
    return;
  }
  if (route.public) {
    if (["login", "signup", "forgot-password"].includes(route.name) && session && isWorkspaceReady(session)) {
      router.navigate("/dashboard", { replace: true });
      return;
    }
    renderAuth(route);
    return;
  }

  const page = route.name === "job-detail"
    ? jobDetailPage(route.params.jobId)
    : route.name === "candidate-detail"
      ? candidateDetailPage(route.params.candidateId)
      : pages[route.name];
  if (!page) {
    root.innerHTML = errorState({ title: "Page not found", message: "That workspace page is not available." });
    return;
  }

  root.innerHTML = workspaceLayout({ session, route, page, notifications: notificationState });
  refreshNotifications().catch(() => {});
  const target = document.querySelector("#portal-page-content");
  try {
    await page.load(target, api);
  } catch (error) {
    if (version !== renderVersion) return;
    target.innerHTML = errorState({
      title: "This workspace view is unavailable",
      message: error.message || "Please try again.",
    });
  }
}

function setAuthMessage(message, tone = "error") {
  const field = document.querySelector("#auth-message");
  if (!field) return;
  field.textContent = message;
  field.className = `form-message ${tone}`;
}

async function resendVerification(email) {
  const normalized = String(email || "").trim();
  if (!normalized) throw new Error("Enter your account email first, then request a new verification email.");
  await api.resendVerification(normalized);
  setAuthMessage("A new verification email has been sent. Please check your inbox and spam folder.", "success");
}

async function handleAuthForm(form) {
  const data = new FormData(form);
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    if (form.id === "login-form") {
      const session = await auth.login({ email: data.get("email"), password: data.get("password") });
      if (!session?.user?.emailVerified) {
        router.navigate("/verify-email");
        return;
      }
      router.navigate(protectedDestination(session));
    } else if (form.id === "signup-form") {
      const session = await auth.signup({
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
        organizationName: data.get("organizationName"),
      });
      router.navigate(session.user.emailVerified ? "/dashboard" : "/verify-email");
    } else if (form.id === "forgot-password-form") {
      await auth.requestPasswordReset(data.get("email"));
      setAuthMessage("If an account exists for that email, reset instructions have been sent.", "success");
    } else if (form.id === "verify-email-form") {
      const token = form.dataset.token || queryToken();
      if (!token) throw new Error("Open the verification link from your email to verify your account.");
      const session = await auth.verifyEmail(token);
      router.navigate(protectedDestination(session));
    } else if (form.id === "reset-password-form") {
      const token = form.dataset.token || queryToken();
      const password = String(data.get("password") || "");
      if (!token) throw new Error("This password reset link is missing its token.");
      if (password !== data.get("confirmPassword")) throw new Error("Passwords do not match.");
      await auth.resetPassword(token, password);
      router.navigate("/login");
    } else if (form.id === "onboarding-form") {
      const step = Number(form.dataset.step || 0);
      if (step === 1) await auth.updateSession({ user: { name: data.get("name"), phone: data.get("phone") } });
      if (step === onboardingStepsLength() - 1) {
        router.navigate("/dashboard");
        return;
      }
      onboardingStep = step + 1;
      renderAuth({ name: "onboarding" });
    }
  } catch (error) {
    setAuthMessage(error.message || "We could not complete that step.");
  } finally {
    submit.disabled = false;
  }
}

function onboardingStepsLength() {
  return 5;
}

root.addEventListener("submit", (event) => {
  const form = event.target;
  if (!["login-form", "signup-form", "forgot-password-form", "verify-email-form", "reset-password-form", "onboarding-form"].includes(form.id)) return;
  event.preventDefault();
  handleAuthForm(form);
});

root.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  const action = button?.dataset.action;
  if (!action) return;

  if (action === "toggle-account") {
    closeNotificationsPanel();
    const menu = document.querySelector("#account-popover");
    if (!menu) return;
    menu.hidden = !menu.hidden;
    document.querySelectorAll('[data-action="toggle-account"]').forEach((control) => {
      control.setAttribute("aria-expanded", String(!menu.hidden));
    });
  }

  if (action === "toggle-notifications") {
    const menu = document.querySelector("#account-popover");
    if (menu) menu.hidden = true;
    const slot = document.querySelector("#notifications-slot");
    if (!slot) return;
    if (slot.hidden) await openNotificationsPanel();
    else closeNotificationsPanel();
  }

  if (action === "mark-all-notifications-read") {
    button.disabled = true;
    try {
      await api.markAllNotificationsRead();
      await refreshNotifications({ renderPanel: true });
    } finally {
      button.disabled = false;
    }
  }

  if (action === "open-notification") {
    const notificationId = button.dataset.notificationId;
    const href = button.dataset.href || "";
    if (notificationId) {
      try {
        await api.markNotificationRead(notificationId);
        await refreshNotifications();
      } catch {
        // Navigation should still proceed even if mark-read fails.
      }
    }
    closeNotificationsPanel();
    if (href) {
      const hash = href.startsWith("#") ? href : `#${href.replace(/^\//, "")}`;
      router.navigate(hash.replace(/^#/, "") || "/dashboard");
    }
  }

  if (action === "logout") {
    await auth.logout();
    notificationState = { items: [], unreadCount: 0, loaded: false };
    router.navigate("/login");
  }

  if (action === "onboarding-back") {
    onboardingStep = Math.max(0, onboardingStep - 1);
    renderAuth({ name: "onboarding" });
  }

  if (action === "resend-verification") {
    try {
      const emailField = document.querySelector('#login-form input[name="email"]');
      const email = button.dataset.email || emailField?.value || auth.session?.user?.email || "";
      button.disabled = true;
      await resendVerification(email);
    } catch (error) {
      setAuthMessage(error.message || "We could not resend the verification email.");
    } finally {
      button.disabled = false;
    }
  }

  if (action === "retry") router.handle();
});

document.addEventListener("click", (event) => {
  if (event.target.closest('[data-action="toggle-notifications"], #notifications-slot, #notifications-panel')) return;
  closeNotificationsPanel();
});

window.addEventListener("portal:session-expired", () => {
  auth.clearExpiredSession();
  notificationState = { items: [], unreadCount: 0, loaded: false };
  router.navigate("/login");
  window.setTimeout(() => setAuthMessage("Your session expired. Please sign in again."), 0);
});

async function start() {
  if (configurationError) {
    root.innerHTML = `<div class="portal-boot">${errorState({
      title: "Portal configuration is required",
      message: configurationError.message,
      actionLabel: "",
    })}</div>`;
    return;
  }
  root.innerHTML = `<div class="portal-boot">${loadingBlock("Preparing secure workspace")}</div>`;
  await auth.hydrate();
  router.start();
}

start();
