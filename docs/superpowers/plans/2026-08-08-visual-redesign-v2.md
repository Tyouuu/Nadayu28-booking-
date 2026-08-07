# Visual Redesign v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Phase 3b's warm-residential palette with a navy/blue
"professional trust" direction benchmarked against Buildium/Stripe, fix the
sidebar contrast bug, remove the serif/all-caps mismatch, replace the
mobile slide-out drawer with a bottom tab bar, and eliminate the "floating
dark card in a light page" structural pattern.

**Architecture:** Because Phase 3b already moved every component onto
named Tailwind tokens (`nadayu-bg/panel/accent/success/border/muted/cream`
defined in `index.html`), most of the recolor is a single 7-value edit.
The remaining work is: stripping `font-serif` (16 files), fixing literal
hex values that bypass the token system (confirmed via grep, listed per
task below), fixing text-contrast pairings that broke because the new
accent color (`#2563EB`, a mid-saturation blue) is visually darker than
the old one (`#B5652F`, a warm terracotta) — so `text-black`/
`text-nadayu-panel` on a solid accent background is no longer readable and
must become `text-white` — and building two new small components for the
mobile bottom tab bar.

**Tech Stack:** React 19 + TypeScript + Vite, Tailwind via CDN
(`index.html`'s inline `tailwind.config`), no separate CSS files, Recharts
for the AdminPanel charts, `qrcode.react` for QR codes.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-08-visual-redesign-v2-design.md`
- New token hex values (replacing Phase 3b's warm values in
  `index.html`'s `tailwind.config`):
  `nadayu-bg` `#F8FAFC`, `nadayu-panel` `#0F172A`, `nadayu-accent`
  `#2563EB`, `nadayu-success` `#16A34A`, `nadayu-border` `#E2E8F0`,
  `nadayu-muted` `#64748B`, `nadayu-cream` `#F1F5F9`.
- The `serif` font family entry and the Fraunces Google Fonts `<link>` are
  removed entirely — no component should reference `font-serif` after
  this plan.
- **Contrast rule for accent buttons/badges:** wherever `bg-nadayu-accent`
  is used at **full opacity** (no `/5`, `/10`, `/15`, `/20` suffix), any
  text/icon color inside it (`text-black`, `text-black/NN`,
  `text-nadayu-panel`) becomes `text-white`/`text-white/NN` (matching
  whatever opacity suffix, if any, the original had). Tinted/opacity-suffixed
  `bg-nadayu-accent/NN` usages are unaffected — those sit on a
  near-white effective background and keep their existing dark text.
- **"No floating dark card" scope decision:** the spec's structural
  principle ("no dark cards floating in a light page") is applied to the
  two concrete instances that were actually flagged in review — the
  Dashboard's `Overview` card and AdminPanel's two analytics chart cards —
  not to every full-width dark header band at the top of a page (e.g.
  `Documents.tsx`, `Maintenance.tsx`, `InviteVisitor.tsx`,
  `ParkingBooking.tsx`, `CommunityBoard.tsx`, `Reporting.tsx`,
  `SecurityScanner.tsx`, `SecurityProfile.tsx`, `ManagementProfile.tsx`).
  Those header bands are full-bleed, touch the top of the page, and read
  as an intentional page-header design element (the same pattern
  Buildium/Stripe use), not as a "floating island" — they get recolored
  automatically by the Task 1 token edit and need no structural change.
- No test suite exists in this repo. Verification per task is
  `npx tsc --noEmit` + `npm run build`. Final task adds a grep sweep and a
  manual cross-role Playwright pass at desktop and mobile (390px) widths.
- Working directly on `main`, no feature branch (established in every
  prior phase of this project).

---

### Task 1: Design tokens — recolor `index.html`

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: the seven `nadayu-*` token hex values every other task's
  Tailwind classes resolve against, and the removal of the `serif` font
  family (so any leftover `font-serif` class falls back to `sans`, not a
  build error — Tailwind's CDN JIT silently ignores unknown utility
  variants for a removed family only if the class itself is removed too,
  which Task 2 handles; this task alone makes `font-serif` a no-op-looking
  but still-present class until Task 2 runs).

- [ ] **Step 1: Replace the color tokens and remove the serif font family**

In `index.html`, replace the `fontFamily` and `colors` blocks (currently
lines 20–32):

```js
fontFamily: {
  sans: ['Inter', 'sans-serif'],
},
colors: {
  'nadayu-bg':      '#F8FAFC',
  'nadayu-panel':   '#0F172A',
  'nadayu-accent':  '#2563EB',
  'nadayu-success': '#16A34A',
  'nadayu-border':  '#E2E8F0',
  'nadayu-muted':   '#64748B',
  'nadayu-cream':   '#F1F5F9',
},
```

- [ ] **Step 2: Remove the Fraunces Google Fonts link**

Replace line 15:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:wght@400;500;600;700&display=swap" rel="stylesheet">
```

with:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Fix the plain `<style>` block (separate from `tailwind.config`)**

This block is NOT touched by Steps 1–2 — it's raw CSS further down the
same file. Replace all four `#2B241C` occurrences (outline focus styles
and selection color, currently lines 103, 108, 125, 130) with `#0F172A`:

```css
      /* Custom focus styles for better accessibility */
      *:focus-visible {
        outline: 2px solid #0F172A;
        outline-offset: 2px;
      }

      button:focus-visible {
        outline: 2px solid #0F172A;
        outline-offset: 0;
      }
```

```css
      /* Custom selection color */
      ::selection {
        background-color: #0F172A;
        color: white;
      }

      ::-moz-selection {
        background-color: #0F172A;
        color: white;
      }
```

- [ ] **Step 4: Verify**

```bash
rm -rf node_modules/.vite
npx tsc --noEmit
npm run build
```
Expected: both succeed. (Phase 3b hit a stale Vite cache error after
editing this same file — deleting `node_modules/.vite` first avoids it.)

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: recolor design tokens to navy/blue, drop Fraunces serif font"
```

---

### Task 2: Strip `font-serif` from all headings

**Files:**
- Modify: `components/SmartAssistant.tsx`, `components/CommunityBoard.tsx`,
  `components/Profile.tsx`, `components/SecurityProfile.tsx`,
  `components/ManagementProfile.tsx`, `components/Documents.tsx`,
  `components/AdminPanel.tsx`, `components/Reporting.tsx`,
  `components/Maintenance.tsx`, `components/SecurityScanner.tsx`,
  `components/Amenities.tsx`, `components/InviteVisitor.tsx`,
  `components/ParkingBooking.tsx`, `components/Dashboard.tsx`,
  `components/Navigation.tsx`, `components/Login.tsx`

**Interfaces:**
- Consumes: nothing from Task 1 directly (independent edit), but should
  run after Task 1 so `npm run build` reflects the final font config.
- Produces: no more `font-serif` class anywhere in `components/`.

Every occurrence follows the exact pattern `font-serif ` (with a trailing
space, always followed by more classes — confirmed by grep, no file has
`font-serif` as the last/only class) — for example
`className="font-serif text-xl font-bold text-gray-900 mb-3"` becomes
`className="text-xl font-bold text-gray-900 mb-3"`. This is identical
across all 31 occurrences in the 16 files above, so it's done with a
script rather than 31 manual edits.

- [ ] **Step 1: Write and run the removal script**

```js
// scratch/strip-font-serif.mjs
import fs from 'fs';

const files = [
  'components/SmartAssistant.tsx',
  'components/CommunityBoard.tsx',
  'components/Profile.tsx',
  'components/SecurityProfile.tsx',
  'components/ManagementProfile.tsx',
  'components/Documents.tsx',
  'components/AdminPanel.tsx',
  'components/Reporting.tsx',
  'components/Maintenance.tsx',
  'components/SecurityScanner.tsx',
  'components/Amenities.tsx',
  'components/InviteVisitor.tsx',
  'components/ParkingBooking.tsx',
  'components/Dashboard.tsx',
  'components/Navigation.tsx',
  'components/Login.tsx',
];

for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  const after = before.replaceAll('font-serif ', '');
  if (before === after) {
    console.log('NO CHANGE (unexpected):', f);
  } else {
    fs.writeFileSync(f, after);
    console.log('OK', f);
  }
}
```

Run: `node scratch/strip-font-serif.mjs`
Expected: `OK` printed for all 16 files, no `NO CHANGE` lines.

- [ ] **Step 2: Verify no leftover occurrences**

```bash
grep -rn "font-serif" components/
```
Expected: no output.

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 4: Delete the scratch script and commit**

```bash
rm scratch/strip-font-serif.mjs
git add components/
git commit -m "style: remove font-serif from all headings (Fraunces dropped)"
```

---

### Task 3: Navigation.tsx — sidebar contrast fix + accent-text fix

**Files:**
- Modify: `components/Navigation.tsx`

**Interfaces:**
- Consumes: `nadayu-panel`/`nadayu-accent` token values from Task 1.
- Produces: a legible sidebar (this task does NOT touch the mobile
  drawer/hamburger structure — that's Task 6). Desktop sidebar and mobile
  topbar both get fixed here; the mobile drawer JSX still exists after
  this task and is removed in Task 6.

Current low-contrast/broken-contrast lines (all confirmed via direct read
of `components/Navigation.tsx`):

- [ ] **Step 1: Fix sidebar section label and logo subtitle contrast**

Replace (line 48):
```tsx
            <p className="text-[#555] text-[10px] mt-0.5 tracking-wide">Community Portal</p>
```
with:
```tsx
            <p className="text-slate-500 text-[10px] mt-0.5 tracking-wide">Community Portal</p>
```

Replace (line 55):
```tsx
        <p className="px-3 pt-2 pb-1.5 text-[#444] text-[9px] font-bold uppercase tracking-[0.12em]">Navigation</p>
```
with:
```tsx
        <p className="px-3 pt-2 pb-1.5 text-slate-500 text-[9px] font-bold uppercase tracking-[0.12em]">Navigation</p>
```

- [ ] **Step 2: Fix nav item contrast and active-state text color**

Replace (line 62-64):
```tsx
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group ${
                active ? 'bg-nadayu-accent text-black' : 'text-[#777] hover:text-white hover:bg-white/[0.06]'
              }`}
```
with:
```tsx
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group ${
                active ? 'bg-nadayu-accent text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
```

- [ ] **Step 3: Fix logo mark text color (both desktop and mobile topbar)**

Replace (line 44):
```tsx
            <span className="font-extrabold text-black text-base leading-none">N</span>
```
with:
```tsx
            <span className="font-extrabold text-white text-base leading-none">N</span>
```

Replace (line 117):
```tsx
            <span className="font-extrabold text-black text-xs">N</span>
```
with:
```tsx
            <span className="font-extrabold text-white text-xs">N</span>
```

- [ ] **Step 4: Fix bottom-section (language switcher, account, sign out) contrast**

Replace (lines 81-83):
```tsx
          <Globe size={15} className="text-[#666] flex-shrink-0" />
          <span className="text-[13px] font-medium text-[#777] flex-1">{LOCALE_LABELS[locale]}</span>
          <span className="text-[10px] text-[#555] font-bold uppercase">{locale.toUpperCase()}</span>
```
with:
```tsx
          <Globe size={15} className="text-slate-400 flex-shrink-0" />
          <span className="text-[13px] font-medium text-slate-400 flex-1">{LOCALE_LABELS[locale]}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">{locale.toUpperCase()}</span>
```

Replace (lines 90-91):
```tsx
          <div className="w-7 h-7 rounded-full bg-[#222] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-[#666]" />
```
with:
```tsx
          <div className="w-7 h-7 rounded-full bg-slate-800 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-slate-400" />
```

Replace (line 95):
```tsx
            <p className="text-[#444] text-[10px] uppercase tracking-wide">{currentUserRole}</p>
```
with:
```tsx
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">{currentUserRole}</p>
```

Replace (line 97):
```tsx
          <Settings size={12} className="text-[#444] group-hover:text-[#666] transition-colors flex-shrink-0" />
```
with:
```tsx
          <Settings size={12} className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
```

Replace (line 102):
```tsx
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#555] hover:text-[#bbb] hover:bg-white/[0.06] transition-all"
```
with:
```tsx
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
```

- [ ] **Step 5: Verify**

```bash
grep -n "#777\|#444\|#555\|#666\|bg-\[#222\]" components/Navigation.tsx
```
Expected: no output (all raw hex grays replaced).

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add components/Navigation.tsx
git commit -m "fix: sidebar nav contrast, accent-background text color"
```

---

### Task 4: Accent-button text contrast fix (app-wide)

**Files:**
- Modify: `components/Login.tsx`, `components/SecurityScanner.tsx`,
  `components/SecurityProfile.tsx`, `components/CommunityBoard.tsx`,
  `components/Reporting.tsx`, `components/ParkingBooking.tsx`,
  `components/ManagementProfile.tsx`, `components/Profile.tsx`,
  `components/CustomPickers.tsx`, `components/SmartAssistant.tsx`,
  `components/Dashboard.tsx`

**Interfaces:**
- Consumes: the contrast rule from Global Constraints and the
  `nadayu-accent` value from Task 1.
- Produces: every solid (non-tinted) `bg-nadayu-accent` element has
  readable white text/icons.

This is the same "primary button" pattern repeated across the app —
`bg-nadayu-accent ... text-nadayu-panel` (or, in a few places,
`text-black`) — which worked when the accent was a light terracotta but
fails contrast now that it's a mid-dark blue (`#2563EB` on `#0F172A` is
~3.5:1, below the 4.5:1 text minimum). Confirmed via grep across all
`components/*.tsx` — every match below is a **solid** `bg-nadayu-accent`
(no `/NN` opacity suffix). Do not change any `bg-nadayu-accent/5`,
`/10`, `/15`, or `/20` occurrence — those sit on a near-white tinted
background and their existing dark text stays correct.

- [ ] **Step 1: Read each file's exact current lines before editing**

For each file listed above, run:
```bash
grep -n "bg-nadayu-accent" components/<file>.tsx
```
and read enough surrounding context (the full `className` string / ternary
expression) to confirm whether the match is solid or tinted, per the rule
above. Do not skip this — line numbers may have shifted since Task 2's
`font-serif` removal changed line counts in the same files.

- [ ] **Step 2: For each solid-accent match with dark text, flip to white**

The substitution is always one of these three shapes — apply whichever
matches what Step 1 found:

```
text-black          → text-white
text-black/NN        → text-white/NN   (keep the same NN opacity number)
text-nadayu-panel    → text-white
```

This includes (non-exhaustive — Step 1's grep is the source of truth for
exact current line numbers):
- `Navigation.tsx` is already done in Task 3 — do not duplicate here.
- `Dashboard.tsx` — the Visitor Parking stat card (`text-black/70`,
  `text-black/50` x2, `text-black`) and the quick-action icon hover state
  (`group-hover:text-black`).
- `Login.tsx` — every primary button/badge using
  `bg-nadayu-accent ... text-nadayu-panel` (there are ~10 — sign-in
  button, password-reset button, OTP button, visitor-access button,
  floating visitor-access button, etc).
- `SecurityScanner.tsx`, `SecurityProfile.tsx` — primary buttons and the
  role badge; `SecurityProfile.tsx` also has three
  `group-hover:text-black` icon hovers paired with
  `group-hover:bg-nadayu-accent`.
- `CommunityBoard.tsx`, `Reporting.tsx`, `ParkingBooking.tsx`,
  `ManagementProfile.tsx`, `Profile.tsx`, `CustomPickers.tsx` — primary
  buttons and active-tab/active-pill states using the same pattern.
- `SmartAssistant.tsx` — the send button and the closed-state FAB both
  use `hover:bg-nadayu-accent hover:text-nadayu-panel`; becomes
  `hover:bg-nadayu-accent hover:text-white`.

- [ ] **Step 3: Verify no tinted occurrences were accidentally touched**

```bash
grep -n "bg-nadayu-accent/[0-9]" components/*.tsx
```
Manually confirm each still pairs with a dark text color (e.g.
`text-nadayu-panel`, `text-nadayu-accent`) — none of these should have
been changed to white in Step 2.

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add components/
git commit -m "fix: white text on solid accent buttons (blue accent is darker than the old terracotta)"
```

---

### Task 5: Fix literal hex values + the two floating dark cards

**Files:**
- Modify: `components/Amenities.tsx`, `components/AdminPanel.tsx`,
  `components/InviteVisitor.tsx`, `components/ParkingBooking.tsx`,
  `components/Dashboard.tsx`

**Interfaces:**
- Consumes: new token hex values from Task 1.
- Produces: no component bypasses the token system with a literal hex
  value that doesn't match the new palette; the Dashboard Overview card
  and AdminPanel's two chart cards are light cards instead of dark
  floating ones (per the Global Constraints scope decision).

- [ ] **Step 1: `Amenities.tsx` — mechanical hex substitution**

All raw hex/rgba values in this file are literal restatements of token
colors (confirmed via read of every match). Apply this exact substitution
table via script (same approach as Task 2):

```js
// scratch/fix-amenities-hex.mjs
import fs from 'fs';

const subs = [
  ['#2B241C', '#0F172A'],
  ['#B5652F', '#2563EB'],
  ['#4A5D3A', '#16A34A'],
  ['#E4D9C6', '#E2E8F0'],
  ['#6B5D48', '#64748B'],
  ['#F5F0E8', '#F1F5F9'],
  ['rgba(43, 36, 28,', 'rgba(15, 23, 42,'],   // panel
  ['rgba(181, 101, 47,', 'rgba(37, 99, 235,'], // accent
  ['rgba(74, 93, 58,', 'rgba(22, 163, 74,'],   // success
  ['rgba(107, 93, 72,', 'rgba(100, 116, 139,'], // muted
  ['#3A3226', '#1E293B'], // panel hover shade (brighter navy, was brighter brown)
];

const file = 'components/Amenities.tsx';
let content = fs.readFileSync(file, 'utf8');
for (const [from, to] of subs) {
  content = content.replaceAll(from, to);
}
fs.writeFileSync(file, content);
console.log('OK', file);
```

Run: `node scratch/fix-amenities-hex.mjs`

- [ ] **Step 2: Verify `Amenities.tsx` has no leftover old hex**

```bash
grep -n "#2B241C\|#B5652F\|#4A5D3A\|#E4D9C6\|#6B5D48\|#F5F0E8\|#3A3226\|rgba(43, 36, 28\|rgba(181, 101, 47\|rgba(74, 93, 58\|rgba(107, 93, 72" components/Amenities.tsx
```
Expected: no output.

- [ ] **Step 3: `InviteVisitor.tsx` and `ParkingBooking.tsx` — QR code color**

Replace in `components/InviteVisitor.tsx` (line 137):
```tsx
{result?.qrCode && <QRCodeSVG value={result.qrCode} size={160} bgColor="#ffffff" fgColor="#2B241C" level="M" />}
```
with:
```tsx
{result?.qrCode && <QRCodeSVG value={result.qrCode} size={160} bgColor="#ffffff" fgColor="#0F172A" level="M" />}
```

Replace in `components/ParkingBooking.tsx` (around line 304-305):
```tsx
                      bgColor="#ffffff"
                      fgColor="#2B241C"
```
with:
```tsx
                      bgColor="#ffffff"
                      fgColor="#0F172A"
```

- [ ] **Step 4: `AdminPanel.tsx` — convert the two chart cards from dark to light**

Read `components/AdminPanel.tsx` around lines 108-174 first — Task 2 may
have shifted line numbers slightly. Replace the Visitor Traffic card
(currently `bg-nadayu-panel rounded-2xl p-6` at what was line 111):

```tsx
        <div className="bg-nadayu-panel rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">Visitor Traffic</h3>
              <p className="text-sm text-gray-500">Weekly Overview</p>
            </div>
            <button className="p-2 rounded-xl text-gray-500 hover:bg-white/10 transition-colors"><MoreHorizontal size={18} /></button>
          </div>
```
with:
```tsx
        <div className="bg-white border border-nadayu-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Visitor Traffic</h3>
              <p className="text-sm text-nadayu-muted">Weekly Overview</p>
            </div>
            <button className="p-2 rounded-xl text-nadayu-muted hover:bg-nadayu-cream transition-colors"><MoreHorizontal size={18} /></button>
          </div>
```

And its chart colors (currently around line 121-137):
```tsx
              <LineChart data={parkingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    padding: '10px 14px',
                    fontWeight: 600,
                    backgroundColor: '#3A3226',
                    color: '#fff',
                  }}
                />
                <Line type="monotone" dataKey="visitors" stroke="#B5652F" strokeWidth={3} dot={{ r: 4, fill: '#B5652F', strokeWidth: 2, stroke: '#2B241C' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="violations" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 4, fill: '#ff6b6b', strokeWidth: 2, stroke: '#2B241C' }} />
              </LineChart>
```
with:
```tsx
              <LineChart data={parkingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    padding: '10px 14px',
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    color: '#0F172A',
                  }}
                />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="violations" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 4, fill: '#ff6b6b', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
```

Replace the Facility Usage card (same pattern, currently around line
154-170):
```tsx
        <div className="bg-nadayu-panel rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">Facility Usage</h3>
              <p className="text-sm text-gray-500">Hours per Week</p>
            </div>
            <button className="p-2 rounded-xl text-gray-500 hover:bg-white/10 transition-colors"><Filter size={18} /></button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 600, backgroundColor: '#3A3226', color: '#fff' }} />
                <Bar dataKey="hours" fill="#B5652F" radius={[8, 8, 8, 8]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
```
with:
```tsx
        <div className="bg-white border border-nadayu-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Facility Usage</h3>
              <p className="text-sm text-nadayu-muted">Hours per Week</p>
            </div>
            <button className="p-2 rounded-xl text-nadayu-muted hover:bg-nadayu-cream transition-colors"><Filter size={18} /></button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontWeight: 600, backgroundColor: '#fff', color: '#0F172A' }} />
                <Bar dataKey="hours" fill="#2563EB" radius={[8, 8, 8, 8]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
```

- [ ] **Step 5: `Dashboard.tsx` — convert the Overview card from dark to light**

Read `components/Dashboard.tsx` around lines 46-77 first (Task 2/4 may
have shifted line numbers). Replace the container and its two `white/[]`
stat sub-cards:

```tsx
      <div className="bg-nadayu-panel rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-sm">{t.dashboard.overview}</h2>
          <span className="text-gray-600 text-xs">{t.common.thisMonth}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-nadayu-accent rounded-xl p-5 cursor-pointer hover:brightness-95 transition-all" onClick={() => setCurrentView("parking")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-white/70 text-xs font-semibold">{t.dashboard.visitorParking}</span>
              <ArrowUpRight size={14} className="text-white/50" />
            </div>
            <p className="text-white text-[1.6rem] font-bold leading-none mb-1">Unlimited</p>
            <p className="text-white/50 text-xs mt-2">{t.dashboard.accessActive}</p>
          </div>
          <div className="bg-white/[0.06] rounded-xl p-5 cursor-pointer hover:bg-white/[0.1] transition-all" onClick={() => setCurrentView("amenities")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-nadayu-muted text-xs font-semibold">{t.dashboard.activeBookings}</span>
              <ArrowUpRight size={14} className="text-gray-600" />
            </div>
            <p className="text-white text-[1.6rem] font-bold leading-none mb-1">{activeBookings.length}</p>
            <p className="text-gray-500 text-xs mt-2">{t.dashboard.facilitiesReserved}</p>
          </div>
          <div className="bg-white/[0.06] rounded-xl p-5 cursor-pointer hover:bg-white/[0.1] transition-all" onClick={() => setCurrentView("community")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-nadayu-muted text-xs font-semibold">{t.dashboard.announcements}</span>
              <ArrowUpRight size={14} className="text-gray-600" />
            </div>
            <p className="text-white text-[1.6rem] font-bold leading-none mb-1">{recentAnnouncements.length}</p>
            <p className="text-gray-500 text-xs mt-2">{t.dashboard.communityUpdates}</p>
          </div>
        </div>
      </div>
```
with:
```tsx
      <div className="bg-white border border-nadayu-border rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-gray-900 font-semibold text-sm">{t.dashboard.overview}</h2>
          <span className="text-nadayu-muted text-xs">{t.common.thisMonth}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-nadayu-accent rounded-xl p-5 cursor-pointer hover:brightness-95 transition-all" onClick={() => setCurrentView("parking")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-white/70 text-xs font-semibold">{t.dashboard.visitorParking}</span>
              <ArrowUpRight size={14} className="text-white/50" />
            </div>
            <p className="text-white text-[1.6rem] font-bold leading-none mb-1">Unlimited</p>
            <p className="text-white/50 text-xs mt-2">{t.dashboard.accessActive}</p>
          </div>
          <div className="bg-nadayu-cream rounded-xl p-5 cursor-pointer hover:bg-nadayu-border transition-all" onClick={() => setCurrentView("amenities")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-nadayu-muted text-xs font-semibold">{t.dashboard.activeBookings}</span>
              <ArrowUpRight size={14} className="text-nadayu-muted" />
            </div>
            <p className="text-gray-900 text-[1.6rem] font-bold leading-none mb-1">{activeBookings.length}</p>
            <p className="text-nadayu-muted text-xs mt-2">{t.dashboard.facilitiesReserved}</p>
          </div>
          <div className="bg-nadayu-cream rounded-xl p-5 cursor-pointer hover:bg-nadayu-border transition-all" onClick={() => setCurrentView("community")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-nadayu-muted text-xs font-semibold">{t.dashboard.announcements}</span>
              <ArrowUpRight size={14} className="text-nadayu-muted" />
            </div>
            <p className="text-gray-900 text-[1.6rem] font-bold leading-none mb-1">{recentAnnouncements.length}</p>
            <p className="text-nadayu-muted text-xs mt-2">{t.dashboard.communityUpdates}</p>
          </div>
        </div>
      </div>
```

(Note: the Visitor Parking sub-card's text already reads `text-white/70`
etc. here because Task 4 already flipped it from `text-black/70` — if
Task 4 ran first, use `text-white` as shown; if this task somehow runs
first, apply Task 4's rule to this block too so it doesn't get missed.)

- [ ] **Step 6: Verify**

```bash
grep -rn "#2B241C\|#B5652F\|#4A5D3A\|#E4D9C6\|#6B5D48\|#F5F0E8\|#3A3226" components/
```
Expected: no output anywhere in `components/`.

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 7: Delete scratch script and commit**

```bash
rm scratch/fix-amenities-hex.mjs
git add components/
git commit -m "fix: recolor remaining literal hex values, convert Dashboard/AdminPanel cards from dark floating panels to light cards"
```

---

### Task 6: Mobile bottom tab bar (replaces the slide-out drawer)

**Files:**
- Create: `components/MobileTabBar.tsx`
- Create: `components/MoreMenu.tsx`
- Modify: `components/Navigation.tsx` (remove hamburger + drawer, render
  `<MobileTabBar />`)
- Modify: `App.tsx` (add `'more'` case to `renderContent`'s switch, add
  bottom padding to the scrollable content area so the fixed tab bar
  doesn't overlap page content)

**Interfaces:**
- Consumes: `UserRole` from `types`, `useAuth()` (`currentUserRole`),
  `useNavigation()` (`currentView`, `navigate`) — same hooks
  `Navigation.tsx` already uses.
- Produces: `MobileTabBar` — no props, self-contained like `Navigation`.
  `MoreMenu` — no props, renders the "overflow" nav items for the current
  role and calls `navigate(id)` on tap, same as the sidebar.

- [ ] **Step 1: Create `components/MobileTabBar.tsx`**

```tsx
import React from 'react';
import { Home, Car, UserPlus, AlertTriangle, Shield, Wrench, BarChart2, FolderOpen, User, MoreHorizontal } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TABS_BY_ROLE: Record<UserRole, { direct: TabItem[]; more: TabItem[] }> = {
  [UserRole.RESIDENT]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'parking', label: 'Parking', icon: Car },
      { id: 'invite-visitor', label: 'Invite', icon: UserPlus },
      { id: 'report', label: 'Report', icon: AlertTriangle },
    ],
    more: [
      { id: 'documents', label: 'Documents', icon: FolderOpen },
      { id: 'amenities', label: 'Amenities', icon: BarChart2 },
      { id: 'community', label: 'Community', icon: MoreHorizontal },
      { id: 'account', label: 'Account', icon: User },
    ],
  },
  [UserRole.TENANT]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'parking', label: 'Parking', icon: Car },
      { id: 'invite-visitor', label: 'Invite', icon: UserPlus },
      { id: 'report', label: 'Report', icon: AlertTriangle },
    ],
    more: [
      { id: 'documents', label: 'Documents', icon: FolderOpen },
      { id: 'amenities', label: 'Amenities', icon: BarChart2 },
      { id: 'community', label: 'Community', icon: MoreHorizontal },
      { id: 'account', label: 'Account', icon: User },
    ],
  },
  [UserRole.SECURITY]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'security', label: 'Scan', icon: Shield },
      { id: 'maintenance', label: 'Maintain', icon: Wrench },
      { id: 'report', label: 'Report', icon: AlertTriangle },
    ],
    more: [
      { id: 'documents', label: 'Documents', icon: FolderOpen },
      { id: 'sec-profile', label: 'Profile', icon: User },
    ],
  },
  [UserRole.MANAGEMENT]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'documents', label: 'Docs', icon: FolderOpen },
      { id: 'maintenance', label: 'Maintain', icon: Wrench },
      { id: 'management', label: 'Admin', icon: BarChart2 },
      { id: 'mgmt-profile', label: 'Profile', icon: User },
    ],
    more: [],
  },
};

export const MobileTabBar: React.FC = () => {
  const { currentUserRole } = useAuth();
  const { currentView, navigate } = useNavigation();
  const config = TABS_BY_ROLE[currentUserRole];
  if (!config) return null;

  const showMoreTab = config.more.length > 0;
  const moreIsActive = config.more.some(item => item.id === currentView);
  const tabs = showMoreTab ? [...config.direct, { id: 'more', label: 'More', icon: MoreHorizontal }] : config.direct;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-nadayu-border z-30 flex items-stretch">
      {tabs.map(tab => {
        const active = tab.id === 'more' ? moreIsActive || currentView === 'more' : currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              active ? 'text-nadayu-accent' : 'text-nadayu-muted'
            }`}
          >
            <tab.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
```

- [ ] **Step 2: Create `components/MoreMenu.tsx`**

```tsx
import React from 'react';
import { Home, Car, UserPlus, AlertTriangle, Shield, Wrench, BarChart2, FolderOpen, User, MessageSquare, Dumbbell, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

const MORE_ITEMS: Record<UserRole, { id: string; label: string; icon: React.ElementType }[]> = {
  [UserRole.RESIDENT]: [
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'amenities', label: 'Amenities', icon: Dumbbell },
    { id: 'community', label: 'Community Board', icon: MessageSquare },
    { id: 'account', label: 'My Account', icon: User },
  ],
  [UserRole.TENANT]: [
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'amenities', label: 'Amenities', icon: Dumbbell },
    { id: 'community', label: 'Community Board', icon: MessageSquare },
    { id: 'account', label: 'My Account', icon: User },
  ],
  [UserRole.SECURITY]: [
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'sec-profile', label: 'Profile', icon: User },
  ],
  [UserRole.MANAGEMENT]: [],
};

export const MoreMenu: React.FC = () => {
  const { currentUserRole } = useAuth();
  const { navigate } = useNavigation();
  const items = MORE_ITEMS[currentUserRole] || [];

  return (
    <div className="max-w-md mx-auto pb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4">More</h2>
      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="w-full flex items-center gap-3 bg-white border border-nadayu-border rounded-xl px-4 py-3.5 text-left hover:border-nadayu-accent transition-colors"
          >
            <div className="w-9 h-9 bg-nadayu-cream rounded-lg flex items-center justify-center flex-shrink-0">
              <item.icon size={17} className="text-nadayu-muted" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">{item.label}</span>
            <ChevronRight size={16} className="text-nadayu-muted" />
          </button>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Wire the `'more'` view into `App.tsx`**

Add the import (alongside the other component imports, e.g. after the
`CommunityBoard` import):
```tsx
import { MoreMenu } from './components/MoreMenu';
```

Add the case (in `renderContent`'s `switch`, alongside the `'community'`
case):
```tsx
      case 'more':
        return <MoreMenu />;
```

- [ ] **Step 4: Add bottom padding so the tab bar doesn't overlap content**

Replace in `App.tsx`:
```tsx
            <div className="h-full overflow-y-auto p-4 md:p-8">
```
with:
```tsx
            <div className="h-full overflow-y-auto p-4 pb-24 md:p-8">
```

- [ ] **Step 5: Rewrite `Navigation.tsx` to drop the hamburger/drawer and render `MobileTabBar`**

Add the import at the top:
```tsx
import { MobileTabBar } from './MobileTabBar';
```

Remove `Menu`, `X`, and `isMobileOpen`/`setIsMobileOpen` usage tied to the
hamburger (the `Menu`/`X` icon imports and the `isMobileOpen` state are
no longer needed in this file — `NavigationContext` still exposes them
for now since other code doesn't reference them elsewhere, so leave the
context itself unchanged, just stop consuming those two fields here).

Replace the mobile topbar's right-side buttons (currently around
lines 121-128):
```tsx
        <div className="flex items-center gap-2">
          <button onClick={() => setLocale(nextLocale)} className="p-1.5 rounded-lg text-nadayu-muted hover:bg-nadayu-cream transition-colors text-xs font-bold uppercase">
            {locale}
          </button>
          <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-1.5 rounded-lg text-nadayu-muted hover:bg-nadayu-cream transition-colors">
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
```
with:
```tsx
        <div className="flex items-center gap-2">
          <button onClick={() => setLocale(nextLocale)} className="p-1.5 rounded-lg text-nadayu-muted hover:bg-nadayu-cream transition-colors text-xs font-bold uppercase">
            {locale}
          </button>
        </div>
```

Replace the mobile drawer block (currently around lines 138-144):
```tsx
      {/* Mobile drawer */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-48 z-30 md:hidden"><Sidebar /></div>
        </>
      )}
```
with:
```tsx
      {/* Mobile bottom tab bar */}
      <MobileTabBar />
```

Update the component's destructured hooks near the top — replace:
```tsx
  const { currentView, isMobileOpen, setIsMobileOpen, navigate } = useNavigation();
```
with:
```tsx
  const { currentView, navigate } = useNavigation();
```

Remove the now-unused `Menu, X,` from the `lucide-react` import list at
the top of the file.

- [ ] **Step 6: Verify TypeScript catches any remaining unused-import issues**

```bash
npx tsc --noEmit
```
Expected: succeeds with no "declared but never used" errors for `Menu`,
`X`, `isMobileOpen`, or `setIsMobileOpen` in `Navigation.tsx` (if any
appear, remove the remaining reference — `tsc` will point at the exact
line).

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/MobileTabBar.tsx components/MoreMenu.tsx components/Navigation.tsx App.tsx
git commit -m "feat: replace mobile drawer with bottom tab bar + More menu"
```

---

### Task 7: Full regression pass and deploy

**Files:** none (verification only)

**Interfaces:**
- Consumes: the fully redesigned app from Tasks 1-6.

- [ ] **Step 1: Grep sweep for leftover old values**

```bash
grep -rn "font-serif\|#FBF8F2\|#2B241C\|#B5652F\|#4A5D3A\|#E4D9C6\|#6B5D48\|#F5F0E8\|#3A3226" components/ index.html
grep -rn "text-\[#777\]\|text-\[#444\]\|text-\[#555\]\|bg-\[#222\]" components/
```
Expected: no output from either command.

- [ ] **Step 2: Full build verification**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 3: Manual cross-role Playwright pass**

Start the dev server, then for each of the four seeded test accounts
(`hafiz.a@email.com` = MANAGEMENT, `siewling.ng@email.com` = SECURITY,
`karwai.wong@email.com` = RESIDENT, password `Nadayu28!` for all):

- Log in, screenshot the Dashboard at desktop width (1280px) — confirm
  the Overview card is now a light card (no dark floating panel), sidebar
  nav text is legible for every item, no serif font anywhere.
- Resize to 390px width — confirm the sidebar is gone, the bottom tab bar
  appears with the correct role-specific tabs, and page content isn't
  clipped by the fixed tab bar (check the last visible content on a
  scrollable page like Documents or Community Board).
- Tap through every direct tab and, for RESIDENT/TENANT and SECURITY, tap
  "More" and confirm it navigates to `MoreMenu` and lists the correct
  remaining items, and that the "More" tab shows as active while on one
  of those pages.
- For MANAGEMENT specifically, screenshot the Admin Panel's Overview tab
  at desktop width — confirm both analytics cards are now light cards
  with dark-on-light chart text/axes, not white-on-dark.
- Screenshot the Login page — confirm the accent color reads as blue, not
  terracotta, and no serif heading remains.

- [ ] **Step 4: Deploy**

```bash
git push origin main
npx vercel deploy --prod --scope ty28
```
Expected: deployment succeeds, production alias
`https://nadayu28-booking.vercel.app` updates.
