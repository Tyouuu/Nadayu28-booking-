# Visual Redesign (Phase 3b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current lime-green/near-black/white styling with the warm-residential palette and Fraunces headings validated during brainstorming, across every component, without changing any data logic, routing, or behavior.

**Architecture:** Pure Tailwind class-level restyling. New named color tokens and a `serif` font family get added once to `index.html`'s inline `tailwind.config`; every component then gets its hardcoded hex values and generic Tailwind gray-scale classes swapped for the new tokens, and its heading elements get `font-serif` added.

**Tech Stack:** React 19 + TypeScript + Vite, Tailwind CSS via CDN (`index.html`) — no new dependencies, no build tooling changes.

## Global Constraints

- **No formal test suite exists in this repo.** Verification per task is `npx tsc --noEmit` + `npm run build`; final verification is a manual dev-server pass across all four roles plus a grep sweep for leftover old colors.
- **This is styling only.** Do not change props, state, data-fetching calls, event handlers, or conditional rendering logic in any file this plan touches — only `className` strings (and the two font-family/color additions to `index.html`).
- **The global color/class mapping table below is the authoritative spec for every task in this plan.** Apply it file by file; where a file has a case not covered by the table, use the judgment rule at the bottom of the table (don't ask — decide and note it in the commit if it's a genuinely ambiguous call).

### Global mapping table

| Old | New | Notes |
|---|---|---|
| `bg-[#111111]` | `bg-nadayu-panel` | dark panel background |
| `text-[#111111]` | `text-nadayu-panel` | dark text on light bg |
| `border-[#111111]` | `border-nadayu-panel` | |
| `hover:bg-[#222222]` / `hover:bg-[#222]` (paired with `bg-[#111111]`) | `hover:brightness-110` (added alongside `bg-nadayu-panel`, replacing the hover class entirely) | brightness filter works on any base color, no new token needed |
| `theme-color` meta tag `#111111` (`index.html`) | `#2B241C` | matches new `nadayu-panel` hex, for the mobile browser chrome color |
| `bg-[#C8FF00]/15 text-[#4a6600]` (or close variants, e.g. different opacity like `/10`) | `bg-nadayu-success/15 text-nadayu-success` | this is the "success badge" pattern (paid/resolved/active/approved) — always maps to `nadayu-success`, never `nadayu-accent` |
| `text-[#4a6600]` used alone (not paired with the badge pattern above) | `text-nadayu-success` | |
| `bg-[#C8FF00]` / `text-[#C8FF00]` / `border-[#C8FF00]` used for buttons, active nav item, selected states, icons, decorative accents, CTAs | `bg-nadayu-accent` / `text-nadayu-accent` / `border-nadayu-accent` | anything that is NOT a "this thing succeeded/completed" status indicator |
| `hover:brightness-95` (on `bg-[#C8FF00]` elements) | unchanged — keep `hover:brightness-95`, just update the base color class | brightness filter doesn't care which hex it's applied to |
| `border-gray-100` / `border-gray-200` | `border-nadayu-border` | |
| `text-gray-400` / `text-gray-500` | `text-nadayu-muted` | |
| `bg-gray-50` / `bg-gray-100` / `bg-[#f3f4f6]` | `bg-nadayu-cream` | subtle fills — table header stripes, input backgrounds, avatar placeholders |
| `bg-white` (as a page or card background, not e.g. `bg-white/10` overlays on dark panels) | `bg-nadayu-bg` for page-level backgrounds, leave card `bg-white` as literal `bg-white` (cards stay white against the new cream page background — this creates the layering the mockups showed) | see per-task notes for which is which |
| Any `<h1>`/`<h2>`/`<h3>` used as a page or section title | add `font-serif` | do NOT add it to small uppercase eyebrow labels, table `<th>` headers, or badge text — those stay `font-sans` (the default) |

**Judgment rule for anything not in this table**: if you find another `#111111`/`#C8FF00`/`#4a6600` occurrence not matching a row above, classify by the same logic — `#111111`-family always → `nadayu-panel`; `#C8FF00`/`#4a6600`-family → `nadayu-success` if it's indicating a completed/positive/approved status, otherwise → `nadayu-accent`. Generic Tailwind grays used for things unrelated to this app's own brand chrome (e.g. a disabled-state gray, a scrollbar color) can stay as-is — the goal is removing this app's brand colors, not eliminating every gray Tailwind class in the codebase.

---

## Task 1: Add design tokens and Fraunces font to index.html

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: Tailwind classes `bg-nadayu-bg`, `bg-nadayu-panel`, `text-nadayu-panel`, `border-nadayu-panel`, `bg-nadayu-accent`, `text-nadayu-accent`, `border-nadayu-accent`, `bg-nadayu-success`, `text-nadayu-success`, `border-nadayu-success`, `bg-nadayu-border`, `border-nadayu-border`, `text-nadayu-muted`, `bg-nadayu-cream`, and `font-serif` (all consumed by every later task in this plan).

- [ ] **Step 1: Add the Fraunces Google Fonts link**

In `index.html`, change:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

to:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace the theme-color meta tag**

Change:

```html
<meta name="theme-color" content="#111111" />
```

to:

```html
<meta name="theme-color" content="#2B241C" />
```

- [ ] **Step 3: Replace the tailwind.config color/fontFamily block**

Find:

```js
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    colors: {
      primary: '#0f172a', // Slate 900
      accent: '#4f46e5', // Indigo 600
      nadayu: '#1e293b',
    },
```

Replace with:

```js
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      serif: ['Fraunces', 'Georgia', 'serif'],
    },
    colors: {
      'nadayu-bg':      '#FBF8F2',
      'nadayu-panel':   '#2B241C',
      'nadayu-accent':  '#B5652F',
      'nadayu-success': '#4A5D3A',
      'nadayu-border':  '#E4D9C6',
      'nadayu-muted':   '#6B5D48',
      'nadayu-cream':   '#F5F0E8',
    },
```

(Leave everything below this block — `animation`, `keyframes` — untouched.)

- [ ] **Step 4: Verify the tokens resolve**

Run: `npm run dev` (or reuse an already-running dev server), then in the browser devtools console on any page run:

```js
getComputedStyle(document.createElement('div')).getPropertyValue('background-color')
```

This alone doesn't prove much — instead, temporarily add `class="bg-nadayu-accent"` to any visible element (e.g. edit `App.tsx`'s loading spinner div directly in devtools, or just proceed to Task 2 where real usage will prove it). The reliable check is Step 5.

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors (Tailwind CDN classes aren't type-checked, but this confirms `index.html`'s inline `<script>` JSON/JS is syntactically valid — a broken `tailwind.config` object would still let `tsc`/`vite build` succeed since it's plain JS in an HTML file, so also load the built `dist/index.html` in a browser or check the dev server renders without a blank page / console error about `tailwind.config`).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add nadayu-* color tokens and Fraunces serif font to Tailwind config"
```

---

## Task 2: Restyle auth/shell components — Login, Navigation, App

**Files:**
- Modify: `components/Login.tsx`
- Modify: `components/Navigation.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: tokens from Task 1.

- [ ] **Step 1: Read the current state of each file**

Read `components/Login.tsx`, `components/Navigation.tsx`, and `App.tsx` in full before editing — this task's mapping table (Global Constraints) applies to whatever hex/gray classes are actually present, and both files have grown since they were last read in this session; don't edit from memory.

- [ ] **Step 2: Apply the global mapping table to each file**

For each file:
- Replace every `#111111`-family class with the `nadayu-panel` equivalent (Global Constraints table).
- Replace `hover:bg-[#222222]`/`hover:bg-[#222]` with `hover:brightness-110`.
- Replace every `#C8FF00`-family class with `nadayu-accent` or `nadayu-success` per the table's judgment rule (Login.tsx and Navigation.tsx are UI chrome — expect these to be almost entirely `nadayu-accent`, not `nadayu-success`, since neither file renders a status badge).
- Replace `border-gray-100`/`border-gray-200` → `border-nadayu-border`, `text-gray-400`/`text-gray-500` → `text-nadayu-muted`, `bg-gray-50`/`bg-gray-100` → `bg-nadayu-cream`.
- Replace page-level `bg-white`/`bg-gray-50` backgrounds (e.g. `Login.tsx`'s root container, `App.tsx`'s loading-spinner screen) with `bg-nadayu-bg`. Card-level `bg-white` (e.g. any white card floating on top of the page background) stays `bg-white`.
- Add `font-serif` to `Login.tsx`'s welcome/heading text (`t.login.welcome`/`t.login.createAccount` heading, the "Nadayu28 Community" brand heading on the left panel) and any page-title-level heading in the other two files. Do not add it to nav item labels, form field labels, or button text.
- **Narrow the sidebar** (per the spec's Layout section): `Navigation.tsx` currently sets the sidebar to `w-56` in three places — the desktop wrapper (`<div className="hidden md:block w-56 flex-shrink-0">`), the fixed-position inner wrapper (`<div className="fixed inset-y-0 left-0 w-56">`), and the mobile drawer (`<div className="fixed inset-y-0 left-0 w-56 z-30 md:hidden">`). Change all three from `w-56` to `w-48`. Leave the mobile top bar (`md:hidden fixed top-0...`) untouched — it isn't part of the sidebar width.

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual visual check**

Start the dev server, view the (logged-out) Login page — confirm cream/warm-brown/terracotta colors, Fraunces on the two brand/welcome headings, no leftover lime green or pure black. Log in and confirm the sidebar (`Navigation.tsx`) renders with the new dark panel color and terracotta active-item highlight, and the `App.tsx` loading spinner (visible briefly on load/reload) uses the new palette.

- [ ] **Step 5: Commit**

```bash
git add components/Login.tsx components/Navigation.tsx App.tsx
git commit -m "style: restyle auth/shell components with nadayu-* tokens and Fraunces"
```

---

## Task 3: Restyle dashboard/booking components

**Files:**
- Modify: `components/Dashboard.tsx`
- Modify: `components/ParkingBooking.tsx`
- Modify: `components/Amenities.tsx`
- Modify: `components/InviteVisitor.tsx`

**Interfaces:**
- Consumes: tokens from Task 1.

- [ ] **Step 1: Read each file's current content**

Read all four files in full before editing.

- [ ] **Step 2: Apply the global mapping table to each file**

Same process as Task 2, Step 2, applied to these four files. Specific things to watch for in this group:
- `ParkingBooking.tsx` and `Amenities.tsx` both render slot-availability badges (available/occupied/selected) — the "available"/"selected" positive-state colors that currently use `#C8FF00` map to `nadayu-success` if they represent "this is confirmed/bookable," and `nadayu-accent` if they're just the current UI selection highlight. Read the surrounding JSX to tell which — a `bg-[#C8FF00]` on a slot the user has actively clicked to select is `nadayu-accent` (it's an interaction state, not a completion status); a `bg-[#C8FF00]/15 text-[#4a6600]` "available" count badge is `nadayu-success`.
- `Dashboard.tsx`'s page background and the three overview stat tiles use a mix of `bg-[#111111]` (dark tile) and `bg-white/[0.06]` (translucent-on-dark tiles) — the translucent ones reference white as an overlay on the dark panel, not the page background, so they stay as literal `bg-white/[...]`, only the base `#111111` tile changes to `bg-nadayu-panel`.
- `InviteVisitor.tsx` and `ParkingBooking.tsx` both render a QR-code result screen with a dark header band (`bg-[#111111]`) — this becomes `bg-nadayu-panel`.
- Add `font-serif` to each file's page-title heading only (e.g. `Dashboard.tsx`'s greeting heading, `ParkingBooking.tsx`'s `t.parking.title`, `Amenities.tsx`'s page title, `InviteVisitor.tsx`'s "Invite Visitor" heading and "VISITOR PASS" card heading).

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual visual check**

As a RESIDENT/TENANT test account, visit Dashboard, Visitor Parking, Amenities, and Invite Visitor. Confirm consistent warm palette, no leftover lime/black, headings in Fraunces, and that slot-selection states are still visually distinguishable (selected vs. available vs. occupied) even after the color swap.

- [ ] **Step 5: Commit**

```bash
git add components/Dashboard.tsx components/ParkingBooking.tsx components/Amenities.tsx components/InviteVisitor.tsx
git commit -m "style: restyle dashboard and booking components with nadayu-* tokens and Fraunces"
```

---

## Task 4: Restyle reporting/maintenance/security components

**Files:**
- Modify: `components/Reporting.tsx`
- Modify: `components/Maintenance.tsx`
- Modify: `components/SecurityScanner.tsx`

**Interfaces:**
- Consumes: tokens from Task 1.

- [ ] **Step 1: Read each file's current content**

Read all three files in full before editing.

- [ ] **Step 2: Apply the global mapping table to each file**

Same process as Task 2, Step 2. Specific things to watch for:
- `Reporting.tsx`'s success screen (after submitting a report) has a `#C8FF00` gradient/glow around a checkmark icon — this is a completion confirmation, so it maps to `nadayu-success`, not `nadayu-accent`.
- `Maintenance.tsx`'s status pill logic already branches on `r.status === 'Resolved'` using a `bg-[#C8FF00]/15 text-[#4a6600]` pattern for Resolved specifically (In Progress and Received use different, already-non-brand colors like blue-50/orange-50 — leave those untouched) — this Resolved pill maps to `nadayu-success`.
- `SecurityScanner.tsx`'s visitor-flagged state uses orange (unrelated to this mapping, leave as-is); its "Visitor Verified"/"Access Granted" success states use `#C8FF00` and map to `nadayu-success`. Its mode-toggle buttons and "Open Camera" button use `#C8FF00`/`#111111` as UI chrome, not status — those map to `nadayu-accent`/`nadayu-panel`.
- Add `font-serif` to each file's page-title heading (`Reporting.tsx`'s category-selection/details/form step headings, `Maintenance.tsx`'s "Maintenance" title, `SecurityScanner.tsx`'s "Access Control" title).

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual visual check**

As a RESIDENT, submit a test report and confirm the success screen uses the new success green, not a leftover lime glow. As MANAGEMENT/SECURITY, open Maintenance and confirm the Resolved pill is olive-green while In Progress/Received keep their existing non-brand colors. As SECURITY, open Access Control and confirm the mode toggle and scan states use the new palette, with the visitor-verified success state in olive-green and the flagged state still orange.

- [ ] **Step 5: Commit**

```bash
git add components/Reporting.tsx components/Maintenance.tsx components/SecurityScanner.tsx
git commit -m "style: restyle reporting, maintenance, and security scanner with nadayu-* tokens and Fraunces"
```

---

## Task 5: Restyle admin/profile/documents components

**Files:**
- Modify: `components/AdminPanel.tsx`
- Modify: `components/Profile.tsx`
- Modify: `components/Documents.tsx`
- Modify: `components/ManagementProfile.tsx`
- Modify: `components/SecurityProfile.tsx`

**Interfaces:**
- Consumes: tokens from Task 1.

- [ ] **Step 1: Read each file's current content**

Read all five files in full before editing — this is the largest task in the plan (Profile.tsx alone has 142 occurrences of colors covered by the mapping table per an earlier grep), so budget the most time here.

- [ ] **Step 2: Apply the global mapping table to each file**

Same process as Task 2, Step 2. Specific things to watch for:
- `AdminPanel.tsx`'s violation status pill (`v.status === 'paid'`) uses the `bg-[#C8FF00]/15 text-[#4a6600]` pattern → `nadayu-success`. Its tab bar (Overview/Users/Audit Log) uses `bg-[#111111]` for the active tab → `nadayu-panel`. Its two `recharts` chart `stroke`/`fill` props reference `#C8FF00` and `#ff6b6b` as literal string values (not Tailwind classes, since `recharts` takes raw color props) — update the `#C8FF00` ones to `#B5652F` (the `nadayu-accent` hex, since recharts props can't consume Tailwind class names) and leave `#ff6b6b` (unrelated to this app's brand palette, used for the violations line) as-is.
- `Profile.tsx`'s vehicle/tenant cards, tab sidebar, and history timeline all use the standard `#111111`/`#C8FF00` chrome pattern — apply the table directly. Its "Account Type: Property Owner" badge and similar informational (non-status) badges map to `nadayu-accent`, not `nadayu-success`.
- `Documents.tsx`'s category filter pills follow the same `bg-[#111111]`-active-pill pattern as `Maintenance.tsx` from Task 4 → `nadayu-panel`.
- `ManagementProfile.tsx` and `SecurityProfile.tsx` are largely static UI (per earlier findings in this project, they have no data-fetching logic) — apply the table the same way; there's no status-badge ambiguity to worry about in either since neither renders dynamic status data.
- Add `font-serif` to each file's page-title heading (`AdminPanel.tsx`'s "Management Dashboard", `Profile.tsx`'s section headings like "Account Details"/"My Vehicles", `Documents.tsx`'s "Documents" title, and the equivalent title in each profile variant).

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual visual check**

As MANAGEMENT: open AdminPanel (all three tabs), confirm the violation "paid" pill and chart accent line are olive-green/terracotta respectively, not lime; open Documents and confirm category pills use the new dark panel color when active. As a RESIDENT: open Profile, click through all five tabs (Details/Vehicles/Tenants/Security/History), confirm consistent styling and Fraunces headings throughout. As SECURITY/MANAGEMENT: open their respective Profile pages and confirm the same.

- [ ] **Step 5: Commit**

```bash
git add components/AdminPanel.tsx components/Profile.tsx components/Documents.tsx components/ManagementProfile.tsx components/SecurityProfile.tsx
git commit -m "style: restyle admin, profile, and documents components with nadayu-* tokens and Fraunces"
```

---

## Task 6: Restyle shared/misc components

**Files:**
- Modify: `components/CustomPickers.tsx`
- Modify: `components/CommunityBoard.tsx`
- Modify: `components/SmartAssistant.tsx`

**Interfaces:**
- Consumes: tokens from Task 1.

- [ ] **Step 1: Read each file's current content**

Read all three files in full before editing.

- [ ] **Step 2: Apply the global mapping table to each file**

Same process as Task 2, Step 2. Specific things to watch for:
- `CustomPickers.tsx` (`CustomDatePicker`/`CustomTimePicker`, shared by `ParkingBooking.tsx`, `Amenities.tsx`, and `InviteVisitor.tsx`) uses `#111111` for the selected day/time cell and `#C8FF00` for the "today" highlight and "Confirm"/quick-select buttons — the "today" highlight and confirm buttons are UI accents (`nadayu-accent`), not status, since a date picker has no completion/success concept.
- `CommunityBoard.tsx` still runs on the mock `notificationService` per earlier findings in this project (not real data) — this task only touches its `className` strings, not its data source; don't "fix" the mock-data issue as part of this styling task, that's out of scope.
- `SmartAssistant.tsx` is the floating AI-help button — its `#C8FF00` FAB background and glow effects map to `nadayu-accent`.
- Add `font-serif` only where these files render an actual page/section title — `CustomPickers.tsx` likely has none (it's a form control, not a page), `CommunityBoard.tsx` has a page title, `SmartAssistant.tsx` likely has none (it's a floating widget, possibly a small panel heading if it expands into a chat panel — check the file).

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual visual check**

Open any booking flow that uses `CustomDatePicker`/`CustomTimePicker` (e.g. Invite Visitor) and confirm the calendar/time picker popovers use the new palette. Open Community Board and confirm consistent styling. Click the floating AI-help button and confirm it uses the new accent color.

- [ ] **Step 5: Commit**

```bash
git add components/CustomPickers.tsx components/CommunityBoard.tsx components/SmartAssistant.tsx
git commit -m "style: restyle shared pickers, community board, and smart assistant with nadayu-* tokens"
```

---

## Task 7: Full regression pass — grep sweep, cross-role visual check, deploy

**Files:** none created — verification only.

**Interfaces:**
- Consumes: the fully restyled app from Tasks 1–6.

- [ ] **Step 1: Grep sweep for leftover brand colors**

Run:

```bash
grep -rn "#111111\|#C8FF00\|#4a6600" components/ App.tsx index.html
```

Expected: no matches outside of `index.html`'s `theme-color` meta tag (which should now read `#2B241C`, not `#111111` — if this command finds `#111111` there, Task 1 Step 2 wasn't completed) and outside of any deliberately-left non-brand usage documented in an earlier task's notes (there should be none — every occurrence found in the earlier per-file greps was accounted for in Tasks 2–6). If this command returns any unexpected match, open that file and apply the Global Constraints mapping table to it before continuing.

- [ ] **Step 2: Type-check and build the full app**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Cross-role manual pass**

Start the dev server and log in as each of the four seeded roles (RESIDENT/TENANT, SECURITY, MANAGEMENT — use the accounts from `supabase_users.sql`, password `Nadayu28!`), clicking through every nav item visible to that role. For each screen, confirm: no lime green or pure black remains, Fraunces renders on page-title headings (visually distinct serif vs. the sans-serif body/buttons), status badges are correctly split (olive-green for completed/positive states, terracotta for neutral UI accents), and the sidebar renders correctly both at desktop width and in the mobile drawer (resize the browser window or use devtools device emulation to check the mobile breakpoint).

- [ ] **Step 4: Deploy**

```bash
git push origin main
npx vercel deploy --prod --scope ty28
```

Confirm the production URL (`https://nadayu28-booking.vercel.app`) reflects the new styling after the deploy completes.

- [ ] **Step 5: Commit**

Nothing new to commit if Step 1's sweep found no issues (this task is verification-only). If Step 1 required fixes, commit those with a message like `fix: restyle remaining brand-color occurrences missed in earlier tasks` before deploying.
