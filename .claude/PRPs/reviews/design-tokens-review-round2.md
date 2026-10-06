# Review round 2 — repaired token layer + rulebook

Three fresh adversarial critics, re-run after the round-1 repair. The applier wave was
HALTED by the workflow gate because blocking findings remained.

**25 findings** — critical: 1, high: 4, medium: 6, low: 14

Blocking = critical + high. These must be zero before the applier wave runs.

---

## R2-1. [CRITICAL] docs/DESIGN-TOKENS.md:268-285 (§2 decision procedure + "three files that are BAND end-to-end"), :408-410 (§3.1 default), :617/:625 (§3.7 "N of these are BAND" columns)

*lens: completeness*

**Claim.** The LIGHT/BAND decision procedure cannot reach text that sits on a photo scrim, because a scrim is always an `absolute inset-0` SIBLING overlay, never an ancestor. §2 says "look at the nearest ancestor that sets a background"; for every scrim on the public site that ancestor is the section (light ladder). §3.1 then says "apply the LIGHT column everywhere except the EV Challenge 3D stretch", and §3.7's per-row BAND subsets count ONLY the three EV files. R-OVERLAY-4 (:869) says the opposite, but it is not one of the two rules §3.0 declares as outranking the tables, and no scrim text site is enumerated anywhere — unlike every other case in §3, which is listed to file:line.

**Evidence.** 7 public files carry a `from-black/*` / `bg-black/*` scrim as a sibling div with white-family text in a following, background-less sibling: home/HeroSection.svelte scrim :35 → text :49 (`text-white`, the LCP quote) and :58 (`text-white/40`); home/ProgramsShowcase.svelte scrim :63 → :69 `text-white`, :75 `text-white/60`, :79 `text-brand-bright`; home/StudentHighlights.svelte scrim :92 → :105 `text-brand-bright`, :109 `text-white`; about/ProgramsBento.svelte scrim :83 → :87 `text-white`, :88 `text-white/60` (and :114/:118); about/Outcomes.svelte scrim :83 → :88 `text-white`, :91 `text-white/70`; about/ConnectCTA.svelte scrim :29 → :31 `text-white`; programs/PlaceholderProgram.svelte scrim :51 → :58 `text-brand-bright`, :66 `text-white` (h1). Applying §3.3's LIGHT column + §3.7's "no edit" there, I recomputed (navy-950 scrim composited over the photo, then measured): `text-foreground` (ink) on a /95 scrim = 1.05–1.08:1; on /85 = 1.02–1.47:1; `text-foreground-muted` (ink-2) on /80 = 1.03–1.65:1; `text-brand-bright` (teal-700, "no edit") on /80 = 1.13–1.92:1. §3.7's `text-brand-bright` row asserts "**21 are BAND**" out of 72 — that 21 is exactly the three EV files and excludes ProgramsShowcase:79, StudentHighlights:105 and PlaceholderProgram:58, so an applier reads the other 51 as LIGHT/no-edit. Same for `text-foreground` ("26 of the 50") and for §3.3's 191 `text-white*`, whose LIGHT/BAND split is never broken out at all.

**Fix.** Promote R-OVERLAY-4 into §3.0 as a third outranking rule (R-SCRIM), and rewrite §2's procedure: "walk up to the nearest ancestor that sets a background OR that contains an `absolute inset-0` scrim sibling". Then enumerate the scrim-text sites the way every other §3 row is enumerated — the 7 files/17 sites above — and correct §3.7's `text-brand-bright` (21), `text-foreground` (26) and §3.3's implied splits to include them.

## R2-2. [HIGH] docs/DESIGN-TOKENS.md:836-841 (R-OVERLAY-2) × :869-871 (R-OVERLAY-4) × :808-824 (§4.2)

*lens: platform*

**Claim.** The scrim alpha floors (/70 normal text, /55 display text) were derived in §4.2 for WHITE text only, but R-OVERLAY-4 explicitly authorises `text-band-foreground-muted`, `text-band-foreground-subtle` and `text-band-brand` on a scrim, and §2 defines 'a photo scrim' as BAND context. Every dimmed caption over a photo therefore lands below AA at the document's own prescribed floor.

**Evidence.** Recomputed with §4.2's own method (navy-950 composited at alpha over the worst realistic photo region, 8-bit rounded, WCAG 2.x luminance). At the /70 NORMAL-TEXT floor over a blown highlight #FFFFFF: white = 6.90 (the number §4.2 prints), but band-ink-2 #C3CEDC = 4.33 (FAIL 4.5), teal-300 #5FC3C4 = 3.32 (FAIL 4.5), band-ink-3 #9AACC0 = 2.97 (FAIL even the 3:1 large-text floor). At the /55 DISPLAY floor over a blown highlight: band-ink-2 = 2.57, teal-300 = 1.97, band-ink-3 = 1.76 — all below 3:1. Even over mid-grey #BFBFBF at /70: band-ink-3 = 4.04, teal-300 = 4.52. This is not hypothetical: §3.3's BAND column routes all 54 `text-white/60` and 14 `text-white/70` to `text-band-foreground-muted`, and §3.9a rewrites the EV hero scrim (`src/routes/programs/ev-challenge/+page.svelte:161`) to `from-overlay/95 via-overlay/70 to-transparent` while the subtitle directly under it at :170 is `text-foreground/70`, which R-OPACITY-2 sends to `text-band-foreground-muted`.

**Fix.** Extend §4.2 with a row per band text token (white / band-ink-2 / band-ink-3 / teal-300 / teal-100) and restate R-OVERLAY-2 as per-token floors: white ≥ /70 normal, but band-ink-2 ≥ /85 (7.56 over a blown highlight), teal-300 ≥ /85 (5.78), and band-ink-3 ≥ /85 (5.18) — or, simpler and enforceable, add to R-OVERLAY-4: 'on a scrim the only permitted text colour is `text-band-foreground` (white); muted/subtle/brand band tokens are for opaque band surfaces only.'

## R2-3. [HIGH] docs/DESIGN-TOKENS.md:971 (§9 gate) vs :362-369 (R-OPACITY-2)

*lens: platform*

**Claim.** §9's verification gate cannot detect the exact residue R-OPACITY-2 exists to prevent. The regex only flags `/65` and below, so `text-foreground/70`…`/95` left inside a BAND file passes every check — and ink at /70 on navy is invisible. No §9 row verifies §3.7's BAND column at all, which is the fix for the previous pass's three CRITICALs.

**Evidence.** R-OPACITY-2 (:362) — 'No alpha survives, and neither does the token.' Recomputed ink #111827 at 70% composited on navy-900 #0B1F3A = **1.05:1**. The tree already contains 3 such utilities inside the three files §2 pins to the band: `src/routes/programs/ev-challenge/+page.svelte:170`, `:187`, `:266`, all `text-foreground/70` (:170 is the hero subtitle). The §9 gate `grep -rE 'text-foreground/(6[0-5]|[0-5][0-9]|[0-9])\b'` does not match `/70`, so all three ship green. Likewise nothing in §9 checks for surviving bare `text-foreground` (26 in those 3 files, 1.07:1 on navy), `text-brand-bright` (21, 1.87:1), `outline-brand` (4, 2.74:1) or `border-border` (13, 13.34:1) inside them — counts I reproduced by grepping the three files.

**Fix.** Add a BAND-scoped §9 row: `grep -rE 'text-(foreground|brand|brand-bright)(/[0-9]+)?\b|outline-brand\b|border-border\b|bg-(background|action|card-bg)\b' src/routes/programs/ev-challenge/+page.svelte src/lib/components/programs/ev-challenge/{EVModel3DSection,WorkshopToRoles}.svelte` → 0 hits, and widen the R-OPACITY-1 row's regex to `text-foreground/[0-9]+` for those three paths.

## R2-4. [HIGH] docs/DESIGN-TOKENS.md:478 (§3.4 row `border-white/25`)

*lens: platform*

**Claim.** The row is marked 'decorative' and maps to `border-border` / `border-band-border`, but all three occurrences are the resting border of an outline (ghost) CTA button — an interactive control edge that §3.4's own closing rule (:526-529) says must be `border-*-strong`. Both prescribed values fail WCAG 1.4.11's 3:1 and make the button's only visible edge disappear.

**Evidence.** All 3 sites are secondary CTA buttons: `src/lib/components/home/HeroSection.svelte:71`, `src/routes/contact-us/+page.svelte:203`, `src/routes/programs/ai-entrepreneurship-camp/+page.svelte:433` — each `border border-white/25 … hover:border-white/60 … focus-visible:outline-white` on an `<a>`/button. Recomputed: `--border` #E5E7EB vs `--background` #FFFFFF = **1.24:1**; `--band-border` navy-700 #14325C vs `--band` navy-900 #0B1F3A = **1.29:1**, vs `--band-deep` #071426 = 1.25:1. Threshold is 3:1. The document already knows this — the *hover* state of the same three elements (`border-white/60`, :477) is correctly mapped to `border-border-strong` / `border-band-border-strong` (3.74 / 4.59), so the rulebook gives hover a compliant edge and the resting state a 1.24:1 one.

**Fix.** Split the `border-white/25` row: 'on an interactive control (all 3 current sites are ghost CTAs — HeroSection.svelte:71, contact-us:203, ai-entrepreneurship-camp:433) → `border-border-strong` / `border-band-border-strong`; elsewhere → `border-border` / `border-band-border`.' Same carve-out applies to `border-white/10` (:479) if any of its 3 sites is ever a control (currently all 3 are dividers, so the row is fine as-is).

## R2-5. [HIGH] docs/DESIGN-TOKENS.md:619-620 (§3.7 rows `bg-foreground` / `border-foreground`) vs :501 (§3.4a row `bg-foreground/[0.02]`)

*lens: platform*

**Claim.** Two sections claim the same six utilities and give different answers, and §3.7's branch is catastrophic. §3.7's rows are written as bare-utility rows with bare-utility counts, but there are ZERO bare `bg-foreground` / `border-foreground` utilities in the public tree — every one of the six carries an alpha, and four of them are already governed by §3.4a with a different replacement.

**Evidence.** Enumerated the public tree: `bg-foreground/[0.02]` ×4 (`WorkshopToRoles.svelte:273,292,359,383`, all `hover:`), `bg-foreground/15` ×1 (`ev-challenge/+page.svelte:427`), `border-foreground/15` ×1 (`ev-challenge/+page.svelte:181`). Bare `bg-foreground` = 0, bare `border-foreground` = 0 — so §3.7's counts '5' and '1' are made entirely of the alpha forms. Following §3.7's BAND column, `hover:bg-foreground/[0.02]` → `hover:bg-band-foreground` = an OPAQUE WHITE card fill on hover inside a navy band, which takes that card's white body copy to 1.00:1 (and §3.7's own paired instruction `text-foreground` would then be ink on white, so the card flips entirely). §3.4a instead says `bg-white/[0.03]` — recomputed 1.05:1, the intended decorative lift. All six sites are BAND (the three EV files), so §3.7's BAND column is the one that fires. `border-foreground/15` → `border-band-foreground` is the same shape: a solid white 1px rule at :181 where a 1.01:1 hairline was.

**Fix.** Delete the `bg-foreground` and `border-foreground` rows from §3.7 (or re-title them 'bare utility only — 0 occurrences today; alpha forms are §3.4a') and move `bg-foreground/15` + `border-foreground/15` into §3.4a alongside `bg-foreground/[0.02]`, mapping them to `bg-band-border` / `border-band-border` on BAND rather than the solid white token.

## R2-6. [MEDIUM] docs/DESIGN-TOKENS.md:615 (§3.7 row `bg-background`)

*lens: contrast*

**Claim.** The `bg-background` row's count is 14, but the public tree has 16 — and the same document says 16 two sections earlier. The row's note "6 of these are the EV stretch" is also wrong: only 3 `bg-background` sites are in the EV stretch.

**Evidence.** `grep -rn 'bg-background' src --include='*.svelte' | grep -v /admin/` = 16 (EVModel3DSection 2, PlaceholderProgram 1, contact-us 6, programs/+page 1, ai-entrepreneurship-camp 2, ev-challenge/+page 1, ithaca-dialogues 3). §1.4:126 says `--background` consumers = "30 (bg- 16, gradient stops 14)"; I measured `(from|via|to)-background` = 14, so 14 is the NEXT row's number, duplicated onto this one. EV-only `bg-background`: EVModel3DSection.svelte:206, :307 and ev-challenge/+page.svelte:146 = 3; the other 3 rows of §3.9a (EVModel3DSection:217, +page:161, +page:342) are `from/via/to-background` gradient stops, which §3.7 already counts separately. §2:279-280 independently says "bg-background ×2" + "bg-background" = 3, and §2:284 says "3 bg-background" — so §3.7's "6" contradicts the doc's own summary.

**Fix.** Change the §3.7 `bg-background` row count 14 → 16 and the note "6 of these are the EV stretch" → "3 of these are the EV stretch (EVModel3DSection.svelte:206,:307, ev-challenge/+page.svelte:146); the 3 EV gradient-stop sites are on the next row". Leave the `from/via/to-background` row at 14.

## R2-7. [MEDIUM] docs/DESIGN-TOKENS.md:619 (§3.7 row `bg-foreground`, count 5) and :620 (row `border-foreground`, count 1) vs :501 (§3.4a row `bg-foreground/[0.02]`, count 4)

*lens: completeness*

**Claim.** Two §3.7 rows collide with §3.4a and produce solid-white results for what are 2%/15% washes. `bg-foreground` has **zero** bare occurrences — all 5 counted sites are opacity-modified, 4 of which §3.4a already owns, with no cross-reference in either direction (compare the `border-brand` row at :628, which DOES say "see §3.4a"). The remaining two sites get BAND replacements that re-create the exact defect §3.7 condemns two rows above.

**Evidence.** `grep -rn 'bg-foreground' src --include='*.svelte'` → WorkshopToRoles.svelte:273,292,359,383 (`hover:bg-foreground/[0.02]`, the 4 §3.4a owns and maps to `bg-white/[0.03]` on BAND) + ev-challenge/+page.svelte:427 (`<div class="h-px w-6 bg-foreground/15">`). `grep -rn 'border-foreground'` → exactly 1 hit, ev-challenge/+page.svelte:181 (`border-t border-foreground/15`). All 6 sites are inside the three files §2 declares BAND end-to-end. §3.7's BAND cells give `bg-band-foreground` (= `--white`) and `border-band-foreground` (= `--white`): a solid-white 1px divider and a solid-white top border on navy-900 = **16.52:1** — brighter than the 13.34:1 `border-border` hairline §3.7's own `border-border` row calls "a white hairline where a subtle divider was meant". The LIGHT cell for `border-foreground` reads "consider `border-border-strong`", which is a judgement call, not a mechanical row, contrary to §0.

**Fix.** Add "see §3.4a" to the `bg-foreground` row and change its count to 1 (bare = 0). Give the two `/15` sites explicit rows: `bg-foreground/15` → `bg-band-border` (BAND) / `bg-border` (LIGHT); `border-foreground/15` → `border-band-border` (BAND) / `border-border` (LIGHT). Replace "consider" with a single mandated value.

## R2-8. [MEDIUM] docs/DESIGN-TOKENS.md:615 (§3.7 row `bg-background`, "**6 of these are the EV stretch: see §3.9**")

*lens: completeness*

**Claim.** The cross-reference count is wrong: only 3 of the 14 bare `bg-background` are in the EV stretch, not 6. The "6" is the number of ROWS in §3.9a's table, three of which are gradient-stop utilities belonging to the adjacent `from/via/to-background` row — and that row carries no §3.9 cross-reference at all.

**Evidence.** `grep -c` per file: EVModel3DSection.svelte has bare `bg-background` at :206 and :307 (2), ev-challenge/+page.svelte at :146 (1) = **3**. The doc contradicts itself: §2's aggregate line (:284) says "**3** `bg-background`" and §2's per-file table says "`bg-background` ×2" + "`bg-background`". The other three §3.9a rows (EVModel3DSection:217, +page:161, +page:342) are `from|via|to-background` occurrences — 10 of the 14 in that category, all in the EV files, verified by `grep -hoP '(from|via|to)-background(/[0-9]+)?' <file>` → page=7, EVModel=3. An applier told to find 6 `bg-background` in the EV stretch finds 3 and, per §8, stops.

**Fix.** Change the `bg-background` row note to "**3 of these are the EV stretch: see §3.9a**", and add "**10 of these are the EV stretch: see §3.9a**" to the `from/via/to-background` row.

## R2-9. [MEDIUM] src/routes/programs/ithaca-dialogues/+page.svelte:529 and src/routes/programs/ai-entrepreneurship-camp/+page.svelte:495 — no row in docs/DESIGN-TOKENS.md §3

*lens: completeness*

**Claim.** `bg-background/80` (2 occurrences) is in no lookup row. §3.7's row is explicitly labelled "`bg-background` (bare)" with count 14, which is the bare-only figure and excludes these; §3.5's scrim table covers only the `*-black` family. Both sites are photo scrims that, left alone, become an 80 % **white** veil over the photograph.

**Evidence.** `grep -rnoP 'bg-background/[0-9]+' src --include='*.svelte'` → exactly those 2. Verified my count of the §1.4 consumer figure: `grep -rnoP 'bg-background(/[0-9]+)?'` = 16, bare = 14 — so §1.4's "`bg-` 16" and §3.7's "(bare) 14" are both right, which is precisely how these 2 fall through the gap. Context at ithaca-dialogues:522-534: `<section class="relative">` → `<enhanced:img class="absolute inset-0 object-cover">` → `<div class="absolute inset-0 bg-background/80">` → `<h2 class="text-foreground">` and `<p class="text-white/60">` (:534). Same shape at ai-entrepreneurship-camp:488-500. §8 requires the applier to stop at both.

**Fix.** Add a row: `bg-background/80` (2, listed by file:line) → `bg-overlay/80` in both contexts (it is a photo scrim, §3.5 + §5), and fix the `text-white/60` copy sitting on it via R-OVERLAY-4 rather than §3.3's LIGHT column.

## R2-10. [MEDIUM] src/app.css:244

*lens: platform*

**Claim.** `--band-border-strong: var(--band-rule-strong); /* 3.37:1 — control edges */` still quotes the ratio of the REJECTED token value. The repair raised `--band-rule-strong` from `#5a7296` to `#7089a8` and updated the :root comment, but not this alias comment — so app.css contradicts both itself and the rulebook, which is the exact failure mode the previous pass's finding 13 fixed elsewhere.

**Evidence.** Recomputed #7089a8 vs navy-900 #0B1F3A = **4.59:1** (navy-950 5.13, navy-700 3.56, band-warm 4.10). 3.37:1 is #5a7296 vs navy-900, which I confirmed = 3.3704. The same file at :146-148 explicitly repudiates #5a7296 ('only 2.61:1 on navy-700 and 3.01:1 on band-warm'), and DESIGN-TOKENS.md:165 prints '4.59 — control edges (3.56 worst case, on band-soft)'. Every other numeric comment in app.css reproduced exactly (I recomputed all 30 of them, including the old-cerulean 7.00/5.27 at :105-106 and the Tailwind red-400 2.89 / green-400 1.78 at :121-123).

**Fix.** Change the comment to `/* 4.59:1 on band; 3.56 worst case on band-soft — control edges */`.

## R2-11. [MEDIUM] docs/DESIGN-TOKENS.md:371-376 (§3.0 R-OPACITY-3) vs :763 (§4.1)

*lens: platform*

**Claim.** The executable rule and the measurement table disagree about `brand/70` as a graphic. R-OPACITY-3 grants it unconditionally on LIGHT; §4.1 measures it below 3:1 on the deepest rung and says so.

**Evidence.** R-OPACITY-3: 'As a **graphic** (hairline, icon, rule) the 3:1 floor allows `/70` and above on LIGHT (3.24).' Recomputed teal-600 #0B6E70 at 70% composited per rung: surface-0 3.24, surface-1 3.14, surface-2 3.14, surface-3 3.05, surface-4 **2.97** — below 3:1. §4.1:763 prints the same 2.97 and annotates 'graphics only, and **not on surface-4**'. R-OPACITY-3 carries no rung caveat, and §3.0 says these rules outrank the tables, so the applier follows the wrong one. §3.1 maps `bg-[#0a0c10]` (5 sites, 8 counting the alpha forms) to surface-4, so the rung is live.

**Fix.** Amend R-OPACITY-3 to '…allows `/70` and above on surface-0…-3 (3.24 → 3.05); on `surface-4` the floor is `/80` (3.57)', matching §4.1.

## R2-12. [LOW] src/app.css:244

*lens: contrast*

**Claim.** Stale contrast comment on `--band-border-strong`: it still prints the old `#5A7296` figure (3.37:1) after the repair raised the token to `#7089A8`. It contradicts app.css:149 in the same file.

**Evidence.** Recomputed WCAG 2.x for `#7089a8` vs `#0b1f3a` = 4.59 (vs navy-950 5.13, navy-700 3.56, band-warm 4.10) — exactly the four numbers app.css:149 and docs §1.5:165 / §4:747 already print. `#5a7296` vs `#0b1f3a` = 3.3704, which is where "3.37:1" came from. This is the same class of defect as prior review finding 13 (stale ratio in a shipped comment), repaired at app.css:200-205 but missed here.

**Fix.** src/app.css:244 → `--band-border-strong: var(--band-rule-strong); /* 4.59:1 on band; 3.56 worst case on band-soft — control edges */`

## R2-13. [LOW] docs/DESIGN-TOKENS.md:248 (§1.8)

*lens: contrast*

**Claim.** "All 24 color-mix() declarations in src/app.css are now guarded" — 24 matches neither the declaration count nor the occurrence count. (The substantive claim that all are guarded is true; only the number is wrong.)

**Evidence.** After stripping comments from src/app.css: 38 `color-mix(` function occurrences, in 15 declarations (`:root --band-warm` @319; `.mission-aura` @538; `.dissolve-panel-eng` @567 and @599; `.dissolve-panel-biz` @575 and @607; `.ev-scene-vignette` @660; `.ev-seam-line` @667; `.ev-seam-glow` @677; `.ev-roles-bg` @697; `.ev-roles-grid` @723; `.ev-ambient-a|b|c|close` @792/@807/@822/@838). Including comments, `grep -o 'color-mix(' src/app.css | wc -l` = 47. A brace-depth scan confirms all 15 are inside an `@supports (color: color-mix(in lab, red, red))`.

**Fix.** Replace "All 24 color-mix() declarations" with "All 15 color-mix()-bearing declarations (38 color-mix() calls)" and keep the enumerated class list, which is correct.

## R2-14. [LOW] docs/DESIGN-TOKENS.md:900-903 (§6)

*lens: contrast*

**Claim.** "src/app.css … contains exactly one hex literal outside the palette blocks: --band-warm: #292823" — there are three.

**Evidence.** Comment-stripped scan of src/app.css declarations containing a hex: 37 total, of which the ones outside §1/§2/§3 palette blocks are `--band-warm: #292823` (:238), `--skeleton-base: #1e1e1e` (:293) and `--skeleton-sweep: #2e2e2e` (:294). The two skeleton literals were introduced by this very pass to retire the `var(--card-bg, #1e1e1e)` fallbacks, and §6:890 describes them two paragraphs above the claim that contradicts them.

**Fix.** Reword to "three hex literals outside the palette blocks: `--band-warm: #292823` (justified in §1.5/§1.8) plus `--skeleton-base` / `--skeleton-sweep`, both admin-legacy and retired with the admin rework."

## R2-15. [LOW] docs/DESIGN-TOKENS.md:893-894 (§6)

*lens: contrast*

**Claim.** `.skeleton` is listed among the rules that "now use color-mix(in srgb, var(--token) N%, transparent) … behind an @supports guard". It uses no color-mix at all.

**Evidence.** src/app.css:894-903 `.skeleton` is `linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-sweep) 37%, var(--skeleton-base) 63%)` — three solid tokens, zero color-mix, and it is correctly outside every `@supports` block (my brace-depth scan lists no color-mix line in it). The sentence also says "13 rules" where the guarded set is 15 declarations across 12 selectors + `:root`.

**Fix.** Drop `.skeleton` from that list (it is covered by the `--skeleton-base`/`--skeleton-sweep` sentence immediately above) and correct "13 rules".

## R2-16. [LOW] docs/DESIGN-TOKENS.md:661 (§3.9a)

*lens: contrast*

**Claim.** "its 16 text-foreground + 16 text-brand-bright go to 1.07 / 1.87" — measured 18 and 17 across the two EV files that paragraph is about.

**Evidence.** Per-file counts: `text-foreground` (bare) — ev-challenge/+page.svelte 10, EVModel3DSection.svelte 8 = 18. `text-brand-bright` — 9 + 8 = 17. (Adding WorkshopToRoles gives 26 and 21, which is what §2:282 and §3.7:617/625 correctly state.) The ratios 1.07 and 1.87 are correct: ink #111827 on navy-900 = 1.0739, teal-700 #075355 on navy-900 = 1.8701.

**Fix.** Change to "its 18 `text-foreground` + 17 `text-brand-bright`", or drop the numbers and point at §3.7's rows, which are already right.

## R2-17. [LOW] src/app.css:206 + :212 (--brand and --action both resolve to --teal-600); call sites e.g. src/lib/components/NewsletterForm.svelte:59

*lens: contrast*

**Claim.** The value inversion collapsed `--brand` and `--action` onto the same colour, so all 14 public CTAs draw a focus ring the exact same colour as the button they surround. Nothing in app.css or §3.0 R-FILL flags it, and R-FILL's BAND prescription reproduces it.

**Evidence.** app.css:206 `--brand: var(--teal-600)` and app.css:212 `--action: var(--teal-600)` — identical (before the swap they were #3e8fc7 vs #2a6ca8). All 14 R-FILL sites are `bg-action … focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand` (verified verbatim at NewsletterForm.svelte:59, PopupBanner.svelte:68, HeroSection.svelte:65, ContactSection.svelte:161, ConnectCTA.svelte:64, PlaceholderProgram.svelte:85, +error.svelte:33, ithaca-dialogues:176/540, ev-challenge:175/458, ai-entrepreneurship-camp:123/507, contact-us:286). Ring-vs-fill contrast = 1.00:1. It still meets WCAG 1.4.11 only because `outline-offset-2` leaves a 2px gap of page background: teal-600 vs white = 6.04:1. The same collapse exists on BAND, where R-FILL says `bg-band-action` (teal-300) + `outline-band-brand` (teal-300) = 1.00:1 ring-vs-fill, 7.94:1 ring-vs-navy.

**Fix.** Add a one-line note under §3.0 R-FILL: "`outline-brand` on a `bg-action` element is now the same hue as the fill (1.00:1); it passes 1.4.11 only via `outline-offset-2`. Do not remove the offset." If a distinct ring is wanted, point those 14 sites at `outline-brand-bright` (teal-700, 8.83:1 on white, 1.46:1 against the teal-600 fill) or `outline-band-brand-strong` on BAND, and say so explicitly rather than leaving `outline-brand` in the "no edit on LIGHT" row.

## R2-18. [LOW] src/app.css:244

*lens: completeness*

**Claim.** Stale contrast comment left behind by the repair. `--band-border-strong` still carries `/* 3.37:1 — control edges */`, the figure for the OLD `#5a7296` value that finding 14 got raised — the same class of defect finding 13 was about.

**Evidence.** src/app.css:151 now declares `--band-rule-strong: #7089a8;` and the comment block at :144-150 correctly states "4.59 / 5.13 / 3.56 / 4.10". I recomputed #7089A8: 4.59 on navy-900, 5.13 on navy-950, 3.56 on navy-700, 4.10 on band-warm. docs/DESIGN-TOKENS.md:165 also says 4.59. Line 244 still says 3.37 — the #5a7296 figure.

**Fix.** Change src/app.css:244 to `/* 4.59:1 on navy-900; 3.56 worst case, on band-soft — control edges */`.

## R2-19. [LOW] docs/DESIGN-TOKENS.md:248 (§1.8, "All 24 `color-mix()` declarations in `src/app.css` are now guarded")

*lens: completeness*

**Claim.** The number 24 matches nothing in the file. The substantive claim (every color-mix is guarded) is true and I verified it; only the count is wrong, and §9's checklist repeats it as a verifiable expectation.

**Evidence.** Stripping comments from src/app.css and counting: `color-mix(` function calls = **38**; CSS declarations containing one = **23** by a `[;{}]` split; distinct rules containing one = **15** (`--band-warm`, `.mission-aura`, `.dissolve-panel-eng|biz`, the two `lg` variants, `.ev-scene-vignette`, `.ev-seam-line`, `.ev-seam-glow`, `.ev-roles-bg`, `.ev-roles-grid`, `.ev-ambient-a|b|c|close`) — which is exactly the 15 the sentence then enumerates. None of 38/23/15 is 24.

**Fix.** Say "All 15 rules that use `color-mix()` (38 calls) are guarded", or drop the count and keep §9's mechanical check ("every `color-mix(` line must be inside an `@supports`"), which I confirmed passes.

## R2-20. [LOW] docs/DESIGN-TOKENS.md:901 (§6, "It contains exactly **one** hex literal outside the palette blocks")

*lens: completeness*

**Claim.** There are three, and the document contradicts itself ten lines earlier.

**Evidence.** Comment-stripped hex scan of src/app.css finds 38 literals; the palette blocks account for 35. The three outside them are `--band-warm: #292823` (:238), `--skeleton-base: #1e1e1e` (:293) and `--skeleton-sweep: #2e2e2e` (:294). §6:890-891 itself says ".skeleton is admin-only and stays dark via the explicit `--skeleton-base` / `--skeleton-sweep` tokens".

**Fix.** "exactly three hex literals outside the palette blocks: `--band-warm` (§1.5/§1.8) plus the two admin-only `--skeleton-*` tokens, which retire with the admin rework."

## R2-21. [LOW] docs/DESIGN-TOKENS.md:968 (§9, verification row 3)

*lens: completeness*

**Claim.** The stated exception is unreachable — the grep in that row cannot produce the hits it excuses, so a reader cannot tell whether the check passed for the right reason.

**Evidence.** The command is `grep -rE '(text|bg|border|from|via|to)-white' src --include='*.svelte' | grep -v /admin/`; the expectation is "0 hits except the 2 SVG `stroke=\"white\"` attributes (§3.5) and the BAND-context `bg-white/*` lifts". `stroke="white"` contains no `(text|bg|border|from|via|to)-white` substring, so it can never match. I confirmed: `grep -rnoE '(fill|stroke)="[^"]*"' src --include='*.svelte' | grep -v 'currentColor\|none'` returns only about/Highlights.svelte:222 and :237.

**Fix.** Drop the SVG clause from row 3 and add a separate row: `grep -rnoE '(fill|stroke)="[^"]*"' src --include='*.svelte' | grep -v 'currentColor\|none\|/admin/'` → exactly 2 hits, both `stroke="white"` in about/Highlights.svelte.

## R2-22. [LOW] docs/DESIGN-TOKENS.md:12-22 (merge-gate callout) and §0 — no global admin-scope statement

*lens: completeness*

**Claim.** The admin exclusion is real but distributed across §3.1, §3.2, §3.6 and §8.5; neither the merge gate nor §0 ever states it, and §3.3 — the largest section — tells the applier the whole-repo bare `text-white` count without telling it to skip the admin ones.

**Evidence.** The first mention of the exclusion is at line 384 (§3.1). §3.3:462-463 reads "the verified bare count is 91 public, **93 including admin**" with no accompanying instruction. Those 2 admin sites are `admin/(protected)/emails/+page.svelte:220` and `admin/(protected)/popups/+page.svelte:323` (`hover:text-white` on `text-[#ccdef0]`); applying §3.3's LIGHT row there writes `hover:text-foreground` = ink on the admin panel's `bg-[#1e1e1e]`, ~1.3:1. §3.4 and §3.5 give counts with no public/admin qualifier at all (I verified those are in fact 100 % public, so they are safe by luck rather than by statement).

**Fix.** Add one line to the merge-gate box: "**Scope: never edit a file under `src/routes/admin/**` in this wave.** Every count in §3 is public-site only; admin is §3.2/§3.6-deferred." and append "(leave the 2 admin sites alone)" to §3.3's reconciliation note.

## R2-23. [LOW] docs/DESIGN-TOKENS.md:615 (§3.7 `bg-background` row) and :661 (§3.9a prose)

*lens: platform*

**Claim.** Three different counts for the same population; an applier reconciling row totals (the document's stated working method) will not close the books.

**Evidence.** Counted the public tree (excluding src/routes/admin): bare `bg-background` = **16**, `from-background` 6 + `via-background` 6 + `to-background` 2 = 14 gradient stops. §1.4:126 agrees ('30 (`bg-` 16, gradient stops 14)'). §3.7:615 says the bare row is **14**. Its note '6 of these are the EV stretch' counts §3.9a's 3 bare + 3 gradient rows under the bare row — actual bare `bg-background` inside the three EV files is 3 (ev-challenge/+page.svelte:146, EVModel3DSection.svelte:206 and :307). §3.9a:661 says 'its 16 `text-foreground` + 16 `text-brand-bright`', which matches neither the per-file counts (EVModel3DSection 19/8, ev-challenge/+page 27/9) nor §3.7's BAND totals (26 bare + 32 alpha / 21). Every other count in §3.1, §3.3, §3.4, §3.4a, §3.5, §3.6 and §3.7 reproduced exactly.

**Fix.** Set the §3.7 `bg-background` bare row to 16, change its note to '3 of these are the EV stretch (§3.9a) plus 3 gradient stops in the row below', and replace §3.9a's '16 + 16' with 'its 46 `text-foreground` (26 bare + 20 alpha) + 17 `text-brand-bright` across the two files'.

## R2-24. [LOW] docs/DESIGN-TOKENS.md:248 (§1.8) and :893 (§6)

*lens: platform*

**Claim.** The color-mix inventory figures are wrong, though the substantive claim behind them — that every one is guarded — is sound.

**Evidence.** `grep -o 'color-mix(in srgb' src/app.css | wc -l` = **30** mix values, spread over **15** declarations in 15 rules; §1.8 says '24 declarations' and its own parenthetical enumeration lists 15 rules. §6:893 says '~40 rgba() literals across 13 rules'. I verified guard coverage with a brace-tracking pass over src/app.css: every non-comment `color-mix` line sits inside `@supports (color: color-mix(in lab, red, red))` (9 such blocks), and each guarded rule has a color-mix-free base declaration — so §9's gate holds. I also verified `--band-warm`: 0.84×#071426 + 0.16×#d98e14 in gamma-encoded sRGB = (40.60, 39.52, 35.12) → #292823, matching the literal exactly.

**Fix.** Change '24' to '30 `color-mix()` values across 15 declarations' and '13 rules' to '15 rules'.

## R2-25. [LOW] docs/DESIGN-TOKENS.md:968 (§9 gate row 3)

*lens: platform*

**Claim.** The white-family gate's alternation omits two of the four prefixes §3.4 requires replacing, and its stated exception can never match the regex it annotates.

**Evidence.** `grep -rE '(text|bg|border|from|via|to)-white'` cannot match `outline-white` (3 sites: HeroSection.svelte:71, contact-us:203, ai-entrepreneurship-camp:433) or `placeholder-white/30` (4 sites: contact-us:226,241,256,269) — neither string contains any of the six prefixes. Today those lines also carry `text-white`, so they hit incidentally; once the applier fixes the `text-white` on the same line the gate goes green with the `outline-white` / `placeholder-white` unconverted. The row's exception clause ('except the 2 SVG `stroke="white"` attributes') is also moot — `stroke="white"` has no hyphen prefix and never matched.

**Fix.** Use `grep -rE '\b(text|bg|border|from|via|to|outline|ring|placeholder|divide|fill|stroke)-white' src --include='*.svelte' | grep -v /admin/` and drop the SVG-attribute clause from the expected-result cell.

