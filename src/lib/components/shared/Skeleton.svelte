<script lang="ts">
	// Reusable shimmer skeleton placeholder for async data loads (admin panel).
	// The `.skeleton` shimmer gradient + reduced-motion neutralization live
	// globally in src/app.css; this component only sizes/shapes the block, so it
	// inherits the global `prefers-reduced-motion` guard for free.
	let {
		width = '100%',
		height = '1rem',
		rounded = '0.5rem',
		class: className = ''
	}: {
		width?: string;
		height?: string;
		rounded?: string;
		class?: string;
	} = $props();
</script>

<div
	class="skeleton {className}"
	style="width: {width}; height: {height}; border-radius: {rounded};"
	aria-hidden="true"
></div>
