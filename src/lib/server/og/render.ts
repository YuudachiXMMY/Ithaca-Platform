import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import type { Locale } from '$lib/content/types';
import type { OgCard } from '$lib/og/cards';
import { fontBytes, fontFamilyFor, fontsFor } from './fonts';

/**
 * The three Open Graph card templates — `prd.md` R-SEO-2.
 *
 * ## The constraint that shapes every number below
 *
 * WeChat is this site's primary arrival path, and WeChat crops a shared thumbnail to a **centre
 * square**. On a 1200×630 card that square is `x ∈ [285, 915]` — the outer 285 px on each side is
 * thrown away, while the full height survives. A card whose headline runs edge to edge therefore
 * loses both of its ends in the preview most visitors actually see.
 *
 * So the safe area is not a guideline here, it is the layout: the content column is
 * `CONTENT_WIDTH` (620 px) wide and centred, i.e. `x ∈ [290, 910]`, five pixels inside the crop on
 * each side. Everything that carries meaning — lockup, eyebrow, headline, rule, domain — lives in
 * that column and is centre-aligned. Only the full-bleed gradient rule and the bottom band extend
 * past it, and both are horizontal bars that read identically at any width.
 *
 * ## Why satori + resvg and not a headless browser
 *
 * These render at BUILD time, once per page per locale (26 files today). satori is a layout engine
 * with no browser attached; resvg rasterizes its SVG. Total is a few seconds, versus launching
 * Chromium 26 times.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** The centre 1:1 crop WeChat keeps. Exported so the tests can state the number they assert on. */
export const OG_SAFE_WIDTH = OG_HEIGHT;
/** Content column width. Deliberately 10 px narrower than the safe square, not wider. */
const CONTENT_WIDTH = 620;
const SIDE_PADDING = (OG_WIDTH - CONTENT_WIDTH) / 2;

// docs/DESIGN-TOKENS.md §1.1 — the §8.2 light palette, by value. Not `var(--ink)`: satori resolves
// no cascade and has no stylesheet, so a CSS variable here would silently compute to nothing.
const INK = '#111827'; // --ink
const INK_2 = '#374151'; // --ink-2
const INK_3 = '#5B6575'; // --ink-3
const TEAL_600 = '#0B6E70'; // --teal-600, the only teal that carries text on white
const TEAL_500 = '#0F8B8D'; // --teal-500, graphics only
const NAVY_900 = '#0B1F3A'; // --navy-900
const AMBER_500 = '#F5A623'; // --amber-500
const WHITE = '#FFFFFF';
const MIST = '#F5F7FA'; // --mist

/**
 * Minimal satori element. satori accepts React's element SHAPE, not React itself, so the tree is
 * built as plain objects — no JSX pipeline, no `react` dependency for 26 build-time PNGs.
 */
type Node = {
	type: string;
	props: { style?: Record<string, unknown>; children?: Node | Node[] | string };
};

const el = (
	style: Record<string, unknown>,
	children?: Node | Node[] | string,
	type = 'div'
): Node => ({ type, props: { style, children } });

export interface RenderOgOptions {
	card: OgCard;
	locale: Locale;
	/** Brand name, already localized — drawn as the lockup and as the home headline. */
	brand: string;
	/** Bare host, e.g. `ithacateens.com`. Not a message: a domain is not translated. */
	domain: string;
}

export interface RenderedOg {
	png: Buffer;
	/** Bytes of font data this render loaded — the CJK subset cost, measured. */
	fontBytes: number;
}

/**
 * Render one card to PNG.
 *
 * Every string is resolved through Paraglide with an explicit `{ locale }`: this runs during
 * prerender, outside any request, so `getLocale()` would report the build's base locale for the
 * Chinese cards too.
 */
export async function renderOgCard({
	card,
	locale,
	brand,
	domain
}: RenderOgOptions): Promise<RenderedOg> {
	const eyebrow = card.eyebrow({}, { locale });
	const title = card.title({}, { locale });

	// The exact glyph set this card needs, and nothing else — see fonts.ts.
	const fonts = fontsFor(`${brand}${eyebrow}${title}${domain}`, [400, 700]);
	const fontFamily = fontFamilyFor(fonts);

	const svg = await satori(layout({ card, locale, brand, domain, eyebrow, title, fontFamily }), {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts
	});

	// satori embeds glyphs as paths (`embedFont` defaults to true), so resvg needs no font access
	// of its own. Disabling system fonts makes the output byte-identical on any machine.
	const png = new Resvg(svg, {
		fitTo: { mode: 'width', value: OG_WIDTH },
		font: { loadSystemFonts: false }
	})
		.render()
		.asPng();

	return { png, fontBytes: fontBytes(fonts) };
}

function layout(input: {
	card: OgCard;
	locale: Locale;
	brand: string;
	domain: string;
	eyebrow: string;
	title: string;
	fontFamily: string;
}): Node {
	const { card, locale, brand, domain, eyebrow, title, fontFamily } = input;
	const accent = card.template === 'program' ? TEAL_500 : AMBER_500;

	return el(
		{
			width: OG_WIDTH,
			height: OG_HEIGHT,
			display: 'flex',
			flexDirection: 'column',
			backgroundColor: WHITE,
			fontFamily
		},
		[
			// Full-bleed brand rule. Survives the square crop because it is horizontal.
			el({
				display: 'flex',
				width: '100%',
				height: 12,
				backgroundImage: `linear-gradient(90deg, ${NAVY_900} 0%, ${TEAL_600} 55%, ${AMBER_500} 100%)`
			}),
			el(
				{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					flexGrow: 1,
					width: '100%',
					paddingLeft: SIDE_PADDING,
					paddingRight: SIDE_PADDING,
					backgroundColor: card.template === 'home' ? MIST : WHITE
				},
				card.template === 'home'
					? homeBody({ locale, brand, domain, eyebrow, accent })
					: innerBody({ card, locale, brand, domain, eyebrow, title, accent })
			),
			el({ display: 'flex', width: '100%', height: 16, backgroundColor: NAVY_900 })
		]
	);
}

/** `home` — the brand IS the headline, so there is no lockup line to repeat it. */
function homeBody(input: {
	locale: Locale;
	brand: string;
	domain: string;
	eyebrow: string;
	accent: string;
}): Node[] {
	const { locale, brand, domain, eyebrow, accent } = input;
	return [
		heading(brand, locale, 76),
		rule(accent, 34),
		el(
			{
				display: 'flex',
				marginTop: 30,
				fontSize: 26,
				fontWeight: 400,
				color: INK_2,
				textAlign: 'center',
				lineHeight: 1.4,
				...tracking(locale, 0.01)
			},
			eyebrow
		),
		domainLine(domain, locale, 34)
	];
}

/** `program` and `default` — lockup, eyebrow, headline, rule, domain. */
function innerBody(input: {
	card: OgCard;
	locale: Locale;
	brand: string;
	domain: string;
	eyebrow: string;
	title: string;
	accent: string;
}): Node[] {
	const { card, locale, brand, domain, eyebrow, title, accent } = input;
	return [
		el(
			{
				display: 'flex',
				fontSize: 21,
				fontWeight: 700,
				color: TEAL_600,
				textAlign: 'center',
				...tracking(locale, 0.16)
			},
			locale === 'en' ? brand.toUpperCase() : brand
		),
		// A programme card wears its eyebrow as a chip; a section card sets it as plain text. That
		// is the whole visual difference between the two templates, and it is enough to tell a
		// programme share from a policy share at thumbnail size.
		card.template === 'program'
			? el(
					{
						display: 'flex',
						marginTop: 30,
						paddingTop: 8,
						paddingBottom: 8,
						paddingLeft: 20,
						paddingRight: 20,
						border: `2px solid ${TEAL_500}`,
						fontSize: 21,
						fontWeight: 500,
						color: TEAL_600,
						...tracking(locale, 0.12)
					},
					locale === 'en' ? eyebrow.toUpperCase() : eyebrow
				)
			: el(
					{
						display: 'flex',
						marginTop: 30,
						fontSize: 23,
						fontWeight: 400,
						color: INK_2,
						textAlign: 'center',
						...tracking(locale, 0.02)
					},
					eyebrow
				),
		heading(title, locale, 60, 26),
		rule(accent, 32),
		domainLine(domain, locale, 30)
	];
}

function heading(text: string, locale: Locale, base: number, marginTop = 0): Node {
	return el(
		{
			display: 'flex',
			marginTop,
			fontSize: headingSize(text, base),
			fontWeight: 700,
			color: INK,
			textAlign: 'center',
			lineHeight: 1.14,
			...tracking(locale, -0.01)
		},
		text
	);
}

function rule(color: string, marginTop: number): Node {
	return el({ display: 'flex', marginTop, width: 96, height: 4, backgroundColor: color });
}

function domainLine(domain: string, locale: Locale, marginTop: number): Node {
	return el(
		{
			display: 'flex',
			marginTop,
			fontSize: 20,
			fontWeight: 500,
			color: INK_3,
			...tracking(locale, 0.1)
		},
		domain
	);
}

/**
 * Letter-spacing, suppressed for Chinese.
 *
 * `docs/DECISIONS.md` Q12: the Chinese copy follows CJK typographic convention, and tracked-out
 * Han characters read as a rendering fault, not as emphasis. The site's own type rules say the
 * same. The Latin cards keep their tracking.
 */
function tracking(locale: Locale, em: number): Record<string, unknown> {
	return locale === 'zh' ? {} : { letterSpacing: `${em}em` };
}

/**
 * Pick a headline size that fills the 620 px column without overflowing it.
 *
 * Measured in "units", where a full-width CJK character counts 2 and a Latin one counts 1: at a
 * given size a Han glyph advances ~1em and Outfit averages ~0.5em, so one unit is ~0.5em either
 * way and a single ladder serves both scripts. `1240 / size` units fit on a 620 px line; the
 * ladder keeps every live headline at three lines or fewer.
 *
 * The base sizes are set so the longest headline the site actually has ("Build. Race. Lead." in
 * English, `伊萨卡家族学院` in Chinese) lands ~40 px inside the crop rather than flush against it.
 * The 620 px column already makes the crop SAFE; this makes it look composed.
 *
 * Deliberately not `textOverflow: 'ellipsis'`: a share card that cuts its own headline in half is
 * worse than one set two steps smaller.
 */
function headingSize(text: string, base: number): number {
	const units = [...text].reduce((total, char) => total + (isWide(char) ? 2 : 1), 0);
	const fitsInThreeLines = (size: number) => units <= (1240 / size) * 3;
	for (const size of [base, base - 10, base - 20, base - 28]) {
		if (fitsInThreeLines(size)) return size;
	}
	return base - 28;
}

/** CJK ideographs, kana, Hangul and full-width forms all advance ~1em. */
function isWide(char: string): boolean {
	const cp = char.codePointAt(0) ?? 0;
	return (
		(cp >= 0x1100 && cp <= 0x115f) ||
		(cp >= 0x2e80 && cp <= 0x303e) ||
		(cp >= 0x3041 && cp <= 0x33ff) ||
		(cp >= 0x3400 && cp <= 0x4dbf) ||
		(cp >= 0x4e00 && cp <= 0x9fff) ||
		(cp >= 0xa000 && cp <= 0xa4cf) ||
		(cp >= 0xac00 && cp <= 0xd7a3) ||
		(cp >= 0xf900 && cp <= 0xfaff) ||
		(cp >= 0xfe30 && cp <= 0xfe6f) ||
		(cp >= 0xff00 && cp <= 0xff60) ||
		(cp >= 0xffe0 && cp <= 0xffe6)
	);
}
