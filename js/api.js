const PRODUCTION_ORIGIN = "https://htn-api-production.up.railway.app";
const API_PATH = "/api/jobs";
const LOCAL_API = `${PRODUCTION_ORIGIN}${API_PATH}`;

function getEndpoints(path = API_PATH) {
    const endpoints = [path];

    if (window.location.origin !== LOCAL_API) {
        endpoints.push(`${PRODUCTION_ORIGIN}${path}`);
    }

    return endpoints;
}

export async function fetchJobs({
    page = 1,
    limit = 20,
    search,
    company,
    employmentType,
    locationType,
    remote,
    source,
    posted,
    sort,
} = {}) {
    let lastError;

    for (const endpoint of getEndpoints()) {
        console.log("Trying endpoint:", endpoint);
        try {
            const url = endpoint.startsWith("http")
            ? new URL(endpoint)
            : new URL(endpoint, window.location.origin);

            console.log("Fetching:", url.toString());

            url.searchParams.set("page", page);
            url.searchParams.set("limit", limit);

            

            if (search) url.searchParams.set("search", search);
            if (company) url.searchParams.set("company", company);
            if (employmentType) url.searchParams.set("employmentType", employmentType);
            if (locationType) url.searchParams.set("locationType", locationType);
            if (source) url.searchParams.set("source", source);
            if (posted) url.searchParams.set("posted", posted);
if (sort) url.searchParams.set("sort", sort);

            if (remote !== undefined) {
                url.searchParams.set("remote", remote);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Jobs request failed with ${response.status}`);
            }

            const payload = await response.json();

            if (!payload.success || !Array.isArray(payload.data)) {
                throw new Error("Jobs response was not in the expected format");
            }

            return {
                jobs: payload.data,
                pagination: payload.pagination,
            };
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Jobs request failed");
}

export async function findJobById(jobId) {
    let lastError;

    for (const endpoint of getEndpoints()) {
        try {
            const response = await fetch(`${endpoint}/${jobId}`, {
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    lastError = new Error("Job not found on this endpoint");
                    continue;
                }
            
                throw new Error(`Job request failed with ${response.status}`);
            }

            const payload = await response.json();

            if (!payload.success) {
                throw new Error("Job response was not in the expected format");
            }

            return payload.data;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Job request failed");
}

export async function applyApplication(application) {
    let lastError;

    for (const endpoint of getEndpoints("/api/applications")) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(application),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const error = new Error(
                    `Application submission failed with ${response.status}`,
                );
                error.status = response.status;
                error.payload = payload;
                throw error;
            }

            return payload;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Application submission failed");
}