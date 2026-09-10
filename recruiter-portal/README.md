# Headsbase External Recruiter Portal

This folder is a separate, front-end-only recruiter collaboration product. It does not replace or alter the public Careers pages in the repository.

## Local development

Run `npm run dev:recruiter` from the repository root. On a local host, the portal defaults to a local development adapter with realistic sample data. It does not make a network request, contact the existing Railway API, contact an ATS, or save passwords.

Visit `http://localhost:5501/#/login`. Any syntactically valid email and password of eight or more characters can be used in development mode. A signup flow starts unverified and guides the user through email confirmation and onboarding. The mock session is limited to the current browser session and contains no password or token.

Append `?demo=empty` before the hash, for example `http://localhost:5501/?demo=empty#/jobs`, to inspect no-data states locally.

## Production authentication boundary

The portal intentionally does not select or configure an external identity provider. The right integration point for this product is the future HTN API authentication service:

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`
- `POST /auth/forgot-password`, `POST /auth/verify-email`
- `GET /auth/me`

The browser client uses `credentials: "include"` and expects the HTN API to issue and rotate a `Secure`, `HttpOnly`, `SameSite` session cookie. No access token, password, recruiter identifier, or organization identifier is stored in JavaScript or passed as a client-chosen request header.

For a deployed site, inject a public runtime config object before the module bundle loads. Copy the structure in `portal-config.example.js` into the hosting template or a non-committed `portal-config.js`; do not add credentials to it. A non-local portal without runtime API configuration shows a safe configuration error and does not call any endpoint.

## Required environment configuration

The static portal cannot read server environment variables directly. Its host should expose only these public runtime values:

| Environment variable | Purpose |
| --- | --- |
| `HTN_RECRUITER_PORTAL_AUTH_MODE` | Set to `api` to activate the HTN API gateway. |
| `HTN_RECRUITER_PORTAL_API_ORIGIN` | Public HTTPS origin of the future HTN API; no trailing slash. |

Session signing keys, email-provider keys, database credentials, and ATS credentials belong in the HTN API environment only. They must never be delivered to this portal or committed to Git.

## Organization isolation contract

The future HTN API must derive the recruiter user and organization from the authenticated session on every request and enforce membership plus assignment scope server-side. The portal never asks for an organization ID and will call only recruiter-scoped resources:

- `GET /recruiter/dashboard`
- `GET /recruiter/jobs` and `GET /recruiter/jobs/:id`
- `GET /recruiter/candidates`
- `GET /recruiter/submissions`
- `GET/PATCH /recruiter/profile`

The API must return only jobs that Headsbase shared with the authenticated organization or assigned to the authenticated recruiter. Frontend filters are solely presentation controls, never authorization.

## Intentionally deferred

This phase does not include ATS connectivity, ATS data sync, job assignment, recruiter invitations, actual candidate storage/submission, profile photo upload, password email delivery, organization authorization backend, or any recruiter score, rank, commission, payment, matching, enrichment, or agent feature.
