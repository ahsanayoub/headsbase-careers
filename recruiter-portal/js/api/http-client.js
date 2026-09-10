export class HttpError extends Error {
  constructor(message, status, payload = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

function isJsonResponse(response) {
  return response.headers.get("content-type")?.includes("application/json");
}

/**
 * All production requests use a same-site, HttpOnly session cookie. The portal
 * never reads, persists, or adds an organization identifier or access token.
 */
export class HttpClient {
  constructor({ origin }) {
    this.origin = origin;
  }

  async request(path, { method = "GET", body, allowUnauthorized = false } = {}) {
    const headers = { Accept: "application/json" };
    const options = {
      method,
      credentials: "include",
      headers,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(`${this.origin}${path}`, options);
    } catch {
      throw new HttpError("We could not reach the recruiter service.", 0);
    }

    const payload = isJsonResponse(response) ? await response.json().catch(() => ({})) : {};

    if (!response.ok) {
      const error = new HttpError(
        payload.message || "The recruiter service could not complete that request.",
        response.status,
        payload,
      );

      if (response.status === 401 && !allowUnauthorized) {
        window.dispatchEvent(new CustomEvent("portal:session-expired"));
      }

      throw error;
    }

    return payload.data ?? payload;
  }
}
