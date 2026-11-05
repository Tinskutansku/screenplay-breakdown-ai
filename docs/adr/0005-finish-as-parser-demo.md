# ADR-0005: Finish the project as a stateless parser demo

**Status:** Accepted
**Date:** 2026-11-05
**Deciders:** Tanja

## Context

Active development of this project has ended, and the full multi-user production product planned in ADR-0001 to ADR-0004 will not be built.

At this point the repository mixed two kinds of code:

- Working and tested: the `.txt` / `.fdx` parser, keyword-based element extraction, the React UI, and the JWT/password-hashing building blocks.
- Scaffolding for a future that will not happen: `/auth/register` and `/auth/login` returning HTTP 501, Google OAuth route stubs, and `GET /scenes` returning one hard-coded scene. None of it is connected to a database.

A visitor (for example a recruiter) opening the repository or a running instance could not tell which parts were real. A fresh clone also failed four tests, because `passlib` 1.7.4 breaks with `bcrypt` 5.x, which an unpinned install pulls in.

## Decision

Ship what works as a finished, stateless demo, and remove everything that only pretends to work.

1. Remove the auth router, auth models, security service, `dependencies.py`, `config.py`, `.env.example` and their tests. The full auth implementation stays reachable on the git branch `auth-groundwork` and is documented in ADR-0001.
2. Remove the hard-coded `GET /scenes`. The UI starts empty and offers a bundled example screenplay (`frontend/public/esimerkit/`) in both `.txt` and `.fdx` form.
3. Keep `SQL/schema.sql` and ADR-0001 to ADR-0004 as design documentation of how the product would have grown, clearly labelled as not wired.
4. Deploy as one container: FastAPI serves both the API and the built React app from the same origin (`Dockerfile`, `render.yaml`), so no CORS, environment variables or second service are needed in production.

## Options considered

**Keep the auth endpoints, pin `bcrypt`.** Smallest change, but leaves 501 endpoints and OAuth stubs in a "finished" project. Rejected: unfinished code reads as abandoned, not as groundwork.

**Wire PostgreSQL and finish auth (full MVP).** Most impressive end state, but it is exactly the open-ended continuation this decision is closing down. Rejected.

**Archive as-is.** No effort, but keeps the misleading stubs and the failing fresh-clone test run. Rejected.

## Consequences

- Every endpoint and screen in the running app does what it appears to do. 39 backend tests, all green on a fresh install.
- Dependencies shrink to FastAPI, Pydantic, python-multipart and Uvicorn. No secrets are needed to run or deploy.
- The authentication work is no longer on `main`. It is preserved, tested, on branch `auth-groundwork`.
- The schema in `SQL/schema.sql` has never been run against a real PostgreSQL instance and now never will be as part of this project.
