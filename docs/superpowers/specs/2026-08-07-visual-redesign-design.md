# Phase 3b: Visual Redesign

## Context

Nadayu28 is a community management portal being built for a real residential
property, with the eventual goal of being used by Nadayu28's actual property
management office. Phase 1 (visitor management, maintenance workflow),
Phase 2 (audit trail), and Phase 3a (document management) have all shipped
to production and cover the functional feature set the app needs.

This spec covers Phase 3b: a full visual redesign, purely aesthetic (no new
functionality, no data/routing/permission changes). The current design —
white background, `#111111` near-black panels, `#C8FF00` lime-green accent,
Inter throughout, Tailwind (via CDN, `index.html`) utility classes with no
separate CSS files — reads as generic default AI-generated styling rather
than something deliberately designed for a real residential community. This
phase replaces it.

Design direction was worked out through the `brainstorming` skill's visual
companion (browser-based mockup comparisons), where three aesthetic
directions and three layout structures were mocked up with real component
content (Dashboard card, login page, a table-heavy page) side by side and
picked interactively. The Next.js migration (the third and last Phase 3
item) happens *after* this redesign, specifically so redesigned components
get ported during that migration instead of being redesigned twice.

## Goals

- Replace the current color palette, typography, and component polish
  (spacing, radii, shadows) across all ~20 components with a warm,
  residential-feeling but still professional-reading design.
- Fix an existing color-semantics problem: `#C8FF00` currently serves as
  both the brand accent *and* the "success/completed" status color
  everywhere a status badge appears. This redesign separates those roles.
- Move all colors into named Tailwind design tokens (`tailwind.config` in
  `index.html`) instead of the hardcoded arbitrary hex values (`bg-[#111111]`,
  `text-[#C8FF00]`, etc.) scattered through every component today, so future
  palette changes touch one file instead of twenty.

## Non-goals (explicitly out of scope for this phase)

- Any change to data logic, routing (`currentView` string-switch), RLS,
  Supabase schema, or component behavior — this is styling only.
- Layout *structure* changes beyond the sidebar refinement described below
  — no move to a top-nav or icon-rail layout (both were considered and
  rejected during brainstorming; see "Layout" below for why).
- The Next.js migration (deferred, happens after this ships).
- A full component library / Storybook / design-system tooling — this is a
  single-app Tailwind token update, not a reusable package.

## Visual direction (from the brainstorming session)

Three aesthetic directions were mocked up: (A) warm residential — cream
background, terracotta accent, warm dark-brown panels, serif headings; (B)
professional/trust — cool gray, navy accent, sans-serif throughout; (C)
editorial/minimal — near-white, almost no color, single accent used
sparingly. **(A) was selected** — it reads as a real residential brand
(closer to a boutique apartment/hospitality site) rather than a generic
SaaS admin dashboard, which better fits an app residents use daily and that
gets pitched to a property management office as "built for this community,"
not "built as a generic tool."

Three layout structures were also mocked up: (A) refined sidebar — same
structure as today, narrower, icon+label; (B) top navigation bar,
full-width content; (C) icon-only rail + top bar (Linear/Notion-style).
**(A) was selected.** Reasoning: this app's role-gated nav lists get long
(MANAGEMENT alone has Dashboard, Documents, Maintenance, Admin Panel, and
Profile), and a vertical list scales to that length far better than a
horizontal bar, which gets cramped especially on narrower viewports. A
sidebar with full text labels (not icon-only) also reads more approachable
for a residential audience than an icon-only rail, which reads as a
power-user tool. Layout B and C were both rejected for these reasons.

## Design tokens

New `tailwind.config` entries in `index.html`, added to the existing
`theme.extend` block (the current `primary`/`accent`/`nadayu` color entries
there are unused leftovers from before this app's real styling was built —
they get replaced, not kept alongside the new tokens):

```js
colors: {
  'nadayu-bg':      '#FBF8F2', // page background (was: white / bg-white)
  'nadayu-panel':   '#2B241C', // dark panels (was: #111111)
  'nadayu-accent':  '#B5652F', // brand accent, CTAs (was: #C8FF00)
  'nadayu-success': '#4A5D3A', // status: resolved/paid/approved (new — previously used #C8FF00)
  'nadayu-border':  '#E4D9C6', // borders, dividers (was: border-gray-100/200)
  'nadayu-muted':   '#6B5D48', // secondary text (was: text-gray-400/500)
  'nadayu-cream':   '#F5F0E8', // secondary light surface, e.g. sidebar footer
},
fontFamily: {
  sans: ['Inter', 'sans-serif'],       // unchanged — body text, forms, buttons
  serif: ['Fraunces', 'Georgia', 'serif'], // new — headings only
},
```

`index.html`'s `<head>` needs a second Google Fonts `<link>` for Fraunces
(weight range 400–700, matching the existing Inter link's pattern) alongside
the existing Inter one. The `body { font-family: 'Inter', sans-serif; }`
base style stays as-is (Inter remains the default; `font-serif` is applied
explicitly to headings).

Every component's hardcoded hex values (`#111111`, `#C8FF00`,
`border-gray-100`, etc. — used for this app's own dark panels/accent, not
incidental gray-scale Tailwind defaults elsewhere) get replaced with the
matching token class (`bg-nadayu-panel`, `text-nadayu-accent`,
`border-nadayu-border`, etc.). Status badges that currently use `#C8FF00`
for "paid"/"resolved"/"active" states switch to `nadayu-success`; badges
using it purely as a UI accent (buttons, active nav item, selected states)
switch to `nadayu-accent`.

## Layout

The sidebar (`components/Navigation.tsx`) keeps its current structure —
fixed-width on desktop, slide-out drawer on mobile, role-filtered nav items
— but gets narrower and switches to the new dark panel color
(`nadayu-panel`) with `nadayu-accent` for the active item and logo mark.
Nav item icons (already `lucide-react`, already present on every item)
stay; labels stay full-text, not icon-only. No changes to
`contexts/NavigationContext.tsx` or the `currentView` routing mechanism.

## Component polish

Beyond the color swap, this phase also updates:

- **Corner radii**: keep the existing `rounded-2xl`/`rounded-xl` scale —
  it already reads as soft/friendly and doesn't need to change to fit the
  new warm direction.
- **Card borders**: existing `border border-gray-100` pattern switches to
  `border-nadayu-border`, which is warmer (tan, not cool gray) and more
  visible against the new cream background than gray-100 was against pure
  white.
- **Headings**: every `<h1>`/`<h2>`/`<h3>` used as a page or section title
  (not small UI labels like table headers or badges) gets `font-serif`.
  Body copy, form labels, buttons, and table content stay `font-sans`
  (the default, so no class needed there).

## Application scope

This touches every component file with visible UI — roughly the full
`components/` directory (~20 files) plus `index.html`. Each file's change
is mechanical: swap hardcoded color values for the new token classes, add
`font-serif` to heading elements. No file's internal logic, props, state,
or data-fetching changes. Because the change is uniform and mechanical
across many files, the implementation plan should group files by rough
theme/complexity rather than treat each as a bespoke design task.

## Testing / verification approach

Same pattern as Phases 1–3a: no formal test suite exists. Verification is
`npx tsc --noEmit` + `npm run build` per task (styling changes can't break
type-checking, but a broken Tailwind class name or unclosed template
literal would still be worth catching), plus a manual visual pass — running
the dev server and clicking through each of the four roles' full nav list,
confirming: no leftover `#111111`/`#C8FF00` hardcoded colors, Fraunces
loads and renders on headings, status badges use the correct color
(`nadayu-success` for positive states, `nadayu-accent` for neutral/brand
UI), and the sidebar renders correctly at both desktop and mobile
(drawer) widths.

## Open questions / risks

- **Tailwind via CDN has no build-time purge/tree-shaking** — adding new
  named color tokens to the CDN script's inline config works the same way
  the existing ones already do (arbitrary values and named tokens both
  resolve at runtime via the CDN's JIT compiler), so this doesn't change
  the app's performance characteristics one way or the other; it's a
  pre-existing characteristic of the CDN approach, not something this
  phase introduces or needs to fix.
- **Fraunces adds a second font-loading round-trip** — acceptable given
  it's only applied to headings (a small fraction of visible text) and the
  existing Inter link already establishes the pattern of loading a Google
  Font in `<head>`.
