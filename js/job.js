import { findJobById } from "./api.js";
import {
  escapeHtml,
  formatDate,
  normalizeList,
  renderDetailList,
  textFrom,
} from "./render.js";

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
    renderMissingState(
      "We could not load this role",
      "The jobs service may still be starting. Please try again in a moment.",
      true,
    );
  }
}

function renderSkeleton() {
  article.innerHTML = `
    <div class="detail-hero">
      <span class="skeleton-line short"></span>
      <span class="skeleton-line title"></span>
      <span class="skeleton-line"></span>
    </div>
    <div class="detail-section">
      <span class="skeleton-line short"></span>
      <span class="skeleton-line"></span>
      <span class="skeleton-line"></span>
      <span class="skeleton-line"></span>
    </div>
  `;
}

function renderJob(job) {
  document.title = `${textFrom(job.title, "Job Details")} | Headsbase Careers`;
  article.setAttribute("aria-busy", "false");
  article.replaceChildren(createHero(job));
  const sections = [
    createApplySection(job),
    renderDetailList("Responsibilities", job.responsibilities),
    renderDetailList("Requirements", job.requirements),
    renderDetailList("Preferred qualifications", job.preferredQualifications),
    createSkillsSection(job),
  ].filter(Boolean);
  
  article.append(...sections);
}

function createHero(job) {
  const header = document.createElement("header");
  header.className = "detail-hero";
  header.innerHTML = `
    <a class="back-link" href="./index.html#jobs">Back to open roles</a>
    <p class="eyebrow">${escapeHtml(textFrom(job.company, "Headsbase"))}</p>
    <h1>${escapeHtml(textFrom(job.title, "Untitled role"))}</h1>
    <div class="detail-meta" aria-label="Job metadata">
      <span class="pill">${escapeHtml(textFrom(job.locationType))}</span>
      <span class="pill">${escapeHtml(textFrom(job.employmentType))}</span>
      <span class="pill">${escapeHtml(formatDate(job.postedDate))}</span>
    </div>
  `;
  return header;
}

function createApplySection(job) {
  const section = document.createElement("section");
  section.className = "apply-section";

  section.innerHTML = `
    <a
      class="button apply-button"
      href="./apply.html?id=${encodeURIComponent(job.jobId)}"
    >
      Apply Now
    </a>
  `;

  return section;
}

function createSkillsSection(job) {
  const skills = normalizeList(job.skills);

  if (!skills.length) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "detail-section";

  section.innerHTML = `
    <h2>Skills</h2>
    <ul class="skills-grid">
      ${skills
        .map((skill) => `<li>${escapeHtml(skill)}</li>`)
        .join("")}
    </ul>
  `;

  return section;
}

function renderMissingState(title, message, allowRetry = false) {
  article.setAttribute("aria-busy", "false");
  article.innerHTML = `
    <section class="state">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a class="button" href="./index.html#jobs">View open roles</a>
      ${
        allowRetry
          ? `<button class="button secondary" type="button" id="retry-detail">Try again</button>`
          : ""
      }
    </section>
  `;

  const retry = document.querySelector("#retry-detail");
  if (retry) {
    retry.addEventListener("click", init);
  }
}
