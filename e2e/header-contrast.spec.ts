import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * The header is transparent until the visitor scrolls, so its legibility is not a property of the
 * header at all — it is a property of whatever each page happens to render in its first ~130px.
 * Nothing in the suite checked that, and nothing could have: axe reports text-over-image contrast
 * as INCOMPLETE rather than a violation, so `a11y.spec.ts` passed with a perfect score while five
 * nav links on /programs/engineering-projects sat at 1.02:1 — dark ink on a dark photo, invisible.
 *
 * This file measures the rendered pixels. It hides the header's content, screenshots the ground
 * underneath, and compares each piece of chrome against what is actually behind it. Routes come
 * from the sitemap, the same way `smoke.spec.ts` derives its coverage, so a new page is checked the
 * day it exists rather than the day someone remembers to add it here.
 */

/** WCAG 2.x relative luminance. */
function luminance([r, g, b]: number[]): number {
	const f = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: number[], b: number[]): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

const rgb = (css: string) =>
	css
		.match(/\d+(\.\d+)?/g)!
		.slice(0, 3)
		.map(Number);

async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
	const res = await request.get('/sitemap.xml');
	expect(res.status(), '/sitemap.xml must be served').toBe(200);
	const xml = await res.text();
	const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
	const paths = [...new Set(locs)].sort();
	expect(paths.length, 'sitemap must not be empty').toBeGreaterThan(0);
	return paths;
}

type Chrome = { what: string; color: string; box: { x: number; y: number; w: number; h: number } };

/**
 * Every visible piece of header chrome, with its box and computed colour.
 *
 * The selector is deliberately `header a, header button` and not `header nav a`: the language
 * switcher lives in a bare <div>, not a <nav>, and that is exactly how it escaped notice — it was
 * the one control in the bar with no ground awareness of any kind.
 */
async function chromeOf(page: Page): Promise<{ text: Chrome[]; logo: Chrome | null }> {
	return page.evaluate(() => {
		const header = document.querySelector('header');
		if (!header) return { text: [], logo: null };

		const visible = (el: Element) => {
			const r = el.getBoundingClientRect();
			const s = getComputedStyle(el);
			return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.opacity !== '0';
		};
		const rectOf = (el: Element) => {
			const r = el.getBoundingClientRect();
			return { x: r.x, y: r.y, w: r.width, h: r.height };
		};

		const text: Chrome[] = [];
		for (const el of header.querySelectorAll('a, button')) {
			if (!visible(el)) continue;
			const label = (el.textContent ?? '').trim();
			// The logo link has no text of its own; it is checked as an image below. The hamburger
			// has no text either but its icon is painted with `color`, so it is kept by the
			// aria-label branch.
			if (!label) {
				if (!el.hasAttribute('aria-expanded')) continue;
				text.push({ what: 'hamburger', color: getComputedStyle(el).color, box: rectOf(el) });
				continue;
			}
			text.push({
				what: label.replace(/\s+/g, ' ').slice(0, 24),
				color: getComputedStyle(el).color,
				box: rectOf(el)
			});
		}

		const img = header.querySelector('img');
		const logo =
			img && visible(img)
				? { what: img.currentSrc.split('/').pop() ?? '', color: '', box: rectOf(img) }
				: null;

		return { text, logo };
	});
}

/**
 * Mean and 90th-percentile-brightest background inside each box.
 *
 * It hides the header's CONTENT and keeps its decoration, which is the whole subtlety here. The
 * ground a nav link sits on is not the hero photo — it is the photo plus the header's own scrim,
 * plus (once scrolled) the header's own `bg-surface-4/90`. Both of those are painted by the header
 * element itself, so hiding `<header>` wholesale measures a background no visitor ever sees and
 * reports failures that are not real. The split is by `aria-hidden`: the scrim is decoration and
 * announces itself as such, everything else is content.
 */
async function groundUnder(page: Page, boxes: Chrome[]) {
	// `transition: none` is not tidiness, it is correctness. The content grid carries
	// `transition-all duration-500`, and `visibility` IS a transitioned property, so the plain
	// assignment below takes half a second to take effect — long enough that the screenshot still
	// contains the nav text. Every box then measures its own glyphs as the "brightest" part of its
	// background and reports ~1:1, a failure that looks exactly like the real defect this file hunts.
	const toggleContent = (hidden: boolean) =>
		page.evaluate((hide) => {
			for (const child of document.querySelector('header')!.children) {
				if (child.getAttribute('aria-hidden') === 'true') continue;
				const el = child as HTMLElement;
				el.style.transition = hide ? 'none' : '';
				el.style.visibility = hide ? 'hidden' : '';
			}
		}, hidden);

	await toggleContent(true);
	const png = (
		await page.screenshot({
			clip: { x: 0, y: 0, width: page.viewportSize()!.width, height: 200 }
		})
	).toString('base64');
	await toggleContent(false);

	return page.evaluate(
		async ([b64, regions]) => {
			const bitmap = await createImageBitmap(
				await (await fetch(`data:image/png;base64,${b64}`)).blob()
			);
			const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(bitmap, 0, 0);
			// The screenshot is in device pixels; the boxes are in CSS pixels.
			const dpr = bitmap.width / window.innerWidth;

			return (regions as { box: { x: number; y: number; w: number; h: number } }[]).map(
				({ box }) => {
					const { data } = ctx.getImageData(
						Math.max(0, Math.round(box.x * dpr)),
						Math.max(0, Math.round(box.y * dpr)),
						Math.max(1, Math.round(box.w * dpr)),
						Math.max(1, Math.round(box.h * dpr))
					);
					let r = 0,
						g = 0,
						b = 0;
					const pixels: number[][] = [];
					for (let i = 0; i < data.length; i += 4) {
						r += data[i];
						g += data[i + 1];
						b += data[i + 2];
						pixels.push([data[i], data[i + 1], data[i + 2]]);
					}
					const n = pixels.length;
					pixels.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]));
					return {
						mean: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
						bright: pixels[Math.floor(n * 0.9)]
					};
				}
			);
		},
		[png, boxes.map(({ box }) => ({ box }))] as const
	);
}

async function atTopOf(page: Page, path: string) {
	await page.goto(path, { waitUntil: 'load' });
	await page.evaluate(() => window.scrollTo(0, 0));
	// Hero images and the header's own 500ms colour transition both need to settle, or the
	// measurement catches a half-faded scrim and reports a number no visitor ever sees.
	await page.waitForTimeout(600);
}

/**
 * `AA` for the 13px nav text. The second, looser bound is on the brightest tenth of the ground:
 * over a photo the mean can look healthy while a bright patch swallows two letters, which is the
 * exact failure the EV Challenge hero produced (a green patch left even pure white at 3.2:1).
 * It is not a WCAG figure — WCAG has nothing to say about per-pixel variation under text — it is
 * the threshold that distinguishes "a scrim is doing its job" from "this photo happens to be dark".
 */
const AA = 4.5;
const AA_WORST_PATCH = 3.0;

test.describe('header chrome is legible on the ground it actually sits on', () => {
	// Two screenshots and a decode per route across the whole sitemap; the default 30s is for
	// tests that assert on one page, not for a sweep.
	test.describe.configure({ timeout: 300_000 });

	test('every sitemap route, unscrolled', async ({ page, request }) => {
		const failures: string[] = [];
		let measured = 0;

		for (const path of await sitemapPaths(request)) {
			await atTopOf(page, path);
			const { text, logo } = await chromeOf(page);
			if (!text.length && !logo) continue;
			measured += text.length;

			const grounds = await groundUnder(page, [...text, ...(logo ? [logo] : [])]);

			text.forEach((el, i) => {
				const fg = rgb(el.color);
				const mean = contrast(fg, grounds[i].mean);
				const patch = contrast(fg, grounds[i].bright);
				if (mean < AA) failures.push(`${path} · ${el.what} · ${mean.toFixed(2)}:1 on mean ground`);
				else if (patch < AA_WORST_PATCH)
					failures.push(`${path} · ${el.what} · ${patch.toFixed(2)}:1 on brightest tenth`);
			});

			// The wordmark is an image, so there is no computed colour to measure. What matters is
			// that the right VARIANT is on screen: logo.png carries a ~50%-opacity white wordmark and
			// logo-ink.png a dark one. Expectation is derived from the measured ground rather than
			// from the app's own predicate, so this cannot pass by agreeing with a bug.
			if (logo) {
				const ground = luminance(grounds[grounds.length - 1].mean);
				const wantsInk = ground > 0.18;
				const isInk = logo.what.includes('logo-ink');
				if (wantsInk !== isInk) {
					failures.push(
						`${path} · logo · ${isInk ? 'ink' : 'white'} wordmark on a ${
							wantsInk ? 'light' : 'dark'
						} ground (${logo.what})`
					);
				}
			}
		}

		// An empty `failures` array proves nothing on its own: if the selector in `chromeOf` ever
		// stopped matching — a markup refactor, a renamed element — this test would sweep 28 routes,
		// measure nothing and pass. Desktop sees 7 controls per route and mobile only the hamburger,
		// so the floor is set from the thinner of the two.
		expect(measured, 'no header chrome was measured — the selector has gone stale').toBeGreaterThan(
			20
		);
		expect(failures, `header chrome below ${AA}:1`).toEqual([]);
	});

	// The sitemap cannot list a 404, so the sweep above is blind to the one page whose ground does
	// not follow from its path: an unmatched `/programs/<anything>` satisfies the dark-hero prefix
	// but renders +error.svelte, which is plain white. Header.svelte keys on `page.status` for
	// exactly this, and nothing else in the suite would notice if that term were dropped.
	test('an unmatched route under a dark-hero prefix still gets light chrome', async ({ page }) => {
		const res = await page.goto('/programs/no-such-programme', { waitUntil: 'load' });
		expect(res?.status(), 'this path must really 404, or the test proves nothing').toBe(404);
		await page.waitForTimeout(600);

		const { text, logo } = await chromeOf(page);
		expect(text.length, 'no chrome found on the error page').toBeGreaterThan(0);
		const grounds = await groundUnder(page, [...text, ...(logo ? [logo] : [])]);

		const failures: string[] = [];
		text.forEach((el, i) => {
			const ratio = contrast(rgb(el.color), grounds[i].mean);
			if (ratio < AA) failures.push(`${el.what} · ${ratio.toFixed(2)}:1`);
		});
		expect(failures, 'header chrome below 4.5:1 on the error page').toEqual([]);

		// The scrim is the visible half of the bug: a navy band across an all-white page.
		expect(
			await page.evaluate(
				() => getComputedStyle(document.querySelector('header')!.children[0]).opacity
			),
			'the dark scrim must not paint over the white error page'
		).toBe('0');
		expect(logo?.what, 'the error page is white, so the wordmark must be ink').toContain(
			'logo-ink'
		);
	});

	// Scrolling repaints the bar `bg-surface-4/90` on every route, which is a different ground from
	// any hero. It gets its own pass because the dark-hero routes change chrome colour at 20px and
	// a fix for the top of the page can easily break the state just below it.
	test('still legible once the bar paints its own background', async ({ page, request }) => {
		const paths = (await sitemapPaths(request)).filter(
			(p) => p === '/' || p.endsWith('/programs/ev-challenge') || p.endsWith('/admissions')
		);
		expect(paths.length, 'expected routes vanished from the sitemap').toBeGreaterThanOrEqual(3);

		const failures: string[] = [];
		for (const path of paths) {
			await page.goto(path, { waitUntil: 'load' });
			await page.evaluate(() => window.scrollTo(0, 600));
			await page.waitForTimeout(700);

			const { text } = await chromeOf(page);
			const grounds = await groundUnder(page, text);
			text.forEach((el, i) => {
				const ratio = contrast(rgb(el.color), grounds[i].mean);
				if (ratio < AA) failures.push(`${path} · ${el.what} · ${ratio.toFixed(2)}:1 (scrolled)`);
			});
		}
		expect(failures, 'header chrome below 4.5:1 after scrolling').toEqual([]);
	});
});
