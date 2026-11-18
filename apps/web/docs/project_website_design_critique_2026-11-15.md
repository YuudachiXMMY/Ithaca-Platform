# Design Critique: ithacateens.com homepage (2026-11-15)

Scope: live English homepage, reviewed at a narrow desktop width (about 1024px) and at 375×812 mobile. Mobile findings rest on measured layout plus partial captures, not a physical device. /contact-us and /zh/ were read for the conversion path only.

## Overall impression

Calm, premium, credible: restrained teal and navy palette, real student photography, named evidence. The main weakness is sequencing. The first four screens are a poem and abstract principles; the offer (Academics, Programs) and the proof (AIEC Grand Prize, Princeton) arrive late and carry the least visual weight.

## First impression

- The eye lands on the Cavafy quote (51px, white on a dark lake photograph). It explains the name but not what Ithaca is, whom it serves, or where.
- The only descriptor, "Family Academy", sits inside a 48px logo image and is unreadable.
- The hero image contains no students. Purpose becomes clear only at The Journey, around the fourth screen on desktop.

## Usability

| Finding                                                                                                                                                                       | Severity | Recommendation                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero has no positioning statement                                                                                                                                             | Critical | Lead with one line stating offer, audience, and location; keep the Cavafy line as a secondary element                                                |
| Offer and proof sit below abstract content. Mission + Approach take 2,161px on mobile (2.7 screens); full page is 9,939px (about 12 screens)                                  | Critical | Reorder: Hero, Journey, Academics + Programs, Results, condensed Approach, Highlights, Contact                                                       |
| Language prompt stays fixed over content while scrolling until dismissed; it covered the mission headline, a pillar heading, Journey step 03, and the University Support card | Moderate | Use a slim bar above the header, or dismiss on first scroll                                                                                          |
| Three conversion labels, two destinations: header "Admissions" (/admissions); "Get in touch" and "Contact Us" (/contact-us). /contact-us does not explain the difference      | Moderate | One primary action label everywhere, e.g. "Book a free consultation", matching the 20 to 30 minute consultation the closing section already promises |
| Counts the page does not support: "View all five tracks" above four cards (IB is named in the Journey text but has no card); "7 Programs" beside four program cards           | Moderate | Add the IB card; link the stat to /programs or label the four cards as flagship programs                                                             |
| WeChat appears only in the footer; the closing contact block shows address, phone, email                                                                                      | Moderate | Add the QR code to the Get in Touch block                                                                                                            |
| Highlight card descriptions are truncated with ellipses and cannot be expanded                                                                                                | Minor    | Cut copy to fit, or link each card to its News entry                                                                                                 |
| Inquiry form marks "Student's grade" as required inside a block titled optional                                                                                               | Minor    | Make it optional or move it to the main fields                                                                                                       |
| Contact row breaks mid-value at narrow desktop widths (phone number, postal code)                                                                                             | Minor    | `white-space: nowrap` on phone and postal code                                                                                                       |

## Visual hierarchy

- First: the quote. Second: the mission H1 at 61px, larger than the hero text. Two consecutive hero-scale statements compete, and neither is the offer.
- Flow runs abstract to concrete. A parent evaluating a provider needs the reverse.
- Emphasis is inverted relative to persuasive value. Results has an 11px heading and one line of text (279px tall on mobile). The generic stats block gets a 36px heading and large numerals. The Journey 01/02/03, the clearest explanation of the product model, also has an 11px heading.
- Whitespace is generous and consistent; in the Approach section it becomes length without information.

## Consistency

| Element         | Issue                                                                                                                                                                                                         | Recommendation                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Section headers | Three patterns: eyebrow + large heading (Mission); eyebrow alone as an 11px H2 (The Journey, Success Stories); large heading without eyebrow (Academics, Our Programs). Alignment alternates left and centred | One header component, one alignment                                 |
| Type scale      | 15 sizes in use (9 to 60px); section headings at 24, 30, 36, 44px                                                                                                                                             | About 8 steps; one size for section H2                              |
| Monospace       | Eyebrows and stat numerals use the `ui-monospace` system stack, so the typeface changes per operating system                                                                                                  | Load one mono face, or set numerals in Manrope with tabular figures |
| Card imagery    | Two cards use screenshots (AI Entrepreneurship Bootcamp: a slide; Hands-On Innovation: a web page). Text in the image collides with the overlaid title                                                        | Replace with photographs                                            |
| Program naming  | "Ithaca Dialogue" on the card, /programs/ithaca-dialogues in the URL                                                                                                                                          | Pick one form                                                       |
| Logo            | 96×96 raster shown at 48px with the wordmark baked in                                                                                                                                                         | SVG mark with live text lockup                                      |

## Accessibility

- Contrast: text on solid backgrounds measured at 4.6:1 or better throughout. Text over photographs depends on overlays and fails in practice on the two screenshot-based cards.
- Touch targets (mobile): inline links are 20px tall, footer links 17px, legal links 16px, below the 24px WCAG 2.2 minimum. Menu button is 36×36. Hero buttons are 48px.
- Readability: 29 text elements in the main content are under 12px. Eyebrows are 11px uppercase mono; card labels 9 to 10px; highlight descriptions 11px. Body text is 16px.
- Forms: newsletter email field has a placeholder but no label or aria-label.
- Structure: skip link, `lang`, single H1, descriptive alt text, reduced-motion rules, titled Vimeo iframe are all present. Hero quote is marked up as paragraphs, not a blockquote; one empty untitled iframe exists.

## What works well

- Palette and type pairing (Manrope + Inter) are disciplined and read as institutional.
- Evidence is specific and named: Hinton lecture, Honda plant, Sedra Student Design Centre, Dr. Reza Moridi, AIEC 2026.
- The Journey (Academic, Projects, Research) explains the product model in one row.
- Hero buttons are full width, 48px, and inside the first screen on mobile; no horizontal overflow at 375px.
- Accessibility foundations are in place, so remaining work is sizing and labelling.

## Priority recommendations

1. Rewrite the first screen: one-line positioning headline, the Cavafy line as a kicker, a hero image with students, fold Mission into it.
2. Reorder the page: Journey directly after the hero, then Academics and Programs, then Results; compress Approach to one three-column row.
3. Give Results real weight: merge with the stats block and the Moridi video into one evidence section with named outcomes.
4. Unify the conversion path: one primary label and destination, WeChat QR in the closing block.
5. Raise the accessibility floor: 12px minimum text, 44px tap height for mobile links, labelled newsletter field, photographs instead of screenshots, non-overlay language prompt.
