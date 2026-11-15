# OptiMart full redesign (Hallmark · Solstice) — design

## Intent

The owner judged the current Dose look (commit `58f4d5a` and later tweaks) bad and asked for a completely new design of both the store and the backoffice. This is a Hallmark `redesign` at **full** depth (`~/.agents/skills/hallmark/references/redesign.md`): the content and wiring stay the same, and the system and composition are replaced.

## Goals

- One new visual system shared by store and backoffice, unrelated to Dose. No green, no IBM Plex, no "plastic tray" surfaces, no pharmacy-label metaphor.
- Store pages recomposed as editorial shop pages. Backoffice recomposed as dense app screens inside its existing shell.
- Floor 0 FAIL on `sloplint --render`, nothing dropped on `--kept`, and `next build` plus `eslint` clean.

## Non-goals

- No API, context, route, data, or auth changes. No new pages, actions, sections, claims, or numbers.
- No new npm dependency. Recharts stays out: the inline SVG charts are restyled, not replaced.
- No dark mode.

## Anti-goals (a failure even if it builds)

- A cream + serif + terracotta template. The signal is vermilion at hue 24 and must never drift past 28.
- Thai text falling back to a system face because the display/body faces have no Thai glyphs.
- Any route, `href`, `name`, `id`, `key`, handler, or `data-testid` lost.

## Direction (dealt)

The deal was `optical-eyewear-shop-browse-0a8c·ad56541a·2026-11-15·r0`, genre editorial. It offered Broadside, Newsprint, and **Solstice (picked, 3/3)**. Why Solstice: product photos carry it, it puts a fat roman serif on warm paper with one vermilion signal, and its "label as a ruled list" range maps directly onto product specs and order summaries. Broadside's condensed all-caps can't carry Thai. Newsprint's justified columns fight a product grid. Dose was excluded by hand because the old log is gone.

Theme file: `~/.agents/skills/hallmark/references/themes/solstice.md`, light `long-light`.

### Thai type (my call; the theme faces are Latin-only)

| Role | Stack | Why |
|---|---|---|
| Display | `"Yeseva One", "Chonburi", ui-serif, Georgia, serif` | Chonburi (Cadson Demak) is a high-contrast Thai display serif, weight 400, matching Yeseva's voice |
| Body | `"Archivo", "Anuphan", ui-sans-serif, sans-serif` | Anuphan is a Thai/Latin grotesk with weights 400 and 500 |
| Small print | `"Archivo Narrow", "Anuphan", ui-sans-serif, sans-serif` | Narrow has no Thai, so Thai falls through to Anuphan 600 |

All of these load from Google Fonts in `layout.tsx` and replace the IBM Plex link. Data in tables and stats uses Archivo/Anuphan with `tabular-nums`, never the display face.

## Store (page scope)

The draw is `e7ba40`. Shape: Bento Grid. Hero: Ledge. Nav: floating pill. Footer: mast. Action: sticky buy bar. Leave out: Figures, Steps.

| Route | Composition |
|---|---|
| `/` | Ledge hero: the headline "แว่นตาที่ชัด ราคาที่จริง", the existing search form, and the newest product cut out large on a cream-to-dusk ground, with its label in live type (name, category in vermilion small print, gold hairline, price). Below it: the categories and new arrivals as a bento of unequal cells. The old three-steps band becomes **plain facts** (payment by transfer slip, check within 1–2 working days, delivery) as a ruled list on the one brown ink band. That band is the close. |
| `/products` | Toolbar as one ruled strip (search, category, sort, count). Grid of square cards on hard paper shadow. |
| `/products/[id]` | Large photo left. Right side: the "label as ruled list" well (category, stock, price) and the pill stepper beside the vermilion add-to-cart. Under 48rem, a **sticky buy bar** pinned to the bottom holds the stepper and the button, so the action stays in reach. |
| `/cart`, `/checkout` | Line items as ruled rows. The summary is a raised well. The slip upload is a square input on paper-2. |
| `/orders`, `/orders/[id]` | Order list as a table. The detail page replaces the pharmacy label with the ruled-list well, and the status steps become "the year on one line" (a hairline with stops, the current one in vermilion). |
| `/login`, `/register` | Single centred well, square inputs. |

**Signature:** the newest product standing in the light in the home hero, its label set in live type.

**Chrome:** a floating pill nav (wordmark, หน้าแรก, สินค้าทั้งหมด, member menu, basket with count) that keeps the existing Navbar logic. The mast footer sets the wordmark large over the existing footer links and copy, Pexels credit included.

## Backoffice (app scope, `flow.md` § App screens)

The theme lends palette, faces, square surfaces, and rules. It lends no layout or ornament.
- Shell: keep the existing sidebar plus mobile tabs (three destinations). Restyle it as a paper-2 rail with a 2px ink rule, and mark the current item with a vermilion bar and ink text.
- Fixed type scale with ratio 1.2. The display face appears only on the page title. Controls are 36–40px with a 44px hit target.
- `/admin`: the signature is **the slip queue**. The pending-verify count and the recent-orders table lead the screen. The four stat figures become one ruled stat row. Charts are restyled to brown ink lines with a gold grid and vermilion on the latest point only.
- `/admin/orders`: status tabs (URL state as it exists now), a table, the slip viewer modal, approve/reject with reason.
- `/admin/products`: a table plus the existing add/edit form and confirmations.
- Data states: draw the loading, empty, and error states the code already has. List any missing state in the handoff and don't build it.

## Status colours (shared, `lib/format.ts` `ORDER_STATUS[].chip`)

Only the class names change. Labels and steps stay. Vermilion is reserved for the state that needs the owner's action (`PENDING_VERIFY`) and for `REJECTED`, shown as outline only. Paid and shipped are ink outline and ink fill. Completed is a gold hairline. Awaiting payment and cancelled are muted.

## Constraints

- Hallmark Floor 1–16 binds every file (tokens only, no `transition: all`, `overflow-x: clip`, focus-visible, reduced motion, no eyebrows or tracked caps, Thai copy unchanged except where a copy gate requires, and each change listed).
- Stamp `redesign: full`, `theme: Solstice (deal 3/3, seed …)`, `solstice: long-light`, `draw: e7ba40`, `copy: th`, and hero `Ledge (/)`.
- Next.js 16.4.6 has breaking changes. Read `node_modules/next/dist/docs/` before touching layout/metadata APIs.
- The old Dose-only classes (`plastic*`, `pharm-*`, `stamp`) are removed once no file references them.

## Left to the builder

Exact bento cell spans, spacing values within the scaffold scale, chart tick density, and the copy for empty states the code already renders (within the existing wording).

## Calls made after the builder check (builder's, not the owner's)

- **Hero picture:** no cut-out assets and no asset pipeline. The hero shows the live newest product (`products[0]`) as its existing rectangular photo in a square frame, standing on the cream-to-dusk ground. While loading it shows a gold slot. If the list is empty, the hero is text-only.
- **Admin chrome:** the root layout stays as it is. On `/admin*`, Navbar renders as a flat full-width bar instead of the floating pill (a pathname check that already exists in the component). The mast footer stays.
- **Slip queue:** existing data only. The `pendingVerify` figure is set largest and links to `/admin/orders`. Recent orders sit beside it. No new fetch and no new actions.
- **`/admin/orders` tabs:** stay in local state and are only restyled. The flow.md "state in URL" rule goes on the handoff list for the owner.
- **Sticky buy bar:** under 48rem it carries the stepper and both CTAs, using the same `handleAdd` handlers. The in-flow pair is hidden with CSS at that width only, so nothing leaves the DOM and `--kept` holds.
- **Icons:** Phosphor stays, recoloured to ink. The `FrameMark` glyphs stay, restyled in ink at 1.5px stroke.
