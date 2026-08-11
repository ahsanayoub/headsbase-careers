import { findJobById, applyApplication } from "./api.js";
import {
  escapeHtml,
  normalizeList,
  textFrom,
} from "./render.js";

const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

const main = document.querySelector("#job-detail");
const summary = document.querySelector("#job-summary");
const form = document.querySelector("#application-form");
const submitButton = document.querySelector("#submit-button");
const formStatus = document.querySelector("#form-status");

let currentJob = null;
let isSubmitting = false;

init();

async function init() {
  if (!jobId) {
    renderError("No job selected", "Return to open roles and choose a position to view.");
    return;
  }

  try {
    const job = await findJobById(jobId);

    if (!job) {
      renderError("Role not found", "This opening may have closed or moved.");
      return;
    }

    currentJob = job;
    renderSummary(job);
  } catch (error) {
    console.error(error);
    renderError(
      "We could not load this role",
      "The jobs service may still be starting. Please try again in a moment.",
    );
  }
}

function renderSummary(job) {
  const skills = normalizeList(job.skills);
  const responsibilities = normalizeList(job.responsibilities);
  const aboutRole = textFrom(job.description, "");
  const aboutText = aboutRole || textFrom(responsibilities[0], "Join our team to shape the future of talent intelligence.");

  summary.innerHTML = "";

  const backLink = document.createElement("a");
  backLink.href = `./job.html?id=${encodeURIComponent(job.jobId)}`;
  backLink.className = "back-link";
  backLink.innerHTML = "&larr; Back to Job";
  summary.appendChild(backLink);

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = textFrom(job.company, "Headsbase");
  summary.appendChild(eyebrow);

  const title = document.createElement("h1");
  title.textContent = textFrom(job.title, "Untitled role");
  summary.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "detail-meta";
  meta.setAttribute("aria-label", "Job metadata");
  meta.innerHTML = `
    <span class="pill">${escapeHtml(textFrom(job.locationType))}</span>
    <span class="pill">${escapeHtml(textFrom(job.employmentType))}</span>
  `;
  summary.appendChild(meta);

  const about = document.createElement("div");
  about.className = "job-about";
  about.innerHTML = `
    <h2>About this role</h2>
    <p>${escapeHtml(aboutText)}</p>
  `;
  summary.appendChild(about);

  if (skills.length) {
    const skillsSection = document.createElement("div");
    skillsSection.className = "job-skills";
    skillsSection.innerHTML = `
      <h2>Skills</h2>
      <ul class="skills-grid">
        ${skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}
      </ul>
    `;
    summary.appendChild(skillsSection);
  }

  main.setAttribute("aria-busy", "false");
}

function renderError(title, message) {
  summary.innerHTML = `
    <a class="back-link" href="./index.html#jobs">&larr; Back to open roles</a>
    <h2>${escapeHtml(title)}</h2>
    <p class="job-summary-muted">${escapeHtml(message)}</p>
  `;
  main.setAttribute("aria-busy", "false");
}

/* Form handling */

form.addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  if (isSubmitting) {
    return;
  }

  if (!currentJob) {
    formStatus.textContent = "Please wait for the job details to load before applying.";
    formStatus.className = "form-status error";
    return;
  }

  if (!form.checkValidity()) {
    const firstInvalid = form.querySelector(":invalid");
    firstInvalid?.focus();
    formStatus.textContent = "Please fill in all required fields.";
    formStatus.className = "form-status error";
    return;
  }

  const application = buildApplication();

  isSubmitting = true;
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";
  formStatus.textContent = "";
  formStatus.className = "form-status";

  try {
    const payload = await applyApplication(application);

    if (payload && payload.success) {
      renderSuccess(textFrom(currentJob.title, "this role"));
    } else {
      formStatus.textContent = "Something went wrong. Please try again in a moment.";
      formStatus.className = "form-status error";
      resetSubmitButton(originalLabel);
    }
  } catch (error) {
    console.error(error);
    renderSubmissionError(error);
    resetSubmitButton(originalLabel);
  } finally {
    isSubmitting = false;
  }
}

function resetSubmitButton(originalLabel) {
  submitButton.disabled = false;
  submitButton.textContent = originalLabel;
}

function renderSubmissionError(error) {
  const payload = error.payload || {};
  const code = payload.code;

  if (code === "ALREADY_APPLIED") {
    formStatus.textContent = "You have already applied to this role.";
    formStatus.className = "form-status error";
    return;
  }

  if (code === "VALIDATION_ERROR") {
    formStatus.textContent =
      payload.message || "Please check your information and try again.";
    formStatus.className = "form-status error";
    return;
  }

  /* Network errors (no response), 5xx, or unexpected 4xx — do not
     expose raw server/database errors to the user. */
  formStatus.textContent =
    "We couldn't submit your application right now. Please try again in a moment.";
  formStatus.className = "form-status error";
}

function renderSuccess(jobTitle) {
  /* Disable every form control so the form cannot be edited or
     resubmitted. */
  const controls = form.querySelectorAll("input, select, textarea, button");
  controls.forEach((el) => (el.disabled = true));

  formStatus.textContent = `Thank you for applying. We've received your application for ${jobTitle}.`;
  formStatus.className = "form-status success";
  submitButton.textContent = "Application submitted";
}

function buildApplication() {
  const data = new FormData(form);
  const experience = data.get("experience");
  const salary = data.get("salary");

  return {
    jobId: jobId,
    firstName: textFrom(data.get("firstName"), ""),
    lastName: textFrom(data.get("lastName"), ""),
    email: textFrom(data.get("email"), ""),
    phone: textFrom(data.get("phone"), ""),
    currentCompany: textFrom(data.get("company"), ""),
    currentTitle: textFrom(data.get("title"), ""),
    yearsExperience: experience ? Number(experience) : undefined,
    desiredSalary: salary ? Number(salary) : undefined,
    noticePeriod: textFrom(data.get("notice"), ""),
    linkedinUrl: textFrom(data.get("linkedin"), ""),
    portfolioUrl: textFrom(data.get("portfolio"), ""),
    githubUrl: "",
    additionalNotes: textFrom(data.get("notes"), ""),
    certifications: textFrom(data.get("certifications"), ""),
  };
}
