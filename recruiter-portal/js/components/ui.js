const iconPaths = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  briefcase: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14.5a4.7 4.7 0 0 1 3.5 5.5"/>',
  send: '<path d="m21 3-7 18-4-8-7-4 18-6Z"/><path d="m10 13 4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55v.09h-3v-.09a1.7 1.7 0 0 0-1.03-1.55A1.7 1.7 0 0 0 8.8 19l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.55-1.03h-.09v-3h.09A1.7 1.7 0 0 0 7 9.94a1.7 1.7 0 0 0-.34-1.88L6.6 8 8.72 5.9l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.55v-.09h3v.09a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03h.09v3h-.09A1.7 1.7 0 0 0 19.4 15Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.6 1.9c-1.25 1.1-2.1 1.55-2.1 3.1"/><path d="M12 17h.01"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  arrowLeft: '<path d="m15 18-6-6 6-6M9 12h11"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  external: '<path d="M14 3h7v7M21 3l-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};

export function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || ""}</svg>`;
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

export function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (value == null || value === "") return "—";

  let date;
  if (value instanceof Date) {
    date = value;
  } else {
    const raw = String(value).trim();
    if (!raw) return "—";
    // Date-only (YYYY-MM-DD): keep midday local parse to avoid timezone day-shift.
    // ISO datetimes already include a time component — do not append T12:00:00.
    date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T12:00:00`)
      : new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function initials(name = "") {
  return String(name).split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "RP";
}

export function statusBadge(value) {
  const tone = String(value || "").toLowerCase().replace(/\s+/g, "-");
  return `<span class="status-badge ${tone}">${escapeHtml(value)}</span>`;
}

export function loadingBlock(label = "Loading workspace") {
  return `<section class="content-state loading-state" aria-busy="true"><span class="spinner" aria-hidden="true"></span><p>${escapeHtml(label)}…</p></section>`;
}

export function emptyState({ title, message, actionLabel, actionRoute } = {}) {
  return `<section class="content-state empty-state"><div class="empty-mark">${icon("briefcase", 24)}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${actionLabel ? `<a class="button button-secondary" href="#${escapeHtml(actionRoute || "/dashboard")}">${escapeHtml(actionLabel)}</a>` : ""}</section>`;
}

export function errorState({ title = "Something needs attention", message, actionLabel = "Try again" } = {}) {
  return `<section class="content-state error-state"><div class="empty-mark">${icon("help", 24)}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><button class="button button-secondary" type="button" data-action="retry">${escapeHtml(actionLabel)}</button></section>`;
}

export function clientName(job) {
  return job.clientVisibility?.startsWith("Client identity") ? "Confidential client" : job.client;
}

const JOB_SECTION_MARKERS = [
  { key: "roleTitle", pattern: /(?:Role|Job)\s+Title:/i, kind: "meta", title: "Role title" },
  { key: "roleType", pattern: /(?:Role|Job)\s+Type:/i, kind: "meta", title: "Role type" },
  { key: "location", pattern: /Location:/i, kind: "meta", title: "Location" },
  { key: "eligibility", pattern: /Eligibility:?/i, kind: "prose", title: "Eligibility" },
  { key: "jobSummary", pattern: /Job Summary:?/i, kind: "prose", title: "Job summary" },
  { key: "roleOverview", pattern: /Role Overview:?/i, kind: "prose", title: "Role overview" },
  { key: "scopeOfWork", pattern: /(?:Scope of Work|Key Responsibilities):?/i, kind: "list", title: "Scope of work" },
  { key: "requiredQualifications", pattern: /(?:Required Qualifications(?:\s*\([^)]*\))?|Required Skills and Qualifications):?/i, kind: "list", title: "Required qualifications" },
  { key: "levels", pattern: /Levels(?=\s*[A-Z]|[A-Z]|$)/i, kind: "list", title: "Levels" },
  { key: "preferredExperience", pattern: /(?:Preferred Experience(?:\s*\([^)]*\))?|Preferred Qualifications):?/i, kind: "list", title: "Preferred qualifications" },
  { key: "whyJoin", pattern: /Why Join:?/i, kind: "prose", title: "Why join" },
];

const META_STOP_PATTERN = /(?=Eligibility:|Location:|(?:Role|Job)\s+(?:Title|Type):|Job Summary:|Role Overview:|Scope of Work|Key Responsibilities|Required Qualifications|Required Skills|Preferred Experience|Preferred Qualifications|Why Join:|micro1\b)/i;

function findJobSections(text) {
  const hits = [];
  for (const marker of JOB_SECTION_MARKERS) {
    const match = marker.pattern.exec(text);
    if (!match) continue;
    hits.push({ ...marker, index: match.index, end: match.index + match[0].length });
  }
  hits.sort((a, b) => a.index - b.index || b.end - a.end);
  const sections = [];
  for (let i = 0; i < hits.length; i += 1) {
    const current = hits[i];
    if (sections.some((section) => current.index >= section.index && current.index < section.bodyStart)) continue;
    const next = hits.slice(i + 1).find((candidate) => candidate.index >= current.end);
    sections.push({
      key: current.key,
      kind: current.kind,
      title: current.title,
      index: current.index,
      bodyStart: current.end,
      bodyEnd: next ? next.index : text.length,
    });
  }
  return sections;
}

export function cleanJobFieldText(value) {
  let text = String(value || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  if (/^\s*\{[\s\S]*\}\s*$/.test(text)) return "";
  text = text.replace(/\n?\s*\{[\s\S]*\}\s*$/g, "").trim();
  text = text.split(/\n(?=Why Join:?)/i)[0].trim();
  text = text.replace(/\s*Why Join:[\s\S]*$/i, "").trim();
  return text;
}

export function unglueProseText(value) {
  return String(value || "")
    .replace(/([a-z0-9)])\.([A-Z])/g, "$1. $2")
    .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
    .replace(/\b(Remote|Hybrid|On-?site)\s*(?=Job\s+Summary)/gi, "$1 ")
    .trim();
}

function splitJobListItems(text) {
  const normalized = unglueProseText(cleanJobFieldText(text));
  if (!normalized) return [];
  if (/\n/.test(normalized)) {
    return normalized
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line && !/^why join:?$/i.test(line));
  }
  const items = normalized
    .split(/(?<=\.)(?:\s+|(?=[A-Z][A-Za-z0-9]))/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 1 ? items : [normalized];
}

function splitJobParagraphs(text) {
  const normalized = unglueProseText(String(text || "").replace(/\r\n?/g, "\n").trim());
  if (!normalized) return [];
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  return paragraphs.length ? paragraphs : [normalized];
}

function trimGluedMetaValue(value, kind, key) {
  let text = String(value || "").trim();
  if (!text || kind !== "meta") return text;
  const stop = text.search(META_STOP_PATTERN);
  if (stop > 0) text = text.slice(0, stop).trim();
  if (key === "location") {
    const workplace = text.match(/^(Remote|Hybrid|On-?site|On site)(?=[A-Z]|$)/i);
    if (workplace) return workplace[1];
    const labeled = text.match(/^([A-Za-z0-9 .,'/-]{1,80}?(?:Remote|Hybrid|On-?site|On site))(?=[A-Z]|$)/i);
    if (labeled) return labeled[1].trim();
    const beforeBrand = text.search(/micro1\b/i);
    if (beforeBrand > 0) return text.slice(0, beforeBrand).trim();
  }
  if (key === "roleType") {
    const withParen = text.match(/^(Contractor|Full[-\s]?time|Part[-\s]?time|Employee|Intern|Temporary|Contract)(?:\s*\([^)]*\))?/i);
    if (withParen) return withParen[0].trim();
  }
  if (key === "roleTitle") {
    const cut = text.search(/(?=(?:Role|Job)\s+Type:)/i);
    if (cut > 0) return text.slice(0, cut).trim();
  }
  return text;
}

function humanizeEmploymentType(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const key = raw.toUpperCase().replace(/[\s-]+/g, "_");
  const labels = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    CONTRACTOR: "Contractor",
    TEMPORARY: "Temporary",
    INTERN: "Intern",
    INTERNSHIP: "Intern",
  };
  if (labels[key]) return labels[key];
  if (/^[A-Z0-9_]+$/.test(raw)) {
    return raw.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-");
  }
  return raw;
}

function skillsFromStructuredJson(value) {
  const text = String(value || "").trim();
  if (!/^\s*\{[\s\S]*\}\s*$/.test(text)) return [];
  try {
    const parsed = JSON.parse(text);
    const bags = [parsed.requiredSkills, parsed.preferredSkills, parsed.parsedSkills, parsed.skills, parsed.certifications];
    return [...new Set(bags.flatMap((bag) => (Array.isArray(bag) ? bag : [])).map((item) => String(item || "").trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

export function enrichJobFromDescription(job = {}) {
  const parsed = parseJobDescription(job.description || "");
  const metaValue = (title) => parsed.meta.find((item) => item.title === title)?.value || "";
  const locationFromDescription = metaValue("Location");
  const roleTypeFromDescription = metaValue("Role type");
  const apiLocation = job.location && job.location !== "Not specified" ? job.location : "";
  const apiEmployment = job.employmentType && job.employmentType !== "Not specified"
    ? humanizeEmploymentType(job.employmentType)
    : "";
  const location = locationFromDescription || apiLocation || [job.city, job.country].filter(Boolean).join(", ") || "Not specified";
  const employmentType = roleTypeFromDescription || apiEmployment || "Not specified";
  const experienceLevel = job.experienceLevel && job.experienceLevel !== "Not specified"
    ? job.experienceLevel
    : "Not specified";
  const jsonSkills = [
    ...skillsFromStructuredJson(job.requirements),
    ...skillsFromStructuredJson(job.responsibilities),
    ...skillsFromStructuredJson(job.preferredQualifications),
  ];
  const requiredSkills = Array.isArray(job.requiredSkills) && job.requiredSkills.length
    ? job.requiredSkills
    : [...new Set(jsonSkills)];
  return {
    ...job,
    location,
    employmentType,
    experienceLevel,
    requiredSkills,
    responsibilities: cleanJobFieldText(job.responsibilities),
    requirements: cleanJobFieldText(job.requirements),
    preferredQualifications: cleanJobFieldText(job.preferredQualifications),
  };
}

export function parseJobDescription(value) {
  const text = String(value || "").trim();
  if (!text) return { meta: [], sections: [], leftover: "" };
  const markers = findJobSections(text);
  if (!markers.length) {
    return { meta: [], sections: [{ key: "overview", kind: "prose", title: "Overview", body: text }], leftover: "" };
  }
  const meta = [];
  const sections = [];
  const overflows = [];
  const leftover = markers[0].index > 0 ? text.slice(0, markers[0].index).trim() : "";
  for (const marker of markers) {
    const rawBody = text.slice(marker.bodyStart, marker.bodyEnd).trim();
    const body = trimGluedMetaValue(rawBody, marker.kind, marker.key);
    if (marker.kind === "meta") {
      meta.push({ title: marker.title, value: body });
      if (body && rawBody.length > body.length) {
        const overflow = unglueProseText(rawBody.slice(body.length).trim());
        if (overflow) overflows.push(overflow);
      }
    } else {
      const cleaned = marker.kind === "prose" ? unglueProseText(cleanJobFieldText(body)) : cleanJobFieldText(body);
      sections.push({ key: marker.key, kind: marker.kind, title: marker.title, body: cleaned });
    }
  }
  if (overflows.length) {
    sections.unshift({
      key: "overview",
      kind: "prose",
      title: "Role overview",
      body: overflows.filter(Boolean).join("\n\n"),
    });
  }
  return { meta, sections, leftover };
}

export function formatJobListHtml(value) {
  const items = splitJobListItems(value);
  if (!items.length) return "";
  return `<ul class="job-prose-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function formatJobDescriptionHtml(value, { includeMeta = true, includeLists = true } = {}) {
  const text = String(value || "").trim();
  if (!text) return `<p>${escapeHtml("No job description provided.")}</p>`;
  const parsed = parseJobDescription(text);
  const blocks = [];
  if (includeMeta && parsed.meta.length) {
    blocks.push(`<dl class="job-prose-meta">${parsed.meta.map((item) => `<div><dt>${escapeHtml(item.title)}</dt><dd>${escapeHtml(item.value)}</dd></div>`).join("")}</dl>`);
  }
  if (parsed.leftover) {
    blocks.push(splitJobParagraphs(parsed.leftover).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(""));
  }
  for (const section of parsed.sections) {
    if (!section.body) continue;
    if (!includeLists && section.kind === "list") continue;
    blocks.push(`<h4>${escapeHtml(section.title)}</h4>`);
    if (section.kind === "list") blocks.push(formatJobListHtml(section.body));
    else blocks.push(splitJobParagraphs(section.body).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(""));
  }
  if (!blocks.length) {
    return splitJobParagraphs(text).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  }
  return `<div class="job-prose">${blocks.join("")}</div>`;
}

function renderOverviewFromDescription(description) {
  const parsed = parseJobDescription(description || "");
  const blocks = [];
  if (parsed.meta.length) {
    blocks.push(`<dl class="job-prose-meta">${parsed.meta.map((item) => `<div><dt>${escapeHtml(item.title)}</dt><dd>${escapeHtml(item.value)}</dd></div>`).join("")}</dl>`);
  }
  if (parsed.leftover) {
    blocks.push(splitJobParagraphs(parsed.leftover).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(""));
  }
  for (const section of parsed.sections) {
    if (!section.body || section.kind === "list" || section.key === "whyJoin") continue;
    blocks.push(`<h4>${escapeHtml(section.title)}</h4>`);
    blocks.push(splitJobParagraphs(section.body).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(""));
  }
  if (!blocks.length) return formatJobDescriptionHtml(description || "", { includeMeta: true, includeLists: false });
  return `<div class="job-prose">${blocks.join("")}</div>`;
}

export function renderJobDetailSections(job) {
  const parsed = parseJobDescription(job.description || "");
  const sectionBody = (key) => parsed.sections.find((section) => section.key === key)?.body || "";
  const responsibilitiesText = cleanJobFieldText(job.responsibilities) || sectionBody("scopeOfWork");
  const requirementsText = cleanJobFieldText(job.requirements) || sectionBody("requiredQualifications");
  const preferredText = cleanJobFieldText(job.preferredQualifications) || sectionBody("preferredExperience");
  const levelsText = sectionBody("levels");
  const responsibilities = splitJobListItems(responsibilitiesText);
  const requirements = splitJobListItems(requirementsText);
  const preferred = splitJobListItems(preferredText);
  const levels = splitJobListItems(levelsText);
  const hasStructured = responsibilities.length > 0 || requirements.length > 0 || preferred.length > 0 || levels.length > 0;
  if (!hasStructured) {
    return `<section><h3>About the role</h3>${formatJobDescriptionHtml(job.description || "")}</section>`;
  }
  const parts = [`<section><h3>About the role</h3>${renderOverviewFromDescription(job.description || "")}</section>`];
  if (responsibilities.length) parts.push(`<section><h3>Scope of work</h3>${formatJobListHtml(responsibilitiesText)}</section>`);
  if (requirements.length) parts.push(`<section><h3>Required qualifications</h3>${formatJobListHtml(requirementsText)}</section>`);
  if (levels.length) parts.push(`<section><h3>Levels</h3>${formatJobListHtml(levelsText)}</section>`);
  if (preferred.length) parts.push(`<section><h3>Preferred qualifications</h3>${formatJobListHtml(preferredText)}</section>`);
  const whyJoin = parsed.sections.find((section) => section.key === "whyJoin");
  if (whyJoin?.body) {
    parts.push(`<section><h3>Why join</h3>${splitJobParagraphs(whyJoin.body).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>`);
  }
  return parts.join("");
}
