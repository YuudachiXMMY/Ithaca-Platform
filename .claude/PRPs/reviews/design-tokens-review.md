# Review — §8.2 light token layer + migration rulebook

Three independent adversarial critics over `src/app.css` and `docs/DESIGN-TOKENS.md`,
2026-09-29. Every finding carries a recomputed number or a grep the critic actually ran.

Severity legend: **critical** and **high** block the applier wave; medium/low are fix-while-you-are-there.

**20 findings** — critical: 5, high: 7, medium: 6, low: 2

---

## 1. [CRITICAL] docs/DESIGN-TOKENS.md:336 (§3.7 row `text-foreground`) + :120 (§1.4) + :421 (§4)

*lens: contrast*

**Claim.** The 46 opacity-modified `text-foreground/N` utilities already in the tree are in no lookup table, are explicitly waved through by §3.7 as "need no edit — the value swap carries them", and every one of them drops below 4.5:1 after the inversion. They all PASSED before it.

**Evidence.** grep -rohE 'text-foreground/[0-9]+' --include='*.svelte' src | sort | uniq -c → /60×15, /50×10, /70×6, /40×6, /30×5, /55×1, /35×1, /25×1, /20×1 = 46. Recomputed sRGB compositing + WCAG 2.x luminance, ink #111827 over white: /55=3.96, /50=3.38, /40=2.53, /35=2.22, /30=1.94, /25=1.72, /20=1.53. Old values (#f0f1f3 over #111318): /55=5.60 PASS, /50=4.84 PASS. So /50 and /55 are a straight pass→fail regression. All call sites are body-size, not large text: EVModel3DSection.svelte:226 `text-sm text-foreground/40` (2.53), :357 `text-[10px] text-foreground/20` (1.53), ev-challenge/+page.svelte:219 `text-xs text-foreground/25` (1.72), privacy/+page.svelte:12 and terms/+page.svelte:12 `text-sm text-foreground/50` (3.38). Worse, 25 of the 46 sit in EVModel3DSection/WorkshopToRoles/ev-challenge/+page, which app.css:624-678 pins to the navy band: ink/50 on navy-900 = 1.03:1, ink/20 = 1.01:1. §1.4's opacity list stops at ink/60 and asserts "still AA" — it never covers the alphas the codebase actually uses.

**Fix.** Add a §3.3-equivalent row set for `text-foreground/N`: LIGHT `/70`→`text-foreground/70`, `/60`→`text-foreground-muted`, `/55` and below→`text-foreground-subtle`; BAND `/70`→`text-band-foreground/70`, `/60` and below→`text-band-foreground-muted` / `-subtle`. Remove `text-foreground` from the §3.7 "no edit" table, or qualify the row as "bare utility only — opacity modifiers must be rewritten".

## 2. [CRITICAL] docs/DESIGN-TOKENS.md:346 (§3.7 row `text-brand-bright`), :342 (`text-brand`), :343 (`outline-brand`)

*lens: contrast*

**Claim.** §3.7 is the only section of §3 with no BAND column, and it declares `text-brand-bright` (72), `text-brand` (90) and `outline-brand` (53) as needing no edit. Inside a navy band those become 1.87:1, 2.74:1 and a 2.74:1 focus ring.

**Evidence.** Recomputed: teal-700 #075355 on navy-900 #0B1F3A = 1.87:1 (on navy-950 = 2.09, on navy-700 = 1.45, on band-warm #292823 = 1.67). teal-600 #0B6E70 on navy-900 = 2.74:1 — a number §4:392 itself prints as **FAIL**. Occurrence counts inside the EV stretch that §3.1:215 pins to the band: `text-brand-bright` 9 in routes/programs/ev-challenge/+page.svelte, 8 in EVModel3DSection.svelte, 4 in WorkshopToRoles.svelte = 21; `text-brand` 9 + 8 + 4 = 21. Concrete text sites: ev-challenge/+page.svelte:367 `text-xs font-medium text-brand-bright` and :481 `text-brand-bright underline` — both inside `<section class="ev-ambient-c …">` (line 378) / `ev-ambient-close` (line 444). Focus rings: ev-challenge/+page.svelte:175, 367, 458, 481 all `focus-visible:outline-brand` on the band → 2.74:1, below the 3:1 of WCAG 1.4.11. Before the swap these were #5aa6db / #3e8fc7, i.e. light-on-dark and legible.

**Fix.** Give §3.7 the same two-column treatment as §3.3/§3.4: BAND replacements `text-brand-bright`→`text-band-brand-strong` (teal-100, 14.00:1), `text-brand`→`text-band-brand` (teal-300, 7.94:1), `outline-brand`→`outline-band-brand` (7.94:1). Do not leave these rows in a "no edit needed" table.

## 3. [CRITICAL] src/app.css:483 (.mission-aura `var(--background)`) × src/lib/components/home/MissionSection.svelte:34,38,45,53

*lens: completeness*

**Claim.** Landing this app.css alone renders the homepage mission block as white text on a white ground — the token values were inverted to a light system but not one consumer file was migrated with them.

**Evidence.** `git status` shows only `package.json` and `src/app.css` modified — zero `.svelte` files. `--background: var(--surface-0)` → `var(--white)` → `#ffffff` (app.css:138,149). `.mission-aura`'s bottom background layer is `var(--background)` (app.css:483), i.e. an opaque white fill. `MissionSection.svelte:34` is `<section class="bg-[#111318]">`, line 38 is `<div class="mission-aura">`, and inside it line 45 is the page's single `<h1>`-scale text with `text-white` and line 53 is `text-white/60`. White on white = 1.00:1 computed. This is not isolated: `grep -rl '#111318|#0a0c10|#0c0e12|#0d0f14|#0e1015' src --include=*.svelte` = 22 files (29 × `#111318`, 8 × `#0a0c10`), and 101 `text-white/NN` occurrences remain, while `body` now paints `background: var(--background)` = #fff with `color: var(--foreground)` = #111827. Secondary proof: `--border` flipped #252830 → `--line` #e5e7eb, so `<section class="ev-ambient-a border-t border-border">` (routes/programs/ev-challenge/+page.svelte:195) now draws a 13:1 bright hairline across a navy band.

**Fix.** Do not merge src/app.css on its own. Ship it in the same commit/PR as the docs/DESIGN-TOKENS.md applier pass over the 22 files carrying dark literals and the 101 `text-white/NN` sites; or, if it must land first, make `.mission-aura`'s base layer `var(--band)` and gate the `:root` inversion behind the applier so the intermediate state is never deployable.

## 4. [CRITICAL] docs/DESIGN-TOKENS.md:246 (§3.3 row `text-white` (94) → LIGHT `text-foreground`)

*lens: platform*

**Claim.** The §3.3 mechanical rule turns every CTA button label into ink-on-teal at 2.94:1, because §3.3 has no exception for `text-white` that sits on a `bg-action`/`bg-brand` fill.

**Evidence.** `grep -rn 'text-white' src --include='*.svelte' | grep -v /admin/ | grep -cE 'bg-action|bg-brand'` = 14 public sites where `text-white` is in the SAME class attribute as the fill: NewsletterForm.svelte:59, PopupBanner.svelte:68, home/HeroSection.svelte:65, home/ContactSection.svelte:161, about/ConnectCTA.svelte:64, programs/PlaceholderProgram.svelte:85, routes/+error.svelte:33, ithaca-dialogues/+page.svelte:176 and :540, ev-challenge/+page.svelte:175 and :458, ai-entrepreneurship-camp/+page.svelte:123 and :507, contact-us/+page.svelte:286. Computed WCAG 2.x: ink #111827 on teal-600 #0B6E70 = 2.94:1; on `--action-hover` teal-700 #075355 = 2.01:1. Both fail the 4.5 floor the document sets. §3.7's `bg-action` row does say "the paired text must be text-action-foreground", but §3.7 is the explicitly-labelled "these need no edit" section, and §0 instructs the applier to work §3 mechanically.

**Fix.** Add a row above the `text-white` row in §3.3: "`text-white` on a `bg-action` / `bg-action-hover` / `bg-brand` / `bg-foreground` element → `text-action-foreground` (LIGHT) / `text-band-action-foreground` (BAND). Check the fill in the SAME class attribute BEFORE applying the generic row." List the 14 sites so they can be ticked off.

## 5. [CRITICAL] docs/DESIGN-TOKENS.md:327-348 (§3.7, "These need no edit")

*lens: platform*

**Claim.** §3.7 is the only lookup section with no BAND column, yet it governs the utilities that fill the one region the document guarantees stays a navy band — so following it literally leaves ink text on navy at 1.07:1.

**Evidence.** src/app.css:551 `.ev-roles-bg` and :624/:639/:654/:670 `.ev-ambient-a|b|c|close` resolve to `radial-gradient(… var(--band) 0%, var(--band-deep) 100%)` = #0B1F3A→#071426, and §2 names exactly those classes as BAND. Inside them: WorkshopToRoles.svelte:264 `<h2 class="… text-foreground">` sits directly inside the `.ev-roles-bg` section opened at :258; ev-challenge/+page.svelte:195 opens `.ev-ambient-a` and :200 is `text-brand-bright`, :208 `text-foreground`, :212/:216/:219 `text-foreground/60|/40|/25`. Counts across the three BAND files (ev-challenge/+page.svelte, WorkshopToRoles.svelte, EVModel3DSection.svelte): 26 `text-foreground`, 21 `text-brand-bright`, 4 `text-brand`, 13 `border-border`, 4 `bg-action`, 29 `text-foreground/NN`. Computed: ink #111827 on navy-900 #0B1F3A = 1.07:1; teal-700 #075355 on navy-900 = 1.87:1; line #E5E7EB on navy-900 = 13.34:1 (a glaring white hairline where a subtle divider was meant); teal-600 on navy-900 = 2.74:1, which the document's own §4 already prints as **FAIL**.

**Fix.** Give §3.7 a BAND column: `text-foreground`→`text-band-foreground`, `text-foreground/60-70`→`text-band-foreground-muted`, `text-foreground/<60`→`text-band-foreground-subtle`, `text-brand`/`text-brand-bright`→`text-band-brand`/`text-band-brand-strong`, `border-border`→`border-band-border`, `bg-card-bg`→`bg-band-soft`, `bg-action`→`bg-band-action` + `text-band-action-foreground`. Change the section title from "need no edit" to "need no edit ON LIGHT; every one needs a swap inside a band".

## 6. [HIGH] docs/DESIGN-TOKENS.md:246 (§3.3 row `text-white`) vs :347 (§3.7 row `bg-action`)

*lens: contrast*

**Claim.** §3.3 maps `text-white` in BAND to `text-band-foreground` unconditionally, but §3.7/§1.5 flip the band CTA fill to teal-300. Applying both mechanically puts white on teal-300 at 2.08:1.

**Evidence.** Recomputed white #FFFFFF on teal-300 #5FC3C4 = 2.08:1; on the hover tone teal-100 #D9F1F1 = 1.18:1. Real call sites that hit both rules at once: src/routes/programs/ev-challenge/+page.svelte:175 and :458 — `class="… bg-action px-8 text-sm font-semibold … text-white … hover:bg-action-hover …"` sitting inside `<section class="ev-ambient-a …">` (line 195) and `ev-ambient-close` (line 444), i.e. BAND by §2. §3.3 says text-white→text-band-foreground; §3.7 says on a band use bg-band-action + text-band-action-foreground. Nothing in §3.3 tells the applier the second rule wins.

**Fix.** Add an exception line to §3.3: `text-white` that is the label of a `bg-action`/`bg-brand` fill becomes `text-action-foreground` (LIGHT) or `text-band-action-foreground` (BAND, = ink, 8.52:1) — never `text-band-foreground`.

## 7. [HIGH] docs/DESIGN-TOKENS.md:120 and :421

*lens: contrast*

**Claim.** "ink/60 = 4.68 — still AA" and "ink/80 · /70 · /60 … all AA" are measured only against white; on the lower rungs of the document's own 5-step surface ladder ink/60 fails 4.5:1.

**Evidence.** Recomputed ink #111827 at 60% alpha composited on each rung and re-measured against that rung: surface-0 4.68, surface-1 4.60, surface-2 4.57, surface-3 4.4951, surface-4 4.42. surface-3 and surface-4 are below 4.5. The document checks ink-3 (5.89/5.49/5.01) and teal-600 (6.04/5.63/5.13) across the whole ladder but checks the opacity ramp against white only — and `--card-bg` is surface-2 with 16 consumers, with surface-3/-4 the mapped targets for `bg-[#0c0e12]`/`bg-[#0a0c10]` (§3.1).

**Fix.** Qualify the §1.4/§4 rows as "on white" and add the ladder row: ink/60 = 4.68/4.60/4.57/4.50/4.42 — permitted on surface-0…-2 only; on surface-3/-4 use `--foreground-muted` (8.76:1 on surface-4) instead.

## 8. [HIGH] src/app.css:197, 480, 494-496, 504-506, 516-518, 526-528, 555, 560, 569, 628, 633, 643, 648, 658, 663, 674 (27 occurrences)

*lens: completeness*

**Claim.** 27 hand-authored `color-mix()` values ship with no `@supports` guard and no fallback declaration, so on the browsers prd.md §14 R-COMPAT-1 explicitly names the entire `background` shorthand is dropped and dark band sections render with no background at all.

**Evidence.** `grep -c color-mix src/app.css` = 27; `grep -c '@supports' src/app.css` = 0. The previous file used zero color-mix — `git show HEAD:src/app.css` has 0 occurrences and expressed the same layers as `rgba()` literals (e.g. old `.ev-roles-bg` used `rgba(62,143,199,0.15)`), so this is a new floor, not a pre-existing one. Tailwind's own color-mix is protected: the compiled output I generated shows `.bg-brand\/30 { background-color: var(--brand); @supports (color: color-mix(in lab, red, red)) { background-color: color-mix(in oklab, var(--brand) 30%, transparent); } }` — a graceful full-opacity fallback that these 27 lack. Support floor for `color-mix()`: Safari 16.2, Chrome 111. prd.md:431 R-COMPAT-1 requires "iOS Safari 16+" (16.0/16.1 have `oklch` but not `color-mix`) and "WeChat in-app browser (… Android X5)" (X5/XWeb is commonly Chromium ≤107). On those, a single invalid component makes the whole comma-separated `background:` value invalid at parse time, so the declaration is dropped entirely — `.ev-ambient-a/b/c/close`, `.ev-roles-bg`, `.ev-roles-grid`, `.dissolve-panel-eng/biz` lose all layers, including the valid `radial-gradient(… var(--band) …, var(--band-deep) …)` base. These are the only background on their elements (`routes/programs/ev-challenge/+page.svelte:195,244`; `WorkshopToRoles.svelte:259,342` is an `absolute inset-0` ground layer), so their `text-white` content lands on the now-white body — unreadable, and an R-A11Y-1/2 failure on a required target. `--band-warm` (app.css:197) is worse: it is *only* reachable through color-mix, so `bg-band-warm` and `.dissolve-panel-biz` have no value at all.

**Fix.** Emit a plain fallback declaration before each color-mix one (same property, `rgba()`/hex equivalent of the mixed result), or wrap the color-mix versions in `@supports (color: color-mix(in lab, red, red)) { … }` with an rgba baseline outside it — mirroring what Tailwind already does for its own opacity modifiers. For `--band-warm`, declare a literal hex in `:root` and keep the color-mix only as an enhancement.

## 9. [HIGH] src/lib/components/programs/ev-challenge/EVModel3DSection.svelte:206,307,217

*lens: platform*

**Claim.** The EV 3D section's own wrappers are `bg-background` (→ #FFFFFF after the inversion) while both src/app.css:489 and DESIGN-TOKENS §3.1 assert "the whole EV 3D stretch stays an INVERTED BAND"; no §3 row resolves the contradiction, so the applier is blocked either way.

**Evidence.** EVModel3DSection.svelte:206 `class="border-t border-border bg-background"` (reduced-motion branch) and :307 `class="relative min-h-[100dvh] … bg-background"` (animated branch, the one that hosts `<EVScene>` and the `.dissolve-panel-*` navy glass at :251/:274/:376/:405). :217 is `from-background via-background/60 to-background/30`. §3.7 line 334 says `bg-background` needs no edit → the section renders WHITE, with semi-transparent navy `color-mix(… var(--band-deep) 72%, transparent)` glass panels (app.css:491-511) and a WebGL grid at #1c1f26 (16.49:1 against white) floating on it. If the applier instead writes `bg-band`, all 8 `text-foreground` + 8 `text-brand-bright` in that file go to 1.07:1 / 1.87:1. Same shape at routes/programs/ev-challenge/+page.svelte:146 `bg-background` and :161/:342 `from-background via-background/50|/80 to-transparent` photo scrims.

**Fix.** Add an explicit §3 row: "`bg-background` / `from|via|to-background` inside `src/lib/components/programs/ev-challenge/**` and `src/routes/programs/ev-challenge/+page.svelte` → `bg-band` / `from|via|to-band` (or `bg-overlay` for the photo scrims per §3.5)", and enumerate the 5 sites. Then apply the §3.7 BAND column to that file's text.

## 10. [HIGH] docs/DESIGN-TOKENS.md:263-280 (§3.4)

*lens: platform*

**Claim.** 18 colour utilities written with ARBITRARY opacity (`/[0.0x]`) have no row anywhere in §3 — §3.4 enumerates only the bare-number forms (`/5`, `/10`, `/20`, `/25`, `/30`, `/40`, `/60`), so per §8 the applier must stop 18 times across 8 files.

**Evidence.** `grep -rhoE '(text|bg|border|from|via|to|outline|ring|placeholder|divide)-[a-z0-9-]+/\[[0-9.]+\]' src --include='*.svelte' | sort | uniq -c` → border-white/[0.06] ×4 (about/DecabFramework, home/StudentHighlights ×2, layout/Header), border-white/[0.08] ×2 (about/Outcomes, layout/Header), bg-white/[0.04] ×2 (about/DecabFramework, home/ImpactStats), bg-white/[0.06] ×1 (home/ProgramsShowcase), bg-white/[0.02] ×1 (about/DecabFramework), text-white/[0.05] ×1 (home/StudentHighlights), bg-foreground/[0.02] ×4 (WorkshopToRoles.svelte:273,292,359,383), border-brand/[0.04|0.06|0.08] ×3 (home/ContactSection). All eleven white-family ones are dark-ground "lift" effects that become invisible on #FFFFFF; `text-white/[0.05]` is a 5%-white watermark that has no light-ground meaning at all. None is counted in §3.4's totals (`bg-white/5 (8)`, `border-white/10 (3)` etc. all reconcile exactly without them).

**Fix.** Add a §3.4 sub-table for the arbitrary-opacity forms: `bg-white/[0.02–0.06]` → `bg-surface-2` (LIGHT) / unchanged (BAND); `border-white/[0.06–0.08]` → `border-border` / `border-band-border`; `bg-foreground/[0.02]` → `bg-surface-2` / `bg-white/[0.03]`; `border-brand/[0.04–0.08]` → `border-brand/20` (a 4% brand hairline is 1.0:1 on white). `text-white/[0.05]` is a watermark — escalate to §8's human-decision list.

## 11. [HIGH] docs/DESIGN-TOKENS.md:361 (§3.8, EVSceneContents row)

*lens: platform*

**Claim.** The three.js table's EVSceneContents row is unusable: its Found column says "brand-derived" and its Replacement column says "same three values", but the three literals at those lines are #5aa6db, #1c1f26 and #252830 — two of which are grid greys, not brand, and have no replacement anywhere in the document.

**Evidence.** EVSceneContents.svelte:94 `<T.PointLight … color="#5aa6db" />` (old `--brand-bright`), :101 `cellColor="#1c1f26"`, :104 `sectionColor="#252830"` (the old `--border` value). §3.8's mapped set is {#3e8fc7→#5FC3C4, #4a6a88→#2B4C7E, #9cc4e8→#D9F1F1}; none of the three EVSceneContents values is in that set, and "same three values" gives no 1:1 assignment. Mapping the Grid `sectionColor` to teal-100 ("the highlight") would be visibly wrong. Also the counts are off: `grep -rnoE "'#[0-9a-fA-F]{3,8}'|\"#[0-9a-fA-F]{3,8}\"" src --include='*.ts' --include='*.svelte' | grep -v /admin/` returns 7 sites / 6 distinct values (FatLine.svelte:32, trike-geometry.ts:19,20,21, EVSceneContents.svelte:94,101,104), not the "5 occurrences / 3 files" stated in §3.8's heading and §0 bullet 2.

**Fix.** Replace the row with three explicit rows — EVSceneContents.svelte:94 `#5aa6db` → `'#5FC3C4'` (band brand key light), :101 `#1c1f26` → a named band grid token (e.g. `--band-soft` #14325C) , :104 `#252830` → `'#5A7296'` (`--band-rule-strong`) — and correct the header to 7 occurrences / 3 files. Also note that FatLine.svelte:32 is a DEFAULT PROP value, not a rendered material (every caller passes `color={line.color}`).

## 12. [HIGH] src/lib/components/programs/ev-challenge/EVModel3DSection.svelte:327,444,454

*lens: platform*

**Claim.** Six `rgba()` colour literals live in inline `style=` attributes in a .svelte file and have no row in §3; §6 only certifies that src/app.css is rgba-free.

**Evidence.** `grep -rn 'rgba(' src --include='*.svelte'` returns exactly these three attributes outside admin: :327 `background: radial-gradient(…, rgba(17,19,24,0.15), rgba(17,19,24,0.4) 60%)` — #111318, i.e. the old `--background`, used as the 3D-scene scrim; :444 `linear-gradient(…, rgba(62,143,199,0.2) 35%, rgba(62,143,199,0.35) 50%, rgba(62,143,199,0.2) 65%, …)` and :454 `radial-gradient(…, rgba(62,143,199,0.04), transparent 70%)` — #3e8fc7, the deleted `--brand` value. §3.1 covers only the class form `bg-[#111318]`, §3.5 covers only `from-black/*`-style utilities, and §6's rewrite-to-color-mix work was scoped to app.css. Per §8 the applier stops here.

**Fix.** Add a §3 row: inline-style `rgba(17,19,24,α)` → `color-mix(in srgb, var(--overlay) Nα%, transparent)`, `rgba(62,143,199,α)` → `color-mix(in srgb, var(--band-brand) Nα%, transparent)` — the same transform §6 already applied to the 13 app.css rules. Better: move all three into named classes in app.css so they follow the token layer.

## 13. [MEDIUM] src/app.css:173

*lens: contrast*

**Claim.** The shipped comment quotes stale contrast numbers for the brand opacity ramp that are ~20% too high and contradict DESIGN-TOKENS.md §1.4.

**Evidence.** app.css:173 reads "Opacity discipline still applies: brand/70 = 3.9:1, brand/50 = 2.8:1". Recomputed teal-600 #0B6E70 at 70% over white = 3.24:1 and at 50% = 2.22:1 — which is exactly what DESIGN-TOKENS.md:420 says (4.88 · 3.98 · 3.24 · 2.22). 3.9 and 2.8 are the old cerulean #3e8fc7 figures. A reader taking app.css at face value would believe brand/70 has comfortable margin over the 3:1 graphics floor when it has 0.24.

**Fix.** Replace with "brand/90 = 4.88:1 (AA floor), brand/80 = 3.98, brand/70 = 3.24, brand/50 = 2.22" to match §1.4.

## 14. [MEDIUM] src/app.css:196 / :205, docs/DESIGN-TOKENS.md:134

*lens: contrast*

**Claim.** `--band-rule-strong` is only ever measured against `--band` and `--band-deep`; against `--band-soft`, the token app.css declares as the "raised plane (card) inside a band", it is 2.61:1 and fails §3.4's own 3:1 control-edge rule.

**Evidence.** Recomputed #5A7296 vs navy-700 #14325C = 2.6102:1 (vs navy-900 = 3.3704, vs navy-950 = 3.7679, vs band-warm #292823 = 3.0111). §1.5:134 lists only "3.37 — control edges"; §3.4:272 tells the applier to use `border-band-border-strong` for any interactive control edge in BAND context, with no caveat about which band surface. An input or focusable card on a `bg-band-soft` panel therefore gets a 2.61:1 boundary, and on `bg-band-warm` (used solid by .dissolve-panel-biz under prefers-reduced-transparency, app.css:545) only 3.011:1 — no margin at all.

**Fix.** Either add a lighter token for control edges on band-soft/band-warm (e.g. #7089A8 or above, which clears 3:1 on navy-700), or state in §1.5 and §3.4 that `--band-soft`/`--band-warm` may not host interactive controls and that control edges on them must use `--band-foreground-subtle` (#9AACC0, 5.51:1 on navy-700).

## 15. [MEDIUM] src/lib/components/NewsletterForm.svelte:54 (rule at docs/DESIGN-TOKENS.md:275)

*lens: contrast*

**Claim.** §3.4 states "placeholders are text: 4.5:1 applies" but its table only enumerates `placeholder-white/30`; the one placeholder written as a semantic token falls into §3.7's no-edit bucket and lands at 1.93:1.

**Evidence.** NewsletterForm.svelte:54 is `… bg-card-bg … placeholder:text-foreground/30 …`. Recomputed ink #111827 at 30% alpha composited on card-bg = mist #F5F7FA, measured against mist = 1.93:1 (on white it is 1.94:1). Threshold is 4.5:1 by §3.4's own sentence. Old value #f0f1f3 at 30% on #181b21 was also failing, so this is a pre-existing bug the token swap does not fix and the lookup table does not catch.

**Fix.** Add a `placeholder:text-foreground/N` row to §3.4 mapping to `placeholder:text-foreground-subtle` (ink-3 on mist = 5.49:1), and fix NewsletterForm.svelte:54 in the applier wave.

## 16. [MEDIUM] docs/DESIGN-TOKENS.md:199 (§3.1 row `bg-[#111318]` "20 occurrences")

*lens: platform*

**Claim.** The count 20 is the whole-repo figure; only 8 of them are on the public site. The other 12 are admin, and §3.2's deferred list omits `bg-[#111318]` entirely — so an applier working to the stated count will recolour the admin panel that §3.2 and §8.5 forbid touching.

**Evidence.** `grep -rnoE '(bg|from|via|to|text)-\[#111318\](/[0-9]+)?' src/routes/admin` → bg-[#111318] ×12 across admin/(protected)/+layout.svelte:1, emails/+page.svelte:2, popups/+page.svelte:6, admin/login/+page.svelte:3 (plus text-[#111318] ×5). Public: bg-[#111318] ×8. §3.2's table lists bg-[#1e1e1e], bg-[#2a2a2a], border-[#2a2a2a], bg-[#242424], text-[#888], text-[#aaaaaa], text-[#cccccc], text-[#f7f7f7], bg-[#ccdef0], text-[#ccdef0], text-[#111318] — `bg-[#111318]` is absent. (§3.1's section header "29 occurrences / 18 files" IS correct for the public site — verified: 29 public ladder occurrences, 18 files.)

**Fix.** Change the §3.1 row to "8 occurrences (public); 12 more in admin — DEFERRED" and add a `bg-[#111318] → bg-surface-0, admin, 4 files` row to §3.2.

## 17. [MEDIUM] docs/DESIGN-TOKENS.md:306-326 (§3.6)

*lens: platform*

**Claim.** §3.6 instructs the applier to convert 47 default-palette status utilities, but 42 of them are inside src/routes/admin/** which §3.2 defers — several rows are 100% admin, directly contradicting the scope note.

**Evidence.** Counted per row: text-red-400 11 (public 4), text-red-300 8 (public 0), bg-red-500/10 5 (0), bg-red-500/15 1 (0), border-red-500/40 5 (0), text-green-300 4 (0), text-green-400 1 (public 1), bg-green-500/15 4 (0), text-yellow-300 1 (0), bg-yellow-500/15 1 (0), text-blue-300 1 (0), bg-blue-500/15 1 (0), text-gray-300 2 (0), bg-gray-500/15 2 (0) = 47 total, 5 public. The only public sites are NewsletterForm.svelte:65 (`text-green-400` / `text-red-400`) and contact-us/+page.svelte:217, :232, :295 (`text-red-400`). Note §3.6's own heading says "~40 occurrences", which matches neither 47 nor 5.

**Fix.** Split §3.6 into "apply now (5 sites, listed by file:line)" and "deferred with the admin panel (42 sites)", mirroring §3.2's DO-NOT-APPLY banner.

## 18. [MEDIUM] docs/DESIGN-TOKENS.md:258-261 (§3.3's below-/60 rule) vs :336 (§3.7 `text-foreground` "fine as-is")

*lens: platform*

**Claim.** The "below /60, do not carry the opacity across" rule is written only for the `text-white/*` rows; the tree already contains 26 public `text-foreground/<60` utilities that §3.7 marks as needing no edit, and after inversion they are ink-on-white at 1.53–3.96:1.

**Evidence.** `grep -rhoE '(text|bg|border)-foreground(-muted|-subtle)?/[0-9]+' src --include='*.svelte' | grep -v admin` → /55 ×1, /50 ×10, /40 ×6, /35 ×1, /30 ×6, /25 ×1, /20 ×1 = 26 below /60 (plus bg-foreground/15, border-foreground/15). Computed ink #111827 composited on #FFFFFF: /20 = 1.53, /25 = 1.72, /30 = 1.94, /35 = 2.22, /40 = 2.53, /50 = 3.38, /55 = 3.96 — all below AA. Two are unambiguously on the light page and cannot be deferred to the band question: src/routes/privacy/+page.svelte:12 and src/routes/terms/+page.svelte:12, both `class="mb-8 text-sm text-foreground/50"` = 3.38:1 at 14px. §4's contrast table stops at ink/60 = 4.68 and never prints these.

**Fix.** Add a §3.7 row: `text-foreground/20`…`/55` (26) → `text-foreground-subtle` (LIGHT) / `text-band-foreground-subtle` (BAND), and extend §4's ink-opacity line to /55 · /50 · /40 · /30 · /25 · /20 so the reason is visible.

## 19. [LOW] docs/DESIGN-TOKENS.md:463 (R-OVERLAY-3, side-anchored gradient)

*lens: contrast*

**Claim.** The canonical side-anchored gradient ends at `to-overlay/30`, an alpha R-OVERLAY-2 forbids under text, and the only guard is a prose comment.

**Evidence.** Recomputed navy-950 #071426 at 30% over mid-grey #BFBFBF → white text = 3.38:1; over a blown highlight #FFFFFF → 1.97:1. R-OVERLAY-2 (:449-452) sets floors of /70 for normal text and /55 for display text and says "there is no compliant scrim below /55". In a `bg-gradient-to-r from-overlay/90 via-overlay/70 to-overlay/30` the /70 stop sits at 50%, so any text box extending past the horizontal midpoint is in non-compliant territory. Every other row of §3.5 gives a hard number; this one gives a verbatim snippet whose right half is below the stated floor.

**Fix.** Change the canonical side-anchored gradient to `from-overlay/90 via-overlay/70 to-overlay/55` (4.10:1 worst case, the display-text floor), or state the maximum text-box width as a fraction of the container next to the snippet.

## 20. [LOW] src/lib/components/about/Highlights.svelte:222,237

*lens: platform*

**Claim.** Raw SVG presentation attributes carrying colour (`stroke="white"`) exist in the tree and appear in no §3 row, which only covers class utilities — per §8 the applier must stop on them.

**Evidence.** `grep -rnoE '(fill|stroke)="[^"]*"' src --include='*.svelte' | grep -v 'currentColor\|none\|/admin/'` returns exactly two hits: Highlights.svelte:222 and :237, the carousel prev/next chevrons. They sit on buttons classed `bg-black/60 … hover:bg-black/80`, which §3.5 maps to `bg-overlay/75` / `bg-overlay/85` — so white is still the right answer, but nothing in the document says so.

**Fix.** Add a one-line note to §3.5: "SVG `stroke=\"white\"` / `fill=\"white\"` inside an element whose background maps to `bg-overlay/*` stays `white` (it is BAND context per R-OVERLAY-4). Two sites: about/Highlights.svelte:222,237."

