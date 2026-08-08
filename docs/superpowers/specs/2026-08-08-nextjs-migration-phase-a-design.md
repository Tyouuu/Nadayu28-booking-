# Next.js Migration — Phase A: Scaffold, Shell, Auth, Dashboard Route — Design Spec

## Purpose

The Nadayu28 portal is currently a Vite-built React SPA with a single HTML entry point and a hand-rolled client-side "router" (`NavigationContext`'s `currentView` string state) — there are no real URLs per page. The user wants to migrate to Next.js to modernize the technical foundation: real file-based routing (enables per-route code splitting — the current build already warns about a 1.4MB single bundle), and a path toward eventually moving secrets currently shipped to the client (Groq API key) behind server code. This is not needed for SEO — the portal is entirely behind login.

Given the scale of the app (21 components, 8 files coupled to the current client-side router), this migration is split into three phases:
- **Phase A (this spec):** Next.js App Router scaffold, shared shell (Navigation/MobileTabBar/MoreMenu/SmartAssistant), auth gating, Tailwind converted from CDN script to a real build-time setup, and ONE fully working route (`/dashboard`) end to end.
- **Phase B (future):** Port the remaining ~19 view components into real routes.
- **Phase C (future):** Remove Vite entirely, cut over the Vercel deployment, merge to `main`.

Phase A and B happen on a dedicated branch (`nextjs-migration`), not `main` — unlike every prior phase this session, this branch does not get deployed to production until Phase C, since the app is genuinely broken (most nav items 404) until all routes are ported. Vite/`main` stays the live production site throughout Phases A and B.

## Non-Goals (Phase A)

- Porting any route other than `/dashboard` (Documents, Billing, Packages, etc. remain unbuilt Next.js routes until Phase B — their nav links will 404 on this branch, which is fine since it isn't deployed).
- Server Components / SSR data fetching — all data fetching stays exactly as it is today (`useEffect` + `supabase-js` client calls in each component). This migration only changes the framework/routing shell, not the data layer.
- Moving the Groq API key server-side — Phase A only renames its env var to the Next.js convention; it stays a client-exposed `NEXT_PUBLIC_` var for now (unchanged behavior, just renamed). Actually hiding it server-side is future work, out of scope here.
- Any visual/design changes — this is a pure framework migration, the rendered UI must look identical to today.

## Architecture

### Routing model

Every existing `currentView` string (`'dashboard'`, `'billing'`, `'packages'`, etc.) becomes a real Next.js route segment at the same name: `/dashboard`, `/billing`, `/packages`. This 1:1 mapping means the existing per-role nav-config objects in `Navigation.tsx`/`MobileTabBar.tsx`/`MoreMenu.tsx` (`navItems`, `TABS_BY_ROLE`, `MORE_ITEMS`, all keyed by these same id strings) need no restructuring — only their navigation mechanism changes.

`NavigationContext` is deleted entirely. Its only two exports were `currentView`/`navigate()` (used for routing — replaced by `usePathname()` / `useRouter()`) and `isMobileOpen`/`setIsMobileOpen` (confirmed dead: set only within the context itself, read nowhere in the app — the mobile drawer this once supported was already replaced by the bottom tab bar in an earlier phase). No replacement is needed for the dead state.

A new small hook, `hooks/useAppNavigate.ts`, wraps `useRouter().push`:

```ts
export function useAppNavigate() {
  const router = useRouter();
  return (view: string) => router.push(`/${view}`);
}
```

This exists so that every call site that currently does `navigate('parking')` or `setCurrentView('parking')` becomes `nav('parking')` with a minimal diff — important because Phase B will repeat this same rename across ~15 more files, and a consistent one-line-diff pattern makes that mechanical.

### Route structure

```
app/
  layout.tsx              — root layout: <html>/<body>, next/font Inter, imports globals.css,
                             mounts I18nProvider > AuthProvider > {children}
  page.tsx                — '/' — if logged in, redirect to /dashboard; else render <Login>
  (portal)/
    layout.tsx             — 'use client'; auth-loading/redirect-if-logged-out gate (mirrors
                              today's AppContent early returns), renders <Navigation> (which
                              internally renders <MobileTabBar>), the scrollable <main> wrapper,
                              <SmartAssistant>, and {children}
    dashboard/
      page.tsx              — renders <Dashboard /> unchanged
```

The `(portal)` route group holds every authenticated page so they all share one layout (nav shell + auth gate) without the group name appearing in the URL. Phase B adds one `page.tsx` per remaining view under this same group.

### Auth gating

Unchanged in substance from today's `AppContent`: `(portal)/layout.tsx` is a client component using the existing `useAuth()` hook (`AuthProvider` itself needs zero changes — it already only touches `supabase-js`, no Vite-specific API). While `isLoading` is true, render the existing loading spinner markup. Once resolved, if `!isLoggedIn`, `redirect('/')` (Next.js's `next/navigation` redirect, called from a `useEffect` since this is a client component). If logged in, render the shell + `{children}`.

The root `page.tsx` handles the inverse: if a logged-in user hits `/`, redirect them to `/dashboard`; if not logged in, render `<Login onLogin={...}>` with the same role-based post-login redirect logic that exists today in `App.tsx` (`login(role)` then navigate to `/management`, `/security`, or `/dashboard` depending on role) — except only the `/dashboard` target actually exists in Phase A, so MANAGEMENT/SECURITY logins will 404 until Phase B ports `/management` and `/security`. This is expected and acceptable since the branch isn't deployed yet.

### Styling

The Tailwind CDN `<script>` and its inline `tailwind.config` object (in `index.html`) are replaced with a real build-time setup:
- `tailwind.config.ts` — same `colors`/`fontFamily`/`animation`/`keyframes` values as the current inline config, copied verbatim (`nadayu-bg`, `nadayu-panel`, `nadayu-accent`, `nadayu-success`, `nadayu-border`, `nadayu-muted`, `nadayu-cream`, the `fade-in`/`slide-up`/`pulse-slow`/`shimmer`/`glow` animations).
- `postcss.config.mjs` — standard Tailwind + Autoprefixer setup.
- `app/globals.css` — `@tailwind base/components/utilities` directives, followed by the plain CSS block currently in `index.html`'s `<style>` tag (scrollbar styling, focus-visible outline, selection color, date-picker styling, backdrop-blur fallback, the `fadeIn` keyframe/`.animate-fade-in` class) copied verbatim.
- The Google Fonts `<link>` for Inter is replaced with `next/font/google`'s `Inter` loader in `app/layout.tsx`, applied via a CSS variable/className on `<body>`, matching the existing `fontFamily.sans` token.

This incidentally fixes the `cdn.tailwindcss.com should not be used in production` console warning the user saw earlier this session.

### Environment variables

Next.js requires client-exposed env vars to be prefixed `NEXT_PUBLIC_` instead of Vite's `VITE_`. Four variables are renamed (values unchanged, just the key prefix and the four read-sites):
- `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL` (read in `services/supabase.ts`)
- `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (read in `services/supabase.ts`)
- `VITE_GROQ_API_KEY` → `NEXT_PUBLIC_GROQ_API_KEY` (read in `components/SmartAssistant.tsx`)
- `VITE_USE_MOCK_DATA` → `NEXT_PUBLIC_USE_MOCK_DATA` (read in `constants.ts`)

`VITE_API_BASE_URL` (pointing at the legacy unused PHP `backend/` folder — confirmed never referenced by any `.ts`/`.tsx` file other than the `.env.example` comment) is dropped, not renamed.

### What moves, what's deleted, what's untouched

- **Deleted:** `vite.config.ts`, `index.html`, `index.tsx`, `contexts/NavigationContext.tsx`.
- **Untouched:** every component under `components/` other than `Dashboard.tsx`, `Navigation.tsx`, `MobileTabBar.tsx`, `MoreMenu.tsx`, `SmartAssistant.tsx` (env var rename only) — they stay exactly as they are, ready to be dropped into Phase B route folders with no internal changes needed since they're already self-contained function components with no Vite-specific APIs beyond the env var pattern already covered above. `services/`, `contexts/AuthContext.tsx`, `contexts/I18nContext.tsx`, `types.ts` — all untouched (no Vite-specific code in any of them).
- **Modified:** `package.json` (scripts + `next` dependency), `tsconfig.json` (Next.js's expected compiler options), `Navigation.tsx`/`MobileTabBar.tsx`/`MoreMenu.tsx` (routing mechanism), `Dashboard.tsx` (routing mechanism only), `services/supabase.ts`/`constants.ts`/`SmartAssistant.tsx` (env var names only).

## Testing

- `npx tsc --noEmit` after each task (Next.js's own `next build` also type-checks).
- `npm run build` (now `next build`) must succeed.
- Manual Playwright pass on the `nextjs-migration` branch's local dev server: unauthenticated `/` shows Login; logging in as RESIDENT lands on `/dashboard` with the real Dashboard rendering (bookings, notifications, quick actions); clicking a Dashboard quick-action tile that targets an unported route (e.g. "Amenities") 404s as expected; Navigation sidebar + MobileTabBar render with the correct active-state highlighting on `/dashboard`; SmartAssistant FAB opens and responds (confirms the renamed Groq env var works); logging out from `/dashboard` returns to `/` and shows Login again.
- No RLS/deploy changes this phase — nothing pushed to `main`, nothing deployed to Vercel production.
