import { findJobById, applyApplication, uploadResume } from "./api.js";
import { escapeHtml, normalizeList, textFrom } from "./render.js";

const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

const main = document.querySelector("#job-detail");
const summary = document.querySelector("#job-summary");
const form = document.querySelector("#application-form");
const submitButton = document.querySelector("#submit-button");
const formStatus = document.querySelector("#form-status");
const resumeInput = document.querySelector("#resume");
const resumeFile = document.querySelector("#resume-file");
const resumeProgress = document.querySelector("#resume-progress");

let currentJob = null;
let selectedResume = null;
let uploadedResume = null;
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
    renderError("We could not load this role", "Please try again in a moment.");
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
  meta.innerHTML = `<span class="pill">${escapeHtml(textFrom(job.locationType))}</span><span class="pill">${escapeHtml(textFrom(job.employmentType))}</span>`;
  summary.appendChild(meta);

  const about = document.createElement("div");
  about.className = "job-about";
  about.innerHTML = `<h2>About this role</h2><p>${escapeHtml(aboutText)}</p>`;
  summary.appendChild(about);

  if (skills.length) {
    const skillsSection = document.createElement("div");
    skillsSection.className = "job-skills";
    skillsSection.innerHTML = `<h2>Skills</h2><ul class="skills-grid">${skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}</ul>`;
    summary.appendChild(skillsSection);
  }

  main.setAttribute("aria-busy", "false");
}

function renderError(title, message) {
  summary.innerHTML = `<a class="back-link" href="./index.html#jobs">&larr; Back to open roles</a><h2>${escapeHtml(title)}</h2><p class="job-summary-muted">${escapeHtml(message)}</p>`;
  main.setAttribute("aria-busy", "false");
}

resumeInput.addEventListener("change", handleResumeSelection);
form.addEventListener("submit", handleSubmit);

function handleResumeSelection() {
  selectedResume = resumeInput.files?.[0] || null;
  uploadedResume = null;

  if (!selectedResume) {
    resumeFile.textContent = "No file selected";
    resumeProgress.textContent = "";
    return;
  }

  resumeFile.textContent = `${selectedResume.name} · ${formatBytes(selectedResume.size)}`;
  resumeProgress.textContent = "Ready to upload when you submit.";
  resumeProgress.className = "resume-progress ready";
}

async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return;

  if (!currentJob) {
    showError("Please wait for the job details to load before applying.");
    return;
  }

  if (!form.checkValidity()) {
    const firstInvalid = form.querySelector(":invalid");
    firstInvalid?.focus();
    showError("Please fill in all required fields.");
    return;
  }

  if (!selectedResume) {
    showError("Please upload your resume before applying.");
    resumeInput.focus();
    return;
  }

  isSubmitting = true;
  submitButton.disabled = true;
  submitButton.textContent = "Uploading resume…";
  formStatus.textContent = "";
  formStatus.className = "form-status";

  try {
    if (!uploadedResume) {
      resumeProgress.textContent = "Uploading resume securely…";
      resumeProgress.className = "resume-progress uploading";
      uploadedResume = await uploadResume(selectedResume);
      resumeProgress.textContent = "Resume uploaded successfully. Submitting application…";
      resumeProgress.className = "resume-progress success";
    }

    submitButton.textContent = "Submitting…";
    const payload = await applyApplication(buildApplication(uploadedResume));

    if (payload?.success) {
      renderSuccess(textFrom(currentJob.title, "this role"));
    } else {
      showError("Something went wrong. Please try again in a moment.");
      resetSubmitButton();
    }
  } catch (error) {
    console.error(error);
    renderSubmissionError(error);
    resetSubmitButton();
  } finally {
    isSubmitting = false;
  }
}

function buildApplication(resume) {
  const data = new FormData(form);
  const experience = data.get("experience");
  const salary = data.get("salary");

  return {
    jobId,
    firstName: textFrom(data.get("firstName"), ""),
    lastName: textFrom(data.get("lastName"), ""),
    email: textFrom(data.get("email"), ""),
    phone: textFrom(data.get("phone"), ""),
    currentCompany: textFrom(data.get("company"), ""),
    currentTitle: textFrom(data.get("title"), ""),
    yearsExperience: experience ? Number(experience) : undefined,
    desiredSalary: salary ? Number(salary) : undefined,
    noticePeriod: data.get("notice") ? Number(data.get("notice")) : undefined,
    linkedinUrl: textFrom(data.get("linkedin"), ""),
    portfolioUrl: textFrom(data.get("portfolio"), ""),
    githubUrl: "",
    additionalNotes: textFrom(data.get("notes"), ""),
    certifications: textFrom(data.get("certifications"), ""),
    resume,
  };
}

function renderSubmissionError(error) {
  const payload = error?.payload || {};
  if (payload.code === "ALREADY_APPLIED") {
    showError("You have already applied to this role.");
    return;
  }
  if (payload.code === "VALIDATION_ERROR") {
    showError(payload.message || "Please check your information and try again.");
    return;
  }
  showError("We couldn't submit your application right now. Please try again in a moment.");
}

function showError(message) {
  formStatus.textContent = message;
  formStatus.className = "form-status error";
}

function resetSubmitButton() {
  submitButton.disabled = false;
  submitButton.textContent = "Apply Now";
}

function renderSuccess(jobTitle) {
  form.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = true));
  formStatus.textContent = `Thank you for applying. We've received your application for ${jobTitle}.`;
  formStatus.className = "form-status success";
  submitButton.textContent = "Application submitted";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
