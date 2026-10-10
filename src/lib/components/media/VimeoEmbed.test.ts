import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import VimeoEmbed from './VimeoEmbed.svelte';

// Characterization: the div/iframe bytes below are exactly what the five iframes on the EV Challenge
// page emitted when their markup was inlined. The golden strings were captured by rendering the
// original inlined markup (both the static featured/secondary iframes and the dynamic clips iframe)
// through `svelte/server` — Svelte escapes `&` to `&amp;` in attribute values whether the attribute
// is static or interpolated, so the div/iframe output is byte-identical to the removed markup.
// The outer `<!--[-->`/`<!--]-->` are Svelte's component-boundary hydration anchors. Note: rendering
// via a component (rather than inline) adds inert comment nodes in-page — the boundary anchors here,
// plus one extra `<!---->` anchor at the two call sites where <VimeoEmbed> is followed by a sibling.
// Those are invisible comment nodes: skipped by CSS structural selectors / grid item counting and
// never traversed by page code, so runtime behavior is unchanged. Any drift in the div/iframe bytes
// (the part asserted below) is a real, user-visible change.

const VIMEO_QS =
	'title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';

// The frame classes moved behind a `band` branch during the §8.2 light-palette migration, so the
// shared prefix now ends at `transition-colors` and the surface-dependent trio is appended. Same
// utilities, different source order — a byte-exact assertion sees that, which is the point of one.
const FRAME = {
	light: 'border-border bg-card-bg hover:border-brand/15',
	band: 'border-band-border bg-band-soft hover:border-band-brand/15'
} as const;

function expected(
	videoId: string,
	title: string,
	aspectPadding: string,
	surface: keyof typeof FRAME = 'light'
) {
	const inner =
		`<div class="relative overflow-hidden border transition-colors ${FRAME[surface]}" style="padding-top: ${aspectPadding}">` +
		`<iframe src="https://player.vimeo.com/video/${videoId}?${VIMEO_QS}" ` +
		`class="absolute inset-0 h-full w-full" ` +
		`allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" ` +
		`referrerpolicy="strict-origin-when-cross-origin" title="${title}"></iframe></div>`;
	return `<!--[-->${inner}<!--]-->`;
}

describe('VimeoEmbed', () => {
	it('renders the featured 16:9 embed byte-identically to the inlined markup', () => {
		const { body } = render(VimeoEmbed, {
			props: { videoId: '1202133392', title: 'EV 2026 Season Highlights', aspectPadding: '56.25%' }
		});
		expect(body).toBe(expected('1202133392', 'EV 2026 Season Highlights', '56.25%'));
	});

	it('renders the secondary 16:9 embed byte-identically', () => {
		const { body } = render(VimeoEmbed, {
			props: { videoId: '1202133393', title: 'EV 2025 Season Highlights', aspectPadding: '56.25%' }
		});
		expect(body).toBe(expected('1202133393', 'EV 2025 Season Highlights', '56.25%'));
	});

	it('renders a 9:16 clip embed byte-identically (matches the already-dynamic clips iframe)', () => {
		const { body } = render(VimeoEmbed, {
			props: { videoId: '1202133768', title: 'EV team clip', aspectPadding: '177.78%' }
		});
		expect(body).toBe(expected('1202133768', 'EV team clip', '177.78%'));
	});

	// `band` exists because --line (#E5E7EB) on navy-900 is a 13.34:1 white hairline and mist is a
	// 15.39:1 white box, where a 1.29:1 divider was intended. Untested, the branch would be free to
	// drift back to the light tokens without anything noticing.
	it('takes the band frame when mounted inside a navy band section', () => {
		const { body } = render(VimeoEmbed, {
			props: {
				videoId: '1202133392',
				title: 'EV 2026 Season Highlights',
				aspectPadding: '56.25%',
				band: true
			}
		});
		expect(body).toBe(expected('1202133392', 'EV 2026 Season Highlights', '56.25%', 'band'));
	});

	it('defaults to the light frame when band is omitted', () => {
		const { body } = render(VimeoEmbed, {
			props: { videoId: '123', title: 'x', aspectPadding: '56.25%' }
		});
		expect(body).toContain(FRAME.light);
		expect(body).not.toContain('band-');
	});

	it('preserves the exact Vimeo query string (& escaped to &amp;) and never double-encodes', () => {
		const { body } = render(VimeoEmbed, {
			props: { videoId: '123', title: 'x', aspectPadding: '56.25%' }
		});
		expect(body).toContain(`src="https://player.vimeo.com/video/123?${VIMEO_QS}"`);
		expect(body).not.toContain('&amp;amp;');
	});
});
