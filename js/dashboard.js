const DEFAULT_PRODUCTION_API = "https://htn-api-production-ab6d.up.railway.app";
const ORGANIZATION_ID = "0e6f5b36-98aa-4d84-a142-b48c6dd3eb1f";

function resolveApiOrigin() {
  const queryOrigin = new URLSearchParams(window.location.search).get("api");
  const savedOrigin = window.localStorage.getItem("htn-api-origin");
  if (queryOrigin) return queryOrigin.replace(/\/$/, "");
  if (savedOrigin) return savedOrigin.replace(/\/$/, "");
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return "http://localhost:3000";
  return DEFAULT_PRODUCTION_API;
}

const API_ORIGIN = resolveApiOrigin();
const DISCOVERY_BASE = API_ORIGIN + "/api/discovery";
const API_BASE = API_ORIGIN + "/api";
const $ = s => document.querySelector(s);
const discoveryHeaders = () => ({ Accept: "application/json", "x-organization-id": ORGANIZATION_ID });
let searches = [];
let profiles = [];
let jobs = [];
let applications = [];

function setConnection(message, type = "info") {
  const el = $("#connection-status");
  if (!message) { el.hidden = true; el.textContent = ""; return; }
  el.hidden = false;
  el.className = "connection-status " + type;
  el.textContent = message;
}

async function requestDiscovery(path, options = {}) {
  return requestJson(DISCOVERY_BASE + path, {
    ...options,
    headers: { ...discoveryHeaders(), ...(options.headers || {}) },
  });
}

async function requestApi(path, options = {}) {
  return requestJson(API_BASE + path, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });
}

async function requestJson(url, options = {}) {
  let response;
  try { response = await fetch(url, options); }
  catch { throw new Error("Cannot reach the API at " + API_ORIGIN); }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(payload.message || "Request failed with status " + response.status);
  return payload;
}

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

async function loadSearches() {
  $("#search-list").innerHTML = '<div class="empty">Loading discovery searches…</div>';
  const payload = await requestDiscovery("/searches?limit=100");
  const data = payload.data;
  searches = data.items || data.data || [];
  const filter = $("#search-filter");
  filter.replaceChildren(new Option("All searches", ""));
  searches.forEach(search => filter.add(new Option(search.name, search.id)));
  renderSearches();
  $("#metric-searches").textContent = searches.length;
  $("#metric-active").textContent = searches.filter(s => s.status === "ACTIVE").length;
  await loadProfiles();
}

function renderSearches() {
  const root = $("#search-list");
  if (!searches.length) { root.innerHTML = '<div class="empty">No discovery searches yet. Create your first one.</div>'; return; }
  root.replaceChildren(...searches.map(search => {
    const item = document.createElement("article");
    item.className = "search-item";
    const details = document.createElement("div");
    details.innerHTML = '<div class="search-name"></div><div class="query"></div><div class="meta-row"></div>';
    details.querySelector(".search-name").textContent = search.name;
    details.querySelector(".query").textContent = search.query || "No generated query";
    const meta = details.querySelector(".meta-row");
    const status = document.createElement("span");
    status.className = "pill " + String(search.status || "").toLowerCase();
    status.textContent = search.status || "UNKNOWN";
    const created = document.createElement("span");
    created.textContent = "Created " + formatDate(search.createdAt);
    meta.append(status, created);
    const actions = document.createElement("div");
    const button = document.createElement("button");
    button.className = "button secondary"; button.type = "button";
    button.textContent = search.status === "ACTIVE" ? "Run search" : "Activate";
    button.addEventListener("click", () => search.status === "ACTIVE" ? executeSearch(search.id) : activateSearch(search.id));
    actions.append(button); item.append(details, actions); return item;
  }));
}

async function activateSearch(id) {
  try {
    await requestDiscovery("/searches/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACTIVE" }) });
    toast("Search activated"); await refreshDiscovery();
  } catch (error) { toast(error.message); }
}

async function executeSearch(id) {
  try {
    toast("Running search…");
    await requestDiscovery("/searches/" + id + "/execute", { method: "POST" });
    toast("Search completed"); await refreshDiscovery();
  } catch (error) { toast(error.message); }
}

async function loadProfiles() {
  $("#profile-list").innerHTML = '<div class="empty">Loading discovered profiles…</div>';
  profiles = [];
  for (const search of searches) {
    try {
      const runs = (await requestDiscovery("/searches/" + search.id + "/runs")).data;
      const latestRun = runs[0];
      if (!latestRun) continue;
      const runProfiles = (await requestDiscovery("/runs/" + latestRun.id + "/profiles")).data;
      profiles.push(...runProfiles.map(profile => ({ ...profile, searchId: search.id, searchName: search.name })));
    } catch (error) { console.error("Failed to load profiles for search", search.id, error); }
  }
  $("#metric-profiles").textContent = profiles.length;
  const latest = [...profiles].sort((a,b) => new Date(b.discoveredAt) - new Date(a.discoveredAt))[0];
  $("#metric-latest").textContent = latest ? formatDate(latest.discoveredAt) : "—";
  renderProfiles();
}

function renderProfiles() {
  const selectedSearchId = $("#search-filter").value;
  const items = profiles.filter(p => !selectedSearchId || p.searchId === selectedSearchId)
    .sort((a,b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
  const root = $("#profile-list");
  if (!items.length) { root.innerHTML = '<div class="empty">No discovered profiles to show for this search.</div>'; return; }
  root.replaceChildren(...items.map(profile => {
    const card = document.createElement("article"); card.className = "profile-card";
    const details = document.createElement("div");
    details.innerHTML = '<div class="profile-name"></div><div class="profile-headline"></div><div class="profile-snippet"></div><div class="meta-row"></div>';
    details.querySelector(".profile-name").textContent = profile.name || profile.headline || "Discovered profile";
    details.querySelector(".profile-headline").textContent = profile.headline || "Public profile";
    details.querySelector(".profile-snippet").textContent = profile.snippet || "No snippet available.";
    const meta = details.querySelector(".meta-row");
    const status = document.createElement("span"); status.className = "pill"; status.textContent = profile.status || "NEW";
    const searchName = document.createElement("span"); searchName.textContent = profile.searchName;
    meta.append(status, searchName);
    const actions = document.createElement("div"); actions.className = "profile-actions";
    if (profile.profileUrl) {
      const link = document.createElement("a"); link.href = profile.profileUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "View profile ↗"; actions.append(link);
    }
    card.append(details, actions); return card;
  }));
}

async function loadJobs() {
  $("#job-list").innerHTML = '<div class="empty">Loading jobs…</div>';
  const search = $("#job-search").value.trim();
  const params = new URLSearchParams({ limit: "100" });
  if (search) params.set("search", search);
  const payload = await requestApi("/jobs?" + params);
  jobs = payload.data || [];

  const jobFilter = $("#application-job-filter");
  const selected = jobFilter.value;
  jobFilter.replaceChildren(new Option("All jobs", ""));
  jobs.forEach(job => jobFilter.add(new Option(job.title, job.externalId || job.id)));
  if ([...jobFilter.options].some(o => o.value === selected)) jobFilter.value = selected;

  renderJobs();
}

function renderJobs() {
  const root = $("#job-list");
  if (!jobs.length) { root.innerHTML = '<div class="empty">No jobs found.</div>'; return; }
  root.replaceChildren(...jobs.map(job => {
    const card = document.createElement("article"); card.className = "job-card";
    const details = document.createElement("div");
    details.innerHTML = '<div class="job-title"></div><div class="job-company"></div><div class="meta-row"></div>';
    details.querySelector(".job-title").textContent = job.title || "Untitled job";
    details.querySelector(".job-company").textContent = job.organization?.name || job.company || "Company not specified";
    const meta = details.querySelector(".meta-row");
    [job.location, job.employmentType?.replace(/_/g, " "), job.workplaceType?.replace(/_/g, " "), job.status].filter(Boolean).forEach(value => {
      const tag = document.createElement("span"); tag.className = "pill"; tag.textContent = value; meta.append(tag);
    });
    const actions = document.createElement("div");
    const button = document.createElement("button"); button.className = "button secondary"; button.textContent = "View applications";
    button.addEventListener("click", () => {
      $("#application-job-filter").value = job.externalId || job.id;
      document.getElementById("applications").scrollIntoView({ behavior: "smooth" });
      loadApplications().catch(error => toast(error.message));
    });
    actions.append(button); card.append(details, actions); return card;
  }));
}

async function loadApplications() {
  $("#application-list").innerHTML = '<div class="empty">Loading applications…</div>';
  const params = new URLSearchParams({ limit: "100" });
  const jobId = $("#application-job-filter").value;
  const status = $("#application-status-filter").value;
  if (jobId) params.set("jobId", jobId);
  if (status) params.set("status", status);
  const payload = await requestApi("/applications?" + params);
  applications = payload.data || [];
  renderApplications();
}

function renderApplications() {
  const root = $("#application-list");
  if (!applications.length) { root.innerHTML = '<div class="empty">No applications found.</div>'; return; }
  root.replaceChildren(...applications.map(application => {
    const card = document.createElement("article"); card.className = "application-card";
    const details = document.createElement("div");
    details.innerHTML = '<div class="application-name"></div><div class="application-job"></div><div class="application-contact"></div><div class="meta-row"></div>';
    const candidate = application.candidate || {};
    const job = application.job || {};
    details.querySelector(".application-name").textContent = [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || "Candidate";
    details.querySelector(".application-job").textContent = job.title || "Job not available";
    details.querySelector(".application-contact").textContent = [candidate.email, candidate.currentTitle, candidate.location].filter(Boolean).join(" • ");
    const meta = details.querySelector(".meta-row");
    const date = document.createElement("span"); date.textContent = "Applied " + formatDate(application.submittedAt || application.createdAt);
    const resume = candidate.documents?.[0];
    meta.append(date);
    if (resume) { const tag = document.createElement("span"); tag.className = "pill"; tag.textContent = "Resume: " + resume.fileName; meta.append(tag); }

    const actions = document.createElement("div"); actions.className = "application-actions";
    const select = document.createElement("select");
    ["APPLIED","SCREENING","INTERVIEW","OFFER","ACCEPTED","REJECTED","WITHDRAWN"].forEach(value => select.add(new Option(value, value, false, application.status === value)));
    select.addEventListener("change", async () => {
      try {
        const payload = await requestApi("/applications/" + application.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: select.value }) });
        application.status = payload.data.status;
        toast("Application status updated");
      } catch (error) { toast(error.message); select.value = application.status; }
    });
    actions.append(select);
    card.append(details, actions); return card;
  }));
}

async function refreshDiscovery() {
  try {
    setConnection("Connecting to " + API_ORIGIN + "…", "info");
    await loadSearches();
    setConnection("Connected to talent discovery API", "success");
  } catch (error) {
    console.error(error);
    setConnection("Unable to load discovery data. The dashboard tried: " + API_ORIGIN + ". " + error.message, "error");
    $("#search-list").innerHTML = '<div class="empty">Discovery API is unavailable. Check the connection message above.</div>';
    $("#profile-list").innerHTML = '<div class="empty">Profiles will appear after the API connection is restored.</div>';
    toast(error.message);
  }
}

async function refreshRecruiting() {
  try {
    await loadJobs();
    await loadApplications();
  } catch (error) {
    console.error(error);
    toast(error.message);
    $("#job-list").innerHTML = '<div class="empty">Unable to load jobs.</div>';
    $("#application-list").innerHTML = '<div class="empty">Unable to load applications.</div>';
  }
}

$("#search-form").addEventListener("submit", async event => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const csv = name => String(formData.get(name) || "").split(",").map(v => v.trim()).filter(Boolean);
  try {
    await requestDiscovery("/searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: String(formData.get("name") || "").trim(), roles: csv("roles"), skills: csv("skills"), locations: csv("locations"), companies: csv("companies"), sources: csv("sources"),
    })});
    $("#search-dialog").close(); event.target.reset(); toast("Search created"); await refreshDiscovery();
  } catch (error) { toast(error.message); }
});

$("#new-search-btn").addEventListener("click", () => $("#search-dialog").showModal());
$("#close-dialog").addEventListener("click", () => $("#search-dialog").close());
$("#cancel-dialog").addEventListener("click", () => $("#search-dialog").close());
$("#refresh-searches").addEventListener("click", refreshDiscovery);
$("#refresh-profiles").addEventListener("click", refreshDiscovery);
$("#search-filter").addEventListener("change", renderProfiles);
$("#refresh-jobs").addEventListener("click", () => loadJobs().catch(error => toast(error.message)));
$("#job-search").addEventListener("change", () => loadJobs().catch(error => toast(error.message)));
$("#refresh-applications").addEventListener("click", () => loadApplications().catch(error => toast(error.message)));
$("#application-job-filter").addEventListener("change", () => loadApplications().catch(error => toast(error.message)));
$("#application-status-filter").addEventListener("change", () => loadApplications().catch(error => toast(error.message)));

refreshDiscovery();
refreshRecruiting();
