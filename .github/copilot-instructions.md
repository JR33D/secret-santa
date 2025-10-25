## Copilot onboarding instructions — secret-santa

Purpose: give an automated coding agent the essential facts and validated commands so it can make, build, and test changes with minimal exploratory searching.

Keep this file authoritative. Trust these steps first; only search the repo when the instructions are incomplete or fail.

### Quick summary

- What it is: a Next.js (React + TypeScript) web application for running a family "Secret Santa". It uses SQLite for simple data storage and includes server-side APIs and an email notification system.
- Languages & framework: TypeScript, JavaScript, React, Next.js (app router present under `src/app` / `src`), Tailwind CSS for styling. Tests use Jest + Testing Library.
- Primary runtimes: Node.js (CI uses Node 20). Dockerfile builds with Node 18 images; prefer Node 20 for local dev to match CI unless you have a specific reason to reproduce the container build exactly.

### Recommended environment (what the agent should assume)

- Node: use Node 20.x (GitHub Actions set node-version: '20').
- npm: use npm bundled with Node 20. Use `npm ci` in CI and reproducible environments.
- OS: CI runs ubuntu-latest. On developer machines Windows is supported; tests run under PowerShell in this repo's workspace context.

### Key repository scripts (authoritative list)

- npm ci — install cleanly in CI (preferred for reproducible installs).
- npm run dev — run Next.js in development (port 3000 by default).
- npm run build — build the Next.js production output.
- npm start — run the production server (after build).
- npm run lint — run Next.js/ESLint checks.
- npm run lint:fix — attempt to auto-fix lint problems.
- npm run format — format with Prettier.
- npm run clean — remove build artifacts (.next, coverage, build).
- npm test — run jest tests.
- npm run test:ci — CI-oriented jest run: `jest --ci --coverage --maxWorkers=2` (used by workflows).

Always-run rule: always run `npm ci` (or `npm install` for local iterative work) before building or running tests. When preparing a PR mimic CI: `npm ci && npm run lint && npx tsc --noEmit && npm run build && npm run test:ci`.

### Validated local sequence (what to run and in what order)

1. Clean workspace (optional but helpful): `npm run clean`.
2. Install dependencies: `npm ci` (preferred) or `npm install` for iterative development.
3. Type check: `npx tsc --noEmit` — makes sure types are ok without producing artifacts.
4. Run lint: `npm run lint`. Note: CI currently sets `continue-on-error: true` when lint runs; lint failures won't block CI but should be fixed in PRs.
5. Build: `npm run build`.
6. Run tests: `npm run test:ci` (or `npm test` locally). Tests include coverage; some tests use mocks defined under `__mocks__`.

Notes about order and pitfalls:

- CI uses `npm ci` (not `npm install`); for local development `npm install` is fine when you need to change package.json.
- Dockerfile is written to use Node 18 images for the container build; GitHub Actions use Node 20. When reproducing the container locally, prefer the Dockerfile's base image (node:18-alpine) to avoid build-time surprises.
- If build or tests fail due to native binary modules for sqlite, the repo contains `__mocks__` for sqlite and sqlite3 that tests rely on — ensure tests run using the jest configuration in `jest.config.js`.

### CI / GitHub workflows — what the agent should replicate

- The repo includes `.github/workflows/pr-test.yml` and `.github/workflows/docker-publish.yml`.
- Key pipeline steps to replicate locally when validating a PR:
  - Use Node 20 (Actions uses `actions/setup-node@v4` with `node-version: '20'`).
  - Run `npm ci`.
  - Run `npm run lint` (CI allows lint to continue on error, but PRs should aim to fix lint issues).
  - Run `npx tsc --noEmit` (type check).
  - Run `npm run build`.
  - Run `npm run test:ci`.

### Project layout & important paths (high priority to low)

- Root files: `package.json`, `tsconfig.json`, `next.config.mjs`, `jest.config.js`, `Dockerfile`, `docker-compose.yml`, `README.md`.
- App source: `src/` (contains `app/`, `components/`, `lib/` — main Next.js pages and components live here). Some compiled/coverage HTML exists in `coverage/` but ignore it for edits.
- Config & tooling: `.github/workflows/*` (CI), `jest.config.js` (test runner), `tsconfig.json` (tsc settings), `tailwind.config.mjs`, `postcss.config.mjs`.
- Tests: `__tests__/` and `src/**/__tests__` (many tests already present). Mocks are in `__mocks__/` to avoid native sqlite calls during tests.
- Data: `data/secret-santa.db` (local SQLite file used for local dev or demos). Treat it as local state; do not commit large DB changes in PRs.

Key files to look at first when making changes

- `src/lib/db.ts` — database access helpers. (If editing DB schema or queries, update tests and consider migrations.)
- `src/lib/api.ts` and `src/app/api` — server API routes.
- `src/components/*` and `src/app/*` — UI components and layout.
- `jest.config.js` and `jest.setup.js` — test runner configuration.

### Tests and flakiness

- The project uses Jest with `jest-environment-jsdom` and collects coverage. Coverage thresholds are enforced in `jest.config.js` (global 70%).
- Some tests may depend on process env or on mocked modules. If tests fail locally but pass in CI, check NODE environment and whether you used `npm ci` vs `npm install` (dependency tree drift can cause different outcomes).

### Docker notes

- Dockerfile builds using `node:18-alpine` and creates a standalone `.next` output — reproducing the Docker build exactly requires using the Dockerfile steps (the container build process executes `npm run build` inside a node:18 image).
- There is a `test-docker.sh` helper in the repo root; CI also does a container startup test (build, run, curl to health endpoint). When validating container behavior locally, run the same steps as CI: build the image and test HTTP health on port 3000.

### Agent operating rules (how to minimize rejected PRs)

1. Trust this document first. Follow the “Always-run” rules (npm ci, tsc, build, tests) before making a PR.
2. Before pushing a PR, run the exact CI validation locally (or in a disposable container): `npm ci && npm run lint && npx tsc --noEmit && npm run build && npm run test:ci`.
3. If making code changes that touch server-side code or DB access, run tests and also run the app locally (`npm run dev`) to smoke-test critical API endpoints (for example, `/api/health`, `/api/*` used by the frontend).
4. Avoid changing Node major version without updating CI/workflow files. CI expects Node 20; Dockerfile uses Node 18 for container images.
5. If tests rely on sqlite or native modules, prefer editing mock files in `__mocks__` and update tests accordingly. Don't commit real DB snapshots.

### Quick-checklist before opening a PR

- Run `npm ci` (or `npm install` when iterating).
- Run `npx tsc --noEmit` and fix type issues.
- Run `npm run format` to ensure consistent code style.
- Run `npm run lint` and `npm run lint:fix` where appropriate.
- Run `npm run build` and `npm start` (or `npm run dev` for local dev) to smoke-test.
- Run `npm run test:ci` and ensure tests and coverage meet thresholds.

### When to search the repo

- Only perform searches when the instruction set above does not answer the question you need (for example, locating an obscure helper or a specific API route). If you search, use the likely high-priority paths first: `src/lib`, `src/app`, `src/components`, `__tests__`, and `.github/workflows`.

---

This document is intentionally concise. If you need more detail about a specific subsystem (database, email templates, or deployment pipeline), open a targeted follow-up request and include the file(s) you plan to change so the agent can expand guidance for that area.
