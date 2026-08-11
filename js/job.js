import { findJobById, submitApplication } from "./api.js";
import { escapeHtml, formatDate, normalizeList, renderDetailList, textFrom } from "./render.js";

const article = document.querySelector("#job-article");
const statusRegion = document.querySelector("#detail-status");
const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

init();

async function init() {
  if (!jobId) {
    renderMissingState("No job selected", "Return to open roles and choose a position to view.");
    return;
  }
  renderSkeleton();
  try {
    statusRegion.textContent = "Loading job details...";
    const job = await findJobById(jobId);
    if (!job) {
      renderMissingState("Role not found", "This opening may have closed or moved.");
      return;
    }
    renderJob(job);
    statusRegion.textContent = "";
  } catch (error) {
    console.error(error);
    renderMissingState("We could not load this role", "The jobs service may still be starting. Please try again in a moment.", true);
  }
}

function renderSkeleton() {
  article.innerHTML = `
    <div class="detail-hero">
      <span class="skeleton-line short"></span><span class="skeleton-line title"></span><span class="skeleton-line"></span>
    </div>
    <div class="detail-section"><span class="skeleton-line short"></span><span class="skeleton-line"></span><span class="skeleton-line"></span><span class="skeleton-line"></span></div>`;
}

function renderJob(job) {
  document.title = `${textFrom(job.title, "Job Details")} | Headsbase Careers`;
  article.setAttribute("aria-busy", "false");
  article.replaceChildren(createHero(job));
  article.append(
    createApplySection(job),
    renderDetailList("Responsibilities", job.responsibilities),
    renderDetailList("Requirements", job.requirements),
    renderDetailList("Preferred qualifications", job.preferredQualifications),
    createSkillsSection(job),
  );
}

function createHero(job) {
  const header = document.createElement("header");
  header.className = "detail-hero";
  header.innerHTML = `<a class="back-link" href="./index.html#jobs">Back to open roles</a><p class="eyebrow">${escapeHtml(textFrom(job.company, "Headsbase"))}</p><h1>${escapeHtml(textFrom(job.title, "Untitled role"))}</h1><div class="detail-meta" aria-label="Job metadata"><span class="pill">${escapeHtml(textFrom(job.locationType))}</span><span class="pill">${escapeHtml(textFrom(job.employmentType))}</span><span class="pill">${escapeHtml(formatDate(job.postedDate))}</span></div>`;
  return header;
}

function createApplySection(job) {
  const section = document.createElement("section");
  section.className = "apply-section";
  section.innerHTML = `
    <div class="apply-card">
      <div><p class="eyebrow">Interested in this role?</p><h2>Apply to ${escapeHtml(textFrom(job.title, "this role"))}</h2><p>Submit your information and our recruiting team will review your application.</p></div>
      <button class="button apply-button" type="button" id="open-application">Apply Now</button>
    </div>
    <div id="application-panel" class="application-panel" hidden></div>`;

  const button = section.querySelector("#open-application");
  const panel = section.querySelector("#application-panel");
  button.addEventListener("click", () => {
    panel.hidden = false;
    panel.innerHTML = createApplicationForm(job);
    button.hidden = true;
    wireApplicationForm(panel, job);
    panel.querySelector("input")?.focus();
  });
  return section;
}

function createApplicationForm(job) {
  return `
    <form id="application-form" novalidate>
      <div class="form-header"><h3>Application</h3><p>Fields marked * are required.</p></div>
      <div class="form-grid">
        <label>First name *<input name="firstName" autocomplete="given-name" required maxlength="80"></label>
        <label>Last name *<input name="lastName" autocomplete="family-name" required maxlength="80"></label>
        <label>Email *<input name="email" type="email" autocomplete="email" required maxlength="160"></label>
        <label>Phone<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>
        <label>Location *<input name="location" autocomplete="address-level2" required maxlength="120" placeholder="City, State/Country"></label>
        <label>Current company<input name="currentCompany" autocomplete="organization" maxlength="160"></label>
        <label>Current title<input name="currentTitle" autocomplete="organization-title" maxlength="160"></label>
        <label>Years of experience<input name="yearsExperience" type="number" min="0" max="60" step="1"></label>
        <label>Desired salary<input name="desiredSalary" type="number" min="0" step="1000" placeholder="Optional"></label>
        <label>Notice period (days)<input name="noticePeriod" type="number" min="0" max="365" step="1"></label>
        <label class="full">LinkedIn URL<input name="linkedinUrl" type="url" autocomplete="url" maxlength="300" placeholder="https://www.linkedin.com/in/..."></label>
        <label class="full">Cover letter<textarea name="coverLetter" rows="5" maxlength="5000" placeholder="Optional"></textarea></label>
        <label class="full">Additional notes<textarea name="additionalNotes" rows="3" maxlength="3000" placeholder="Anything else you'd like us to know?"></textarea></label>
      </div>
      <label class="consent"><input name="certificationAcknowledged" type="checkbox" required> I certify that the information provided is accurate and complete. *</label>
      <div id="application-message" class="form-message" role="alert" aria-live="polite"></div>
      <div class="form-actions"><button class="button secondary" type="button" id="cancel-application">Cancel</button><button class="button apply-button" type="submit" id="submit-application">Submit Application</button></div>
    </form>`;
}

function wireApplicationForm(panel, job) {
  const form = panel.querySelector("#application-form");
  const message = panel.querySelector("#application-message");
  const submit = panel.querySelector("#submit-application");
  const cancel = panel.querySelector("#cancel-application");

  cancel.addEventListener("click", () => {
    panel.hidden = true;
    const openButton = panel.parentElement.querySelector("#open-application");
    if (openButton) openButton.hidden = false;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const numberOrUndefined = (name) => {
      const value = String(data.get(name) || "").trim();
      return value ? Number(value) : undefined;
    };

    const payload = {
      jobId: job.id,
      firstName: String(data.get("firstName") || ""),
      lastName: String(data.get("lastName") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      location: String(data.get("location") || ""),
      currentCompany: String(data.get("currentCompany") || ""),
      currentTitle: String(data.get("currentTitle") || ""),
      linkedinUrl: String(data.get("linkedinUrl") || ""),
      yearsExperience: numberOrUndefined("yearsExperience"),
      desiredSalary: numberOrUndefined("desiredSalary"),
      noticePeriod: numberOrUndefined("noticePeriod"),
      coverLetter: String(data.get("coverLetter") || ""),
      additionalNotes: String(data.get("additionalNotes") || ""),
      certificationAcknowledged: data.get("certificationAcknowledged") === "on",
    };

    submit.disabled = true;
    submit.textContent = "Submitting...";
    message.textContent = "";

    try {
      const result = await submitApplication(payload);
      panel.innerHTML = `<div class="application-success"><p class="eyebrow">Application received</p><h3>Thank you for applying.</h3><p>Your application for <strong>${escapeHtml(result.jobTitle || job.title)}</strong> has been submitted successfully.</p><p class="success-reference">Application ID: ${escapeHtml(result.id)}</p></div>`;
    } catch (error) {
      console.error(error);
      message.textContent = error.status === 409 ? "You have already applied to this role." : (error.message || "We could not submit your application. Please try again.");
      submit.disabled = false;
      submit.textContent = "Submit Application";
    }
  });
}

function createSkillsSection(job) {
  const skills = normalizeList(job.skills);
  if (!skills.length) return null;
  const section = document.createElement("section");
  section.className = "detail-section";
  section.innerHTML = `<h2>Skills</h2><ul class="skills-grid">${skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}</ul>`;
  return section;
}

function renderMissingState(title, message, allowRetry = false) {
  article.setAttribute("aria-busy", "false");
  article.innerHTML = `<section class="state"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a class="button" href="./index.html#jobs">View open roles</a>${allowRetry ? `<button class="button secondary" type="button" id="retry-detail">Try again</button>` : ""}</section>`;
  const retry = document.querySelector("#retry-detail");
  if (retry) retry.addEventListener("click", init);
}
