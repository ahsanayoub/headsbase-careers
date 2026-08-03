console.log("MAIN.JS VERSION - JULY 30", new Date().toISOString());
import { fetchJobs } from "./api.js";
import { createJobCard, createSkeletonCards, createState, textFrom } from "./render.js";

const grid = document.querySelector("#jobs-grid");
const count = document.querySelector("#jobs-count");
const search = document.querySelector("#job-search");
const loadMore = document.querySelector("#load-more");
const statusRegion = document.querySelector("#status-region");
const locationFilter = document.querySelector("#location-filter");
const employmentFilter = document.querySelector("#employment-filter");
const companyFilter = document.querySelector("#company-filter");
const postedFilter = document.querySelector("#posted-filter");
const sortFilter = document.querySelector("#sort-filter");
const activeFilters = document.querySelector("#active-filters");
const clearFilters = document.querySelector("#clear-filters");

let jobs = [];

let currentPage = 1;

let hasMore = false;
let isLoading = false;

const PAGE_SIZE = 20;

function init() {
  [
      search,
      locationFilter,
      employmentFilter,
      companyFilter,
      postedFilter,
      sortFilter,
  ].forEach((control) => {
      control.addEventListener("input", handleFiltersChanged);
      control.addEventListener("change", handleFiltersChanged);
  });

  clearFilters.addEventListener("click", resetFilters);

  activeFilters.addEventListener(
      "pointerdown",
      handleFilterChipInteraction
  );

  activeFilters.addEventListener(
      "click",
      handleFilterChipInteraction
  );

  loadMore.addEventListener("click", () => {
      if (!hasMore || isLoading) {
          return;
      }

      loadJobs(currentPage + 1);
  });

  loadJobs();
}

function handleFiltersChanged() {
  currentPage = 1;

  loadJobs(1);
}


function handleFilterChipInteraction(event) {
    const chip = event.target.closest(".filter-chip");

    if (chip) {
      event.preventDefault();
      clearFilter(chip.dataset.filter);
    }
}

async function loadJobs(page = 1) {
  if (isLoading) return;

  isLoading = true;
  loadMore.hidden = true;

  statusRegion.textContent =
    page > 1 ? "Loading more roles..." : "Loading roles...";

  if (page === 1) {
    grid.replaceChildren(...createSkeletonCards(4));
    grid.setAttribute("aria-busy", "true");
  } else {
    loadMore.disabled = true;
  }

  try {
    const result = await fetchJobs({
      ...getFilterState(),
      page,
      limit: PAGE_SIZE,
    });

    currentPage = result.pagination.page;
    hasMore = result.pagination.hasMore;

    jobs =
      page === 1
        ? result.jobs
        : [...jobs, ...result.jobs];

    populateFilterOptions();
    renderJobs();

    statusRegion.textContent = "";
  } catch (error) {
    console.error(error);

    count.textContent = "Roles unavailable";

    grid.replaceChildren(
      createState({
        title: "We could not load open roles",
        message:
          "The jobs service may still be starting. Please try again.",
        actionLabel: "Try again",
        onAction: () => loadJobs(page),
        tone: "error",
      })
    );
  } finally {
    isLoading = false;

    grid.setAttribute("aria-busy", "false");

    loadMore.disabled = false;
  }
}

function renderJobs() {
  const state = getFilterState();
  const visibleJobs = jobs;

  renderActiveFilters(state);
  count.textContent = formatCount(visibleJobs.length, hasActiveFilters(state));

  if (!visibleJobs.length) {
    grid.replaceChildren(
      createState({
        title: hasActiveFilters(state) ? "No roles match those filters" : "No open roles right now",
        message: hasActiveFilters(state)
          ? "Try adjusting the filters or clearing them to see every open role."
          : "Check back soon for new opportunities at Headsbase.",
        actionLabel: hasActiveFilters(state) ? "Clear filters" : undefined,
        onAction: hasActiveFilters(state) ? resetFilters : undefined,
      }),
    );
   
loadMore.hidden = !hasMore;
    return;
  }

  const cards = visibleJobs.map(createJobCard);


grid.replaceChildren(...cards);

  loadMore.hidden = !hasMore;
}

function populateFilterOptions() {
  updateSelectOptions(employmentFilter, "Employment", uniqueValues("employmentType"));
  updateSelectOptions(companyFilter, "Company", uniqueValues("company"));
}

function updateSelectOptions(select, placeholder, values) {
  const currentValue = select.value;
  select.replaceChildren(new Option(placeholder, ""));

  values.forEach((value) => {
    select.add(new Option(value, normalizeValue(value)));
  });

  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function uniqueValues(key) {
  return [...new Set(jobs.map((job) => textFrom(job[key], "")).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function getFilterState() {
  return {
      page: currentPage,
      limit: PAGE_SIZE,

      search: search.value.trim(),

      company: companyFilter.value,

      employmentType: employmentFilter.value,

      locationType: locationFilter.value,

      posted: postedFilter.value
          ? Number(postedFilter.value)
          : undefined,

      sort: sortFilter.value,
  };
}

function renderActiveFilters(state) {
  const filters = [
    state.search && {
      key: "search",
      label: `Search: ${state.search}`,
    },

    state.locationType && {
      key: "locationType",
      label: selectedText(locationFilter),
    },

    state.employmentType && {
      key: "employmentType",
      label: selectedText(employmentFilter),
    },

    state.company && {
      key: "company",
      label: selectedText(companyFilter),
    },

    state.posted && {
      key: "posted",
      label: selectedText(postedFilter),
    },

    state.sort === "oldest" && {
      key: "sort",
      label: "Oldest first",
    },
  ].filter(Boolean);

  activeFilters.replaceChildren(...filters.map(createFilterChip));
  clearFilters.hidden = filters.length === 0;
}

function createFilterChip(filter) {
  const button = document.createElement("button");
  const label = document.createElement("span");
  const close = document.createElement("span");

  button.type = "button";
  button.className = "filter-chip";
  button.dataset.filter = filter.key;
  button.setAttribute("aria-label", `Remove ${filter.label} filter`);

  label.textContent = filter.label;
  close.setAttribute("aria-hidden", "true");
  close.innerHTML = "&times;";

  button.append(label, close);
  return button;
}

function clearFilter(key) {
  const controls = {
    search: search,
    locationType: locationFilter,
    employmentType: employmentFilter,
    company: companyFilter,
    posted: postedFilter,
    sort: sortFilter,
  };

  const control = controls[key];

  if (!control) {
    return;
  }

  control.value = key === "sort" ? "newest" : "";

  handleFiltersChanged();
}

function resetFilters() {
  search.value = "";

  locationFilter.value = "";

  employmentFilter.value = "";

  companyFilter.value = "";

  postedFilter.value = "";

  sortFilter.value = "newest";

  currentPage = 1;

  loadJobs(1);
}

function hasActiveFilters(state) {
  return Boolean(
    state.search ||
    state.locationType ||
    state.employmentType ||
    state.company ||
    state.posted ||
    state.sort === "oldest"
  );
}

function selectedText(select) {
  return select.selectedOptions[0]?.textContent || "";
}

function normalizeValue(value) {
  return textFrom(value, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatCount(value, filtered) {
  const noun = value === 1 ? "role" : "roles";
  return filtered ? `${value} matching ${noun}` : `${value} open ${noun}`;
}
init();