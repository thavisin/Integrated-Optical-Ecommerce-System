# OptiMart Solstice Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Dose system across the store and backoffice of `apps/web` with a Hallmark Solstice full redesign. Content and wiring stay unchanged.

**Architecture:** Task 1 is a shared-system task that comes first: tokens, base, fonts, the shared component classes in `globals.css`, the chrome, the shared components, and `design.md`. Three parallel page tasks follow. Each one owns its own page files and its own CSS partial. A final sweep task records the after state, checks it against the before state, and removes the dead Dose classes.

**Tech Stack:** Next.js 16.4.6 (App Router, read `apps/web/node_modules/next/dist/docs/` before touching layout or metadata), React 19, Tailwind 4 (`@theme static` tokens), `@phosphor-icons/react`, Hallmark scripts at `~/.agents/skills/hallmark/scripts/`.

**Spec:** `docs/specs/2026-11-15-hallmark-solstice-redesign-design.md`. Every task reads it, plus `~/.agents/skills/hallmark/SKILL.md` (§ The Floor), `references/redesign.md`, and `references/themes/solstice.md`.

## Global Constraints

- Hallmark Floor 1–16 binds every file. Every colour and font goes through a `:root`/`@theme` token. No `transition: all`. Never animate width, height, top, or left. `overflow-x: clip` on html and body. Every interactive element gets a `:focus-visible` style. Every animation gets a reduced-motion fallback. No eyebrows and no tracked caps.
- Signal colour: vermilion `oklch(54% 0.20 24)`. Its hue must never exceed 28. Gold never colours text. No soft shadows and no rounded cards. Only buttons and the stepper take `--radius-pill`.
- Fonts: display `"Yeseva One", "Chonburi"`; body `"Archivo", "Anuphan"`; small print `"Archivo Narrow", "Anuphan"`. Load them from Google Fonts in `layout.tsx` and remove the IBM Plex link.
- Keep every route, `href`, `name`, `id`, `key`, `type`, handler, API call, and context use. Don't move logic or rename props.
- Thai copy stays verbatim unless a copy gate (19, 54, 58, 63, 69) names a line. Record every changed line in the CSS stamp as `reworded "<before>" to "<after>" · <gate>`.
- No new npm dependency, no new route, no new fetch, no new action.
- There are no unit tests in `apps/web`. A task's verification is `npx eslint <its files>` plus `npm run build --workspace @optimart/web`, and in Task 5, `sloplint`. Subagents run only the checks named in their task.
- Commit through the eval `commit` namespace, never `git add -A`.

## Review Focus

1. **Thai glyph fallback.** Every heading and body string must render in Chonburi/Anuphan, not in a system face. Task 1 Step 6 checks this on the rendered screen.
2. **Mobile at 375px.** The product detail sticky bar must not cover the footer links or the cart count, and the admin tables must scroll inside their own container. Tasks 2 and 4 check at 375px.
3. **Empty and loading states.** Check an empty cart, no orders, an empty search, a dashboard with zero revenue, and products still loading. Each one must still render in the new system. The `--kept` sweep in Task 5 covers the wiring, and the screenshot pass covers the look.
4. **Focus order and visibility.** Check the pill nav menu, the stepper buttons, the status tabs, and the slip modal. Each one needs a visible `:focus-visible`, and the modal's focus trap and Escape handling must stay as they are now.
5. **Long product names.** A name like `เลนส์กรองแสงน้ำเงิน Blue-Cut 1.6` must wrap without overflowing a bento cell or a table cell. The existing waiver 49b carries over.

---

### Task 1: Shared system, chrome and shared components

**Files:**
- Modify: `apps/web/src/app/tokens.css`, `apps/web/src/app/base.css` (replace both with the scaffold output)
- Modify: `apps/web/src/app/globals.css` (full rewrite: stamp block, imports, shared classes)
- Create: `apps/web/src/app/styles/shop.css`, `styles/account.css`, `styles/admin.css` (each holds only a comment naming its owning task; `globals.css` imports them)
- Modify: `apps/web/src/app/layout.tsx` (font link, mast footer markup)
- Modify: `apps/web/src/components/Navbar.tsx`, `ui.tsx`, `StatusBadge.tsx`
- Modify: `apps/web/src/lib/format.ts` (only the `ORDER_STATUS[].chip` class strings and the Dose comment)
- Create: `apps/web/design.md`

**Interfaces:**
- Produces the shared class vocabulary that Tasks 2–4 use, and that no other task redefines:
  - `.btn` `.btn--primary` (vermilion pill) `.btn--secondary` (ink, 2px underline) `.btn--sm` `.btn--quiet` `.icon-btn`
  - `.field` `.field-sm` `.label` `.help`
  - `.well` (square, 2px ink border, gold outline inset 7px, `--shadow-card`)
  - `.rule-list` (ruled label/value rows with small-print labels and display-face values)
  - `.tbl` `.tbl-scroll`
  - `.chip` `.chip--signal` `.chip--ink` `.chip--outline` `.chip--gold` `.chip--muted`
  - `.seg` `.seg--tabs`
  - `.stat-row` `.stat`
  - `.toolbar` `.search-group`
  - `.stepper` (pill)
  - `.band` `.band--ink`
  - `.frame` (square photo, 10% ink hairline)
  - `.small` (Archivo Narrow 600, 12.5–13.5px)
  - `.container` `.stack` `.stack-lg` `.section` `.section--tight`
  - `.noty` `.noty--err` `.modal` `.modal-scrim`
  - `.nav` `.nav--pill` `.nav--flat` `.wordmark` `.mast`
- Keep the existing class names that pages already use (`btn`, `field`, `tbl`, `num`, `card`, `label`, `frame`…) and give them new rules. Drop `card` as a separate look: alias `.card` to the square ruled surface.
- `ORDER_STATUS` chip map:
  - `AWAITING_PAYMENT` → `chip--muted`
  - `PENDING_VERIFY` → `chip--signal`
  - `PAID` → `chip--outline`
  - `SHIPPED` → `chip--ink`
  - `COMPLETED` → `chip--gold`
  - `REJECTED` → `chip--outline chip--signal-line`
  - `CANCELLED` → `chip--muted`

- [ ] **Step 1: Record the before state.** Run `npm run dev` from the repo root, with the seed data loaded (`npm run setup` if the DB is empty). Then run `node ~/.agents/skills/hallmark/scripts/sloplint.mjs apps/web/src/app --genre editorial --render --before --url http://localhost:3000/ --url http://localhost:3000/products --url http://localhost:3000/products/1 --url http://localhost:3000/cart --url http://localhost:3000/login`. Run it a second time with `--scope app --url http://localhost:3000/admin --url http://localhost:3000/admin/orders --url http://localhost:3000/admin/products`, logged in as `admin@optimart.com` / `admin123`. Expected: `.hallmark/before.json` and `.hallmark/before/` exist. Write the four-line read (what the page is for, what stays, what reads as generated, what is broken) into the Picks block.
- [ ] **Step 2: Scaffold.** Run `node ~/.agents/skills/hallmark/scripts/theme.mjs scaffold solstice --dealt "3/3, seed optical-eyewear-shop-browse-0a8c·ad56541a·2026-11-15·r0" --redesign full` in `apps/web/src/app`. Expected: `tokens.css` and `base.css` are rewritten and the stamp skeleton is printed. Add the Thai fallbacks to the three `--font-*` tokens. Add the app type scale (ratio 1.2) under `[data-scope="app"]` for Task 4 to use.
- [ ] **Step 3: Rewrite `globals.css`.** Line 1 is the filled stamp: `shape: Bento Grid (draw e7ba40)`, genre editorial, theme Solstice, `solstice: long-light`, `redesign: full`, job buy, `nav: floating pill (flat on /admin)`, `footer: mast`, `hero: Ledge (/)`, signature, states, `copy: th`. Then come the critique line, waiver 49b carried over, and the imports (`tailwindcss`, `tokens.css`, `base.css` layer(base), the three partials). Then the shared classes above, each with all eight states: rest, hover, active, focus-visible, disabled, busy, empty, error.
- [ ] **Step 4: Chrome.**
  - In `Navbar.tsx`, add `nav--pill` (a floating, inset, rounded bar on paper-2 with a 2px ink border) everywhere except where `pathname.startsWith("/admin")`, which gets `nav--flat`. The logic, the links, the menu, and the cart count stay as they are.
  - In `layout.tsx`, build the mast footer: the wordmark at display size over the existing links and copy, with the Pexels credit kept verbatim.
- [ ] **Step 5: Shared components.**
  - `ui.tsx`: Spinner in ink. ErrorBanner as a square `noty--err` with a vermilion rule. EmptyState as a square paper-2 well with a gold hairline and the Phosphor icon in ink.
  - `StatusBadge.tsx`: no change unless the class names require one.
  - `format.ts`: apply the chip map.
- [ ] **Step 6: Lock and verify.** Write `apps/web/design.md` per `~/.agents/skills/hallmark/references/design-md.md`, covering tokens, faces, surfaces, controls, and the chip map. Run `npm run build --workspace @optimart/web`. Expected: build succeeds. Load `/` and confirm in DevTools (Computed → Rendered Fonts) that the Thai heading renders in Chonburi and the body in Anuphan.
- [ ] **Step 7: Commit:** `"🎨 redesign: Solstice system, chrome and shared components"`.

### Task 2: Store, catalogue (home, products, product detail)

**Files:**
- Modify: `apps/web/src/app/page.tsx`, `apps/web/src/app/products/page.tsx`, `apps/web/src/app/products/[id]/page.tsx`, `apps/web/src/components/ProductCard.tsx`
- Modify: `apps/web/src/app/styles/shop.css` (sole owner)

**Interfaces:**
- Consumes the Task 1 class vocabulary. Don't redefine any shared class. Page-only classes are prefixed `shop-`.

- [ ] **Step 1: Home hero (Ledge).**
  - Left side: the existing h1 "แว่นตาที่ชัด ราคาที่จริง", the existing lead, and the existing search form (`onSearch`, `q`), unchanged.
  - Right side: `products[0]` in a `.frame` standing on a cream-to-dusk ground, with its label set in live type (name, category in vermilion small print, a gold hairline, the price in display face) and linked to `/products/{id}`. While loading it shows a gold slot. If `products` is empty, the hero is text only.
  - The headline, the sentence, and the action must all be visible at 1280×800.
- [ ] **Step 2: Run the hero stage.** Run `node ~/.agents/skills/hallmark/scripts/sloplint.mjs apps/web/src/app/page.tsx --render --stage hero --url http://localhost:3000/`, then the hero review in fresh context (`gates.md` § 6). Fix until it passes.
- [ ] **Step 3: Home below the hero.**
  - Bento of unequal cells: the four category links (`FrameMark` in ink, 1.5px stroke) and the new-arrivals cards.
  - The old three-step band becomes plain facts in a `.rule-list` on `band--ink`, which is the page's close. Reword the "ซื้อง่ายด้วยสามขั้นตอนจริงของร้าน" heading only if gate 8/85 names it, and record the change.
- [ ] **Step 4: `/products`.** The toolbar becomes one ruled `.toolbar` strip. The grid is square `ProductCard`s on `--shadow-card`. `ProductCard` keeps its props and link. The name wraps to at most two lines. Category goes in small print and the price in display face.
- [ ] **Step 5: `/products/[id]`.**
  - Large `.frame` photo on the left. On the right, a `.well` holding a `.rule-list` (category, stock, price), then the `.stepper` beside `หยิบลงตะกร้า` (primary) and `สั่งซื้อทันที` (secondary).
  - Under 48rem, a `shop-buybar` is fixed to the bottom with the same stepper and both buttons, wired to the same `handleAdd` handlers and quantity state. The in-flow pair gets `display:none` only at that width. Add bottom padding to `main` so the footer is never covered.
- [ ] **Step 6: Verify.** Run `npx eslint src/app/page.tsx src/app/products src/components/ProductCard.tsx` in `apps/web`. Expected: 0 errors. Open `/`, `/products`, and `/products/1` at 1440 and 375 widths. Expected: no horizontal scroll, and the buy bar doesn't cover the footer at 375.
- [ ] **Step 7: Commit:** `"🎨 redesign: store catalogue in Solstice"`.

### Task 3: Store, account and checkout (cart, checkout, orders, auth)

**Files:**
- Modify: `apps/web/src/app/cart/page.tsx`, `checkout/page.tsx`, `orders/page.tsx`, `orders/[id]/page.tsx`, `login/page.tsx`, `register/page.tsx`
- Modify: `apps/web/src/app/styles/account.css` (sole owner)

**Interfaces:**
- Consumes the Task 1 classes, `StatusBadge`, `ORDER_STATUS[].step`. Page-only classes are prefixed `acct-`.

- [ ] **Step 1: Cart and checkout.**
  - Line items become ruled rows: photo, name, `.stepper`, line total in tabular numerals.
  - The summary is a `.well` with a `.rule-list`.
  - In checkout, the address fields and the slip `<input type="file">` become square `.field`s on paper-2 with labels above them. Every `name`, the `onSubmit`, and the upload `FormData` stay unchanged.
- [ ] **Step 2: Orders.**
  - `/orders` becomes a `.tbl` (order number, date, items, total, `StatusBadge`), with an empty state through `EmptyState`.
  - `/orders/[id]`: replace the `pharm-label` markup with a `.well` and `.rule-list`. The status timeline becomes "the year on one line": a hairline with one stop per `step` 0–4, labels in small print, the current stop filled vermilion, and rejected or cancelled shown as a muted line with the reason.
  - The resend-slip form, the cancel button, and their confirmations keep their handlers.
- [ ] **Step 3: Auth.** `/login` and `/register` each become a single centred `.well` with square fields and one primary button. Error text uses `.help`/`.noty--err`.
- [ ] **Step 4: Verify.** Run `npx eslint src/app/cart src/app/checkout src/app/orders src/app/login src/app/register` in `apps/web`. Expected: 0 errors. Log in as `customer@example.com` / `customer123`, add one item, and walk the cart and checkout pages to the order detail at 1440 and 375 widths. Expected: no horizontal scroll, and the order is created with the slip attached.
- [ ] **Step 5: Commit:** `"🎨 redesign: cart, checkout, orders and auth in Solstice"`.

### Task 4: Backoffice (app scope)

**Files:**
- Modify: `apps/web/src/app/admin/layout.tsx`, `admin/page.tsx`, `admin/orders/page.tsx`, `admin/products/page.tsx`
- Modify: `apps/web/src/app/styles/admin.css` (sole owner)

**Interfaces:**
- Consumes the Task 1 classes and the `[data-scope="app"]` type scale. Set `data-scope="app"` on the `AdminShell` root. Page-only classes are prefixed `adm-`.
- Read `~/.agents/skills/hallmark/references/flow.md` § App screens and `craft.md` § 9 first.

- [ ] **Step 1: Shell.**
  - Sidebar: a paper-2 rail with a 2px ink right rule. The current item has a 3px vermilion left bar, ink text, and `aria-current`. Mobile tabs use `.seg--tabs`.
  - The guard screens (not logged in, not admin) become a centred `.well`.
  - `MENU`, the auth checks, and `Suspense` are unchanged.
- [ ] **Step 2: `/admin` dashboard.**
  - The lead is the slip queue: the `stats.cards.pendingVerify` figure set largest in tabular numerals, linking to `/admin/orders`, beside the recent-orders `.tbl`.
  - The four existing cards become one `.stat-row` with labels unchanged.
  - The `RevenueLine` and `MonthlyBars` inline SVGs get restyled: brown ink strokes, a gold hairline grid, and vermilion only on the latest point, with token colours via `currentColor` or `var()`. Their data props and aria-labels stay unchanged. The status bar maps `STATUS_SWATCH` onto the token colours.
  - Top products is a ruled list.
- [ ] **Step 3: `/admin/orders`.**
  - Status tabs as `.seg--tabs`, kept in local state.
  - Orders `.tbl` inside `.tbl-scroll`.
  - The slip viewer `.modal` is square, on paper-2, with a 2px ink border.
  - Approve is primary. Reject asks for a reason in a square textarea.
  - Every handler, the confirmations, and the focus handling stay unchanged.
- [ ] **Step 4: `/admin/products`.**
  - Products `.tbl`, with stock at 3 or below shown in a `chip--signal`.
  - The add/edit form uses square fields and the image upload field. Delete keeps its confirm.
  - Controls are 36–40px with 44px hit areas.
- [ ] **Step 5: Verify.** Run `npx eslint src/app/admin` in `apps/web`. Expected: 0 errors. Log in as admin and open all three screens at 1440 and 375 widths. Expected: tables scroll inside their container, the modal opens and closes with Escape, and approve/reject changes the status.
- [ ] **Step 6: Commit:** `"🎨 redesign: backoffice in Solstice"`.

### Task 5: Sweep, cleanup and handoff

**Files:**
- Modify: `apps/web/src/app/globals.css` (stamp lines, removal of dead Dose rules)
- Modify: any page file that a FAIL points at
- Create: `.hallmark/log.json` entry (gitignored)

**Interfaces:**
- Consumes everything from Tasks 1–4. This task is the only integration owner of the stamp.

- [ ] **Step 1: Remove Dose leftovers.** Run `rg -n "plastic|pharm-|stamp\b|accent-soft|accent-deep|glint|IBM Plex" apps/web/src`. Delete each rule or token with no remaining reference. Expected: the only matches left are the stamp comments.
- [ ] **Step 2: Sweep.** With the dev server and backend running, run the Task 1 Step 1 commands with `--kept` in place of `--before`, then again with `--scope app` for the admin URLs. Fix every `FAIL`. Restore every `FAIL kept`, or record it in the stamp as `dropped … · reason`. Fix or waive each `REFLEX`, and repeat until clean. Expected: `Floor 0 FAIL`, and `.hallmark/compare.html` is written.
- [ ] **Step 3: Judged gates and finish review.** Load `gates.md` § 5 and walk the J and R/J gates. Run the finish review in fresh context with the before screenshots (`review-finish.md`, run by the reviewer only). Act on its first word.
- [ ] **Step 4: Project checks.** Run `npm run build --workspace @optimart/web` and `npm run lint --workspace @optimart/web`. Expected: both exit 0.
- [ ] **Step 5: Log.** Run `node ~/.agents/skills/hallmark/scripts/theme.mjs log --entry '{"mode":"redesign","depth":"full","scope":"site","theme":"solstice","shape":"Bento Grid","hero":"Ledge","nav":"floating pill","footer":"mast","signature":"newest product standing in the light","draw":"e7ba40",...}'`.
- [ ] **Step 6: Handoff.** Write the redesign handoff block (Before/After/Kept/Changed/Dropped/Yours/Compare), the list of reworded lines, the owner list (admin/orders tabs not in the URL, any data state the code lacks), and the material ask.
- [ ] **Step 7: Commit:** `"🎨 redesign: sweep, remove Dose leftovers"`.
