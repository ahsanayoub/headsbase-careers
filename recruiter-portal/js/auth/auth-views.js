import { escapeHtml, icon } from "../components/ui.js";
import { isDevelopmentMode } from "../config.js";

function authFrame({ eyebrow, title, copy, body, footer = "" }) {
  return `<div class="auth-shell">
    <aside class="auth-aside">
      <a class="auth-brand" href="#/login" aria-label="Headsbase recruiter portal">
        <img src="../htn.svg" alt="Headsbase Talent Network" />
      </a>
      <div class="auth-aside-copy">
        <p class="page-kicker">External recruiter collaboration</p>
        <h1>A focused workspace for the work Headsbase has shared with you.</h1>
        <p>Manage assigned roles, candidate submissions, and next steps without exposing internal ATS operations.</p>
      </div>
      <p class="auth-aside-note">Headsbase Recruiter Portal</p>
    </aside>
    <main class="auth-main" id="portal-main">
      <section class="auth-card">
        <div class="auth-heading"><p class="page-kicker">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div>
        ${isDevelopmentMode() ? '<p class="dev-notice"><strong>Development mode</strong><br>This local portal uses sample workspace data only.</p>' : ""}
        ${body}
        ${footer}
      </section>
    </main>
  </div>`;
}

export function loginView({ message = "" } = {}) {
  return authFrame({
    eyebrow: "Welcome back", title: "Sign in to your recruiter workspace",
    copy: "Use the email address associated with your recruiter organization.",
    body: `<form class="auth-form" id="login-form">
      <label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@company.com" /></label>
      <label>Password<input name="password" type="password" required minlength="10" autocomplete="current-password" placeholder="Enter your password" /></label>
      <p class="form-message" id="auth-message" role="alert">${escapeHtml(message)}</p>
      <button class="button button-primary button-full" type="submit">Sign in</button>
      <a class="text-link center-link" href="#/forgot-password">Forgot your password?</a>
    </form>`,
    footer: '<p class="auth-footer">New to Headsbase? <a class="text-link" href="#/signup">Create a recruiter account</a></p>',
  });
}

export function signupView() {
  return authFrame({
    eyebrow: "Join the network", title: "Create your recruiter account",
    copy: "Start your organization profile. Headsbase reviews access separately; creating an account does not grant job access.",
    body: `<form class="auth-form" id="signup-form">
      <label>Your name<input name="name" type="text" required autocomplete="name" placeholder="Full name" /></label>
      <label>Work email<input name="email" type="email" required autocomplete="email" placeholder="you@company.com" /></label>
      <label>Recruiter organization<input name="organizationName" type="text" required autocomplete="organization" placeholder="Your organization name" /></label>
      <label>Password<input name="password" type="password" required minlength="10" autocomplete="new-password" placeholder="At least 10 characters" /></label>
      <label class="checkbox-label"><input name="terms" type="checkbox" required /> <span>I agree to the Headsbase Recruiter Terms and Privacy Notice.</span></label>
      <p class="form-message" id="auth-message" role="alert"></p>
      <button class="button button-primary button-full" type="submit">Create account</button>
    </form>`,
    footer: '<p class="auth-footer">Already have an account? <a class="text-link" href="#/login">Sign in</a></p>',
  });
}

export function forgotPasswordView() {
  return authFrame({
    eyebrow: "Account recovery", title: "Reset your password",
    copy: "We’ll send password-reset instructions to the email associated with your recruiter account.",
    body: `<form class="auth-form" id="forgot-password-form">
      <label>Work email<input name="email" type="email" required autocomplete="email" placeholder="you@company.com" /></label>
      <p class="form-message" id="auth-message" role="alert"></p>
      <button class="button button-primary button-full" type="submit">Send reset instructions</button>
      <a class="text-link center-link" href="#/login">Back to sign in</a>
    </form>`,
  });
}

export function verifyEmailView(session, token = "") {
  const hasToken = Boolean(token);
  return authFrame({
    eyebrow: "Email verification", title: hasToken ? "Verify your email" : "Check your email",
    copy: hasToken ? "Your verification link is ready. Confirm it to activate your recruiter account." : `We sent a verification link to ${session?.user?.email || "your email address"}. Open that link to verify your account.`,
    body: `<form class="auth-form" id="verify-email-form" data-token="${escapeHtml(token)}">
      <div class="verification-mark">${icon("check", 26)}</div>
      <p class="muted-copy">Email verification uses a one-time token issued by the HTN authentication service.</p>
      <p class="form-message" id="auth-message" role="alert"></p>
      ${hasToken ? '<button class="button button-primary button-full" type="submit">Verify email</button>' : '<a class="button button-primary button-full" href="#/login">Return to sign in</a>'}
    </form>`,
  });
}

export function resetPasswordView(token = "") {
  return authFrame({
    eyebrow: "Account recovery", title: "Choose a new password",
    copy: "Set a new password for your recruiter account.",
    body: `<form class="auth-form" id="reset-password-form" data-token="${escapeHtml(token)}">
      <label>New password<input name="password" type="password" required minlength="10" autocomplete="new-password" placeholder="At least 10 characters" /></label>
      <label>Confirm password<input name="confirmPassword" type="password" required minlength="10" autocomplete="new-password" placeholder="Repeat your password" /></label>
      <p class="form-message" id="auth-message" role="alert"></p>
      <button class="button button-primary button-full" type="submit">Set new password</button>
      <a class="text-link center-link" href="#/login">Back to sign in</a>
    </form>`,
  });
}

const onboardingSteps = [
  { kicker: "Step 3 of 8", title: "Confirm your organization", copy: "This profile represents your recruiting organization, not a client or internal Headsbase team.", fields: (session) => `<label>Organization name<input name="organizationName" required value="${escapeHtml(session.organization.name)}" /></label><label>Website<input name="website" type="url" placeholder="https://" value="${escapeHtml(session.organization.website || "")}" /></label><label>Primary location<input name="location" required value="${escapeHtml(session.organization.location || "")}" /></label><label>Primary contact<input name="primaryContact" required value="${escapeHtml(session.organization.primaryContact || session.user.name)}" /></label>` },
  { kicker: "Step 4 of 8", title: "Complete your recruiter profile", copy: "Help Headsbase understand who they are collaborating with.", fields: (session) => `<label>Your name<input name="name" required autocomplete="name" value="${escapeHtml(session.user.name)}" /></label><label>Phone<input name="phone" type="tel" autocomplete="tel" value="${escapeHtml(session.user.phone || "")}" /></label>` },
  { kicker: "Step 5 of 8", title: "Add your specializations", copy: "Describe the roles and talent communities where your organization is strongest.", fields: (session) => `<label>Recruiter specialization<textarea name="specialization" required rows="4">${escapeHtml(session.organization.specialization || "")}</textarea></label>` },
  { kicker: "Step 6 of 8", title: "Define your markets", copy: "Tell us where your organization can support searches.", fields: (session) => `<label>Locations and markets<textarea name="markets" required rows="4">${escapeHtml(session.organization.markets || "")}</textarea></label>` },
  { kicker: "Step 7 of 8", title: "Agree to recruiter terms", copy: "Recruiter access is controlled by Headsbase. You will only see jobs explicitly shared with your organization or assigned to you.", fields: () => `<div class="terms-card"><div class="terms-icon">${icon("lock", 22)}</div><div><strong>Headsbase Recruiter Terms</strong><p>Protect candidate information, respect client confidentiality, and use shared job information only for approved recruiting work.</p></div></div><label class="checkbox-label"><input name="terms" type="checkbox" required /> <span>I agree to the Headsbase Recruiter Terms and understand that access to jobs is granted by Headsbase.</span></label>` },
];

export function onboardingView(session, step = 0) {
  const current = onboardingSteps[step] || onboardingSteps[0];
  return authFrame({ eyebrow: current.kicker, title: current.title, copy: current.copy, body: `<div class="onboarding-progress" aria-label="Onboarding progress">${onboardingSteps.map((_, index) => `<span class="${index <= step ? "is-complete" : ""}"></span>`).join("")}</div><form class="auth-form" id="onboarding-form" data-step="${step}">${current.fields(session)}<p class="form-message" id="auth-message" role="alert"></p><div class="onboarding-actions">${step ? '<button class="button button-secondary" type="button" data-action="onboarding-back">Back</button>' : ""}<button class="button button-primary" type="submit">${step === onboardingSteps.length - 1 ? "Enter recruiter workspace" : "Continue"}</button></div></form>` });
}
