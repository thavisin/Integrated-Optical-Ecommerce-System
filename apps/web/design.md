# Design: OptiMart

The locked system. Every Hallmark run reads this first, and every page uses it. Change it on purpose: this file is the rule.

## System
- Genre: editorial
- First page shape: Bento Grid (draw e7ba40). Backoffice: app screen.
- Theme: Solstice, dealt 3/3 (seed optical-eyewear-shop-browse-0a8c·ad56541a·2026-11-15·r0), light `long-light`
- Axes: light/high-contrast-serif/warm · posture: restrained
- Stamp: `apps/web/src/app/globals.css` line 1. No other file carries a stamp. The partials `styles/*.css` have only a pointer line.

## Tokens
`src/app/tokens.css` is the source of truth. The `@theme static` block exposes these tokens to Tailwind. Tailwind's stock palette is cleared, so only these colours exist.
```css
:root {
  --color-paper: oklch(94% 0.03 80);  --color-paper-2: oklch(97% 0.02 85);  --color-paper-3: oklch(89% 0.05 80);
  --color-ink: oklch(27% 0.05 50);  --color-ink-2: oklch(36% 0.05 50);  --color-muted: oklch(48% 0.06 55);  --color-rule: oklch(84% 0.06 78);
  --color-accent: oklch(54% 0.20 24);  --color-accent-2 (hover): oklch(48% 0.20 24);  --color-accent-ink: oklch(97% 0.02 85);  --color-focus: = accent;
  --color-gold: oklch(74% 0.14 75);  --color-gold-2: oklch(84% 0.11 80);  --color-error / --color-success
  --font-display: "Yeseva One", "Chonburi", ui-serif, Georgia, serif;
  --font-body: "Archivo", "Anuphan", ui-sans-serif, sans-serif;
  --font-outlier: "Archivo Narrow", "Anuphan", ui-sans-serif, sans-serif;   /* small print, 600 */
  --radius-card: 0;  --radius-pill: 999px;  --radius-nav: 1.75rem;  --rule-hair: 1px;  --rule-bar: 2px;
  --shadow-card: 10px 10px 0 var(--color-paper-3);   /* hard, no blur; the only shadow */
  --control-h: 48px / --control-h-sm: 44px  (app scope: 40px / 36px)
}
```
- Vermilion sits at hue 24 and never goes past 28. It marks the primary button, the focus ring, the current tab or nav item, and one figure, and covers under 5% of a screen. It never fills a section. Gold rules lines and never colours text.
- Space: `--space-3xs`…`--space-4xl` (2, 4, 8, 12, 16, 24, 40, 64, 96, 144 px). Type: `--text-xs`…`--text-3xl`, plus fluid `--text-display`, `--text-section`, `--text-title` and `--text-lead`. Motion: `--dur-micro`, `--dur-short` and `--ease-out`, used on transform, opacity and colour only.
- **App scope:** put `data-scope="app"` on the admin shell. It switches to a fixed 1.2-ratio type scale (no fluid heads) and 40/36px controls.

## Tailwind usage
- Use Tailwind utilities for layout and spacing, and only with token values: `flex`, `grid`, `gap-4`, `mt-6`, `md:grid-cols-2`, `bg-paper-2`, `text-ink`, `text-muted`, `border-rule`, `font-display`, `text-sm`, `rounded-pill`, `shadow-card`.
- Spacing is one 4px unit: `1`=4, `2`=8, `3`=12, `4`=16, `6`=24, `10`=40, `16`=64, `24`=96, `36`=144. `gap-[var(--space-lg)]` also works.
- Never use raw colours (`bg-red-500`, `text-[#333]`, `bg-[oklch(...)]`), arbitrary font families, `rounded-lg` on surfaces, or soft `shadow-*` utilities.
- Controls and surfaces use the shared classes below, not utility piles. The shared classes live in `@layer components`, so utilities still override them (`md:hidden`, `w-full`, `mt-4`).

## Faces
- Display: Yeseva One 400, with Thai falling to Chonburi. Use it for h1–h3, the wordmark and `.rule-list` values. Never use it for labels, buttons or table data. Heads take one weight and one colour, never an italic word.
- Body: Archivo **400 and 500 only** (that is all `layout.tsx` loads; Anuphan 400/500 for Thai), 16–17px, line-height 1.55. Weight 600 exists only through `.small` and the other small-print uses (Archivo Narrow / Anuphan 600). Never use `font-bold`, `font-semibold`, `font-extrabold` or `font-weight: 600+` on the body face: the browser would fake the weight. Use `font-medium` (500) for emphasis.
- Small print (`.small`, `figcaption`, `.help`, chip text, `dt`, stat labels): Archivo Narrow 600 at 12.5–13.5px, with Thai falling to Anuphan 600. Sentence case, untracked, no caps.
- Figures in tables and stats use the body face with `tabular-nums` (`.num`).

## Shared classes (`src/app/globals.css`; no page task redefines them)
Every control has eight states: rest, `:hover`, `:active`, `:focus-visible` (a 2px vermilion outline that appears instantly), `:disabled`/`[aria-disabled]`, `[aria-busy="true"]`, empty (`:empty` or `:placeholder-shown`) and error (`[aria-invalid="true"]`, or `data-state="error"` on rows, stats and `.rule-list` items).

| Class | What it is | Notes |
|---|---|---|
| `.btn` | pill, 1px ink outline, Narrow 600 | base for all buttons |
| `.btn--primary` | vermilion pill, cream text | one per screen |
| `.btn--secondary` | ink text over a 2px ink underline, no box | turns vermilion on hover |
| `.btn--quiet` | pill with a rule-coloured outline | tertiary actions, nav member button |
| `.btn--sm` | 44px tall (36px in app scope) | |
| `.icon-btn` | 44×44 round hit target | stepper +/-, close, basket |
| `.stepper` | pill holding `.icon-btn` − `.num` + | `:focus-within` ring |
| `.field` `.field-sm` | square input on paper-2, 1px ink border | `select.field` draws its own caret, `textarea.field` is 3 lines |
| `.label` / `.help` | label above the field / small print below | `.help[data-error]`, or a `.help` after an invalid field, turns red |
| `.well` | square paper-2 surface, 2px ink border, gold outline inset 7px, `--shadow-card` | raised summary, login box; a first h2/h3 gets a gold underline |
| `.card` (+`.card--lift`) | square ruled surface: paper-2, hairline sides, 2px ink top | `--lift` adds the hard shadow on hover |
| `.rule-list` | `<dl class="rule-list"><div><dt/><dd/></div></dl>` | small-print `dt` on the left, Yeseva `dd` on the right, dotted gold rules between rows |
| `.tbl` `.tbl-scroll` | 2px ink head rule, hairline rows, row hover in paper-2 | `tr[aria-selected]`, `tr[data-state=error]` |
| `.chip` + `--signal` `--ink` `--outline` `--gold` `--muted` `--signal-line` | square small-print status tag | map below |
| `.seg` / `.seg--tabs` | ink-bordered segmented choice / underlined tab strip | selected via `aria-selected`, `aria-pressed` or `aria-current="page"`; tabs get a vermilion underline |
| `.stat-row` `.stat` | one ruled row of figures (`<b>` value, `<span>` label) | stacks under 40rem |
| `.toolbar` `.search-group` | one ruled strip (2px ink top, hairline bottom) / field+button joined | `.divider-v` separates groups |
| `.band` / `.band--ink` | paper-2 band with ink top rule / brown ink band with cream text | at most 2 per page, never vermilion. Inside `.band--ink`: `.btn--primary` stays vermilion. Every other `.btn` (`--quiet`, `--secondary`, bare) and `.icon-btn` inverts to paper text and border, with hover at paper 12%, active at 20%, a gold focus ring and disabled at 45% opacity. `.small` and `.label` there are paper at 75%, never gold |
| `.frame` (`.frame--card`) | square photo, 10% ink hairline, warm filter | empty shows a gold-2 slot; set `aspect-ratio` inline to override |
| `.small` | Narrow 600 small print, muted | |
| `.container` `.stack` `.stack-lg` `.section` `.section--tight` | layout | |
| `.noty` / `.noty--err` | square notice with a 2px ink top / vermilion top rule | `ErrorBanner` renders `--err` |
| `.empty` | square paper-2 box, gold hairline, ink icon | `EmptyState` renders it |
| `.modal-scrim` `.modal` | square paper-2, 2px ink border, hard shadow | |
| `.nav` `.nav--pill` `.nav--flat` `.nav-link(--on)` `.menu` `.avatar` `.count` | floating pill (store) / flat bar with 2px ink rule (`/admin*`) | set by `Navbar` |
| `.wordmark` `.mast` `.mast-links` | Yeseva wordmark; mast footer sets it at `--text-display` | in `layout.tsx` |
| `.skip` | skip link | appears on `:focus-visible` |
| `.grid-products` | product grid, `minmax(0,1fr)` tracks: 1 column, 2 at 40rem, 3 at 64rem, 4 at 80rem | no states of its own; the cards inside carry them |
| `.rail` | horizontal scroll-snap row that cuts the next item at the gutter | `:focus-visible` ring (give it `tabindex="0"`) |
| `.chart-svg` | inline SVG chart at full width; text in the body face with tabular numerals, muted | colour series with tokens (ink lines, gold grid, vermilion on the latest point only) |
| `.chart-legend` | wrapping legend row of `span` items | static |
| `.swatch` | 0.75rem square colour key, coloured inline with a token | static |
| `.lead` | intro sentence under a head, `--text-lead`, ink-2, 52ch max | static |
| `.num` | tabular numerals (`font-variant-numeric: tabular-nums`) for prices, counts and order numbers | static; inside `.tbl` it also forces the body face |

## ORDER_STATUS chip map (`src/lib/format.ts`)
| Status | Chip | Look |
|---|---|---|
| AWAITING_PAYMENT | `chip--muted` | paper-3 fill |
| PENDING_VERIFY | `chip--signal` | vermilion fill: the owner must act |
| PAID | `chip--outline` | ink outline |
| SHIPPED | `chip--ink` | ink fill |
| COMPLETED | `chip--gold` | gold hairline |
| REJECTED | `chip--outline chip--signal-line` | vermilion outline, never filled |
| CANCELLED | `chip--muted` | paper-3 fill |

## Controls
- Primary: vermilion fill · pill · 48px tall (44px small, 40px in app scope)
- Secondary: ink text over a 2px ink underline, no box · same height

## Motion
- Character: quiet. A tab swaps and a row lights up on hover over `--dur-short`. No reveal, counter or loop. Under reduced motion everything finishes at once.

## Partials
`styles/shop.css` (Task 2), `styles/account.css` (Task 3) and `styles/admin.css` (Task 4) are imported by `globals.css` and hold page-specific rules only. Each partial keeps the Hallmark pointer comment on line 1 and **all of its rules inside its `@layer components { }` block**. An unlayered rule there would beat both the shared classes and every Tailwind utility.

The partials are imported before the shared block, so a partial rule that overrides a shared class sits earlier in the same layer and loses on equal specificity. Compound the shared class: `.well.shop-detail-well` for `.well`, `.modal.adm-slip-modal` for `.modal`, `.rule-list.shop-facts` for `.rule-list`, `.field.acct-file` for `.field`. A descendant selector (`.adm-slip > img`) is the pattern for inner parts; never a bare page class alone.

## Exports
`tokens.css` in this project, with Tailwind theme variables in its `@theme static` block.
