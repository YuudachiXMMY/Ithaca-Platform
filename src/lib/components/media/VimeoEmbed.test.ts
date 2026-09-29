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

function expected(videoId: string, title: string, aspectPadding: string) {
	const inner =
		`<div class="relative overflow-hidden border border-border bg-card-bg transition-colors hover:border-brand/15" style="padding-top: ${aspectPadding}">` +
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

	it('preserves the exact Vimeo query string (& escaped to &amp;) and never double-encodes', () => {
		const { body } = render(VimeoEmbed, {
			props: { videoId: '123', title: 'x', aspectPadding: '56.25%' }
		});
		expect(body).toContain(`src="https://player.vimeo.com/video/123?${VIMEO_QS}"`);
		expect(body).not.toContain('&amp;amp;');
	});
});
