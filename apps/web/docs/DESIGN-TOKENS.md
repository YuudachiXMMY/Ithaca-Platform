# Design tokens — the light system, and the rulebook for applying it

**Status**: token layer landed (`src/app.css`). The applier wave has **not** run yet.
**Decision of record**: `docs/DECISIONS.md` D-1 — implement `prd.md` §8.2 **literally**.
**Scope of this document**: it is the contract the applier wave executes. It is meant to be
**mechanical**. If you are applying it and the thing in front of you is not in §3, **stop and
report it** (§8). Do not invent a value.

**Last revised** 2026-09-29, against `.claude/PRPs/reviews/design-tokens-review.md` (20 findings)
and `.claude/PRPs/reviews/design-tokens-review-round2.md` (25 findings).
Every ratio printed anywhere in this document was recomputed in those passes — see §4 for the method.

> ### ⚠ AMENDMENT 2026-09-29 — **the EV Challenge stretch is LIGHT, not BAND**
>
> Every revision of this document up to and including the one above treated
> `/programs/ev-challenge` as the one region that stays an inverted navy band, on the
> reasoning that "a 3D scene reads best on a dark ground". **The owner has since decided the
> EV page should be light like the rest of the site**, and that conversion has shipped.
>
> The consequence is narrow but it touches many rows: **BAND is now the 9 photo-scrim files
> and nothing else.** There is no longer a file that is BAND end-to-end. The EV page and
> `EVModel3DSection.svelte` are still BAND _in three places_ — they carry three photo scrims
> between them — but by R-SCRIM, exactly like every other scrim site. §2's second table has
> been struck and the affected rows in §3.1 / §3.7 / §3.8 / §3.9a / §9.3 carry an
> `EV → LIGHT` note.
>
> `src/app.css` moved with it: `.ev-ambient-a|b|c|close`, `.ev-roles-bg`, `.ev-roles-grid`,
> `.dissolve-panel-eng|biz`, `.ev-scene-vignette`, `.ev-seam-line` and `.ev-seam-glow` are now
> light surfaces. **The token layer (`:root` / `@theme inline`) did not change** — including
> the full `--band-*` set, which the scrim population still needs. `--band-warm` is the one
> token this left with no consumer; it is kept, see §1.5.

> ### ⚠ MERGE GATE — `src/app.css` MUST NOT LAND ALONE
>
> The token layer is already inverted; the `.svelte` tree is not. In the current checkout
> `--background` is `#FFFFFF` while `MissionSection.svelte:34` still says `bg-[#111318]` and
> `:45`/`:53` still say `text-white` / `text-white/60` — **white on white, 1.00:1**. 18 public
> files still carry dark-ladder literals (29 occurrences) and 191 `text-white*` utilities remain.
> `--border` flipped `#252830` → `#E5E7EB`, so `border-border` inside a navy band is now a
> **13.34:1 white hairline**.
>
> `src/app.css` and the §3 applier pass ship in **one** commit/PR. Do not deploy the
> intermediate state. (Review finding 3.)
>
> ### SCOPE — two hard boundaries, stated once, here
>
> 1. ~~**Never edit a file under `src/routes/admin/**` in this wave.**~~ **VOID as of
>    2026-10-10** — `552a31c` deleted the admin panel outright, so `src/routes/admin/` does not
>    exist and the work §3.2 / §3.6 deferred has no object. Every count in §3 is therefore simply
>    the whole app. The `| grep -v /admin/` filters left in the verification commands throughout
>    this document are now **no-ops**; they have deliberately not been rewritten, because the
>    numbers beside them were measured with those filters in place and editing ~15 command
>    strings would only break that correspondence. (Originally Round-2 finding R2-22.)
> 2. **Text over a photograph is BAND, never LIGHT** — see **§3.0 R-SCRIM**, which outranks every
>    table in §3. A scrim is an `absolute inset-0` **sibling**, so the "nearest ancestor with a
>    background" walk in §2 lands on the (now white) section and gives you the wrong column.
>    The 11 files / 36 sites this affects are enumerated in §2. (Round-2 finding R2-1; the EV
>    amendment above added the 2 EV files / 13 sites.)

---

## 0. What actually changed, and why it is not a recolour

`prd.md` §8.2 is a **light** system: `--color-ink #111827` is body text, `--color-mist #F5F7FA`
and white are surfaces, navy is only for dark section blocks. This site was **dark-first**:
`--background #111318`, `--foreground #f0f1f3`, every section background between `#0a0c10` and
`#111318`, 91 bare `text-white` + 54 `text-white/60` utilities, photo scrims at `from-black/80`.

So this is an **inversion**, not a recolour. Four consequences that govern everything below:

1. **Token names are frozen; values inverted.** `src/app.css` keeps the `:root` value layer +
   `@theme inline` alias layer. Because `@theme inline` inlines the _expression_, `text-brand`
   compiles to `color: var(--brand)` and ~456 utility occurrences — including every `/5`…`/95`
   opacity modifier — follow a `:root` edit for free. **Do not flatten that indirection.**
2. **Anything that is not a token does not follow.** That is the ~500 literals this document
   exists to map: hardcoded hex arbitrary-values in `.svelte`, 29 dark-ladder section
   backgrounds, default-palette status utilities, 7 three.js material colours, 6 inline-`style`
   `rgba()` values.
3. **A light system needs a first-class dark band.** The site alternates section colour heavily.
   §8.2 keeps navy for dark blocks, so `src/app.css` ships a full `--band-*` set (surface, text,
   border, brand, action, status) and **every row in §3 gives you both contexts**: what to write
   on a light surface, and what to write inside a navy band. **There are no exceptions** —
   §3.7 used to be one, and it was the single biggest defect in the previous revision.
4. **A value swap does not carry an opacity modifier.** `text-white/60` was 7.19:1 on the old
   dark ground; the same utility rewritten as `text-foreground/60` is 4.68:1 on white and 1.04:1
   on a band. Opacity is where a light inversion quietly fails an axe audit. See **§3.0 R-OPACITY**.

---

## 1. Token table

### 1.1 Palette — `prd.md` §8.2, verbatim

`:root` holds the bare name; `@theme inline` exposes §8.2's own `--color-*` spelling, so
`bg-navy-900`, `text-teal-600`, `text-ink` etc. all exist as utilities.

| Token         | Value     | Role                                                   | Replaced                  |
| ------------- | --------- | ------------------------------------------------------ | ------------------------- |
| `--navy-950`  | `#071426` | Deepest band; photo-scrim base                         | —                         |
| `--navy-900`  | `#0B1F3A` | The default dark section block                         | —                         |
| `--navy-700`  | `#14325C` | Raised plane inside a band; band hairlines             | —                         |
| `--navy-500`  | `#2B4C7E` | Informational blue on light                            | —                         |
| `--teal-600`  | `#0B6E70` | The only teal that carries text on white               | `--brand` `#3e8fc7`       |
| `--teal-500`  | `#0F8B8D` | **Graphics only** — 4.12:1 on white                    | —                         |
| `--teal-300`  | `#5FC3C4` | Brand text/lines on a navy band                        | —                         |
| `--teal-100`  | `#D9F1F1` | Band chips; strongest band brand tone                  | —                         |
| `--amber-600` | `#D98E14` | Fills/shapes only (2.68:1 on white)                    | —                         |
| `--amber-500` | `#F5A623` | Badges; legible only on navy or as an ink-bearing fill | —                         |
| `--amber-200` | `#FCE3B0` | Soft chip fill                                         | —                         |
| `--ink`       | `#111827` | Body text                                              | `--foreground` `#f0f1f3`  |
| `--ink-2`     | `#374151` | Secondary text                                         | `text-white/60` (54 uses) |
| `--mist`      | `#F5F7FA` | Tinted page surface                                    | `--card-bg` `#181b21`     |
| `--line`      | `#E5E7EB` | **Decorative hairline only** (1.24:1)                  | `--border` `#252830`      |
| `--white`     | `#FFFFFF` | Base surface                                           | —                         |

### 1.2 Derived palette — values §8.2 does not supply, each justified by arithmetic

| Token                                                                 | Value                                         | Why it exists                                                                                                                                                    |
| --------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--teal-700`                                                          | `#075355`                                     | §8.2's teal ramp bottoms out at 6.04:1. `--brand-bright`'s role (the _more legible_ tone for small text) needs darker on a light ground. 8.83:1.                 |
| `--amber-800`                                                         | `#8A5300`                                     | Warning **text**. §8.2's darkest amber (`amber-600`) is 2.68:1 on white — fails even the 3:1 large-text floor. 6.33:1.                                           |
| `--danger-600`                                                        | `#B3261E`                                     | §8.2 has no status hues; Tailwind v4's `red-400` (`oklch(70.4% 0.191 22.216)` ≈ `#ff6467`) is 2.89:1 on white. 6.54:1.                                           |
| `--success-700`                                                       | `#0F7A3D`                                     | Same, for `text-green-300`/`-400`. 5.42:1.                                                                                                                       |
| `--ink-3`                                                             | `#5B6575`                                     | Tertiary/meta text. Still AA (5.01:1) on the deepest surface rung.                                                                                               |
| `--rule-strong`                                                       | `#7B8593`                                     | **Control** boundaries. WCAG 1.4.11 needs 3:1; `--line` gives 1.24:1. 3.74 / 3.61 / 3.48 / 3.32 / 3.18:1 across surface-0…-4.                                    |
| `--band-ink-2`                                                        | `#C3CEDC`                                     | Secondary text on a band (10.37:1 on navy-900, 8.04 on navy-700, 9.27 on band-warm).                                                                             |
| `--band-ink-3`                                                        | `#9AACC0`                                     | Tertiary text on a band (7.11 / 7.95 / 5.51 / 6.35 on navy-900 / -950 / -700 / band-warm).                                                                       |
| `--band-rule-strong`                                                  | `#7089A8`                                     | Control boundaries on a band. **Raised from `#5A7296` in the 2026-09-29 pass** — see the note below. 4.59 / 5.13 / 3.56 / 4.10 on navy-900 / -950 / -700 / warm. |
| `--danger-300` / `--success-300` / `--info-300`                       | `#FCA5A5` / `#86EFAC` / `#A9C7F0`             | Status on a band (8.70 / 11.76 / 9.53:1).                                                                                                                        |
| `--danger-tint` / `--success-tint` / `--warning-tint` / `--info-tint` | `#FDECEA` / `#E8F6EE` / `#FDF3DC` / `#E7EFFA` | Status wash fills; ink clears 15:1 on all four.                                                                                                                  |

**Why `--band-rule-strong` moved.** WCAG 1.4.11 asks for 3:1 against _the surface the control is
actually on_, and a band has **four** surfaces, not one: `--band` (navy-900), `--band-deep`
(navy-950), `--band-soft` (navy-700 — declared in `app.css` as "raised plane (card) inside a band",
i.e. exactly where a focusable card lives) and `--band-warm` (`#292823`, shipped solid by
`.dissolve-panel-biz` under `prefers-reduced-transparency`). The old `#5A7296` measured
3.37 / 3.77 / **2.61** / **3.01** — it failed on the raised plane and had no margin on the warm
panel. `#7089A8` clears 3:1 on all four with margin, and the token had **zero consumers**, so the
change is free. (Review finding 14.)

### 1.3 Light surface ladder

The dark site carried a five-step ladder as raw literals across 18 files with **no token at all**.
This is that ladder inverted, rung for rung, so every old literal maps to exactly one rung.

| Token         | Value     | Was       | Ink   | Ink-2 | Ink-3 | teal-600 | line (1.4.11 ✗) | rule-strong |
| ------------- | --------- | --------- | ----- | ----- | ----- | -------- | --------------- | ----------- |
| `--surface-0` | `#FFFFFF` | `#111318` | 17.74 | 10.31 | 5.89  | 6.04     | 1.24            | 3.74        |
| `--surface-1` | `#FAFBFC` | `#0e1015` | 17.12 | 9.95  | 5.69  | 5.83     | 1.20            | 3.61        |
| `--surface-2` | `#F5F7FA` | `#0d0f14` | 16.53 | 9.60  | 5.49  | 5.63     | 1.15            | 3.48        |
| `--surface-3` | `#EEF2F7` | `#0c0e12` | 15.78 | 9.17  | 5.24  | 5.37     | 1.10            | 3.32        |
| `--surface-4` | `#E8EDF3` | `#0a0c10` | 15.07 | 8.76  | 5.01  | 5.13     | 1.05            | 3.18        |

Ink clears AAA on every rung; `teal-600` and `ink-3` clear AA on every rung — which is exactly why
`teal-600`, and not `teal-500`, is the brand colour permitted to carry text. `--line` fails the
1.4.11 3:1 floor on every rung: it is a decorative divider, never a control edge.

### 1.4 Semantic tokens — **names frozen, values inverted**

| Token                 | Resolves to     | Value     | Was       | Consumers today                                                                                                                                                 |
| --------------------- | --------------- | --------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--background`        | `--surface-0`   | `#FFFFFF` | `#111318` | 30 (`bg-` 16, gradient stops 14)                                                                                                                                |
| `--foreground`        | `--ink`         | `#111827` | `#f0f1f3` | 97 `text-` (50 bare + **47 opacity-modified**), 5 `bg-`, 1 `border-`                                                                                            |
| `--foreground-muted`  | `--ink-2`       | `#374151` | _new_     | 0 — the solid replacement for `text-white/60`–`/70` and `text-foreground/60`–`/70`                                                                              |
| `--foreground-subtle` | `--ink-3`       | `#5B6575` | _new_     | 0 — the solid replacement for everything below `/60`                                                                                                            |
| `--foreground-dark`   | `--ink`         | `#111827` | `#1b1b1b` | 0 utilities; **kept and re-scoped** — ink used _because the surface under it is a bright fill_ (amber-500, teal-300/100, amber-200), not because it is the page |
| `--card-bg`           | `--surface-2`   | `#F5F7FA` | `#181b21` | 16                                                                                                                                                              |
| `--border`            | `--line`        | `#E5E7EB` | `#252830` | 33 — **decorative only**                                                                                                                                        |
| `--border-strong`     | `--rule-strong` | `#7B8593` | _new_     | 0 — interactive control edges                                                                                                                                   |
| `--brand`             | `--teal-600`    | `#0B6E70` | `#3e8fc7` | `text-brand` 18, `outline-brand` 53, `from/via-brand` 54, `border-brand` 24, `bg-brand` 23 (`text-brand-bright`'s 72 are the next row)                          |
| `--brand-bright`      | `--teal-700`    | `#075355` | `#5aa6db` | 72 (all `text-`)                                                                                                                                                |
| `--brand-graphic`     | `--teal-500`    | `#0F8B8D` | _new_     | 0 — hairlines/fills, **never text**                                                                                                                             |
| `--action`            | `--teal-600`    | `#0B6E70` | `#2a6ca8` | 14 `bg-action`                                                                                                                                                  |
| `--action-hover`      | `--teal-700`    | `#075355` | `#215c93` | 14 `bg-action-hover`                                                                                                                                            |
| `--action-foreground` | `--white`       | `#FFFFFF` | _new_     | 0 — was implicit `text-white`; **14 sites must adopt it**, see §3.0 R-FILL                                                                                      |

**Why `--brand` and `--action` share a value.** On a light ground there is exactly one teal that
simultaneously carries text at 4.5:1 and takes white text at 4.5:1. That is `teal-600`. They stay
separate tokens because their _roles_ are separate and because `--action-hover` deepens
independently. "Bright" in `--brand-bright` now means **higher contrast against the surface**, not
lighter — on a light ground the legible teal is the dark one.

**Opacity discipline.** `--brand` text must be **full-opacity**: on white `brand/90` = 4.88:1 (AA,
the floor, 0.38 of margin), `brand/80` = 3.98 (large text only), `brand/70` = 3.24 (graphics only —
0.24 over the 3:1 floor), `brand/50` = 2.22 (decorative only). `--foreground` tolerates more but
**not as much as the previous revision of this document claimed**: `ink/60` is 4.68 _on white_ and
4.42 on surface-4. The executable rule is **§3.0 R-OPACITY**; the full per-rung table is §4.

### 1.5 Inverted band (dark section block)

| Token                      | Resolves to          | Value     | Contrast on `--band` (navy-900)                                  |
| -------------------------- | -------------------- | --------- | ---------------------------------------------------------------- |
| `--band`                   | `--navy-900`         | `#0B1F3A` | — (the surface)                                                  |
| `--band-deep`              | `--navy-950`         | `#071426` | —                                                                |
| `--band-soft`              | `--navy-700`         | `#14325C` | raised plane (1.29 vs band)                                      |
| `--band-warm`              | **literal**          | `#292823` | 1.12 vs band — **0 consumers since the EV amendment**; see below |
| `--band-foreground`        | `--white`            | `#FFFFFF` | 16.52 AAA                                                        |
| `--band-foreground-muted`  | `--band-ink-2`       | `#C3CEDC` | 10.37 AAA                                                        |
| `--band-foreground-subtle` | `--band-ink-3`       | `#9AACC0` | 7.11 AAA                                                         |
| `--band-border`            | `--navy-700`         | `#14325C` | 1.29 — decorative only                                           |
| `--band-border-strong`     | `--band-rule-strong` | `#7089A8` | 4.59 — control edges (3.56 worst case, on band-soft)             |
| `--band-brand`             | `--teal-300`         | `#5FC3C4` | 7.94 AAA                                                         |
| `--band-brand-strong`      | `--teal-100`         | `#D9F1F1` | 14.00 AAA                                                        |
| `--band-action`            | `--teal-300`         | `#5FC3C4` | 7.94 (boundary)                                                  |
| `--band-action-hover`      | `--teal-100`         | `#D9F1F1` | 14.00 (boundary)                                                 |
| `--band-action-foreground` | `--ink`              | `#111827` | 8.52 on teal-300, 15.04 on teal-100                              |

**`--band-warm` is a literal, on purpose.** It is `color-mix(in srgb, navy-950 84%, amber-600)`,
which evaluates to `#292823` — but it is the only band surface reachable _only_ through
`color-mix()`, so on a browser without that function it would resolve to nothing at all and
`.dissolve-panel-biz` (including its `prefers-reduced-transparency` branch) would have no
background. `src/app.css` therefore declares the literal in `:root` and re-derives it from the two
source tokens inside `@supports (color: color-mix(in lab, red, red))`. See §1.8. (Review finding 8.)

**`--band-warm` now has zero consumers.** Its only one was `.dissolve-panel-biz`, and the EV
amendment moved that panel to `--amber-200` (ink 14.15:1) — the two tracks still read as two
planes, but by _temperature_ (cool mist vs warm cream) rather than by lightness. The token and its
`@supports` re-derivation are **kept**: the names in §1 are frozen, `bg-band-warm` is a spellable
utility, and `--band-rule-strong`'s 3:1 argument in §1.2 is measured against it. Retire it only
with a deliberate token-layer pass, not as incidental cleanup.

**The CTA inverts on a band.** A `teal-600` button sitting on `navy-900` has a **2.74:1 boundary**
against the band and fails WCAG 1.4.11. On a band the primary CTA is therefore a `teal-300` fill
carrying **ink** text: 7.94:1 boundary, 8.52:1 text. It does **not** carry white — white on
teal-300 is **2.08:1** and on teal-100 **1.18:1**. This is the trap §3.0 R-FILL exists to close.

### 1.6 Status

| Light          | Value     | on white / mist | Band             | Value     | on navy-900 |
| -------------- | --------- | --------------- | ---------------- | --------- | ----------- |
| `--success`    | `#0F7A3D` | 5.42 / 5.05     | `--band-success` | `#86EFAC` | 11.76       |
| `--warning`    | `#8A5300` | 6.33 / 5.90     | `--band-warning` | `#F5A623` | 8.15        |
| `--danger`     | `#B3261E` | 6.54 / 6.09     | `--band-danger`  | `#FCA5A5` | 8.70        |
| `--info`       | `#2B4C7E` | 8.61 / 8.03     | `--band-info`    | `#A9C7F0` | 9.53        |
| `--success-bg` | `#E8F6EE` | ink 15.92       | —                | —         | —           |
| `--warning-bg` | `#FDF3DC` | ink 16.08       | —                | —         | —           |
| `--danger-bg`  | `#FDECEA` | ink 15.51       | —                | —         | —           |
| `--info-bg`    | `#E7EFFA` | ink 15.31       | —                | —         | —           |

Never mix the two columns. A `--danger-300` chip on a white card is 1.9:1.

### 1.7 Non-colour

| Token            | Value     | Note                                                            |
| ---------------- | --------- | --------------------------------------------------------------- |
| `--nav-h`        | `4.5rem`  | unchanged                                                       |
| `--container`    | `1200px`  | §8.2 verbatim; utility is **`max-w-page`** (`--container-page`) |
| `--radius-card`  | `12px`    | §8.2's `--radius-md`; **renamed**                               |
| `--radius-panel` | `20px`    | §8.2's `--radius-lg`; **renamed**                               |
| `--overlay`      | `#071426` | photo scrim base; utility `bg-overlay/N`, `from-overlay/N`      |

**Why the radii were renamed.** `--radius-md` and `--radius-lg` are _existing Tailwind v4 theme
keys_ (`node_modules/tailwindcss/theme.css:399-400` = `0.375rem` / `0.5rem`). Declaring §8.2's
values under those names in `:root` silently resizes the 28 `rounded-lg` call sites already in the
tree. Values are §8.2-verbatim; only the key names differ.

### 1.8 `color-mix()` browser floor — **read before you author one**

`prd.md` §14 **R-COMPAT-1** makes _iOS Safari 16+_ and the _WeChat in-app browser (Android X5)_
required targets. `color-mix()` shipped in **Safari 16.2** and **Chrome 111**; iOS Safari 16.0/16.1
do not have it, and the X5/XWeb webview is commonly Chromium **≤ 107**. WeChat-on-mobile is this
site's primary arrival path, so this is a live production risk, not a theoretical one.

The failure mode is worse than "the mix falls back to something". Every `color-mix()` in
`src/app.css` also contains a `var()`, which means the declaration cannot be grammar-checked at
parse time; it becomes **invalid at computed-value time**, and a property that is IACVT computes to
its **initial** value. For `background` that is `none` / `transparent`. Critically, **an earlier
plain declaration in the same rule is _not_ used as a fallback** — the cascade already picked the
later declaration as the winner before substitution ran. So this does **not** work:

```css
/* WRONG — the second declaration wins the cascade, then goes IACVT,
   and `background` computes to its initial value. The first line is dead. */
.x {
	background: var(--band-deep);
	background: linear-gradient(…, color-mix(in srgb, var(--band) 46%, transparent), …);
}
```

Two shapes do work, and `src/app.css` uses the first:

1. **`@supports` guard.** Base rule carries a color-mix-free, on-palette, legible declaration; the
   enhancement lives in `@supports (color: color-mix(in lab, red, red)) { … }`. That is the same
   feature test Tailwind emits for its own `/N` opacity modifiers
   (`.bg-brand\/30 { background-color: var(--brand); @supports (…) { background-color: color-mix(…) } }`),
   so our guard and Tailwind's guard agree — no browser ever gets one and not the other.
2. **Different property.** `background-color: var(--band-deep)` (fallback) +
   `background-image: …color-mix…` (enhancement). Two different properties, so the IACVT one does
   not take the other down with it.

**The verified inventory** (comment-stripped scan of `src/app.css`, recomputed round 2 — the
previous revision said "24 declarations", which matched nothing in the file): **30**
`color-mix(in srgb, …)` values, in **23** declarations, across **15 rule blocks** — 12 distinct
class selectors plus `:root`, with `.dissolve-panel-eng` and `.dissolve-panel-biz` appearing twice
each (base + `lg` variant). All 15 blocks sit inside one of the **8**
`@supports (color: color-mix(in lab, red, red))` guards: `--band-warm` (in `:root`),
`.mission-aura`, `.dissolve-panel-eng|biz` incl. the `lg` variants, `.ev-scene-vignette`,
`.ev-seam-line`, `.ev-seam-glow`, `.ev-roles-bg`, `.ev-roles-grid`, `.ev-ambient-a|b|c|close`.
(`grep -o 'color-mix(' src/app.css` returns **47**: 30 values + the 8 `in lab` feature tests + 9
mentions inside comments. Do not use the raw grep as the inventory; §9 checks _containment_, not
count.) The degraded render for every band section is the **navy ground gradient without
the teal glows** — on-palette and fully legible, rather than a transparent section dropping white
text onto the white body.

**Rule for the applier:** never put a `color-mix()` in an inline `style=` attribute (an inline style
cannot carry an `@supports` guard). If you need one, it goes in `src/app.css` behind a guard and the
component references a class. §3.9 is exactly this case.

---

## 2. Two contexts — read this before §3

Every row in §3 has two replacement columns.

- **LIGHT** — the element sits on `--surface-0`…`--surface-4` (i.e. the normal page).
- **BAND** — the element sits inside a navy dark section block (`bg-band`, `bg-band-deep`,
  `bg-band-soft`, `bg-band-warm`, the `.ev-*` ambient classes, or a photo scrim).

**The decision procedure.** Walk up from the element until you hit **whichever of these comes
first**:

- **(a)** an ancestor that **sets a background itself** (`bg-*`, or one of the `.ev-*` /
  `.dissolve-panel-*` classes), **or**
- **(b)** an ancestor that **contains an `absolute inset-0` scrim sibling** — a positioned overlay
  div stacked over a photo/video that paints **any** colour at all.

  This is a TEST, not a list. Read it as "does this `absolute inset-0` sibling paint something over
  an image?" — if yes, it is a scrim. The common forms are `bg-black/*`, `from|via|to-black/*`,
  `bg-overlay/*`, `from|via|to-overlay/*`, `bg-background/*` and `from|via|to-background`, but an
  **arbitrary-hex gradient counts too**. A review pass that treated the list as exhaustive missed
  `src/lib/components/about/HeroSection.svelte:40`
  (`from-[#111318] via-[#111318]/80 to-[#111318]/30 lg:via-[#111318]/50 lg:to-transparent`),
  which would have put a white veil over the About hero photograph and taken that page's `<h1>` —
  its LCP element — with it. When a scrim is written as a raw hex, map the gradient to `--overlay`
  per R-OVERLAY-1 and treat the text on it as BAND; do not route it through §3.1's light ladder.

If you land on **(b)**, or on **(a)** and it is `bg-band*` / `bg-overlay*` / `.ev-ambient-*` /
`.ev-roles-bg` / `.dissolve-panel-*`, you are in **BAND**. Otherwise LIGHT. If you cannot tell,
**stop and report** (§8).

> **Why (b) has to be in the procedure.** In this codebase a photo scrim is **always an
> `absolute inset-0` SIBLING div, never an ancestor** — the text sits in a later, background-less
> sibling with `relative z-10` (or `absolute bottom-0`). A plain "nearest ancestor that sets a
> background" walk therefore skips the scrim entirely and lands on the **section**, which the light
> ladder now makes WHITE — so a literal reading of the old procedure puts **ink text on a navy
> scrim**. The binding rule is **§3.0 R-SCRIM**, which outranks every table in §3.
> (Round-2 finding R2-1.)

#### The scrim-text sites — 11 files, 36 text sites

Every one of these is **BAND**. They are listed to `file:line` the same way every other §3 row is,
because the §3.3 / §3.7 counts below are whole-tree figures and do **not** break the scrim sites
out. Verified by grep on 2026-09-29; the round-2 critic's list (7 files / 17 sites) was short by
`HeroSection:71`, `StudentHighlights:113`, `PlaceholderProgram:72/:77/:80` and both
`bg-background/80` files, and wrongly included `ProgramsBento:114/:118` (those sit in a **sibling
text column**, not over the photo — they are LIGHT).

| File                                                            | Scrim  | Text sites on it                                                                                                                 |
| --------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/components/home/HeroSection.svelte`                    | `:35`  | `:49` `text-white` (**the homepage LCP element**), `:58` `text-white/40`, `:71` ghost CTA — see §3.4's split row                 |
| `src/lib/components/home/ProgramsShowcase.svelte`               | `:63`  | `:69` `text-white`, `:75` `text-white/60`, `:79` `text-brand-bright` + `group-hover:text-white`                                  |
| `src/lib/components/home/StudentHighlights.svelte`              | `:92`  | `:105` `text-brand-bright`, `:109` `text-white`, `:113` `text-white/40` (+ `:97` `text-white/[0.05]` → §8 item 6)                |
| `src/lib/components/about/ProgramsBento.svelte`                 | `:84`  | `:87` `text-white`, `:88` `text-white/60`                                                                                        |
| `src/lib/components/about/Outcomes.svelte`                      | `:83`  | `:88` `text-white`, `:91` `text-white/70`                                                                                        |
| `src/lib/components/about/ConnectCTA.svelte`                    | `:29`  | `:31` `text-white`                                                                                                               |
| `src/lib/components/programs/PlaceholderProgram.svelte`         | `:51`  | `:58` `text-brand-bright`, `:66` `text-white` (h1), `:72` `text-brand-bright` + `border-brand/30`, `:77` + `:80` `text-white/60` |
| `src/routes/programs/ai-entrepreneurship-bootcamp/+page.svelte` | `:495` | `:498` `text-white`, `:501` `text-white/60`                                                                                      |
| `src/routes/programs/ithaca-dialogues/+page.svelte`             | `:529` | `:532` **`text-foreground`** (ink on a navy scrim = 1.4:1), `:535` `text-white/60`                                               |

**Added by the 2026-09-29 EV amendment.** These two files used to be BAND end-to-end (see the
struck table below); now only their photo regions are, and they are ordinary scrim sites. Line
numbers are post-conversion and the token spellings are the ones the files carry **today**, not
the pre-wave `text-white*` forms the rows above quote:

| File                                                               | Scrim  | Text sites on it                                                                                                                                              |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/programs/ev-challenge/+page.svelte` (hero)             | `:161` | `:166` `text-band-foreground` (**the page's LCP element**), `:170` / `:184` / `:187` `text-band-foreground/80`                                                |
| `src/routes/programs/ev-challenge/+page.svelte` (competition)      | `:344` | `:349` `text-band-foreground`, `:352` / `:362` `text-band-foreground/80`, `:357` chip (`border-band-brand/30` + `text-band-brand-strong`), `:369` link (same) |
| `src/lib/components/programs/ev-challenge/EVModel3DSection.svelte` | `:221` | `:228` `text-band-foreground`, `:232` / `:239` / `:242` `text-band-foreground/80` — the **reduced-motion** poster only                                        |

`EVModel3DSection:221`'s photo carries `opacity-40`, so its composite depends on the wrapper
behind it. That wrapper (`:213`) is therefore pinned to `bg-overlay` — it is part of the scrim,
not a section, and converting it to a light surface would have put a navy gradient over a
washed-out photo and taken the display copy's ground with it.

Five further CTA labels sit on these scrims but are governed by **R-FILL**, not by the scrim:
`HeroSection:65`, `PlaceholderProgram:85`, `ai-entrepreneurship-bootcamp:507`,
`ithaca-dialogues:540` (R-FILL rows 3, 6, 13, 9) and `ev-challenge/+page.svelte:175` (row 10).

The two `bg-background/80` scrims (`ai-entrepreneurship-bootcamp:495`, `ithaca-dialogues:529`) are
themselves a §3 row — see §3.5. Left alone they become an **80 % white veil** over the photograph.

`ai-entrepreneurship-bootcamp:167` and `ithaca-dialogues:202` are also scrims
(`from-background via-background/40 to-transparent`, the mobile heroes) but carry **no text** —
§3.5 + §3.7's gradient row still apply, R-SCRIM does not.

~~**The three files that are BAND end-to-end**~~ — **STRUCK 2026-09-29.** This table used to list
`ev-challenge/+page.svelte`, `EVModel3DSection.svelte` and `WorkshopToRoles.svelte` as BAND for
their whole length, on the strength of `src/app.css` pinning the EV 3D stretch navy. The owner
then moved the EV page onto the light system, so:

- `WorkshopToRoles.svelte` is **LIGHT end to end** — it has no photo scrim at all and now carries
  no `band-*` utility. Its ambient ground (`.ev-roles-bg` / `.ev-roles-grid`) is a tinted mist
  radial with white role cards on it.
- `ev-challenge/+page.svelte` and `EVModel3DSection.svelte` are **LIGHT except for their three
  photo scrims**, which are in the table above and are decided by R-SCRIM like every other scrim.
- The old census this table printed (26 bare `text-foreground`, 32 `text-foreground/N`, 21
  `text-brand-bright`, …, all of which needed the BAND column) **no longer applies**. Those
  utilities now take the LIGHT column, which is what a reader of §3.7 would already have assumed.

**BAND is the 11 scrim files above and nothing else.** The LIGHT/BAND split is now a per-element
property everywhere — always decided by (b) — with no whole-file exception left in the tree.

---

## 3. Lookup table

### 3.0 The three rules that outrank the tables

Apply these **before** you reach for a row. When a §3 row and one of these disagree, these win.
Order of precedence when two of them fire on the same element: **R-FILL → R-SCRIM → R-OPACITY.**
(A CTA label on a scrim is decided by its fill, not by the scrim; see the four R-FILL rows listed
in §2.)

#### R-SCRIM — text over a photograph is BAND, and only three text tokens are legal on it

An `absolute inset-0` scrim is a **sibling**, not an ancestor, so §2's background walk needs
clause (b) to find it. Every text element that overlaps a scrim is **BAND context**, regardless of
what the surrounding section's background is. The 9 files / 23 sites are enumerated in §2.

Because a scrim is translucent, its worst case is the photograph showing through — the floors in
§4.2 are measured over a **blown highlight `#FFFFFF`**, which is the realistic worst region. At
R-OVERLAY-2's own alpha floors, most band text tokens **fail there**. So:

| On a scrim, write                              | At the `/70` normal floor | At the `/55` display floor | Verdict                       |
| ---------------------------------------------- | ------------------------- | -------------------------- | ----------------------------- |
| `text-band-foreground` (white)                 | **6.90**                  | **4.10**                   | ✅ the default                |
| `text-band-foreground/80`                      | **5.12**                  | **3.25**                   | ✅ the one "muted" step       |
| `text-band-brand-strong` (teal-100)            | **5.85**                  | **3.47**                   | ✅ the one brand/eyebrow tone |
| ~~`text-band-foreground-muted`~~ (band-ink-2)  | 4.33                      | 2.57                       | ❌ **never on a scrim**       |
| ~~`text-band-brand`~~ (teal-300)               | 3.32                      | 1.97                       | ❌ **never on a scrim**       |
| ~~`text-band-foreground-subtle`~~ (band-ink-3) | 2.97                      | 1.76                       | ❌ **never on a scrim**       |
| ~~`text-foreground*`~~ at any alpha            | ≤ 1.4                     | ≤ 1.4                      | ❌ **never on a band at all** |

**That is the whole permitted set: three tokens.** All three clear AA (≥ 4.5) at the normal-text
floor and the 3:1 large-text floor at the display floor. `-muted` / `-subtle` / `text-band-brand`
are for **opaque** band surfaces (`bg-band*`, the `.ev-*` classes) only — which is why §3.3's BAND
column, which routes all 54 `text-white/60` and 14 `text-white/70` to
`text-band-foreground-muted`, is **overridden by this rule on the 9 scrim files**.

So on a scrim: `text-white` → `text-band-foreground`; `text-white/40`…`/70` →
`text-band-foreground/80`; `text-brand-bright` → `text-band-brand-strong`; `text-foreground` →
`text-band-foreground`. Hierarchy on a scrim comes from **size and weight**, not from a third and
fourth grey. (Round-2 findings R2-1, R2-2.)

SVG `stroke="white"` / `fill="white"` **attributes** on a scrim stay `white` — §3.5.

#### R-FILL — check the fill in the SAME `class` attribute before you touch any `text-*`

A text colour on an element that also carries a **fill** is determined by that fill, not by the
surrounding LIGHT/BAND context. Read the whole `class` attribute first.

| Fill on the same element                                        | Text must be                   | Ratio                       |
| --------------------------------------------------------------- | ------------------------------ | --------------------------- |
| `bg-action` / `bg-action-hover` / `hover:bg-action-hover`       | `text-action-foreground`       | 6.04 / 8.83                 |
| `bg-brand` / `bg-brand-bright`                                  | `text-action-foreground`       | 6.04 / 8.83                 |
| `bg-band-action` / `bg-band-action-hover`                       | `text-band-action-foreground`  | 8.52 / 15.04                |
| `bg-band-brand` / `bg-band-brand-strong`                        | `text-band-action-foreground`  | 8.52 / 15.04                |
| `bg-foreground`                                                 | `text-background`              | 17.74                       |
| `bg-amber-500` / `bg-amber-200` / `bg-teal-300` / `bg-teal-100` | `text-foreground-dark`         | 8.75 / 14.15 / 8.52 / 15.04 |
| `bg-band-soft` / `bg-band-warm`                                 | `text-band-foreground` (white) | 12.80 / 14.77               |

**The two ways to get this wrong, both of which the naive §3.3/§3.7 pass produces:**

- `text-white` on `bg-action` → §3.3's generic LIGHT row says `text-foreground`. That is
  **ink on teal-600 = 2.94:1**, and on `--action-hover` teal-700 = **2.01:1**. Both fail.
- `text-white` on `bg-action` _inside a band_ → §3.3's generic BAND row says
  `text-band-foreground`, and §3.7 flips the fill to `bg-band-action` (teal-300). That is
  **white on teal-300 = 2.08:1**. Fails.

**The 14 public call sites** where `text-white` shares a class attribute with `bg-action`/`bg-brand`
(`grep -rn 'text-white' src --include='*.svelte' | grep -v /admin/ | grep -E 'bg-action|bg-brand'`).
Tick each one off:

| #   | File                                                            | Line | Context                               | Result                                                                                                               |
| --- | --------------------------------------------------------------- | ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/lib/components/NewsletterForm.svelte`                      | 59   | LIGHT                                 | `text-action-foreground`                                                                                             |
| 2   | `src/lib/components/PopupBanner.svelte`                         | 68   | LIGHT                                 | `text-action-foreground`                                                                                             |
| 3   | `src/lib/components/home/HeroSection.svelte`                    | 65   | **BAND** (scrim `:35`, R-SCRIM)       | same as #10 \*                                                                                                       |
| 4   | `src/lib/components/home/ContactSection.svelte`                 | 161  | LIGHT                                 | `text-action-foreground`                                                                                             |
| 5   | `src/lib/components/about/ConnectCTA.svelte`                    | 64   | LIGHT                                 | `text-action-foreground`                                                                                             |
| 6   | `src/lib/components/programs/PlaceholderProgram.svelte`         | 85   | **BAND** (scrim `:51`, R-SCRIM)       | same as #10                                                                                                          |
| 7   | `src/routes/+error.svelte`                                      | 33   | LIGHT                                 | `text-action-foreground`                                                                                             |
| 8   | `src/routes/programs/ithaca-dialogues/+page.svelte`             | 176  | LIGHT                                 | `text-action-foreground`                                                                                             |
| 9   | `src/routes/programs/ithaca-dialogues/+page.svelte`             | 540  | **BAND** (scrim `:529`, R-SCRIM)      | same as #10                                                                                                          |
| 10  | `src/routes/programs/ev-challenge/+page.svelte`                 | 175  | **BAND** (hero scrim `:161`, R-SCRIM) | `bg-band-action` + `hover:bg-band-action-hover` + `text-band-action-foreground` + `focus-visible:outline-band-brand` |
| 11  | `src/routes/programs/ev-challenge/+page.svelte`                 | 460  | ~~BAND~~ → **LIGHT** (EV amendment)   | `text-action-foreground` — `.ev-ambient-close` is a light surface now                                                |
| 12  | `src/routes/programs/ai-entrepreneurship-bootcamp/+page.svelte` | 123  | LIGHT                                 | `text-action-foreground`                                                                                             |
| 13  | `src/routes/programs/ai-entrepreneurship-bootcamp/+page.svelte` | 507  | **BAND** (scrim `:495`, R-SCRIM)      | same as #10                                                                                                          |
| 14  | `src/routes/contact-us/+page.svelte`                            | 286  | LIGHT                                 | `text-action-foreground`                                                                                             |

**5 BAND, 9 LIGHT** (was 6 / 8 — the EV amendment moved row 11 to LIGHT; row 10 stays BAND, but
because it sits on the hero photo scrim, not because the section behind it is navy). Rows 3, 6,
9, 13 were "LIGHT" in the previous revision; **R-SCRIM moves them**
— each sits on a photo scrim, so its fill is a `teal-600` button on `navy-950`, a **2.74:1**
boundary that fails WCAG 1.4.11 (§1.5, "the CTA inverts on a band"). They take #10's treatment:
`bg-band-action` + `hover:bg-band-action-hover` + `text-band-action-foreground` +
`focus-visible:outline-band-brand`. (Round-2 finding R2-1.)

\* #3 is the homepage hero. Its **layout** is still §8 human-decision item 2 — but the colour is
not: the hero is a photo with a scrim in every variant under discussion, so the button inverts
either way. Do not hold the applier wave on item 2 for this row.

**The focus ring is the same hue as the fill.** The inversion collapsed `--brand` and `--action`
onto `teal-600` (they were `#3e8fc7` / `#2a6ca8` before), so all 14 sites draw
`focus-visible:outline-brand` around a `bg-action` fill at **1.00:1** ring-vs-fill. It still meets
1.4.11 **only** because `focus-visible:outline-offset-2` leaves a 2px gap of page background
(teal-600 vs white = 6.04:1; on BAND, teal-300 vs navy-900 = 7.94:1). **Do not remove the offset
from any of the 14 sites, and do not "simplify" `outline-offset-2` away.** If a visually distinct
ring is ever wanted, the values are `outline-brand-bright` (teal-700 — 8.83:1 on white, 1.46:1
against the fill) on LIGHT and `outline-band-brand-strong` (teal-100) on BAND — but that is a
design change, not part of this wave. (Round-2 finding R2-17; the same note is in `src/app.css`
next to `--action`.)

#### R-OPACITY — when an opacity modifier must become a SOLID token

The old dark ladder made opacity-dimmed text cheap (`text-white/60` was 7.19:1). The light
inversion does not. **47** `text-foreground/N` utilities are already in the tree at alphas this
document's previous revision never covered (`/70`×6, `/60`×15, `/55`×1, `/50`×10, `/40`×6,
`/35`×1, `/30`×6, `/25`×1, `/20`×1). Do not do arithmetic at the call site — use these cuts.

**R-OPACITY-1 — `--foreground` on LIGHT.** Keep the opacity modifier **only at `/70` and above**
(worst rung, surface-4: 6.07:1). At **`/65` and below, replace it with a solid token**:

| Found                          | Replace with             | Why                                                                                                                                                                                                                                  |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text-foreground/70`…`/95`     | keep as written          | ≥ 6.07:1 on every rung                                                                                                                                                                                                               |
| `text-foreground/60`, `/65`    | `text-foreground-muted`  | ink/60 is 4.68 on white but **4.4951 on surface-3** and **4.42 on surface-4** — it fails on the two rungs §3.1 maps `bg-[#0c0e12]` / `bg-[#0a0c10]` onto. `--foreground-muted` is 10.31 / 8.76 instead, at the same apparent weight. |
| `text-foreground/55` and below | `text-foreground-subtle` | /55 = 3.96, /50 = 3.38, /40 = 2.53, /30 = 1.94, /20 = 1.53 — all fail on every rung. `--foreground-subtle` is 5.89 / 5.01.                                                                                                           |

The cut is at `/70` rather than `/60` deliberately: a single threshold means the applier never has
to work out which surface rung it is standing on, and `--foreground-muted` beats `ink/60` on every
rung anyway. There is no case where keeping `/60` is better.

**R-OPACITY-2 — `--foreground` on BAND.** **No alpha survives, and neither does the token.** Ink at
_any_ opacity on navy is between 1.01:1 and 1.39:1 (ink/100 on navy-900 is 1.07, on navy-700 1.39).

| Found                          | Replace with                  | Ratio |
| ------------------------------ | ----------------------------- | ----- |
| `text-foreground` (bare)       | `text-band-foreground`        | 16.52 |
| `text-foreground/70`…`/95`     | `text-band-foreground-muted`  | 10.37 |
| `text-foreground/65` and below | `text-band-foreground-subtle` | 7.11  |

**R-OPACITY-3 — `--brand` never carries opacity as text.** `brand/90` (4.88) is the only alpha that
clears AA and it has 0.38 of margin. Brand text is full-opacity, LIGHT and BAND. As a **graphic**
(hairline, icon, rule) the 3:1 floor allows `/70` and above on **`surface-0`…`surface-3` only**
(3.24 / 3.20 / 3.14 / 3.03); **on `surface-4` the floor is `/80`** (3.57 — `/70` there is **2.97**,
under the 3:1 line). §3.1 maps `bg-[#0a0c10]` to `surface-4` at 8 sites, so that rung is live, and
§4.1 already prints the 2.97. (Round-2 finding R2-11.) Purely decorative
washes (a glow, a 4%-alpha frame) are exempt from 1.4.11 and may be any alpha — but see §3.4 for
what to do with the 3 `border-brand/[0.04–0.08]` sites, which are invisible on white (1.06–1.13:1).

**R-OPACITY-4 — `white` on BAND.** `text-white/N` keeps enough contrast down to `/50` (5.04 on
navy-900), but §3.3 converts it to a solid band token anyway so the band has the same two-rung
hierarchy the light side has. Below `/50` (4.35 at /45, 3.73 at /40) it is a hard requirement.

### 3.1 Dark section-background literals (public site, 29 occurrences / 18 files)

These were the untokenised ladder. Each maps to exactly one rung. **Counts here are public-site
only**; the admin panel is §3.2 and is deferred.

| Found              | LIGHT replacement  | BAND replacement  | Count | Notes                                                                    |
| ------------------ | ------------------ | ----------------- | ----- | ------------------------------------------------------------------------ |
| `bg-[#111318]`     | `bg-surface-0`     | `bg-band`         | **8** | the old base. **12 more in admin — DEFERRED, see §3.2**                  |
| `from-[#111318]`   | `from-surface-0`   | `from-band`       | 1     |                                                                          |
| `via-[#111318]/80` | `via-surface-0/80` | `via-band/80`     | 1     | opacity modifier survives verbatim (a _surface_ alpha, not a text alpha) |
| `via-[#111318]/50` | `via-surface-0/50` | `via-band/50`     | 1     |                                                                          |
| `to-[#111318]/30`  | `to-surface-0/30`  | `to-band/30`      | 1     |                                                                          |
| `bg-[#0e1015]`     | `bg-surface-1`     | `bg-band`         | 2     |                                                                          |
| `bg-[#0d0f14]`     | `bg-surface-2`     | `bg-band`         | 1     |                                                                          |
| `bg-[#0c0e12]`     | `bg-surface-3`     | `bg-band-deep`    | 6     |                                                                          |
| `bg-[#0a0c10]`     | `bg-surface-4`     | `bg-band-deep`    | 5     |                                                                          |
| `bg-[#0a0c10]/70`  | `bg-surface-4/70`  | `bg-band-deep/70` | 1     | was missing from the previous revision                                   |
| `bg-[#0a0c10]/90`  | `bg-surface-4/90`  | `bg-band-deep/90` | 1     | was missing                                                              |
| `bg-[#0a0c10]/95`  | `bg-surface-4/95`  | `bg-band-deep/95` | 1     | was missing                                                              |

8 + 1 + 1 + 1 + 1 + 2 + 1 + 6 + 5 + 1 + 1 + 1 = **29**, reconciling with the section header.

Files: `#0a0c10` → `home/ProgramsShowcase`, `layout/Header`, `home/ImpactStats`,
`routes/programs/+page`. `#0c0e12` → `about/{TeamGrid,Outcomes,DecabFramework,Approach,Highlights}`.
`#0d0f14` → `layout/Footer`. `#0e1015` → `home/StudentHighlights`. `#111318` → `home/{MissionSection,
ContactSection,FeaturedSection}`, `about/{ConnectCTA,MissionGrid,TeamGrid,HeroSection,ProgramsBento,Highlights}`.

**Default for the alternation rhythm**: apply the LIGHT column **everywhere**. The one exception
this row used to carve out — the EV Challenge 3D stretch, pinned to the band by `src/app.css` —
was removed by the 2026-09-29 EV amendment: `.ev-ambient-*`, `.ev-roles-bg`, `.ev-roles-grid` and
`.dissolve-panel-*` are light surfaces now. Which sections (if any) become navy bands is an
editorial decision — see §8.

### 3.2 Admin grey literals — **DEFERRED, DO NOT APPLY THIS ROUND**

`docs/DECISIONS.md` ("Open / deferred") excludes the admin panel from this rework: 125 literals
across 7 files, entirely outside the token layer. Mappings are recorded here so the later pass does
not have to re-derive them. **Touching these now will produce a half-light admin panel.**

| Found              | Where                                           | Eventual replacement     |
| ------------------ | ----------------------------------------------- | ------------------------ |
| `bg-[#111318]`     | **admin, 4 files (12×)** — added 2026-09-29     | `bg-surface-0`           |
| `bg-[#1e1e1e]`     | admin, 7 files                                  | `bg-surface-0`           |
| `bg-[#2a2a2a]`     | admin, 7 files                                  | `bg-surface-2`           |
| `border-[#2a2a2a]` | admin, 7 files                                  | `border-border`          |
| `bg-[#242424]`     | admin, 1 file                                   | `bg-surface-1`           |
| `text-[#888]`      | admin, 7 files                                  | `text-foreground-subtle` |
| `text-[#aaaaaa]`   | admin, 3 files                                  | `text-foreground-subtle` |
| `text-[#cccccc]`   | admin, 4 files                                  | `text-foreground-muted`  |
| `text-[#f7f7f7]`   | admin, 5 files                                  | `text-foreground`        |
| `bg-[#ccdef0]`     | admin, 7 files                                  | `bg-action`              |
| `text-[#ccdef0]`   | admin, 7 files                                  | `text-brand`             |
| `text-[#111318]`   | admin, 3 files (5×, paired with `bg-[#ccdef0]`) | `text-action-foreground` |

The 4 admin files carrying `bg-[#111318]`: `admin/(protected)/+layout.svelte`,
`admin/(protected)/emails/+page.svelte`, `admin/(protected)/popups/+page.svelte`,
`admin/login/+page.svelte`. (Review finding 16 — the previous revision's "20 occurrences" was the
whole-repo figure and this row was missing from §3.2 entirely, so an applier working to the stated
count would have recoloured the admin panel.)

`#ccdef0` is the _value_ of the deleted `--accent` token. It never went through the token layer, so
it survived the token's removal. That is the whole reason §6 says "0 consumers" and yet you still
see the colour.

### 3.3 `text-white` family (191 public occurrences)

**Apply §3.0 R-FILL first**, then **§3.0 R-SCRIM**. 14 of the 91 bare `text-white` sites are CTA
labels governed by the fill; a further **18** sites (9 bare + 9 with an alpha) sit on a photo scrim
and take R-SCRIM's three-token set, **not** the BAND column below. The BAND column below is for
**opaque** band surfaces.

**BAND breakdown of this section** (the split the previous revision never printed):

| Population                                                   | Bare `text-white` | `text-white/N` |
| ------------------------------------------------------------ | ----------------- | -------------- |
| R-FILL CTA labels (§3.0, 14 sites)                           | 14                | 0              |
| R-SCRIM — on a photo scrim (§2's 9 files)                    | **9**             | **9**          |
| the three EV files (opaque band) — `text-white*` occurrences | 0                 | 0              |
| LIGHT — everything else                                      | 68                | 91             |

The 9 bare scrim sites: `HeroSection:49`, `:71`; `ProgramsShowcase:69`; `StudentHighlights:109`;
`ProgramsBento:87`; `Outcomes:88`; `ConnectCTA:31`; `PlaceholderProgram:66`;
`ai-entrepreneurship-bootcamp:498`. The 9 alpha scrim sites: `HeroSection:58` (`/40`),
`ProgramsShowcase:75` (`/60`), `StudentHighlights:113` (`/40`), `ProgramsBento:88` (`/60`),
`Outcomes:91` (`/70`), `PlaceholderProgram:77` + `:80` (`/60`), `ai-entrepreneurship-bootcamp:501`
(`/60`), `ithaca-dialogues:535` (`/60`) — **all nine become `text-band-foreground/80`.**
(`StudentHighlights:97`'s `text-white/[0.05]` is §3.4a / §8 item 6 and is not counted here.)

| Found                | LIGHT replacement        | BAND replacement (opaque band only) | Contrast after (light / band)        |
| -------------------- | ------------------------ | ----------------------------------- | ------------------------------------ |
| `text-white` (91)    | `text-foreground`        | `text-band-foreground`              | 17.74 / 16.52                        |
| `text-white/80` (3)  | `text-foreground/80`     | `text-band-foreground-muted`        | 9.45 / 10.37                         |
| `text-white/70` (14) | `text-foreground-muted`  | `text-band-foreground-muted`        | 10.31 on white, 9.60 on mist / 10.37 |
| `text-white/60` (54) | `text-foreground-muted`  | `text-band-foreground-muted`        | 10.31 / 10.37                        |
| `text-white/55` (2)  | `text-foreground-muted`  | `text-band-foreground-muted`        | 10.31 / 10.37                        |
| `text-white/50` (19) | `text-foreground-subtle` | `text-band-foreground-subtle`       | 5.89 on white, 5.49 on mist / 7.11   |
| `text-white/45` (1)  | `text-foreground-subtle` | `text-band-foreground-subtle`       | 5.89 / 7.11                          |
| `text-white/40` (4)  | `text-foreground-subtle` | `text-band-foreground-subtle`       | 5.89 / 7.11                          |
| `text-white/35` (1)  | `text-foreground-subtle` | `text-band-foreground-subtle`       | 5.89 / 7.11                          |
| `text-white/30` (1)  | `text-foreground-subtle` | `text-band-foreground-subtle`       | 5.89 / 7.11                          |
| `text-white/20` (1)  | `text-foreground-subtle` | `text-band-foreground-subtle`       | 5.89 / 7.11                          |

91 + 100 = 191. (The previous revision said 94 bare / 194 total; the verified bare count is 91
public, 93 including admin — **leave the 2 admin sites alone**: `admin/(protected)/emails/+page.svelte:220`
and `admin/(protected)/popups/+page.svelte:323`, both `hover:text-white` on a `text-[#ccdef0]`
control. Writing `hover:text-foreground` there puts ink on the admin panel's `bg-[#1e1e1e]` at
~1.3:1. Admin is §3.2-deferred; see the scope box at the top. Round-2 finding R2-22.)

Reconciliation: 14 R-FILL + 9 R-SCRIM + 68 LIGHT = 91 bare; 9 R-SCRIM + 91 LIGHT = 100 alpha.

**Rule**: below `/60`, do **not** carry the opacity across — see §3.0 R-OPACITY-1. An opacity-dimmed
foreground on a light ground is how a light redesign fails an axe contrast audit.
`text-foreground/40` is 2.53:1; `text-foreground-subtle` is 5.89:1 and reads the same weight to the
eye.

### 3.4 `bg-white` / `border-white` / `placeholder-white` / `outline-white`

| Found                      | LIGHT replacement               | BAND replacement                     | Notes                                       |
| -------------------------- | ------------------------------- | ------------------------------------ | ------------------------------------------- |
| `bg-white/40` (1)          | `bg-surface-2`                  | `bg-white/40`                        | a translucent lift has no meaning on white  |
| `bg-white/20` (1)          | `bg-surface-2`                  | `bg-white/20`                        |                                             |
| `bg-white/5` (8)           | `bg-surface-2`                  | `bg-white/5`                         |                                             |
| `border-white/60` (3)      | `border-border-strong`          | `border-band-border-strong`          | 3.74 / 4.59 — meets 1.4.11 on every surface |
| `border-white/25` (3)      | **`border-border-strong`**      | **`border-band-border-strong`**      | **all 3 are control edges** — see below     |
| `border-white/10` (3)      | `border-border`                 | `border-band-border`                 | decorative — all 3 are dividers, verified   |
| `placeholder-white/30` (4) | `placeholder-foreground-subtle` | `placeholder-band-foreground-subtle` | placeholders are text: 4.5:1 applies        |
| `outline-white` (3)        | `outline-brand`                 | `outline-band-brand`                 | focus rings: 6.04 / 7.94                    |

**Why `border-white/25` is not decorative.** The previous revision mapped it to `border-border`
(**1.24:1** on white) / `border-band-border` (**1.29:1** on navy-900, 1.25 on navy-950) and called
it decorative. All **3** occurrences are the **resting border of an outline (ghost) CTA button** —
the only visible edge of an interactive control, so WCAG 1.4.11's 3:1 applies and both prescribed
values erase the button. The document already knew this: the _hover_ state of the same three
elements (`border-white/60`, the row above) maps to `border-*-strong` at 3.74 / 4.59. Hover and
rest need the **same** floor. (Round-2 finding R2-4.)

| #   | File:line                                                           | Context                             | Resting → hover                                                 |
| --- | ------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| 1   | `src/lib/components/home/HeroSection.svelte:71`                     | **BAND** (scrim `:35`, R-SCRIM)     | `border-band-border-strong` → `hover:border-band-border-strong` |
| 2   | `src/routes/contact-us/+page.svelte:203`                            | LIGHT (success panel, `bg-brand/5`) | `border-border-strong` → `hover:border-border-strong`           |
| 3   | `src/routes/programs/ai-entrepreneurship-bootcamp/+page.svelte:433` | LIGHT                               | `border-border-strong` → `hover:border-border-strong`           |

Each of those three lines also carries `text-white`, `hover:bg-white/5` and `outline-white` in the
same `class` attribute — apply §3.3, §3.4 and (for #1) R-SCRIM to them in the same edit. Because
rest and hover now resolve to the same token, the `hover:border-*` utility becomes a no-op: keep it
(it documents intent and survives a future value split) — do **not** delete it.

The same carve-out would apply to `border-white/10`, but all 3 of its sites are dividers, not
controls (`home/FeaturedSection:33`, `layout/Header:379`, `about/HeroSection:68` — each a
`border-t` / `border-l` rule), so that row stands as written.

`bg-white` and `border-white` with **no** modifier have **0 occurrences** in the tree (the previous
revision listed 4 and 6). If one appears, it is `bg-surface-0` / `border-foreground` on LIGHT and
`bg-band-foreground` / `border-band-foreground` on BAND.

#### 3.4a Arbitrary-opacity forms (18 bracketed + 2 plain-alpha = 20 occurrences / 9 files)

`grep -rhoE '(text|bg|border|…)-[a-z0-9-]+/\[[0-9.]+\]' src --include='*.svelte'` finds 18 utilities
written with a bracketed alpha. None of them was counted in the bare-number rows above (those
reconcile exactly without them), and none had a row anywhere. All eleven white-family ones are
dark-ground "lift" effects that are literally invisible on `#FFFFFF`. (Review finding 10.) The last
two rows use a **plain** alpha (`/15`), not a bracketed one, and were pulled in here from §3.7 in
round 2 — see the note under the table.

| Found                             | Count | Where                                                                 | LIGHT                | BAND                                         |
| --------------------------------- | ----- | --------------------------------------------------------------------- | -------------------- | -------------------------------------------- |
| `bg-white/[0.02]`                 | 1     | `about/DecabFramework`                                                | `bg-surface-2`       | unchanged (1.05:1, decorative lift)          |
| `bg-white/[0.04]`                 | 2     | `about/DecabFramework`, `home/ImpactStats`                            | `bg-surface-2`       | unchanged (1.11:1)                           |
| `bg-white/[0.06]`                 | 1     | `home/ProgramsShowcase`                                               | `bg-surface-2`       | unchanged (1.17:1)                           |
| `border-white/[0.06]`             | 4     | `about/DecabFramework`, `home/StudentHighlights` ×2, `layout/Header`  | `border-border`      | `border-band-border`                         |
| `border-white/[0.08]`             | 2     | `about/Outcomes`, `layout/Header`                                     | `border-border`      | `border-band-border`                         |
| `bg-foreground/[0.02]`            | 4     | `programs/ev-challenge/WorkshopToRoles.svelte:273,292,359,383`        | `bg-surface-2`       | ~~`bg-white/[0.03]`~~ **EV → LIGHT**         |
| `border-brand/[0.04\|0.06\|0.08]` | 3     | `home/ContactSection`                                                 | `border-brand/20`    | `border-band-brand/20`                       |
| `text-white/[0.05]`               | 1     | `home/StudentHighlights`                                              | **STOP — §8 item 6** | —                                            |
| `bg-foreground/15`                | 1     | `programs/ev-challenge/+page.svelte:429` (`<div class="h-px w-6 …">`) | `bg-border`          | ~~`bg-band-border`~~ **EV → LIGHT**          |
| `border-foreground/15`            | 1     | `programs/ev-challenge/+page.svelte:181` (`border-t`)                 | `border-border`      | `border-band-border` — **BAND** (hero scrim) |

**The two `/15` rows are here, not in §3.7.** §3.7's `bg-foreground` / `border-foreground` rows are
**bare-utility** rows and there are **zero** bare occurrences of either utility in the public tree —
all six sites carry an alpha, and all six are inside the EV files. **EV amendment:** five of the six are LIGHT now (`WorkshopToRoles` ×4 → `hover:bg-surface-1` on a `bg-surface-0` card, and the Past-Seasons rule → `bg-border`); only `+page.svelte:181` is still BAND, because it sits inside the hero photo scrim. Following §3.7's
BAND cells would give `bg-band-foreground` / `border-band-foreground` = **solid `--white`**: an
opaque white card fill under white body copy (**1.00:1**) and a solid-white 1px rule at **16.52:1**
where a 1.01:1 hairline was — brighter even than the 13.34:1 `border-border` artefact §3.7's own
`border-border` row calls out. `--band-border` (navy-700, 1.29:1 on the band) is the intended
weight. (Round-2 findings R2-5, R2-7.)

`border-brand/[0.04]` measures **1.06:1** on white — not a hairline, an absence. `border-brand/20`
is 1.35:1, the same decorative weight as `--border` (1.24:1), and keeps the brand tint the component
was reaching for. It is decorative, so 1.4.11 does not apply; if the element is an interactive
control, use `border-border-strong` instead.

`text-white/[0.05]` is a 5 %-white watermark — a device that has no light-ground equivalent at all.
Escalate it, do not substitute.

#### 3.4b `placeholder:` written with a semantic token — **new**

§3.4's sentence "placeholders are text: 4.5:1 applies" only ever had a row for
`placeholder-white/30`. The one placeholder written with a semantic token fell through into §3.7's
no-edit bucket. (Review finding 15.)

| Found                            | Count | Where                      | LIGHT                                | BAND                                      |
| -------------------------------- | ----- | -------------------------- | ------------------------------------ | ----------------------------------------- |
| `placeholder:text-foreground/30` | 1     | `NewsletterForm.svelte:54` | `placeholder:text-foreground-subtle` | `placeholder:text-band-foreground-subtle` |

That input is `bg-card-bg` (= mist), so the current value measures **1.93:1**. It was also failing
before the inversion (`#f0f1f3` at 30 % on `#181b21`), so this is a pre-existing bug the swap does
not fix — fix it in the applier wave. `--foreground-subtle` on mist is **5.49:1**.

**Rule**: if the border is the edge of an **interactive control** (input, select, textarea, button,
a focusable card), use `border-border-strong` / `border-band-border-strong` — WCAG 1.4.11 requires
3:1 and `--border` is 1.24:1. If it is a divider or a decorative frame, `border-border` is correct.

### 3.5 Photo scrims — `from-black` / `via-black` / `to-black` / `bg-black` / `bg-background/N`

See §5 for the full rule, and **§3.0 R-SCRIM** for the text that sits on these. Mechanical
replacements:

| Found                  | Replacement (both contexts) | Notes                                                                |
| ---------------------- | --------------------------- | -------------------------------------------------------------------- |
| `from-black/85` (2)    | `from-overlay/95`           |                                                                      |
| `from-black/80` (2)    | `from-overlay/90`           |                                                                      |
| `from-black/70` (1)    | `from-overlay/85`           |                                                                      |
| `from-black/60` (1)    | `from-overlay/80`           |                                                                      |
| `via-black/55` (2)     | `via-overlay/70`            | this stop usually sits under the text — /70 is the normal-text floor |
| `via-black/40` (1)     | `via-overlay/70`            | **raise it**; /40 measured 4.28:1 (large-text only)                  |
| `via-black/20` (2)     | `via-overlay/35`            | decorative stop, no text                                             |
| `to-black/20` (2)      | `to-overlay/35`             | decorative stop, no text                                             |
| `bg-black/80` (2)      | `bg-overlay/85`             |                                                                      |
| `bg-black/60` (2)      | `bg-overlay/75`             |                                                                      |
| `bg-black/50` (1)      | `bg-overlay/70`             |                                                                      |
| `bg-black/40` (1)      | `bg-overlay/70`             | **raise it** if any text sits on it                                  |
| `to-transparent` (36)  | `to-transparent`            | unchanged — but the transparent end must not sit under text          |
| `via-transparent` (1)  | `via-transparent`           | unchanged                                                            |
| `bg-background/80` (2) | `bg-overlay/85`             | **was in no row at all** — see below                                 |

**`bg-background/80` — the two scrims that fell through the gap.** §3.7's row is explicitly
"`bg-background` (**bare**)" with the bare-only count of 14, and this section previously covered
only the `*-black` family, so these 2 matched nothing and §8 would have stopped the applier at
both. They are photo scrims: `src/routes/programs/ithaca-dialogues/+page.svelte:529` and
`src/routes/programs/ai-entrepreneurship-bootcamp/+page.svelte:495`, each an
`<div class="absolute inset-0 bg-background/80">` over a full-bleed `<enhanced:img>`. Left alone
`--background` is now `#FFFFFF`, so each becomes an **80 % white veil** over the photograph with
white/ink text on top. Raise to `bg-overlay/85` (the `bg-black/80` mapping; /80 navy-950 is 10.02:1
for white over a blown highlight, /85 is 12.04 and matches the flat-scrim canon in §5). The text on
them is **R-SCRIM**, not §3.3's LIGHT column — including
`ithaca-dialogues:532`'s `text-foreground`, which is the only bare `text-foreground` on a scrim in
the tree. (Round-2 finding R2-9.)

The reason the counts do not collide: `grep -rnoP 'bg-background(/[0-9]+)?'` = **16**, bare = **14**,
alpha = **2**. §1.4's "`bg-` 16" and §3.7's "(bare) 14" are _both_ correct; these 2 are the
difference.

Never emit `black` on a light page: a neutral-black scrim reads as a hole punched in the layout.
`--overlay` is `navy-950`, which is the same family as the bands and is what §8.2 asks for.

**SVG presentation attributes on a scrim.** `stroke="white"` / `fill="white"` written as an SVG
_attribute_ (not a class) inside an element whose background maps to `bg-overlay/*` **stays
`white`** — it is BAND context per R-OVERLAY-4. Two sites, both carousel chevrons on
`bg-black/60 … hover:bg-black/80` buttons: `about/Highlights.svelte:222` and `:237`. No edit
needed; recorded so you do not stop on them. (Review finding 20 — these are the _only_ two colour
presentation attributes in the public tree.)

### 3.6 Default-palette status utilities — **5 public, 42 admin-deferred**

Every one of these is a dark-mode choice that fails on a light ground. But 42 of the 47 live in
`src/routes/admin/**`, which §3.2 defers. **Apply the 5 public ones only.** (Review finding 17 — the
previous revision's "~40 occurrences" heading matched neither the 47 total nor the 5 in scope, and
several of its rows are 100 % admin.)

#### Apply now — 5 sites

| File:line                                 | Found            | LIGHT replacement | Ratio after | Was on white |
| ----------------------------------------- | ---------------- | ----------------- | ----------- | ------------ |
| `lib/components/NewsletterForm.svelte:65` | `text-green-400` | `text-success`    | 5.42        | 1.78         |
| `lib/components/NewsletterForm.svelte:65` | `text-red-400`   | `text-danger`     | 6.54        | 2.89         |
| `routes/contact-us/+page.svelte:217`      | `text-red-400`   | `text-danger`     | 6.54        | 2.89         |
| `routes/contact-us/+page.svelte:232`      | `text-red-400`   | `text-danger`     | 6.54        | 2.89         |
| `routes/contact-us/+page.svelte:295`      | `text-red-400`   | `text-danger`     | 6.54        | 2.89         |

All five are LIGHT. If any of these components is ever hosted in a band, the BAND column below
applies instead.

#### Deferred with the admin panel — 42 sites, **DO NOT APPLY THIS ROUND**

| Found               | Total | Public | LIGHT replacement       | BAND replacement             | Contrast after (light / band)   |
| ------------------- | ----- | ------ | ----------------------- | ---------------------------- | ------------------------------- |
| `text-red-400`      | 11    | 4      | `text-danger`           | `text-band-danger`           | 6.54 / 8.70 (was 2.89 on white) |
| `text-red-300`      | 8     | 0      | `text-danger`           | `text-band-danger`           | 6.54 / 8.70                     |
| `bg-red-500/10`     | 5     | 0      | `bg-danger-bg`          | `bg-danger/20`               | ink 15.51                       |
| `bg-red-500/15`     | 1     | 0      | `bg-danger-bg`          | `bg-danger/20`               |                                 |
| `border-red-500/40` | 5     | 0      | `border-danger/50`      | `border-band-danger/50`      |                                 |
| `text-green-300`    | 4     | 0      | `text-success`          | `text-band-success`          | 5.42 / 11.76                    |
| `text-green-400`    | 1     | 1      | `text-success`          | `text-band-success`          | 5.42 / 11.76                    |
| `bg-green-500/15`   | 4     | 0      | `bg-success-bg`         | `bg-success/20`              | ink 15.92                       |
| `text-yellow-300`   | 1     | 0      | `text-warning`          | `text-band-warning`          | 6.33 / 8.15                     |
| `bg-yellow-500/15`  | 1     | 0      | `bg-warning-bg`         | `bg-warning/20`              | ink 16.08                       |
| `text-blue-300`     | 1     | 0      | `text-info`             | `text-band-info`             | 8.61 / 9.53                     |
| `bg-blue-500/15`    | 1     | 0      | `bg-info-bg`            | `bg-info/20`                 | ink 15.31                       |
| `text-gray-300`     | 2     | 0      | `text-foreground-muted` | `text-band-foreground-muted` | 10.31 / 10.37                   |
| `bg-gray-500/15`    | 2     | 0      | `bg-surface-3`          | `bg-band-soft`               | neutral chip fill               |

47 total, 5 public, 42 deferred.

### 3.7 Semantic-token utilities — **no edit ON LIGHT; every one needs a swap inside a BAND**

This section used to be titled "These need no edit". It was the only lookup section without a BAND
column, and it governs exactly the utilities that fill the one region this document guarantees stays
a navy band — so following it literally left ink on navy at **1.07:1**, teal-700 text at **1.87:1**,
teal-600 focus rings at **2.74:1** (below the 3:1 of WCAG 1.4.11) and `--line` hairlines at
**13.34:1**. (Review findings 1, 2, 5 — all three are this one structural defect.)

**Counts are public-site (`| grep -v /admin/`). §3.0 R-FILL, R-SCRIM and R-OPACITY outrank every row
here.** Each "**N are BAND**" figure below used to sum **two** BAND populations — the three EV files
and the 9 scrim files — and says which contributes what.

> **EV amendment, 2026-09-29 — read this before you trust a count.** The EV half of every "N are
> BAND" figure below is **gone**: those files took the LIGHT column in the conversion. Only the
> scrim contribution survives, and the EV files now contribute to the **scrim** population instead,
> through the three photo scrims listed in §2. The per-row arithmetic has **not** been re-run —
> the counts are a pre-wave census and are kept for provenance — so where a row says "N are BAND,
> M in the three EV files", **subtract M** and read the EV files' non-scrim occurrences as LIGHT.
> The rows where that subtraction takes the BAND figure to zero are marked `EV → LIGHT` inline.

| Utility                    | Count | LIGHT                                                                                                   | BAND                                                                                                                                                                               | Watch for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ----- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg-background` (bare)     | 14    | no edit (`#FFFFFF`)                                                                                     | `bg-band`                                                                                                                                                                          | a `bg-background` panel on a white page is now invisible — it probably wanted `bg-card-bg`. **EV → LIGHT: the 3 EV sites (`EVModel3DSection.svelte:206`, `:307`, `ev-challenge/+page.svelte:146`) took the LIGHT column in the 2026-09-29 conversion — see §3.9a. BAND count for this row is now 0.** The 2 `bg-background/80` sites are **not** in this count: they are photo scrims, §3.5.                                                                                                                                                                                                                                                                          |
| `from/via/to-background`   | 14    | no edit                                                                                                 | `from/via/to-band`, or `…-overlay/N` if it is a photo scrim (§3.5)                                                                                                                 | a fade-to-background over a photo now _brightens_ the photo edge. **EV → the 10 EV stops are scrim gradients, not sections (§3.9a) — they stay `*-overlay/N` under R-SCRIM, so "BAND" here means "scrim", not "navy section".** The other 4 are the mobile-hero scrims at `ai-entrepreneurship-bootcamp:167` and `ithaca-dialogues:202`, 2 stops each — also §3.5.                                                                                                                                                                                                                                                                                                    |
| `text-foreground` (bare)   | 50    | no edit — 17.74 / 15.07 across the ladder                                                               | `text-band-foreground` (16.52)                                                                                                                                                     | ink on navy is 1.07:1. **EV → LIGHT. 27 of the 50 were BAND, 26 of them in the three EV files (10 + 8 + 8); those 26 are LIGHT now except the 3 that sit on an EV photo scrim (§2). What is left is `ithaca-dialogues/+page.svelte:532` plus those 3 — all scrim sites, all R-SCRIM.**                                                                                                                                                                                                                                                                                                                                                                                |
| `text-foreground/N`        | 47    | **R-OPACITY-1** — `/70`+ keep, `/60`–`/65` → `text-foreground-muted`, `/55`− → `text-foreground-subtle` | **R-OPACITY-2** — **every alpha dies.** bare → `-muted`, `/65`− → `-subtle`; on a scrim → R-SCRIM instead                                                                          | these were **not** in any table before and every one of them regressed. **EV → LIGHT. All 32 of the 47 that were BAND were in the three EV files (17 + 11 + 4); they take R-OPACITY-1 now, except the 7 `/80` forms that sit on an EV photo scrim (§2), which are the permitted R-SCRIM alpha.** Note `/70`…`/95` survives on LIGHT and **must not** on BAND — see the §9 gate row.                                                                                                                                                                                                                                                                                   |
| `bg-foreground` (bare)     | **0** | — (0 occurrences; if one appears, paired text is `text-background`, R-FILL)                             | — (0 occurrences)                                                                                                                                                                  | **all 5 `bg-foreground` utilities in the tree carry an alpha and belong to §3.4a.** The previous revision's "5" was the alpha population; following the BAND cell would have turned a 2 %-white decorative lift into an **opaque white card fill** (1.00:1 against its own white body copy).                                                                                                                                                                                                                                                                                                                                                                          |
| `border-foreground` (bare) | **0** | — (0 occurrences)                                                                                       | — (0 occurrences)                                                                                                                                                                  | same: the single `border-foreground/15` site is **§3.4a**. The previous BAND cell (`border-band-foreground`) is solid white at **16.52:1** where a 1.01:1 hairline was. (R2-5, R2-7.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `bg-card-bg`               | 16    | no edit on `surface-0`; **inside a mist band flip to `bg-surface-0`** or it disappears (1.07:1 vs mist) | `bg-band-soft` (1.29 vs band)                                                                                                                                                      | mist on mist is invisible                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `border-border`            | 33    | no edit **if decorative**; a control edge → `border-border-strong` (§3.4 rule)                          | `border-band-border`, control edge → `border-band-border-strong`                                                                                                                   | **EV → LIGHT. 13 of the 33 were BAND, all in the three EV files; only `ev-challenge/+page.svelte:181` (inside the hero scrim) is still BAND. On a band `--line` is a **13.34:1 white hairline** where a subtle divider was meant                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `bg-border`                | 1     | no edit — fine as a divider                                                                             | `bg-band-border`                                                                                                                                                                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `text-brand`               | 18    | no edit — 6.04 on white, 5.63 on mist, 5.13 on surface-4                                                | `text-band-brand` (7.94)                                                                                                                                                           | teal-600 on navy is **2.74** — the number §4 already prints as FAIL. **EV → LIGHT. The 4 that were BAND were all in `WorkshopToRoles.svelte`, which is now LIGHT end to end; **0 are BAND** (`about/Outcomes.svelte:106` is the only `text-brand` in a scrim file and it sits in the light list below the photos, not on one).                                                                                                                                                                                                                                                                                                                                        |
| `text-brand-bright`        | 72    | no edit — 8.83 / 8.23. "Bright" now means higher contrast, not lighter                                  | opaque band → `text-band-brand-strong` (14.00); **on a scrim → `text-band-brand-strong` too** (R-SCRIM — never `text-band-brand`/teal-300, which is 3.32:1 over a blown highlight) | teal-700 on navy is **1.87**. **EV → LIGHT. 25 were BAND: 21 in the three EV files (9 + 8 + 4) — of those, only the 2 on the competition photo scrim (`ev-challenge/+page.svelte:357`, `:369`, post-conversion line numbers) are still BAND — plus 4 on photo scrims: `ProgramsShowcase:79`, `StudentHighlights:105`, `PlaceholderProgram:58`, `PlaceholderProgram:72`. Everything else is LIGHT.                                                                                                                                                                                                                                                                     |
| `outline-brand`            | 53    | no edit — 6.04 / 5.63, passes the 3:1 focus-indicator floor                                             | `outline-band-brand` (7.94)                                                                                                                                                        | a teal-600 focus ring on navy is **2.74**, below 1.4.11. **EV → LIGHT for 3 of 4. 8 were BAND: 4 in the EV files, of which only `ev-challenge/+page.svelte:175` (the hero-scrim CTA) survives; `:369` keeps `outline-band-brand` because it is on the competition scrim. Plus the 4 scrim CTAs (R-FILL rows 3, 6, 9, 13 — `HeroSection:65`, `PlaceholderProgram:85`, `ithaca-dialogues:540`, `ai-entrepreneurship-bootcamp:507`). **Keep `outline-offset-2` on every one** (see R-FILL). A ring drawn with a _negative_ offset over a photo (`ProgramsShowcase:52`) has no measurable ground — leave it `outline-brand` and flag it at review, do not invent a value. |
| `from/via-brand`           | 54    | no edit                                                                                                 | `from/via-band-brand`                                                                                                                                                              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `border-brand`             | 24    | no edit (decorative)                                                                                    | `border-band-brand`                                                                                                                                                                | see §3.4a for the 3 `border-brand/[0.0x]` sites                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `bg-brand`                 | 23    | no edit; paired text per **R-FILL**                                                                     | `bg-band-brand` + `text-band-action-foreground`                                                                                                                                    |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `bg-action`                | 14    | no edit; paired text **must** be `text-action-foreground` (white, 6.04)                                 | `bg-band-action` + `text-band-action-foreground`                                                                                                                                   | teal-600 fill on navy is a 2.74:1 boundary. **EV → LIGHT for row 11.** 5 are BAND: R-FILL row 10 (EV, hero photo scrim) + rows 3, 6, 9, 13 (photo scrims, R-SCRIM).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `bg-action-hover`          | 14    | no edit; contrast improves to 8.83                                                                      | `bg-band-action-hover` + `text-band-action-foreground`                                                                                                                             | never pair white with `bg-band-action-hover`: white on teal-100 is **1.18**. Same 5 BAND sites as the row above — they move together.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### 3.8 three.js material colours (7 occurrences / 3 files)

CSS variables are unreadable from a WebGL material, so these are JS-side constants. (The previous
revision said "5 occurrences / 3 files" and folded the three `EVSceneContents` literals into one
unusable "same three values" row — two of them are grid greys, not brand-derived. Review finding 11.)

**EV → LIGHT.** This table shipped a band column because the EV 3D stretch was going to stay navy.
The 2026-09-29 amendment moved it to the light ladder, so the **Shipped** column below is what is
in the tree; the struck column is what the band-era revision of this section prescribed.

The **hierarchy** is what carries over, not the hues. On navy the cage highlight was the _lightest_
tone and the structural body the darkest; on mist that inverts — the highlight is the _darkest_
teal and the body a mid slate. Ordering is preserved, so the render reads the same way:
**GLOW > BRAND > DIM**, and the ground grid sits below all three.

| File:line                                          | Band-era (struck) | Shipped (light) | Role + contrast on mist                                                                                                                                |
| -------------------------------------------------- | ----------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `programs/ev-challenge/FatLine.svelte:32`          | ~~`'#5FC3C4'`~~   | `'#0B6E70'`     | teal-600 — **default prop value only**; every caller passes `color={line.color}`, so this is a safety net, not a rendered material                     |
| `programs/ev-challenge/trike-geometry.ts:35`       | ~~`'#5FC3C4'`~~   | `'#0B6E70'`     | `BRAND` — teal-600 (`--brand`), the brand line. 5.63:1                                                                                                 |
| `programs/ev-challenge/trike-geometry.ts:36`       | ~~`'#2B4C7E'`~~   | `'#5B6575'`     | `BRAND_DIM` — `--ink-3`, the neutral body. 5.49:1. **Not** `--rule-strong`: over half the DIM lines carry `opacity: 0.3–0.5` and vanish at 3.74        |
| `programs/ev-challenge/trike-geometry.ts:37`       | ~~`'#D9F1F1'`~~   | `'#075355'`     | `BRAND_GLOW` — teal-700 (`--brand-bright`), the cage highlight. 8.23:1, the strongest tone in the scene                                                |
| `programs/ev-challenge/EVSceneContents.svelte:102` | ~~`'#5FC3C4'`~~   | `'#0B6E70'`     | `<T.PointLight>` key light. **Inert** — every material in this scene (Line2, Points, Grid) draws through its own shader and is unlit                   |
| `programs/ev-challenge/EVSceneContents.svelte:115` | ~~`'#14325C'`~~   | `'#E5E7EB'`     | `<Grid cellColor>` — the fine grid. `--line`, 1.15:1: present, not assertive (it was 1.29:1 on navy)                                                   |
| `programs/ev-challenge/EVSceneContents.svelte:118` | ~~`'#7089A8'`~~   | `'#7B8593'`     | `<Grid sectionColor>` — the major grid. `--rule-strong`, 3.48:1. One rung lighter than `BRAND_DIM`, so the floor stays separable from the frame filler |

`EVSceneContents.svelte`'s `PointsMaterial` opacity also moved, `0.2` → `0.45`: teal dust at 0.2
composites to ~1.1:1 on mist and simply is not there.

The `ACCENT*` → `BRAND*` rename this section used to ask for is done. The scene's lights,
environment and tone-mapping were tuned against a near-black page — that retune was §8 human-decision
item 4 and is now **resolved**; see §8.

### 3.9 Colour inside inline `style=` attributes and the EV `bg-background` contradiction — **new**

#### 3.9a `bg-background` inside the EV Challenge stretch (6 rows: **3** bare `bg-background` + **3** gradient attributes carrying 10 stops)

> **EV → LIGHT, 2026-09-29. The contradiction this subsection existed to resolve is gone.** It was
> written because `src/app.css` and §3.1 asserted the EV 3D stretch stayed navy while its section
> wrappers said `bg-background` (now `#FFFFFF`). The owner resolved it the other way: the stretch
> is **light**, `bg-background` is **correct as written**, and `src/app.css`'s `.ev-*` /
> `.dissolve-panel-*` rules were rewritten to light surfaces to match. The **Replacement** column
> below is therefore **struck** except for its three scrim rows, which were always right and are
> what shipped. The Shipped column records the tree as it stands.

`src/app.css` and §3.1 both asserted the whole EV 3D stretch stays an inverted band, yet the section
wrappers are `bg-background` — which now resolves to `#FFFFFF`. Left as "no edit" the section
renders white with semi-transparent navy glass panels and a WebGL grid floating on it; changed to
`bg-band` without the rest of §3.7's BAND column, the two files' **18** bare `text-foreground`
(46 counting the 28 opacity-modified forms) and **17** `text-brand-bright` go to 1.07 / 1.87.
Both halves must land together. (Review finding 9; counts corrected round 2, R2-16/R2-23 — the
previous revision said "16 + 16".)

**This table has 6 rows but they are not 6 `bg-background` utilities.** Three rows are bare
`bg-background` (`EVModel3DSection.svelte:206`, `:307`, `ev-challenge/+page.svelte:146`); the other
three are gradient attributes belonging to §3.7's `from/via/to-background` row, and between them
they carry **10** of that row's 14 stops. §3.7's `bg-background` note therefore says "3", not "6".
(Round-2 findings R2-6, R2-8, R2-23.)

| Pre-wave file:line              | Found                                                                                                          | Band-era replacement (struck)                                                                            | **Shipped**                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `EVModel3DSection.svelte:206`   | `border-t border-border bg-background`                                                                         | ~~`border-t border-band-border bg-band`~~                                                                | `border-t border-border bg-surface-2` (now `:206`)                                                                 |
| `EVModel3DSection.svelte:217`   | `from-background via-background/60 to-background/30` (over an `opacity-40` photo)                              | `from-overlay/95 via-overlay/70 to-overlay/55` — a photo scrim, §3.5 + §5. **Correct; this is shipped.** | unchanged (now `:221`); its wrapper `:213` gained `bg-overlay` so the `opacity-40` composite still has a dark base |
| `EVModel3DSection.svelte:307`   | `border-t border-border bg-background`                                                                         | ~~`border-t border-band-border bg-band`~~                                                                | `relative min-h-[100dvh] … border-t border-border bg-surface-2` (now `:317`)                                       |
| `ev-challenge/+page.svelte:146` | `min-h-screen bg-background` (the page wrapper)                                                                | ~~`min-h-screen bg-band`~~                                                                               | `min-h-screen bg-background` — **no edit**, which is what §3.7's LIGHT column said all along                       |
| `ev-challenge/+page.svelte:161` | `from-background via-background/50 to-transparent` (hero photo scrim)                                          | `from-overlay/95 via-overlay/70 to-transparent`. **Correct; this is shipped.**                           | unchanged (`:161`)                                                                                                 |
| `ev-challenge/+page.svelte:342` | `from-background via-background/80 to-background/40 md:from-background md:via-background/80 md:to-transparent` | `from-overlay/95 via-overlay/70 to-overlay/55 md:…`. **Correct; this is shipped.**                       | unchanged (now `:344`)                                                                                             |

Then apply §3.7's **LIGHT** column to the text in those two files, plus `WorkshopToRoles.svelte` —
except inside the three scrims, where R-SCRIM's three-token set applies. That is the whole
amendment: 3 scrims stay BAND, everything else in the EV stretch is LIGHT.

#### 3.9b Inline `style=` colour literals (3 attributes / 6 values)

Three `style=` attributes carry `rgba()` built from **deleted** token values — `#111318` (the old
`--background`) and `#3e8fc7` (the old `--brand`). §3.1 covers only the `bg-[#111318]` class form
and §6's color-mix rewrite was scoped to `app.css`, so these had no row. They also cannot be fixed
in place: an inline style cannot carry an `@supports` guard, so writing `color-mix()` into the
attribute would reintroduce §1.8's failure on iOS Safari 16.0/16.1 and WeChat X5. (Review
finding 12.)

`src/app.css` now ships three guarded classes for exactly these. **The applier's change is
markup-only — delete the colour from `style=` and add the class:**

| File:line                     | Delete from `style=`                                                                                                                    | Add class            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `EVModel3DSection.svelte:327` | `background: radial-gradient(ellipse at center, rgba(17,19,24,0.15), rgba(17,19,24,0.4) 60%)` — **keep `opacity: 0`**, GSAP animates it | `.ev-scene-vignette` |
| `EVModel3DSection.svelte:444` | the whole `linear-gradient(…rgba(62,143,199,0.2\|0.35\|0.2)…)` seam                                                                     | `.ev-seam-line`      |
| `EVModel3DSection.svelte:454` | the whole `radial-gradient(…rgba(62,143,199,0.04)…)` glow                                                                               | `.ev-seam-glow`      |

`grep -rn 'rgba(' src --include='*.svelte'` must return **zero** non-admin hits afterwards.

---

## 4. Contrast — every pair this system depends on

**Method.** WCAG 2.x relative luminance (sRGB, the 0.04045/12.92 piecewise transfer, coefficients
0.2126/0.7152/0.0722). Alpha is composited in gamma-encoded sRGB and **rounded to 8 bits before
measuring**, which is what a browser rasteriser does; that rounding is why e.g. `brand/90` reads
4.88 here and 4.90 under pure float maths. Thresholds: **normal text ≥ 4.5**, **large text ≥ 3**
(≥ 24px, or ≥ 18.66px bold), **UI component boundaries, focus indicators and graphical objects ≥ 3**.
Every number below was recomputed 2026-09-29.

| Pair                                                                    | Ratio                            | Verdict                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| ink on white                                                            | 17.74                            | AAA                                                                                                |
| ink on mist                                                             | 16.53                            | AAA                                                                                                |
| ink on surface-4 (deepest light rung)                                   | 15.07                            | AAA                                                                                                |
| ink-2 on white / mist / surface-4                                       | 10.31 / 9.60 / 8.76              | AAA                                                                                                |
| ink-3 on white / mist / surface-4                                       | 5.89 / 5.49 / 5.01               | AA                                                                                                 |
| teal-600 on white / mist / surface-4                                    | 6.04 / 5.63 / 5.13               | AA                                                                                                 |
| white on teal-600 (`--action` fill)                                     | 6.04                             | AA                                                                                                 |
| **ink on teal-600**                                                     | **2.94**                         | **FAIL** — why `text-white` on `bg-action` must not become `text-foreground`                       |
| **ink on teal-700** (`--action-hover`)                                  | **2.01**                         | **FAIL**                                                                                           |
| teal-700 on white / mist (`--brand-bright`)                             | 8.83 / 8.23                      | AAA                                                                                                |
| white on teal-700 (`--action-hover` fill)                               | 8.83                             | AAA                                                                                                |
| teal-500 on white / mist / surface-4                                    | 4.12 / 3.84 / 3.50               | **large-text & graphics only**                                                                     |
| white on navy-900 / navy-950 / navy-700                                 | 16.52 / 18.47 / 12.80            | AAA                                                                                                |
| white on band-warm `#292823`                                            | 14.77                            | AAA                                                                                                |
| teal-300 on navy-900 / navy-950 / navy-700 / band-warm                  | 7.94 / 8.87 / 6.15 / 7.10        | AAA                                                                                                |
| teal-100 on navy-900 / navy-700 / band-warm                             | 14.00 / 10.85 / 12.52            | AAA                                                                                                |
| **teal-600 on navy-900** (button on band)                               | **2.74**                         | **FAIL** — why the band CTA inverts                                                                |
| **teal-700 on navy-900** (`text-brand-bright` on a band)                | **1.87**                         | **FAIL**                                                                                           |
| **ink on navy-900 / navy-950 / navy-700** (`text-foreground` on a band) | **1.07 / 1.04 / 1.39**           | **FAIL at every alpha** — see the ink-on-band row below                                            |
| **`--line` `#E5E7EB` on navy-900** (`border-border` on a band)          | **13.34**                        | a white hairline where a subtle divider was meant — use `border-band-border` (1.29)                |
| band-ink-2 `#C3CEDC` on navy-900 / navy-700 / band-warm                 | 10.37 / 8.04 / 9.27              | AAA                                                                                                |
| band-ink-3 `#9AACC0` on navy-900 / -950 / -700 / band-warm              | 7.11 / 7.95 / 5.51 / 6.35        | AA–AAA on all four band surfaces                                                                   |
| ink on teal-300 (band CTA label)                                        | 8.52                             | AAA                                                                                                |
| ink on teal-100                                                         | 15.04                            | AAA                                                                                                |
| **white on teal-300** (band CTA label done wrong)                       | **2.08**                         | **FAIL** — see §3.0 R-FILL                                                                         |
| **white on teal-100** (band CTA hover done wrong)                       | **1.18**                         | **FAIL**                                                                                           |
| **amber-500 on white / mist**                                           | **2.03 / 1.89**                  | **FAIL** — the number that justifies §8.2's "amber is never used for body text"                    |
| amber-600 on white / mist (the darkest §8.2 amber)                      | 2.68 / 2.50                      | **FAIL**, even for large text                                                                      |
| amber-500 on navy-900                                                   | 8.15                             | AAA — amber is legible _only_ on navy                                                              |
| ink on amber-500 / amber-200 (badge fills)                              | 8.75 / 14.15                     | AAA                                                                                                |
| amber-800 on white / mist (`--warning`)                                 | 6.33 / 5.90                      | AA                                                                                                 |
| danger `#B3261E` on white / mist / surface-4                            | 6.54 / 6.09 / 5.55               | AA                                                                                                 |
| white on danger fill                                                    | 6.54                             | AA                                                                                                 |
| success `#0F7A3D` on white / mist / surface-4                           | 5.42 / 5.05 / 4.61               | AA                                                                                                 |
| info `#2B4C7E` on white / mist / surface-4                              | 8.61 / 8.03 / 7.32               | AAA                                                                                                |
| ink on danger-tint / success-tint / warning-tint / info-tint            | 15.51 / 15.92 / 16.08 / 15.31    | AAA                                                                                                |
| band-danger / -success / -info / -warning on navy-900                   | 8.70 / 11.76 / 9.53 / 8.15       | AAA                                                                                                |
| **line `#E5E7EB` vs surface-0…-4**                                      | 1.24 / 1.20 / 1.15 / 1.10 / 1.05 | **FAIL as a control edge** — decorative dividers only (exempt from 1.4.11)                         |
| rule-strong `#7B8593` vs surface-0…-4                                   | 3.74 / 3.61 / 3.48 / 3.32 / 3.18 | passes the 3:1 UI-boundary rule on every rung                                                      |
| band-rule-strong `#7089A8` vs navy-900 / -950 / -700 / warm             | 4.59 / 5.13 / 3.56 / 4.10        | passes 3:1 on **all four** band surfaces (the old `#5A7296` was 3.37 / 3.77 / **2.61** / **3.01**) |
| navy-700 vs navy-900 (`--band-border`)                                  | 1.29                             | **FAIL as a control edge** — decorative only                                                       |
| band-warm `#292823` vs navy-900 / navy-950                              | 1.12 / 1.25                      | a warm shift, not a contrast step                                                                  |
| teal-600 focus ring vs white / mist                                     | 6.04 / 5.63                      | passes 3:1                                                                                         |
| teal-300 focus ring vs navy-900 / navy-950                              | 7.94 / 8.87                      | passes 3:1                                                                                         |
| **teal-600 focus ring vs navy-900** (`outline-brand` on a band)         | **2.74**                         | **FAIL 1.4.11** — 4 sites, see §3.7                                                                |

### 4.1 Opacity ramps — the rows the previous revision was missing

**`--brand` (teal-600) text at alpha, on every rung** (the previous revision printed only
white / mist / surface-4, which is why R-OPACITY-3's "`/70` and above on LIGHT" read as unconditional
— round-2 finding R2-11):

| Alpha  | surface-0 | surface-1 | surface-2 (mist) | surface-3 | surface-4 | Verdict                                                   |
| ------ | --------- | --------- | ---------------- | --------- | --------- | --------------------------------------------------------- |
| `/100` | 6.04      | 5.83      | 5.63             | 5.37      | 5.13      | AA — the only **text** form                               |
| `/90`  | **4.88**  | 4.76      | 4.60             | 4.44      | 4.25      | AA on surface-0 only, 0.38 margin                         |
| `/80`  | 3.98      | 3.90      | 3.81             | 3.69      | **3.57**  | large text / graphics — the graphic floor on `surface-4`  |
| `/75`  | 3.61      | 3.53      | 3.45             | 3.34      | 3.24      | graphics                                                  |
| `/70`  | 3.24      | 3.20      | 3.14             | 3.03      | **2.97**  | graphics on `surface-0`…`-3` only; **FAILS on surface-4** |
| `/50`  | 2.22      | 2.19      | 2.17             | 2.14      | 2.09      | decorative only                                           |
| `/20`  | 1.35      | 1.34      | 1.33             | 1.32      | 1.32      | decorative only                                           |

The two live `text-brand/70` sites are lucide `<Icon>`s (graphics) in
`home/ContactSection.svelte:134,142`, whose section maps to `bg-surface-0` — 3.24, so they pass.
§9.2 has the row that keeps them honest.

`src/app.css` used to claim "brand/70 = 3.9:1, brand/50 = 2.8:1" in a comment. Those were the old
cerulean `#3e8fc7` figures, ~20 % high; they are fixed. (Review finding 13.)

**`--foreground` (ink) text at alpha, composited on each rung and measured against that rung:**

| Alpha | surface-0 | surface-1 | surface-2 | surface-3  | surface-4 | Verdict                                                       |
| ----- | --------- | --------- | --------- | ---------- | --------- | ------------------------------------------------------------- |
| `/80` | 9.45      | 9.25      | 8.97      | 8.71       | 8.45      | AAA everywhere                                                |
| `/70` | 6.60      | 6.47      | 6.36      | 6.26       | 6.07      | AA everywhere — **the floor for keeping an opacity modifier** |
| `/60` | 4.68      | 4.60      | 4.57      | **4.4951** | **4.42**  | **fails on surface-3 and -4**                                 |
| `/55` | 3.96      | 3.93      | 3.89      | 3.84       | 3.77      | **FAIL**                                                      |
| `/50` | 3.38      | 3.34      | 3.32      | 3.29       | 3.24      | **FAIL**                                                      |
| `/40` | 2.53      | 2.53      | 2.50      | 2.48       | 2.47      | **FAIL**                                                      |
| `/35` | 2.22      | 2.20      | 2.20      | 2.18       | 2.18      | **FAIL**                                                      |
| `/30` | 1.94      | 1.94      | 1.93      | 1.92       | 1.92      | **FAIL**                                                      |
| `/25` | 1.72      | 1.72      | 1.72      | 1.70       | 1.70      | **FAIL**                                                      |
| `/20` | 1.53      | 1.53      | 1.53      | 1.52       | 1.52      | **FAIL**                                                      |

The previous revision printed only `ink/80 · /70 · /60 on white = 9.45 · 6.60 · 4.68` and called all
three "all AA". That is true on white and false on `surface-3`/`-4`, which are precisely where §3.1
sends `bg-[#0c0e12]` and `bg-[#0a0c10]`. It is **not** true that `--card-bg` fails: card-bg is
`surface-2`, where ink/60 is 4.57 and passes. (Review finding 7; the card-bg half of that claim is
rejected — see §3.0 R-OPACITY-1, which cuts at `/70` anyway so the distinction never reaches an
applier.)

**`--foreground` (ink) at alpha on a BAND** — for completeness, so nobody tries:

| Alpha  | navy-900 | navy-950 | navy-700 |
| ------ | -------- | -------- | -------- |
| `/100` | 1.07     | 1.04     | 1.39     |
| `/60`  | 1.04     | 1.02     | 1.24     |
| `/20`  | 1.01     | 1.01     | 1.08     |

There is no alpha at which an ink-family colour is legible on a band. R-OPACITY-2.

**`white` at alpha on navy-900** (why §3.3's BAND column is a floor, not a ceiling):

| Alpha | `/80` | `/70` | `/60` | `/55` | `/50` | `/45`    | `/40`    | `/30`    |
| ----- | ----- | ----- | ----- | ----- | ----- | -------- | -------- | -------- |
| Ratio | 10.88 | 8.64  | 6.64  | 5.80  | 5.04  | **4.35** | **3.73** | **2.66** |

### 4.2 Photo-scrim measurements (§8.2's "≥ 40%" is not enough)

White text over `navy-950` at alpha _a_, composited on the worst realistic photo regions:

| Scrim alpha         | over mid-grey `#BFBFBF` | over a blown highlight `#FFFFFF` |
| ------------------- | ----------------------- | -------------------------------- |
| 30 %                | 3.38 — large text only  | **1.97 — FAIL**                  |
| 35 %                | 3.81 — large text only  | **2.26 — FAIL**                  |
| 40 % (§8.2's floor) | 4.28 — large text only  | **2.60 — FAIL**                  |
| 55 %                | 6.26 — AA               | 4.10 — large text only           |
| 70 %                | 9.40 — AAA              | 6.90 — AA                        |
| 75 %                | 10.68 — AAA             | 8.31 — AAA                       |
| 85 %                | 13.73 — AAA             | 12.04 — AAA                      |
| 90 %                | 15.47 — AAA             | 14.26 — AAA                      |
| 95 %                | 16.97 — AAA             | 16.42 — AAA                      |

§8.2's 40 % is a minimum **ink coverage**, not a contrast guarantee. The enforced floors are in §5.

**Every band text token on a scrim** — the table above is **white only**, which is why R-OVERLAY-4
used to authorise tokens that fail at its own floors. Same method; `over blown #FFFFFF / over
mid-grey #BFBFBF`:

| Text token on a scrim                           | scrim `/55`     | scrim `/70`     | scrim `/85`   | scrim `/95`   |
| ----------------------------------------------- | --------------- | --------------- | ------------- | ------------- |
| `text-band-foreground` — white `#FFFFFF`        | 4.10 / 6.26     | 6.90 / 9.40     | 12.04 / 13.73 | 16.42 / 16.97 |
| `text-band-foreground/80`                       | 3.25 / 4.69     | 5.12 / 6.71     | 8.35 / 9.33   | 10.85 / 11.18 |
| `text-band-brand-strong` — teal-100 `#D9F1F1`   | 3.47 / 5.30     | 5.85 / 7.97     | 10.20 / 11.64 | 13.92 / 14.39 |
| `text-band-foreground-muted` — ink-2 `#C3CEDC`  | **2.57** / 3.93 | **4.33** / 5.90 | 7.56 / 8.62   | 10.31 / 10.65 |
| `text-band-brand` — teal-300 `#5FC3C4`          | **1.97** / 3.01 | **3.32** / 4.52 | 5.78 / 6.60   | 7.89 / 8.16   |
| `text-band-foreground-subtle` — ink-3 `#9AACC0` | **1.76** / 2.69 | **2.97** / 4.04 | 5.18 / 5.91   | 7.07 / 7.30   |

Read the `/70` and `/55` columns — those are R-OVERLAY-2's two floors. White, `white/80` and
teal-100 clear AA at `/70` and the 3:1 large-text floor at `/55`. **band-ink-2 (4.33), teal-300
(3.32) and band-ink-3 (2.97) do not** — band-ink-3 misses even 3:1. Raising the floor to `/85` per
token would fix it, but it puts the burden of "which gradient stop is under this word" on every
applier, so **§3.0 R-SCRIM takes the other branch and bans those three tokens on a scrim outright.**
The mid-grey column is informational: it is the _better_ case and must never be the one you plan
against. (Round-2 finding R2-2.)

---

## 5. Photo overlays — exact rules

`from-black/80` on a light page is wrong twice over: neutral black is off-palette, and 40–55 %
coverage does not carry normal-size white text (see §4.2).

**R-OVERLAY-1 — colour.** Every scrim uses `--overlay` (= `navy-950`). Never `black`, never
`--band` (too light for a scrim), never a `--foreground`-derived colour.

**R-OVERLAY-2 — the floor at the text region.** The _effective_ alpha of the gradient stop that sits
under the text must be:

- **≥ /70** for normal-size text (< 24px, or < 18.66px bold) → measured 9.40 / 6.90
- **≥ /55** for display text (≥ 24px, or ≥ 18.66px bold) → measured 6.26 / 4.10
- there is no compliant scrim below /55; do not emit one under text.

Both floors are derived for the **three text tokens R-OVERLAY-4 permits** (white, `white/80`,
teal-100). They are **not** valid for `text-band-foreground-muted`, `text-band-brand` or
`text-band-foreground-subtle`, which is why R-OVERLAY-4 forbids those on a scrim rather than giving
them a higher alpha floor. Full per-token table: §4.2.

**R-OVERLAY-3 — the canonical gradients.** Use these verbatim; do not improvise stops.

```html
<!-- Bottom-anchored caption over a photo (the common case) -->
<div class="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/70 to-transparent"></div>

<!-- Same, but the caption is display-size -->
<div class="absolute inset-0 bg-gradient-to-t from-overlay/90 via-overlay/55 to-transparent"></div>

<!-- Side-anchored text (hero, split layout) -->
<div class="absolute inset-0 bg-gradient-to-r from-overlay/90 via-overlay/70 to-overlay/55"></div>

<!-- Flat scrim over a full-bleed hero video/image -->
<div class="absolute inset-0 bg-overlay/70"></div>

<!-- Decorative edge fade with NO text on it -->
<div class="absolute inset-0 bg-gradient-to-t from-overlay/60 to-transparent"></div>
```

The side-anchored gradient used to end at `to-overlay/30`. In a
`from-/90 via-/70 to-/30` the `/70` stop sits at the 50 % mark, so any text box extending past the
horizontal midpoint fell into territory R-OVERLAY-2 forbids — `/30` measures **1.97:1** over a blown
highlight, and the only guard was a prose comment. It now ends at `/55`, the display-text floor
(**4.10:1** worst case), so the whole width is at least compliant for display copy and the `/70`
half still carries normal text. (Review finding 19.)

**R-OVERLAY-4 — text on a scrim is BAND context, and the permitted set is three tokens.** This is
the same rule as **§3.0 R-SCRIM**, which is where the enumerated site list and the precedence order
live; it is restated here because §5 is what you read when you author a _new_ scrim.

- **Text**: `text-band-foreground` (white) · `text-band-foreground/80` (the one muted step) ·
  `text-band-brand-strong` (teal-100, for a brand eyebrow). **Nothing else.**
- **Explicitly banned on a scrim**: `text-band-foreground-muted`, `text-band-foreground-subtle`,
  `text-band-brand` (teal-300) — all three fall below AA at R-OVERLAY-2's own `/70` floor over a
  blown highlight (4.33 / 2.97 / 3.32, §4.2) — and `text-foreground` at **any** alpha (ink on a navy
  scrim is ≤ 1.4:1). Those three band tokens are for **opaque** band surfaces.
- **Fills**: `bg-band-action` / `bg-band-action-hover` carrying `text-band-action-foreground` (ink).
  A `bg-action` (teal-600) button on a scrim is a **2.74:1** boundary and fails 1.4.11 — the four
  sites are R-FILL rows 3, 6, 9, 13.
- **Borders**: a control edge on a scrim is `border-band-border-strong` (4.59), never
  `border-band-border` (1.29). See §3.4's `border-white/25` split.
- SVG `stroke="white"` / `fill="white"` **attributes** on a scrim stay white — §3.5.

Hierarchy on a scrim is made with **size, weight and spacing**, not with a third and fourth grey.
(Round-2 findings R2-1, R2-2, R2-4.)

**R-OVERLAY-5 — `to-transparent` may not sit under text.** It is fine as the far end of a fade. If
the text box overlaps the transparent end, the gradient direction is wrong, not the alpha.

---

## 6. Tokens removed, and what replaced the literals

| Token                                                     | Consumers | Why                                                                                                                                                                            |
| --------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--accent` / `--color-accent`                             | **0**     | Declared in `:root` + aliased in `@theme`, used nowhere in the repo. Its _value_ `#ccdef0` is alive but hardcoded in 12 admin call sites, decoupled from the token (see §3.2). |
| `--accent-hover` / `--color-accent-hover`                 | **0**     | Same.                                                                                                                                                                          |
| `--background-secondary` / `--color-background-secondary` | **0**     | Superseded by `--surface-0`…`--surface-4`. Its old value `#f7f8fa` was already a _light_ colour sitting unused in a dark system.                                               |
| `--spacing-nav` (`@theme`)                                | **0**     | Enabled `pt-nav` / `h-nav`, which nothing used — all 7 call sites already write the arbitrary value `var(--nav-h)`. `--nav-h` itself is **kept**.                              |

Also retired: the three `var()` fallback literals. `var(--card-bg, #1e1e1e)` ×2 in `.skeleton` and
`var(--brand, #3e8fc7)` in `.nav-progress`. The `--card-bg` fallback only ever _worked_ because
`--card-bg` happened to be a dark grey; it is now mist, so the fallback was actively dangerous.
`.skeleton` is admin-only and stays dark via the explicit `--skeleton-base` / `--skeleton-sweep`
tokens, to be retired with the admin rework.

Also rewritten: the `rgba()` literals across **15 rule blocks** (12 distinct selectors plus `:root`:
`--band-warm`, `.mission-aura`, `.dissolve-panel-eng|biz` — each of those two twice, base + `lg` —
`.ev-scene-vignette`, `.ev-seam-line`, `.ev-seam-glow`, `.ev-roles-bg`, `.ev-roles-grid`,
`.ev-ambient-a|b|c|close`) now use `color-mix(in srgb, var(--token) N%, transparent)`: **30 values
in 23 declarations, each behind one of 8 `@supports` guards with a color-mix-free base
declaration** — see §1.8 for the verified inventory. Three of those classes
(`.ev-scene-vignette`, `.ev-seam-line`, `.ev-seam-glow`) were added to absorb the inline `style=`
gradients in `EVModel3DSection.svelte` (§3.9b).

**`.skeleton` is not in that list.** It uses **no** `color-mix()` at all — it is
`linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-sweep) 37%, var(--skeleton-base) 63%)`,
three solid tokens, and it is correctly outside every `@supports` block. The previous revision listed
it among the guarded rules. (Round-2 finding R2-15.)

`src/app.css` after `@theme inline` contains **zero** `rgba()` calls and **zero** `var()` fallbacks.
It contains exactly **three** hex literals outside the palette blocks:

1. `--band-warm: #292823` — deliberate, explained in §1.5 and §1.8: a derived value only reachable
   through `color-mix()` has no value at all on a browser without it, and `--band-warm` is a
   _surface_.
2. `--skeleton-base: #1e1e1e` and 3. `--skeleton-sweep: #2e2e2e` — admin-legacy, introduced by this
   pass to retire the `var(--card-bg, #1e1e1e)` fallbacks (described two paragraphs above), and
   **retired with the admin rework**.

(A comment-stripped scan finds 38 hex literals in the file; 35 are in the §1–§3 palette blocks.
The previous revision said "exactly one", contradicting its own `--skeleton-*` paragraph.
Round-2 findings R2-14, R2-20.)

---

## 7. CJK typography (§8.2) — already shipped, do not re-implement

The rules live in `src/app.css` under `:lang(zh)`. **Do not add per-component Chinese styling.**

**Scoping.** `src/app.html` renders `<html lang="%lang%">` and `src/hooks.server.ts` substitutes the
locale from the URL (no cookie, no header), so every `/zh` page is `:lang(zh)` in the _prerendered_
HTML. `:lang(zh)` is therefore the correct hook: prerender-safe, zero JS, no class plumbing, and it
also catches a `lang="zh"` island inside an English page.

**Cascade.** The `:lang(zh)` rules are deliberately written **outside any `@layer`**. Unlayered
declarations beat layered ones, and Tailwind utilities live in `@layer utilities` — so they win
without `!important`.

| §8.2 rule                                | Implementation                                                                                                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| line-height 1.75                         | `:lang(zh) { line-height: 1.75 }` plus a lift for `.leading-normal`, `.leading-snug`, `.leading-relaxed`, `.leading-loose`. `leading-tight` / `leading-none` / `leading-[1.0x]` are **left alone** — 1.75 is a body rule, not a 72px-display rule.                       |
| no letter-spacing                        | `:lang(zh) { letter-spacing: normal }` plus `:lang(zh) [class*='tracking-'] { letter-spacing: normal }`, which neutralises all 136 tracking utilities — including the 25 `tracking-[0.28em]` eyebrow labels, where Latin tracking on CJK glyphs reads as broken spacing. |
| `text-wrap: balance` OFF for ZH headings | `:lang(zh) h1, :lang(zh) h2, :lang(zh) h3 { text-wrap: normal }`. Balance re-breaks lines to even them out, which fights CJK line-breaking (every glyph is a break opportunity, so "balance" just produces arbitrary breaks).                                            |
| corner brackets 「」                     | `:lang(zh) q { quotes: '「' '」' '『' '』' }`. Copy in `messages/zh.json` already authors them; this stops quoted markup regressing to Latin double quotes.                                                                                                              |

---

## 8. If you hit something not in this table — **STOP**

Do not guess a value. Do not "pick something close". Do not copy a value from a sibling component.

Report it with: the file, the line, the exact literal or utility, and which context it is in (LIGHT
or BAND per §2). The token layer is cheap to extend and impossible to un-guess once 40 components
have absorbed an invented hex.

**Already known to need a human decision** (do not resolve these yourself):

1. ~~**Which sections become inverted navy bands.**~~ **RESOLVED 2026-09-29 — none of them.**
   §3.1's default used to carve out the EV 3D stretch; the owner then chose to convert that too, so
   the public site is light everywhere and navy survives only as the photo-scrim base
   (`--overlay`). §8.1's "photography-led, generous whitespace" is the reasoning of record. The
   `--band-*` set stays in the token layer because the 11 scrim files depend on it.
2. **The homepage hero — layout only.** It is a full-bleed poster with `from-black/*`. §3.5 + §5
   make the scrim correct, but whether the hero stays a full-bleed dark block or becomes a light
   hero with a contained image is a **layout** decision, not a substitution. **The colour is not
   blocked on it**: the hero is a photo with a scrim in every variant under discussion, so
   §3.0 R-SCRIM already fixes `HeroSection:49/:58/:65/:71` as BAND. Do not hold the wave here.
3. **Where amber belongs.** The ramp is defined and measured, and the tree currently has **zero**
   amber utilities. §8.2 lists amber as a palette member without assigning it a role. Season badges
   / registration-status chips are the obvious candidates; nobody has decided.
4. ~~**Threlte scene re-tuning.**~~ **RESOLVED 2026-09-29, with eyes on a render.** §3.8's
   Shipped column carries the values; they were judged against screenshots of the built page at
   nine scroll positions, not derived. Two findings worth keeping: (a) the scene has **no lit
   materials** — `LineMaterial`, `PointsMaterial` and `<Grid>` all draw through their own shaders —
   so the `<T.AmbientLight>` / `<T.PointLight>` rig is inert and no light/environment retune was
   needed or possible; (b) the only value that had to move off its first pick was `BRAND_DIM`,
   because most DIM lines carry `opacity: 0.3–0.5` and a 3.74:1 base disappears at that alpha.
5. **The admin panel** (§3.2, and the 42 deferred status utilities in §3.6) — deferred by
   `docs/DECISIONS.md`, mappings recorded, **not** to be applied in this wave.
6. **`text-white/[0.05]`** in `home/StudentHighlights.svelte` — a 5 %-white watermark. On a light
   ground a 5 %-ink watermark is a different design gesture, not a substitution. Needs the owner.

---

## 9. Verification the applier owes

After the wave, all of these must hold. Run them before opening the PR. **Every rule this document
states has a row here** — a rule an applier can violate silently is not a rule. Two shell variables
make the BAND-scoped rows readable; export them first:

```bash
# ARRAYS, not strings — zsh does not word-split an unquoted "$VAR", so a
# space-separated string here silently becomes one (nonexistent) filename and
# every BAND-scoped row below passes with 0 hits for the wrong reason.
# Arrays + "${X[@]}" behave identically in bash and zsh.

# RETIRED 2026-09-29 (EV amendment). There is no longer a file that is BAND
# end-to-end; §9.3 is struck and this array with it. The two EV files that still
# have BAND regions carry photo scrims and have moved into SCRIM below.
# EV=(src/routes/programs/ev-challenge/+page.svelte
#     src/lib/components/programs/ev-challenge/EVModel3DSection.svelte
#     src/lib/components/programs/ev-challenge/WorkshopToRoles.svelte)

# The 11 files that carry a photo scrim (§2, §3.0 R-SCRIM)
SCRIM=(src/lib/components/home/HeroSection.svelte
       src/lib/components/home/ProgramsShowcase.svelte
       src/lib/components/home/StudentHighlights.svelte
       src/lib/components/about/ProgramsBento.svelte
       src/lib/components/about/Outcomes.svelte
       src/lib/components/about/ConnectCTA.svelte
       src/lib/components/programs/PlaceholderProgram.svelte
       src/routes/programs/ai-entrepreneurship-bootcamp/+page.svelte
       src/routes/programs/ithaca-dialogues/+page.svelte)

# The 2 EV files added by the 2026-09-29 amendment. They are DELIBERATELY NOT in
# SCRIM: every §9.4 row greps a whole file, and these two are scrim only inside
# three regions (§2) and LIGHT everywhere else — so a whole-file `outline-brand`
# or `bg-action` row would fire on their (correct) light CTAs. Use the
# line-scoped rows at the end of §9.4 instead.
EVSCRIM=(src/routes/programs/ev-challenge/+page.svelte
         src/lib/components/programs/ev-challenge/EVModel3DSection.svelte)

# Sanity-check the arrays before you trust a 0: each must print its own count.
for f in "${SCRIM[@]}" "${EVSCRIM[@]}"; do [ -f "$f" ] || echo "MISSING $f"; done
```

**Suffix guards, not `\b`.** Several rows end a token with `([^-a-z]|$)` rather than `\b`. That is
deliberate: `-` is a non-word character, so `grep -E 'text-foreground\b'` **matches
`text-foreground-muted`**, `outline-brand\b` matches `outline-brand-bright`, and
`text-band-brand\b` matches the _permitted_ `text-band-brand-strong`. Do not "simplify" these back
to `\b`.

### 9.1 Residue — the old system must be gone

| Check                                                                                                                                                                            | Expected                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `grep -rE '#(111318\|0e1015\|0d0f14\|0c0e12\|0a0c10)' src --include='*.svelte' \| grep -v /admin/`                                                                               | 0 hits (§3.1)                                                                                                                                                                                          |
| `grep -rn 'rgba(' src --include='*.svelte' \| grep -v /admin/`                                                                                                                   | 0 hits (§3.9b)                                                                                                                                                                                         |
| `grep -rnE '\b(text\|bg\|border\|from\|via\|to\|outline\|ring\|placeholder\|divide\|fill\|stroke\|shadow\|caret\|decoration)-white' src --include='*.svelte' \| grep -v /admin/` | 0 hits except the BAND-context `bg-white/*` and `bg-white/[0.0x]` lifts (§3.4, §3.4a) and the one permitted `text-band-foreground/80` — note that is a `band-` token and does **not** match this regex |
| `grep -rnoE '(fill\|stroke)="[^"]*"' src --include='*.svelte' \| grep -v 'currentColor\|none\|/admin/'`                                                                          | exactly 2 hits, both `stroke="white"` in `about/Highlights.svelte:222,237` (§3.5)                                                                                                                      |
| `grep -rE '(from\|via\|to\|bg)-black/' src --include='*.svelte' \| grep -v /admin/`                                                                                              | 0 hits (§3.5)                                                                                                                                                                                          |
| `grep -rnE 'bg-background/' src --include='*.svelte' \| grep -v /admin/`                                                                                                         | 0 hits — the 2 scrims became `bg-overlay/85` (§3.5, R2-9)                                                                                                                                              |
| `grep -rE 'text-(red\|green\|yellow\|blue\|gray)-[0-9]' src --include='*.svelte' \| grep -v /admin/`                                                                             | 0 hits (§3.6)                                                                                                                                                                                          |

**Row 3 replaces the previous revision's `(text|bg|border|from|via|to)-white` regex**, which could
not match `outline-white` (3 sites) or `placeholder-white/30` (4 sites) — both of which share a line
with a `text-white` today, so the gate would have gone green the moment that `text-white` was fixed,
leaving them unconverted. Its stated exception for `stroke="white"` was also unreachable (that string
contains none of the six prefixes); it is now its own row. (Round-2 findings R2-21, R2-25.)

### 9.2 R-OPACITY — LIGHT

| Check                                                                                                        | Expected                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grep -rE 'text-foreground/(6[0-5]\|[0-5][0-9]\|[0-9])\b' src --include='*.svelte' \| grep -v /admin/`       | 0 hits (**R-OPACITY-1** — `/65` and below must be a solid token)                                                                                                                                                                                                                                                                                        |
| `grep -rnoE 'text-brand(-bright)?/[0-9]+' src --include='*.svelte' \| grep -v /admin/`                       | 2 hits, both `text-brand/70` on a **lucide `<Icon>`** in `home/ContactSection.svelte:134,142`. R-OPACITY-3 permits `/70` **as a graphic** on `surface-0`…`-3` (3.24 → 3.03). That component maps to `bg-surface-0`, so it passes. **Any additional hit, or either of these landing on `bg-surface-4`, is a failure** — the floor on surface-4 is `/80`. |
| `grep -rnoE 'placeholder(:text-foreground\|-foreground)/[0-9]+' src --include='*.svelte' \| grep -v /admin/` | 0 hits (§3.4b — placeholders are text)                                                                                                                                                                                                                                                                                                                  |

### 9.3 ~~R-OPACITY-2 / §3.7 BAND column — the three EV files~~ — **STRUCK 2026-09-29**

This whole subsection existed to police the one whole-file BAND population. **There isn't one any
more** (§2, EV amendment), and every row below greps `"${EV[@]}"`, an array §9's preamble has now
retired — so run as written they all fail with "no such file" and go green for the wrong reason.

The two rows that were not EV-specific are kept live and moved here:

| Check                                                                              | Expected                                                                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `grep -rnE 'bg-band-foreground\|border-band-foreground' src --include='*.svelte'`  | 0 hits — solid white as a **fill or border** is never correct in this wave (§3.7, R2-5)                                         |
| `grep -rn 'band-' src/lib/components/programs/ev-challenge/WorkshopToRoles.svelte` | **0 hits** — this file is LIGHT end to end; it has no photo scrim and no BAND region                                            |
| `grep -nE 'var\(--band' src/app.css`                                               | hits only inside the `:root` / `@theme inline` token layers — **0** inside any `.ev-*` or `.dissolve-panel-*` rule body (§3.9a) |

The historical note is kept because the defect it describes is generic: R-OPACITY-1's regex stops
at `/65`, so **`text-foreground/70` and above inside any BAND region passes it** while measuring
1.05:1 on navy. On the EV page that used to be three sites; today it is covered by §9.4's
scrim rows instead. (Round-2 finding R2-3.)

### 9.4 R-SCRIM — the 9 scrim files, plus the 2 EV scrim files

| Check                                                                                                                 | Expected                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grep -nE 'text-band-foreground-(muted\|subtle)\|text-band-brand([^-]\|$)' "${SCRIM[@]}"`                             | **0 hits** — the three tokens R-SCRIM bans. The `([^-]\|$)` suffix is load-bearing: a bare `\b` after `brand` also matches `text-band-brand-strong`, which is **permitted**. |
| `grep -nE 'text-foreground(/[0-9]+)?([^-a-z/]\|$)' src/routes/programs/ithaca-dialogues/+page.svelte \| grep '^532:'` | 0 hits — `:532` was the one bare `text-foreground` on a scrim; it must now be `text-band-foreground` (the file's other 15 `text-foreground*` are LIGHT and stay)             |
| `grep -nE 'text-band-foreground/(100\|9[0-9]\|8[1-9]\|[0-7]?[0-9])([^0-9]\|$)' "${SCRIM[@]}"`                         | 0 hits — the only permitted alpha on white scrim text is `/80` (5.12 at the `/70` floor)                                                                                     |
| `grep -nE 'border-band-border([^-]\|$)' "${SCRIM[@]}" \| grep -E 'inline-flex\|<button\|<a '`                         | 0 hits — a control edge on a scrim is `border-band-border-strong` (§3.4, R2-4)                                                                                               |
| `grep -nE 'bg-action(-hover)?([^-a-z]\|$)\|outline-brand([^-]\|$)' "${SCRIM[@]}"`                                     | 0 hits — the 4 scrim CTAs take `bg-band-action*` + `outline-band-brand` (R-FILL rows 3, 6, 9, 13)                                                                            |

#### The 2 EV scrim files — line-scoped, because these files are only PARTLY scrim

`"${EVSCRIM[@]}"` is not folded into `"${SCRIM[@]}"` on purpose: every row above greps a whole
file, and these two are BAND only inside three regions (§2) and LIGHT everywhere else — so a
whole-file `outline-brand` / `bg-action` row would fire on their _correct_ light CTAs. The
invariant is a **partition**: every `band-*` utility in these files is inside a scrim, and no
utility inside a scrim is a light one.

| Check                                                                                           | Expected                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grep -n 'band-' "${EVSCRIM[@]}"`                                                               | exactly **15** matching lines (21 utility occurrences — `:175` alone carries 4), all inside the three scrim regions: `+page.svelte` `:166 :170 :175 :181 :184 :187` (hero) and `:349 :352 :357 :362 :369` (competition), `EVModel3DSection.svelte` `:228 :232 :239 :242` (reduced-motion poster). **A hit outside those ranges is the bug this row exists to catch.** |
| `grep -nE 'text-band-foreground-(muted\|subtle)\|text-band-brand([^-]\|$)' "${EVSCRIM[@]}"`     | **0 hits** — same three banned tokens as above                                                                                                                                                                                                                                                                                                                        |
| `grep -nE 'text-band-foreground/(100\|9[0-9]\|8[1-9]\|[0-7]?[0-9])([^0-9]\|$)' "${EVSCRIM[@]}"` | 0 hits — all 8 alpha forms are `/80`                                                                                                                                                                                                                                                                                                                                  |
| `grep -n 'bg-overlay' src/lib/components/programs/ev-challenge/EVModel3DSection.svelte`         | exactly **1** hit, at `:213` — the wrapper the `opacity-40` poster composites against. Removing it silently lightens the photo under a navy scrim (§2)                                                                                                                                                                                                                |
| `grep -rn 'from-overlay' "${EVSCRIM[@]}"`                                                       | exactly **3** hits (`:161`, `:344`, `:221`) — the three scrims. Each must keep its §5 R-OVERLAY alphas                                                                                                                                                                                                                                                                |

### 9.5 R-FILL

| Check                                                                                                                                         | Expected                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grep -rn 'text-white' src --include='*.svelte' \| grep -v /admin/ \| grep -E 'bg-action\|bg-brand'`                                          | 0 hits                                                                                                                                                                                                                      |
| `grep -rnE 'bg-(band-)?action(-hover)?([^-a-z]\|$)' src --include='*.svelte' \| grep -v /admin/ \| grep -vE 'text-(band-)?action-foreground'` | 0 hits — every action fill carries its paired label token                                                                                                                                                                   |
| `grep -rnE 'outline-(brand\|band-brand)' src --include='*.svelte' \| grep -v /admin/ \| grep -v 'outline-offset'`                             | 0 hits — **`--brand` and `--action` are the same colour now** (both `teal-600`), so the ring is legible only via the 2px offset. If this row ever goes non-zero, the fix is to restore the offset, not to recolour. (R2-17) |
| `grep -rnE 'bg-band-action(-hover)?([^-a-z]\|$)' src --include='*.svelte' \| grep -E 'text-band-foreground([^-]\|$)'`                         | 0 hits — white on teal-300 is **2.08**, on teal-100 **1.18**                                                                                                                                                                |

### 9.6 `src/app.css` invariants

`src/app.css` is ~40 % comment, and every one of the round-2 count findings against §1.8 and §6 was
caused by counting **inside** comments (the raw `grep -o 'color-mix(' | wc -l` is 47; the real value
count is 30). So run this, not a bare `grep -c`:

```bash
node -e '
const fs=require("fs");
const raw=fs.readFileSync("src/app.css","utf8");
const s=raw.replace(/\/\*[\s\S]*?\*\//g,"");          // strip comments
const n=(re)=>(s.match(re)||[]).length;
console.log("color-mix(in srgb) values :", n(/color-mix\(in srgb/g), "(expect 30)");
console.log("@supports guards          :", n(/@supports/g),          "(expect 8)");
console.log("rgba( calls               :", n(/rgba\(/g),             "(expect 0)");
console.log("var() fallback literals   :", n(/var\(--[a-z-]+,/g),    "(expect 0)");
console.log("hex literals              :", n(/#[0-9a-fA-F]{3,8}/g),  "(expect 38: 35 palette + band-warm + 2 skeleton)");
// containment: every color-mix value must be inside an @supports block
let depth=0, sup=-1, bad=[];
s.split("\n").forEach((l,i)=>{
  if(/@supports/.test(l)) sup=depth;
  if(/color-mix\(in srgb/.test(l) && sup<0) bad.push(i+1);
  depth += (l.match(/{/g)||[]).length - (l.match(/}/g)||[]).length;
  if(sup>=0 && depth<=sup) sup=-1;
});
console.log("unguarded color-mix lines :", bad.length?bad.join(","):"none (expect none)");
'
```

| Check                                                                 | Expected                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the script above                                                      | 30 / 8 / 0 / 0 / 38 / none. (Those 30 values sit in **23** declarations across **15** rule blocks — §1.8.)                                                                                                                          |
| hex literals outside the §1–§3 palette blocks                         | exactly **3**: `--band-warm`, `--skeleton-base`, `--skeleton-sweep` (§6). `grep -n '#292823\|#1e1e1e\|#2e2e2e' src/app.css` — the only declaration hits are `:238`, `:293`, `:294`.                                                 |
| `awk '/^\.skeleton \{/,/^\}/' src/app.css \| grep -c 'color-mix'`     | **0** — `.skeleton` uses no `color-mix()`; it is three solid tokens and is correctly **outside** every guard. §6 used to list it among the guarded rules. (R2-15)                                                                   |
| `grep -n '3\.37' src/app.css`                                         | exactly **1** hit, at `:146`, in the prose that explains why the rejected `#5A7296` was raised. **0** hits on any declaration line — the `--band-border-strong` comment at `:244` now reads **4.59 / 3.56**. (R2-10, R2-12, R2-18.) |
| every other contrast ratio printed in an `src/app.css` comment        | matches §4 — all 30 were recomputed; the last stale one was the `3.37` above                                                                                                                                                        |
| `grep -n 'outline-offset' src/app.css` + the `--action` comment block | the `--brand`/`--action` collapse note is present next to `--action` (R2-17)                                                                                                                                                        |

### 9.7 Scope and build

| Check                                                     | Expected                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `git diff --name-only \| grep '^src/routes/admin/'`       | **0 files** — admin is §3.2/§3.6-deferred (scope box at the top, R2-22) |
| `npm run check` + `npm run lint` + `npm run build`        | green                                                                   |
| axe / Playwright a11y smoke (`.github/workflows` PR gate) | 0 colour-contrast violations                                            |
