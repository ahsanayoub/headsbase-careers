import { createRecruiterGateway } from "./api/gateway.js";
import { AuthStore, isWorkspaceReady } from "./auth/auth-store.js";
import { forgotPasswordView, loginView, onboardingView, signupView, verifyEmailView } from "./auth/auth-views.js";
import { errorState, loadingBlock } from "./components/ui.js";
import { workspaceLayout } from "./layouts/workspace-layout.js";
import { candidatesPage } from "./pages/candidates.js";
import { dashboardPage } from "./pages/dashboard.js";
import { helpPage } from "./pages/help.js";
import { jobDetailPage, jobsPage } from "./pages/jobs.js";
import { profilePage } from "./pages/profile.js";
import { submissionsPage } from "./pages/submissions.js";
import { Router } from "./router.js";

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

const pages = {
  dashboard: dashboardPage,
  jobs: jobsPage,
  candidates: candidatesPage,
  submissions: submissionsPage,
  profile: profilePage,
  help: helpPage,
};

const router = new Router((route) => renderRoute(route));

function showToast(message) {
  const toast = document.querySelector("#portal-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
}

function protectedDestination(session) {
  if (!session) return "/login";
  if (!session.user?.emailVerified) return "/verify-email";
  if (!session.onboardingComplete) return "/onboarding";
  return "/dashboard";
}

function renderAuth(route, message) {
  if (route.name === "login") root.innerHTML = loginView({ message });
  else if (route.name === "signup") root.innerHTML = signupView();
  else if (route.name === "forgot-password") root.innerHTML = forgotPasswordView();
  else if (route.name === "verify-email") root.innerHTML = verifyEmailView(auth.session);
  else if (route.name === "onboarding") root.innerHTML = onboardingView(auth.session, onboardingStep);
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
    router.navigate(session.onboardingComplete ? "/dashboard" : "/onboarding", { replace: true });
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

  const page = route.name === "job-detail" ? jobDetailPage(route.params.jobId) : pages[route.name];
  root.innerHTML = workspaceLayout({ session, route, page });
  const target = document.querySelector("#portal-page-content");
  try {
    await page.load(target, api);
  } catch (error) {
    if (version !== renderVersion) return;
    target.innerHTML = errorState({ title: "This workspace view is unavailable", message: error.message || "Please try again." });
  }
}

function setAuthMessage(message, tone = "error") {
  const field = document.querySelector("#auth-message");
  if (!field) return;
  field.textContent = message;
  field.className = `form-message ${tone}`;
}

async function handleAuthForm(form) {
  const data = new FormData(form);
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    if (form.id === "login-form") {
      const session = await auth.login({ email: data.get("email"), password: data.get("password") });
      router.navigate(protectedDestination(session));
    }
    if (form.id === "signup-form") {
      const session = await auth.signup({ name: data.get("name"), email: data.get("email"), password: data.get("password"), organizationName: data.get("organizationName") });
      router.navigate(session.user.emailVerified ? "/onboarding" : "/verify-email");
    }
    if (form.id === "forgot-password-form") {
      await auth.requestPasswordReset(data.get("email"));
      setAuthMessage("If an account exists for that email, reset instructions have been sent.", "success");
    }
    if (form.id === "verify-email-form") {
      await auth.verifyEmail();
      router.navigate("/onboarding");
    }
    if (form.id === "onboarding-form") {
      const step = Number(form.dataset.step || 0);
      if (step === 0) await auth.updateSession({ organization: { name: data.get("organizationName"), website: data.get("website"), location: data.get("location"), primaryContact: data.get("primaryContact") } });
      if (step === 1) await auth.updateSession({ user: { name: data.get("name"), phone: data.get("phone") } });
      if (step === 2) await auth.updateSession({ organization: { specialization: data.get("specialization") } });
      if (step === 3) await auth.updateSession({ organization: { markets: data.get("markets") } });
      if (step === 4) {
        await auth.completeOnboarding();
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

root.addEventListener("submit", (event) => {
  const form = event.target;
  if (!["login-form", "signup-form", "forgot-password-form", "verify-email-form", "onboarding-form"].includes(form.id)) return;
  event.preventDefault();
  handleAuthForm(form);
});

root.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "toggle-account") {
    const menu = document.querySelector("#account-popover");
    if (!menu) return;
    menu.hidden = !menu.hidden;
    document.querySelectorAll('[data-action="toggle-account"]').forEach((button) => button.setAttribute("aria-expanded", String(!menu.hidden)));
  }
  if (action === "logout") {
    await auth.logout();
    router.navigate("/login");
  }
  if (action === "onboarding-back") {
    onboardingStep = Math.max(0, onboardingStep - 1);
    renderAuth({ name: "onboarding" });
  }
  if (action === "resend-verification") setAuthMessage("A new verification email would be sent from the HTN authentication service.", "success");
  if (action === "retry") router.handle();
});

window.addEventListener("portal:session-expired", () => {
  auth.clearExpiredSession();
  router.navigate("/login");
  window.setTimeout(() => setAuthMessage("Your session expired. Please sign in again."), 0);
});

async function start() {
  if (configurationError) {
    root.innerHTML = `<div class="portal-boot">${errorState({ title: "Portal configuration is required", message: configurationError.message, actionLabel: "" })}</div>`;
    return;
  }
  root.innerHTML = `<div class="portal-boot">${loadingBlock("Preparing secure workspace")}</div>`;
  await auth.hydrate();
  router.start();
}

start();
