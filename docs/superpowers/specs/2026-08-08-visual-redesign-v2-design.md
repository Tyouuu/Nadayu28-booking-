# Visual Redesign v2 (Phase 3b revision)

## Context

Phase 3b (2026-08-07) shipped a "warm residential" redesign — cream
background, terracotta accent, dark-brown panels, Fraunces serif headings.
After seeing it live in production, the user's feedback was that it still
looks wrong: low-contrast sidebar navigation text, a dark "Overview" card
floating in the middle of a light page (competing with the also-dark
sidebar for visual weight), and a serif-heading + all-caps-label mix that
reads as boutique-hospitality rather than a property management tool.

The user's business goal for this app: it's being pitched to the real
Nadayu28 property management office as a low-cost alternative to
established property management SaaS (Buildium, AppFolio) and local
Malaysian condo apps (i-Neighbour, myCondo). Price is the only competitive
lever available — which means the product cannot *look* or *behave* like
the cheaper option. Both the visual design and the feature set need to
read as being on par with the established players; anything that looks
like a generic/home-brew app undermines the one pitch this project has.
This redesign explicitly benchmarks against real competitor and
adjacent-category products (Buildium Resident Center, Linear, Stripe,
Notion) rather than an original/abstract aesthetic direction.

This was worked out interactively via the `brainstorming` skill's visual
companion: real screenshots of the current app were compared side-by-side
against screenshots of Buildium, Linear, Stripe, and Notion, which surfaced
four concrete problems (listed below), followed by three new
palette/layout direction mockups, followed by a mobile-vs-desktop layout
mockup. All three rounds were decided by the user in the browser tool.

## Problems with the current (Phase 3b) design

1. **Sidebar contrast** — unselected nav items render as low-contrast gray
   text (`text-[#777]`, labels at `text-[#444]`/`text-[#555]`) on the dark
   `nadayu-panel` background, close to unreadable.
2. **"Floating dark island" structure** — the Dashboard's dark `Overview`
   card sits in the middle of an otherwise light page, on top of an
   already-dark sidebar. Three competing light/dark zones instead of one
   consistent structure.
3. **Serif + all-caps mismatch** — Fraunces headings ("Good Morning, Wong")
   next to all-caps functional labels ("NAVIGATION") reads as two different
   products stitched together, not a coherent tool.
4. **Color choice itself** — terracotta/warm-brown doesn't read as
   "property management software" to anyone who's used one. None of
   Buildium, AppFolio, Linear, Stripe, or Notion use a warm palette as
   their primary color; they use blue, slate, near-black, or white with a
   single restrained accent.

## Direction selected

**Palette: "Professional trust" (navy + blue), benchmarked against
Buildium/Stripe.** Of three mocked options (A: navy/blue professional, B:
Linear-style full dark mode, C: Notion-style near-white/grayscale), A was
selected — light backgrounds and a solid (not "floating") dark sidebar
give the best outdoor mobile readability for SECURITY staff scanning QR
codes and residents checking things on their phones, while still reading
as a serious, professional tool rather than a stripped-down MVP.

**Layout: adaptive by breakpoint, not one structure forced onto both.**
Desktop (≥768px) keeps the sidebar — MANAGEMENT's nav list is long (7
items: Dashboard, Documents, Parking N/A, Maintenance, Admin Panel,
Profile, etc.) and benefits from full labels and information density.
Mobile (<768px) replaces the current slide-out drawer with a fixed bottom
tab bar — SECURITY and residents are mobile-first for their most frequent
actions (scanning a QR code, booking parking, reporting an issue) and
should reach them in one tap, not two (open drawer, then tap item).

## Design tokens

`index.html`'s `tailwind.config` — replacing today's warm values with the
navy/blue palette. The token *names* stay the same (nothing downstream
needs to change other than the hex values and dropping the `serif` font
family):

```js
colors: {
  'nadayu-bg':      '#F8FAFC', // page background (was: #FBF8F2)
  'nadayu-panel':   '#0F172A', // sidebar, dark surfaces (was: #2B241C)
  'nadayu-accent':  '#2563EB', // brand accent, CTAs, active states (was: #B5652F)
  'nadayu-success': '#16A34A', // status: resolved/paid/approved (was: #4A5D3A)
  'nadayu-border':  '#E2E8F0', // borders, dividers (was: #E4D9C6)
  'nadayu-muted':   '#64748B', // secondary text (was: #6B5D48)
  'nadayu-cream':   '#F1F5F9', // secondary light surface (was: #F5F0E8)
},
fontFamily: {
  sans: ['Inter', 'sans-serif'], // unchanged
  // 'serif' entry removed — no more Fraunces anywhere
},
```

Because Phase 3b already moved every component off hardcoded hex values
and onto these named tokens, **this pass does not require touching all ~20
component files again.** Changing the seven hex values in `index.html` is
enough to recolor every `bg-nadayu-*`/`text-nadayu-*`/`border-nadayu-*`
class in the app in one place. Three categories of work remain beyond that
single edit:

1. **Remove the Fraunces `<link>`** in `index.html`'s `<head>`, and strip
   the `font-serif` class from every heading it was added to in Phase 3b
   (confirmed present in 16 files: `SmartAssistant.tsx`,
   `CommunityBoard.tsx`, `Profile.tsx`, `SecurityProfile.tsx`,
   `ManagementProfile.tsx`, `Documents.tsx`, `AdminPanel.tsx`,
   `Reporting.tsx`, `Maintenance.tsx`, `SecurityScanner.tsx`,
   `Amenities.tsx`, `InviteVisitor.tsx`, `ParkingBooking.tsx`,
   `Dashboard.tsx`, `Navigation.tsx`, `Login.tsx`). Headings keep their
   existing size/weight classes (`text-xl font-bold`, etc.) — only
   `font-serif` is removed, so they fall back to the `sans` default.
2. **Fix literal (non-token) hex values that bypass the token system and
   won't pick up the new palette automatically** — confirmed present in:
   - `Navigation.tsx` — the sidebar's own contrast bug (`text-[#777]`,
     `text-[#444]`, `text-[#555]`, `bg-[#222]`, `border-white/[0.06]`);
     these get replaced with real contrast-appropriate values as part of
     the sidebar rewrite (see Layout below), not just a token swap.
   - `AdminPanel.tsx` — Recharts `stroke`/`fill`/`contentStyle` props take
     raw hex, not classes (`stroke="#B5652F"`, tooltip `backgroundColor`,
     etc.) — update to the new accent/panel hex values.
   - `Amenities.tsx` — inline `style={{}}` objects with raw hex/rgba
     (facility modal overlay, booking-confirmed icon) — update to new
     panel/success hex values.
   - `InviteVisitor.tsx`, `ParkingBooking.tsx` — `QRCodeSVG`'s `fgColor`
     prop takes a raw hex, currently `#2B241C` — update to the new
     `nadayu-panel` value `#0F172A`.
3. **The plain `<style>` block** in `index.html` (outline/selection
   colors) — Phase 3b already learned this block is separate from the
   `tailwind.config` JS object and gets missed by a config-only edit;
   check it explicitly this time too.

## Layout: sidebar (desktop) + bottom tab bar (mobile)

### Desktop (≥768px) — sidebar, largely unchanged structurally

Same fixed-width sidebar as today (`components/Navigation.tsx`'s
`Sidebar()`), recolored via tokens, plus the contrast fix: unselected nav
items move from `text-[#777]` to Tailwind's built-in `text-slate-400`
(`#94A3B8`) — `nadayu-muted` (`#64748B`) is tuned for light backgrounds and
would still be too low-contrast on the dark sidebar, so the sidebar uses
this separate light-on-dark gray instead, matching what was validated in
the mockup. Section label ("NAVIGATION") and footer icons get the same
treatment (`text-slate-400`/`text-slate-500` in place of `#444`/`#555`) —
legible, not near-invisible.

### Mobile (<768px) — bottom tab bar replaces the slide-out drawer

The mobile topbar (logo + language switcher) stays, but the hamburger
menu and slide-out drawer are removed entirely. In their place, a new
fixed bottom tab bar (`components/MobileTabBar.tsx`, new file) shows up to
4 direct-access items plus a 5th "More" item when a role has more than 4
nav entries. Tapping "More" navigates to a new lightweight view
(`components/MoreMenu.tsx`, new file — a simple icon+label list, styled
like the sidebar's nav items) listing the remaining items for that role.
"More" is `NavigationContext`'s existing `currentView` mechanism gets one
new view id (`'more'`); no new modal/sheet system, no changes to how
`navigate()` or `currentView` work otherwise.

Per-role tab assignment (based on each role's current nav list in
`Navigation.tsx`):

| Role | Bottom tabs (direct) | Under "More" |
|---|---|---|
| RESIDENT / TENANT | Dashboard, Parking, Invite Visitor, Report Issue | Documents, Amenities, Community Board, My Account |
| SECURITY | Dashboard, Security Scan, Maintenance, Report Issue | Documents, Profile |
| MANAGEMENT | Dashboard, Documents, Maintenance, Admin Panel, Profile | *(none — exactly 5 items, no More tab)* |

If the active view is one of the items grouped under "More" (e.g. a
resident is on the Documents page), the "More" tab shows its active/
highlighted state so the user isn't left with no tab appearing selected.

### Structural principle (applies everywhere, not just Dashboard)

No more dark cards/panels floating inside an otherwise light page. Cards
are light background + `border-nadayu-border` + a subtle shadow; color is
reserved for status and emphasis (badges, buttons, active states), not for
carving the page into light/dark zones. The sidebar is the only large,
consistently-dark surface in the app.

## Non-goals

- No change to data logic, routing mechanism (`currentView` string-switch
  stays, just gains a `'more'` id), RLS, or Supabase schema.
- No re-litigating the accent-vs-success semantic split established in
  Phase 2/3b (`nadayu-accent` = brand/CTA, `nadayu-success` = genuine
  positive status) — only the hex values change, the per-element
  classification from Phase 3b is reused as-is.
- No corner-radius/spacing/shadow system overhaul — Phase 3b's
  `rounded-xl`/`rounded-2xl` scale and card padding stay; only color,
  font, and the sidebar/mobile-nav structure change.
- The Next.js migration remains deferred until after this ships, same as
  before.

## Testing / verification approach

Same as Phase 3b: no formal test suite. `npx tsc --noEmit` + `npm run
build` per task, a grep sweep confirming no leftover `font-serif` classes
or old hex values (`#FBF8F2`, `#2B241C`, `#B5652F`, `#4A5D3A`, `#E4D9C6`,
`#6B5D48`, `#F5F0E8`, plus the `#777`/`#444`/`#555`/`#222` sidebar grays),
and a manual cross-role Playwright pass at both desktop and mobile
(390px) widths — confirming the bottom tab bar renders correctly per role,
"More" navigates and highlights correctly, and the sidebar text is
legible at every nav item.

## Open questions / risks

- **`MoreMenu.tsx` is new, not a restyle of an existing file** — small
  addition (a static list rendering `navigate()` calls), same pattern as
  every other nav-triggered view, low risk.
- **Bottom tab bar height reduces usable mobile viewport** — existing
  mobile page content already accounts for the topbar (`pt-14` pattern);
  pages will need bottom padding (`pb-16` or similar) added so the tab bar
  doesn't overlap page content. This needs to be checked per-page during
  the mobile regression pass, not assumed to be automatic.
