# Design-system token layer validation (Formae `design-system/tokens/`)

This branch (`design-system-validation`) exists only to answer one question:
**does the Formae design system's token layer, dropped into a real,
unrelated, already-shipped codebase, hold up on its own?** No components
were ported — only `app/globals.css`'s token block was swapped. Nothing else
in this repo was touched, and this branch is not merged into `main`.

## Which style: Ledger

Picked **`design-system/tokens/ledger.css`** over `hearth.css`.

Nadayu28 is a three-perspective smart-community management system
(resident / security / management office — see `SYSTEM_OVERVIEW.md`). Before
deciding, I read `AdminPanel.tsx` and `Dashboard.tsx` directly rather than
going on the docs alone:

- `AdminPanel.tsx` is a tabbed back-office console: an audit log, a billing
  tab with per-unit fee schedules and arrears reporting, a CSV export
  (`arrearsToCSV`), payment recording modals, role management, violation
  tracking. This is a register, not a storefront.
- `Dashboard.tsx` (the resident-facing view) is also dense and
  information-forward rather than spacious/marketing — small type (`text-xs`,
  `text-[11px]`), tight row padding, an "agenda" list of bookings/packages,
  uppercase tracking-widest eyebrow labels. It reads like a compact
  operations feed, not a "one booking, one customer, one price list" page.

That matches Ledger's own stated brief — "precision/high-density register
for ops-heavy B2B businesses" — much more closely than Hearth's ("client-facing
service businesses... pages with a handful of large things on them"). Nadayu28
has no single screen that reads as Hearth's target shape.

## What the port actually was

Mechanical, in the sense that no hand-tuning or invented values were needed
to get `next build` to exit 0. But mechanical did **not** mean safe or
sufficient — see below. The swap:

- Replaced Nadayu28's entire `@theme { ... }` block (10 `--color-nadayu-*`
  custom properties, `--font-sans`, 5 `--animate-*` tokens, plus 4 keyframe
  blocks) with Ledger's `@theme { ... }` block (canvas/ink/paper/primary/status
  scale, ~30 `--color-*` custom properties) verbatim from
  `design-system/tokens/ledger.css` in the Formae repo.
- Inserted Ledger's `:root { ... }` craft-token block (`--fw-*`, `--tracking-*`,
  `--border-*`, `--shadow-hue`, `--hairline`, `--ease-out-quad`, `--dur*`) and
  its global element rules (`html { letter-spacing }`, `b, strong`, `.tnum`,
  `body`, `:focus-visible`) directly below it.
- Left every line of Nadayu28's pre-existing global CSS below that point
  completely untouched (scrollbar styling, its own `body`, `*:focus-visible`,
  `button:focus-visible`, `::selection`, date-picker styling, backdrop-blur
  support, the `fadeIn` keyframe and `.animate-fade-in` class) — per the
  brief, no components or supporting global rules were rewritten to
  compensate for the swap.
- Zero component files were touched. Zero custom-property names were
  invented to paper over gaps.

## Build result: exits 0, tells you nothing is wrong

`npm run build` (`next build`, Turbopack, Next 16.3.0) on both the
pre-swap baseline and the post-swap tree:

```
✓ Compiled successfully in 3.8s
  Running TypeScript ...
  Finished TypeScript in 3.1s ...
  Collecting page data using 21 workers ...
✓ Generating static pages using 21 workers (20/20) in 1019ms
  Finalizing page optimization ...
```

All 20 routes statically generate. TypeScript passes. Exit code 0. There is
**no build error, no TypeScript error, and no warning** anywhere in the
output that indicates anything changed. (Note: the very first baseline
build, before any `.env` was created, failed with `Error: supabaseUrl is
required.` — that is Nadayu28's own pre-existing requirement for Supabase
env vars at prerender time, unrelated to the token swap, and was worked
around with a throwaway `.env` of dummy values, gitignored, not committed.)

A green build here is a false signal. Verified this by inspecting the
compiled Tailwind bundle directly (`.next/static/chunks/*.css`) rather than
trusting the exit code:

```
$ grep -c "nadayu" .next/static/chunks/28zitm4rrbd7a.css
0
```

**Zero.** Every one of the 1,111 `nadayu-*` Tailwind utility usages
(`bg-nadayu-panel`, `text-nadayu-accent`, `border-nadayu-border`,
`bg-nadayu-cream`, `text-nadayu-muted`, `bg-nadayu-warning/10`, etc., across
23 files — `AdminPanel.tsx`, `Dashboard.tsx`, `Login.tsx`, `Navigation.tsx`,
`MobileTabBar.tsx`, and 18 more) compiles to **no CSS rule at all**, because
Tailwind v4's JIT engine silently drops a utility class when the
`--color-nadayu-*` custom property it resolves against doesn't exist in
`@theme` — it does not error, warn, or even leave a comment. Every
background, text color, and border driven by those classes falls through to
the browser default (usually transparent background / black text / no
border). This is total, silent, unstyled breakage across effectively the
whole UI, and the build system offers no signal of it whatsoever.

## The one token that *is* missing by name, and its blast radius

`--font-sans` is the one property both files use by the same name, and the
mismatch there is real, not just cosmetic:

- Nadayu28's original `@theme` set `--font-sans: var(--font-inter), sans-serif;`,
  bridging Tailwind's `.font-sans` utility to the actual `--font-inter` value
  that `next/font/google`'s `Inter(...)` call injects as a CSS variable on
  `<html>` (see `app/layout.tsx:37-38`: `<html className={inter.variable}>` /
  `<body className="font-sans">`).
- `ledger.css` ships that exact line **commented out**, with a comment
  telling the consuming app to supply its own font wiring.
- Result, confirmed in the compiled CSS: `.font-sans{font-family:var(--font-sans)}`
  now resolves against nothing. Per CSS custom-property semantics that makes
  the whole declaration invalid, so `font-family` on `<body>` falls through
  to its inherited value — the browser/Tailwind-preflight system font stack,
  not Inter. The app silently stops using the font it was built and shipped
  with. No error anywhere.
- The 5 `--animate-*` tokens Nadayu28 defined (`--animate-slide-up`,
  `--animate-pulse-slow`, `--animate-shimmer`, `--animate-glow`, and
  `--animate-fade-in`) are **not** used anywhere as Tailwind utility classes
  in any `.tsx` file (checked with a repo-wide grep) — so losing them is a
  non-event in this codebase specifically, not a general safety net.

## A second, independent problem: source-order collisions, not just missing tokens

Because the brief for this task is explicit that global element rules
(`body`, `:focus-visible`) should be carried over from the chosen token file
too, and because Nadayu28 already had its own hand-written versions of both,
pasting Ledger's copies in *before* Nadayu28's pre-existing ones creates a
same-specificity cascade fight that Nadayu28's older rules always win, purely
because they appear later in the file. Verified directly in the compiled
CSS:

```
body{background:var(--color-ink-950);color:var(--color-paper)}   /* Ledger's — inert */
body{-webkit-font-smoothing:antialiased;...;background:#fff;...}  /* Nadayu28's — wins */

:focus-visible{box-shadow:0 0 0 2px var(--color-ink-900), 0 0 0 4px var(--color-primary);border-radius:4px;outline:none}  /* Ledger's ring */
:focus-visible{outline-offset:2px;outline:2px solid #0f172a}      /* Nadayu28's — outline wins, but... */
:focus-visible{outline-offset:0;outline:2px solid #0f172a}
```

`outline` is overridden back to Nadayu28's old literal navy
(`#0f172a`, which is itself the un-tokenized *old* panel color, now
disconnected from any token). But `box-shadow` is a *different* property, so
it is never overridden — the net effect is both rings render at once: a
solid 2px navy outline **and** a Ledger-blue box-shadow ring stacked around
every focused element. This is not a case of "one wins cleanly"; it's a
visibly broken compound state that a naive token-file drop-in produces and
that no tool in the build chain flags.

The document-background collision is cleaner but no less real: Ledger's
intended canvas token (`--color-ink-950`, a light navy-tinted grey) never
paints anywhere on `<body>`, because Nadayu28's own `background: #ffffff`
rule, further down the same file, wins outright.

## Verdict

**The token layer needs two specific things before it's portable into an
existing app, not "some polish":**

1. **A rename/compatibility layer for consumer-facing custom-property
   names.** The design-system token files use a generic vocabulary
   (`--color-canvas`, `--color-ink-950`, `--color-primary`, `--color-jade`,
   ...); real consuming apps that pre-date the design system name their own
   tokens after themselves (here, `--color-nadayu-*`). Tailwind v4's JIT
   fails this *silently* — no error, no warning, exit code 0 — which means
   automated build/typecheck gates cannot catch a token-layer swap that
   breaks 100% of a codebase's color usage. Either the token file needs to
   ship (or the porting process needs to generate) alias custom properties
   matching whatever the target app already uses, or adopting the design
   system has to be treated as a full find-and-replace of every consuming
   class name — which is component-layer work, not token-layer work, and
   contradicts the idea that the token layer alone is portable.
2. **`--font-sans` must not ship commented out.** It's the one property name
   shared between an arbitrary consumer app and this design system by
   convention (Tailwind's own theme key), and leaving it undefined doesn't
   error — it silently drops the app back to system-default fonts. This
   should either default to a system-font stack explicitly (so an
   unconfigured consumer at least gets an intentional value, not an
   accidental one) or the design-system docs should say, loudly, that
   omitting it is unsafe to leave as a copy-paste no-op.

A secondary, process-level finding for whoever runs a future token-layer
port: don't paste a new file's global element rules (`body`,
`:focus-visible`) above an existing app's own copies of the same selectors
without deleting the old ones — same-specificity source-order collisions are
easy to introduce this way and, as shown above, can produce compound broken
states (two focus rings at once) rather than a clean "old wins" or "new
wins" outcome.

What *did* work cleanly: the color values, status scale, craft tokens
(`--fw-*`, `--tracking-*`, `--border-*`, `--shadow-hue`, `--hairline`,
easing/duration) and `.tnum` all dropped in with no naming collisions and no
build-time errors, because nothing in Nadayu28 already used those names.
The token *values* are self-consistent; the problem is entirely about a
token layer meeting a codebase that was never written against it.
