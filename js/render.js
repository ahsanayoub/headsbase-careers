export function formatDate(value) {
  if (!value) {
    return "Recently posted";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|•|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function textFrom(value, fallback = "Not specified") {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || fallback;
  }

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

export function createJobCard(job) {
  const article = document.createElement("article");
  article.className = "job-card";

  const skills = normalizeList(job.skills).slice(0, 4);
  const summary = normalizeList(job.responsibilities)[0] || "Help build excellent work with the Headsbase team.";
  const detailUrl = `./job.html?id=${encodeURIComponent(job.jobId)}`;

  article.innerHTML = `
    <div>
      <div class="job-topline">
        <span class="pill">${escapeHtml(textFrom(job.locationType))}</span>
        <span class="pill">${escapeHtml(formatDate(job.postedDate))}</span>
      </div>
      <h3>${escapeHtml(textFrom(job.title, "Untitled role"))}</h3>
      <p class="company">${escapeHtml(textFrom(job.company, "Headsbase"))}</p>
      <p class="summary">${escapeHtml(summary)}</p>
      <ul class="tag-list" aria-label="Skills">
        ${skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}
      </ul>
    </div>
    <a class="button" href="${detailUrl}" aria-label="View details for ${escapeHtml(
      textFrom(job.title, "this role"),
    )}">View Details</a>
  `;

  return article;
}

export function createSkeletonCards(count = 4) {
  return Array.from({ length: count }, () => {
    const card = document.createElement("article");
    card.className = "job-card skeleton";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = `
      <div>
        <div class="job-topline">
          <span class="skeleton-pill"></span>
          <span class="skeleton-pill"></span>
        </div>
        <span class="skeleton-line title"></span>
        <span class="skeleton-line short"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line"></span>
      </div>
      <span class="skeleton-line short"></span>
    `;
    return card;
  });
}

export function createState({ title, message, actionLabel, onAction, tone = "neutral" }) {
  const state = document.createElement("section");
  state.className = `state ${tone}`;
  state.innerHTML = `
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(message)}</p>
  `;

  if (actionLabel && onAction) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary";
    button.textContent = actionLabel;
    button.addEventListener("click", onAction);
    state.append(button);
  }

  return state;
}

export function renderDetailList(title, items) {
  const values = normalizeList(items);

  if (!values.length) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "detail-section";

  section.innerHTML = `
    <h2>${escapeHtml(title)}</h2>
    <ul>
      ${values
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}
    </ul>
  `;

  return section;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
