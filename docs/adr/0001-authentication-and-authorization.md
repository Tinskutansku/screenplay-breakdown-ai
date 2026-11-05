# ADR-0001: Authentication and authorization model

**Status:** Accepted, implementation archived on branch `auth-groundwork` (see ADR-0005)
**Date:** 2026-07-07
**Deciders:** Tanja

## Context

Film AI Breakdown is moving from a single-user local prototype toward a real multi-user product. The SQL schema already models projects owned by a user, and the product roadmap explicitly includes shared production-team workflows: breaking a script into scenes, deriving schedule strips from it, combining those into a stripboard/calendar view, and generating a daily call sheet from the schedule. That roadmap only makes sense if more than one person (script supervisor, 1st AD, production coordinator, etc.) can work on the same project - a single-owner project model can't support that without a rework later.

No database is connected yet. This is the right moment to decide the auth/authorization model, since retrofitting it onto an existing multi-tenant schema and a set of already-shipped endpoints is much more painful than deciding it now.

Constraints gathered from the stakeholder:
- No fixed timeline - "do it properly," not rushed
- Both email/password and OAuth (Google to start) login are wanted
- No email-sending service is set up yet (no way to send verification/reset emails today)
- Planned hosting is a cloud PaaS (Render/Railway/Fly.io-style), not a single fixed server

## Decision

Use JWT-based stateless authentication: a short-lived access token plus a longer-lived, revocable refresh token. Support two login paths against one underlying user identity:

1. Email + password, hashed with bcrypt (via `passlib`)
2. OAuth 2.0 via Google (via `authlib`), extensible to GitHub/other providers later without changing the token model

Authorization is enforced per-project via a `project_members` table (project_id, user_id, role), replacing the current single-owner `projects.user_id` column, because the roadmap explicitly requires shared team access to a project's schedule and breakdown data.

## Options considered

### Option A: JWT (access + refresh tokens), stateless

| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Cost | None extra |
| Scalability | Good - stateless, works cleanly across multiple instances on a PaaS |
| Team familiarity | Standard, well-documented pattern for FastAPI |

Pros: no server-side session store needed; scales horizontally without shared state; industry-standard pattern with mature libraries (`python-jose`, `authlib`).
Cons: revoking a compromised access token before it naturally expires needs either a short expiry + refresh rotation, or a token blocklist.

### Option B: Server-side sessions (cookie + session store)

| Dimension | Assessment |
|---|---|
| Complexity | Low-medium |
| Cost | Needs Redis or a DB-backed session store |
| Scalability | Requires a shared session store once more than one instance runs |
| Team familiarity | Simple mental model |

Pros: instant revocation (delete the session server-side); no token-refresh dance.
Cons: needs a shared store (Redis/DB) as soon as there's more than one server process; mixes a bit awkwardly with an OAuth login path.

### Option C: Third-party auth provider (Auth0 / Clerk / Supabase Auth)

| Dimension | Assessment |
|---|---|
| Complexity | Low (delegated) |
| Cost | Free tier, then paid per active user |
| Scalability | Handled by the provider |
| Team familiarity | New external dependency to learn |

Pros: password resets, email verification, OAuth and MFA come out of the box - solves the "no email service yet" gap immediately.
Cons: recurring cost as the user base grows; some vendor lock-in; less control over the exact `users`/`projects` data model already sketched out in `schema.sql`.

## Trade-off analysis

Given "no rush, do it well" and a genuine multi-user product goal, Option A fits best: no recurring third-party cost, full control over the schema that's already been designed, and it's the standard, well-supported pattern for a FastAPI backend deployed on a PaaS. Option C isn't wrong - it's worth revisiting if password-reset/email-verification upkeep becomes a burden later - but it outsources exactly the schema control this project already wants. Option B is reasonable but doesn't clearly beat Option A here, and buys less flexibility for mixing password and OAuth logins against the same account.

## Consequences

- Need: `password_hash` column on `users` (schema currently has none)
- Need: `oauth_accounts` table (`provider`, `provider_user_id`, `user_id`) so a Google login and an email/password login can resolve to the same user
- Need: `project_members` table (`project_id`, `user_id`, `role`) replacing the single-owner `projects.user_id`, to support the stripboard/call-sheet team workflows
- Need: `SECRET_KEY` / JWT signing key managed via `.env`, never committed
- Gap: with no email service yet, password-reset and email-verification flows can be designed now but must degrade gracefully - new accounts start unverified and nothing blocks on verification until an email provider (Resend/Postmark/SendGrid, etc.) is chosen
- Harder: revoking a token before its natural expiry - mitigated with short-lived access tokens (~15 min) plus refresh-token rotation, with refresh tokens revocable in the database
- Easier: horizontal scaling later on Render/Railway/Fly.io, since auth state isn't pinned to a specific server instance

## Action items

1. [x] Update SQL schema: `password_hash` on `users`, add `oauth_accounts`, add `project_members`
2. [x] Add auth dependencies to `backend/requirements.txt` (`passlib[bcrypt]`, `python-jose[cryptography]`, `authlib`)
3. [x] Build password hashing + JWT create/verify utilities
4. [x] Build `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/google` endpoint scaffolding (DB read/write parts marked as pending actual DB integration)
5. [x] Build `get_current_user` FastAPI dependency (token validation is real and tested now; DB user lookup is a marked TODO until the database is wired)
6. [x] Add `SECRET_KEY` and Google OAuth client id/secret placeholders to `.env.example`
7. [ ] When the database is wired: implement the actual user/oauth_account/project_member reads and writes behind these endpoints
8. [ ] When an email provider is chosen: wire up real email verification and password-reset emails
9. [ ] Register a Google OAuth client (Google Cloud Console) and fill in real credentials in `.env` - a placeholder can't be generated from code
