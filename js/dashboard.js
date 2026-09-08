const DEFAULT_PRODUCTION_API = "https://htn-api-production-ab6d.up.railway.app";
const ORGANIZATION_ID = "0e6f5b36-98aa-4d84-a142-b48c6dd3eb1f";

function resolveApiOrigin() {
  const queryOrigin = new URLSearchParams(window.location.search).get("api");
  const savedOrigin = window.localStorage.getItem("htn-api-origin");

  if (queryOrigin) return queryOrigin.replace(/\/$/, "");
  if (savedOrigin) return savedOrigin.replace(/\/$/, "");

  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:3000";
  }

  return DEFAULT_PRODUCTION_API;
}

let API_ORIGIN = resolveApiOrigin();
let API_BASE = API_ORIGIN + "/api/discovery";
const $ = s => document.querySelector(s);
const headers = () => ({ Accept: "application/json", "x-organization-id": ORGANIZATION_ID });
let searches = [];
let profiles = [];

function setConnection(message, type = "info") {
  const el = $("#connection-status");
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.className = "connection-status " + type;
  el.textContent = message;
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(API_BASE + path, {
      ...options,
      headers: { ...headers(), ...(options.headers || {}) },
    });
  } catch {
    throw new Error("Cannot reach the discovery API at " + API_ORIGIN);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed with status " + response.status);
  }

  return payload.data;
}

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadSearches() {
  $("#search-list").innerHTML = '<div class="empty">Loading discovery searches…</div>';

  const data = await request("/searches?limit=100");
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

  if (!searches.length) {
    root.innerHTML = '<div class="empty">No discovery searches yet. Create your first one.</div>';
    return;
  }

  root.replaceChildren(...searches.map(search => {
    const item = document.createElement("article");
    item.className = "search-item";

    const details = document.createElement("div");
    details.innerHTML =
      '<div class="search-name"></div>' +
      '<div class="query"></div>' +
      '<div class="meta-row"></div>';

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
    button.className = "button secondary";
    button.type = "button";
    button.textContent = search.status === "ACTIVE" ? "Run search" : "Activate";
    button.addEventListener("click", () => {
      if (search.status === "ACTIVE") executeSearch(search.id);
      else activateSearch(search.id);
    });

    actions.append(button);
    item.append(details, actions);
    return item;
  }));
}

async function activateSearch(id) {
  try {
    await request("/searches/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });

    toast("Search activated");
    await refreshAll();
  } catch (error) {
    toast(error.message);
  }
}

async function executeSearch(id) {
  try {
    toast("Running search…");

    await request("/searches/" + id + "/execute", {
      method: "POST",
    });

    toast("Search completed");
    await refreshAll();
  } catch (error) {
    toast(error.message);
  }
}

async function loadProfiles() {
  $("#profile-list").innerHTML = '<div class="empty">Loading discovered profiles…</div>';
  profiles = [];

  for (const search of searches) {
    try {
      const runs = await request("/searches/" + search.id + "/runs");
      const latestRun = runs[0];

      if (!latestRun) continue;

      const runProfiles = await request("/runs/" + latestRun.id + "/profiles");

      profiles.push(...runProfiles.map(profile => ({
        ...profile,
        searchId: search.id,
        searchName: search.name,
      })));
    } catch (error) {
      console.error("Failed to load profiles for search", search.id, error);
    }
  }

  $("#metric-profiles").textContent = profiles.length;

  const latest = [...profiles].sort(
    (a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt),
  )[0];

  $("#metric-latest").textContent = latest
    ? formatDate(latest.discoveredAt)
    : "—";

  renderProfiles();
}

function renderProfiles() {
  const selectedSearchId = $("#search-filter").value;

  const items = profiles
    .filter(profile => !selectedSearchId || profile.searchId === selectedSearchId)
    .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));

  const root = $("#profile-list");

  if (!items.length) {
    root.innerHTML = '<div class="empty">No discovered profiles to show for this search.</div>';
    return;
  }

  root.replaceChildren(...items.map(profile => {
    const card = document.createElement("article");
    card.className = "profile-card";

    const details = document.createElement("div");
    details.innerHTML =
      '<div class="profile-name"></div>' +
      '<div class="profile-headline"></div>' +
      '<div class="profile-snippet"></div>' +
      '<div class="meta-row"></div>';

    details.querySelector(".profile-name").textContent =
      profile.name || profile.headline || "Discovered profile";

    details.querySelector(".profile-headline").textContent =
      profile.headline || "Public profile";

    details.querySelector(".profile-snippet").textContent =
      profile.snippet || "No snippet available.";

    const meta = details.querySelector(".meta-row");
    const status = document.createElement("span");
    status.className = "pill";
    status.textContent = profile.status || "NEW";

    const searchName = document.createElement("span");
    searchName.textContent = profile.searchName;

    meta.append(status, searchName);

    const actions = document.createElement("div");
    actions.className = "profile-actions";

    if (profile.profileUrl) {
      const link = document.createElement("a");
      link.href = profile.profileUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View profile ↗";
      actions.append(link);
    }

    card.append(details, actions);
    return card;
  }));
}

async function refreshAll() {
  try {
    setConnection("Connecting to " + API_ORIGIN + "…", "info");
    await loadSearches();
    setConnection("Connected to talent discovery API", "success");
  } catch (error) {
    console.error(error);

    setConnection(
      "Unable to load discovery data. The dashboard tried: " +
      API_ORIGIN +
      ". " +
      error.message,
      "error",
    );

    $("#search-list").innerHTML =
      '<div class="empty">Discovery API is unavailable. Check the connection message above.</div>';

    $("#profile-list").innerHTML =
      '<div class="empty">Profiles will appear after the API connection is restored.</div>';

    toast(error.message);
  }
}

$("#search-form").addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const csv = name =>
    String(formData.get(name) || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);

  try {
    await request("/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") || "").trim(),
        roles: csv("roles"),
        skills: csv("skills"),
        locations: csv("locations"),
        companies: csv("companies"),
        sources: csv("sources"),
      }),
    });

    $("#search-dialog").close();
    event.target.reset();

    toast("Search created");
    await refreshAll();
  } catch (error) {
    toast(error.message);
  }
});

$("#new-search-btn").addEventListener("click", () => $("#search-dialog").showModal());
$("#close-dialog").addEventListener("click", () => $("#search-dialog").close());
$("#cancel-dialog").addEventListener("click", () => $("#search-dialog").close());

$("#refresh-searches").addEventListener("click", refreshAll);
$("#refresh-profiles").addEventListener("click", refreshAll);
$("#search-filter").addEventListener("change", renderProfiles);

refreshAll();