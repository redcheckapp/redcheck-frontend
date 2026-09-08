# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

RedCheck is an interactive time/task management SPA that uses AI ("SmartCheck AI") to prioritize daily workloads (risk level, execution order, reasoning). This repo is the **frontend only** — the backend lives in a sibling repo at `../redcheck-backend` (not part of this working directory, but available locally for reference if API contract context is needed).

Write new code comments and commit messages in English, even though some existing code (e.g. `ThemeContext.tsx`) has Spanish comments/names.

Commits follow Conventional Commits style: `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `docs: ...`, etc.

There is no automated test suite in this project, and none is planned — don't introduce a test framework unless explicitly asked.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc -b && vite build (type-checks, then bundles)
npm run lint      # eslint .
npm run preview   # preview the production build locally
```

## Environment

- `VITE_API_URL` — base URL for the backend API, consumed by `src/api/axiosConfig.ts` at build time. Set via `.env` locally, or passed as a Docker build ARG in production (see `Dockerfile`).
- Production deploy is Docker + NGINX: Vite build output is served statically, and NGINX reverse-proxies API paths (`/auth`, `/users`, `/subjects`, `/tasks`, `/recurring_tasks`, `/progress_records`, `/notifications`, `/ai`, etc.) to the backend container. See `nginx.conf` for the exact route table if adding a new API domain that needs proxying.

## Architecture

**Layering:** the codebase strictly separates presentation from data access from global state:

- `src/api/` — one file per backend domain (`authApi.ts`, `taskApi.ts`, `subjectApi.ts`, `recurringTaskApi.ts`, `progressRecordApi.ts`, `smartCheckApi.ts`, `userApi.ts`, `registerApi.ts`), all built on a shared Axios instance in `axiosConfig.ts`. That instance auto-attaches `Authorization: Bearer <token>` from `localStorage` via a request interceptor — new API calls should go through this `api` instance rather than raw `axios`/`fetch`, and API functions should be fully typed against `src/types/index.ts`. A response interceptor there also clears the token and redirects to `/login` on a 401 for a request that carried a token (a plain failed-login 401, with no token yet, is left alone so the caller's own error message still shows).
- `src/context/` — global state via React Context, not a state library. `ThemeContext` and `LanguageContext` follow the same pattern: state is initialized with a priority chain (shared cookie → `localStorage` → system/browser preference) and persisted back to both a shared cookie and `localStorage` on change. If adding another cross-page persisted preference, follow this same cookie+localStorage dual-write pattern via `src/utils/cookies.ts` (`getSharedCookie`/`setSharedCookie`) rather than introducing a new mechanism.
- `src/pages/` — route-level components, wired up in `src/App.tsx` (`react-router-dom` `BrowserRouter`/`Routes`). Current routes: `/`, `/login`, `/register`, `/dashboard`, `/terms`, `/privacy`.
- `src/components/` — reusable, mostly presentational UI. Heavy use of `createPortal` for floating elements (modals, tooltips) to avoid `z-index` stacking issues — follow this pattern for new overlay/modal components rather than relying on z-index alone.
- `src/components/Sidebar.tsx` — the "Analyze Risks" button and the "SmartCheck AI / Analysis Engine" label are intentionally hidden (not deleted) behind `SHOW_RISK_ANALYSIS_BUTTON` / `SHOW_ANALYSIS_ENGINE_LABEL` flags at the top of the file, per a product decision to not expose them yet — flip the flag to `true` to bring one back rather than re-implementing it. The collapsed-sidebar sparkle icon (desktop only, `sm:` and up) is the intended replacement AI hint: visible while the sidebar is collapsed, fades out on expand, never rendered on mobile. The mobile drawer also supports swipe-to-close (drag left past ~30% of its width), implemented with raw `onTouchStart/Move/End` handlers rather than a gesture library — keep that pattern if extending the gesture.
- `src/types/index.ts` — single shared file for API request/response and domain types (`TaskResponse`, `SubjectResponse`, `RecurringTaskResponse`, etc.). Add new domain types here rather than colocating them per-component.

**Provider order** (`App.tsx`): `LanguageProvider` wraps `ThemeProvider` wraps `BrowserRouter`. Both contexts read/write shared cookies, so keep this nesting if adding related providers.

**Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin, not a PostCSS config file). Dark mode is class-based (`dark` class toggled on `documentElement` by `ThemeContext`), palette centers on `zinc`/`gray` for WCAG contrast. Animations use `framer-motion`; `tsparticles` is used for the auth-page interactive background.

**i18n:** handled by `LanguageContext` (not an external i18n library) — same cookie+localStorage persistence pattern as theme.

**User feedback:** use `react-hot-toast` (`toast.success/error/loading`) for all user-facing success/error/status messages — not `alert()`. A single `<Toaster />` is mounted once in `App.tsx`'s `AppShell` (theme-aware styling via `useTheme()`), so components just call `toast(...)` directly, no need to render their own `<Toaster />`. For an async flow with a start/end state (e.g. "analyzing..." → "ready"), reuse one toast via its id (`toast.loading(...)` returns an id, pass `{ id }` to the follow-up `toast.success/error`) instead of stacking separate toasts.

**Error boundary:** `src/components/ErrorBoundary.tsx` wraps the whole app (outermost, in `App.tsx`, above `LanguageProvider`/`ThemeProvider`) so a render error anywhere doesn't blank the page. It intentionally doesn't use `ThemeContext`/`LanguageContext` for its fallback UI, since those could be what's broken — it reads `navigator.language` directly instead.

**PWA:** `public/manifest.json` + the meta tags in `index.html` make RedCheck installable ("Add to Home Screen"); when launched from the home screen icon it opens in standalone mode with no browser URL bar. This is the only way to hide the address bar — a normal browser tab can't do that via script. `public/icons/` (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) were generated from `public/redcheck.svg` via Inkscape; regenerate them the same way if the logo changes. No service worker/offline support is set up — this is install-for-chrome-hiding only.
