# FE-001: Scaffold React TypeScript application

Status: DONE
Priority: P0
Area: Frontend
Related specs: FE-000
Depends on: none

## Goal

Create the minimal strict Vite React project, lock dependencies, and feature folder skeleton.

## Allowed scope

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig*.json`
- `frontend/src/`

## Required reading

- `AGENTS.md`
- `frontend/AGENTS.md` 
- `specs/frontend/FE-000-foundation.md`
- Relevant files in `docs/guardrails/` and `docs/tech/`

## Implementation steps

1. Initialize React TypeScript with strict settings.
2. Install only approved runtime/test dependencies and one UI library.
3. Create app/api/auth/components/features/i18n/test folders.
4. Configure lint, formatter, Vitest, Testing Library, typecheck, and build scripts.
5. Remove default demo code.

## Acceptance criteria

- [x] Locked install is reproducible.
- [x] Typecheck/lint/test/build smoke commands pass.
- [x] No class component or generic CRUD generator is added.

## Verification commands

```bash
cd frontend && npm ci
cd frontend && npm run typecheck
cd frontend && npm test -- --run
cd frontend && npm run build
```

## Out of scope

- App shell, API calls, and feature screens.

## Codex execution log

- Started: 2026-07-14
- Completed: 2026-07-14
- Files changed: `frontend/package.json`, `frontend/package-lock.json`, `frontend/index.html`, `frontend/eslint.config.js`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/src/main.tsx`, `frontend/src/vite-env.d.ts`, `frontend/src/app/App.tsx`, `frontend/src/app/App.test.tsx`, `frontend/src/app/styles.css`, `frontend/src/test/setup.ts`, `frontend/src/api/.gitkeep`, `frontend/src/auth/.gitkeep`, `frontend/src/components/.gitkeep`, `frontend/src/features/.gitkeep`, `frontend/src/i18n/.gitkeep`, `tasks/frontend/FE-001-scaffold-react-typescript-application.md`, `AI_USAGE.md`
- Commands run:
  - `npm install` (initial lock generation)
  - `npm install` (after switching from deprecated ESLint 8 package config to ESLint 9 flat config)
  - `npm run format`
  - `npm ci` (initial parallel verification run succeeded, but concurrent typecheck/test/build/lint commands saw `node_modules` mid-rebuild and failed with missing modules)
  - `npm run typecheck` (initial sequential run failed because Vite's `defineConfig` type does not include Vitest `test`; fixed by importing from `vitest/config`)
  - `npm ci`
  - `npm run typecheck`
  - `npm test -- --run`
  - `npm run build`
  - `npm run lint`
  - `npm run format:check`
  - `/usr/bin/python3 scripts/check_simplicity.py frontend`
  - `/usr/bin/python3 scripts/validate_docs.py` (initial extra guard run failed while `frontend/node_modules` existed because third-party package READMEs contain broken relative links; passed after removing generated dependency/build artifacts)
- Result: Passed. `npm ci` installed from the lockfile with 0 vulnerabilities; typecheck passed; Vitest reported 1 test file and 1 test passed; Vite production build passed; lint, Prettier check, frontend simplicity check scanned 7 source files, and repository docs validation passed.
- Deviations/questions: No unresolved questions. `frontend/index.html` and `frontend/eslint.config.js` were necessary for a standard Vite app and current ESLint 9 configuration but were not listed in the task's allowed scope. No app shell, API calls, auth flow, feature screens, class components, HOC factories, or generic CRUD generator were added.
