// @sveltejs/enhanced-img ships `declare module '*?enhanced'` and nothing else. That pattern is an
// exact match on the suffix, so adding any imagetools directive — `?enhanced&w=96;192;288` — makes
// the import untyped and svelte-check fails with "Cannot find module".
//
// The widths are not decorative. Without them enhanced:img emits an x-descriptor srcset
// ("1x, 1.9988x") and `sizes` is ignored for x descriptors, so the header logo was shipping its
// 1809x1823 original to phones behind an inert `sizes="200px"`. See Header.svelte.
//
// This lives in its OWN file, not app.d.ts: that file ends in `export {}`, which makes it a module,
// and a `declare module` inside a module is module augmentation rather than an ambient declaration
// — it compiles and does nothing. A .d.ts with no top-level import/export is the ambient one.
//
// One declaration per width list. TypeScript's module wildcard allows exactly one `*`, so
// `*?enhanced&*` is not expressible; a new width list needs a new block here.
declare module '*?enhanced&w=96;192;288' {
	const value: import('vite-imagetools').Picture;
	export default value;
}
