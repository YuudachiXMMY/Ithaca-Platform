<script lang="ts">
	import { onMount } from 'svelte';
	import { z } from 'zod';
	import { Loader2, Plus, X, Pencil, Trash2 } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	type Popup = {
		id: string;
		title: string;
		content: string;
		buttonText: string | null;
		buttonLink: string | null;
		isActive: boolean;
		startDate: string | null;
		endDate: string | null;
		createdAt: string;
	};

	let popups = $state<Popup[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showForm = $state(false);
	let submitting = $state(false);
	let deletingId = $state<string | null>(null);
	let editingId = $state<string | null>(null);

	let title = $state('');
	let content = $state('');
	let buttonText = $state('');
	let buttonLink = $state('');
	let isActive = $state(false);
	let startDate = $state('');
	let endDate = $state('');
	let fieldErrors = $state<{ title?: string; content?: string }>({});

	const popupSchema = z.object({
		title: z.string().min(1, m.admin_popups_form_titleRequired()),
		content: z.string().min(1, m.admin_popups_form_contentRequired())
	});

	async function fetchPopups() {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/admin/popups');
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_popups_errors_load();
				return;
			}
			popups = data.data;
		} catch {
			error = m.admin_popups_errors_load();
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		title = '';
		content = '';
		buttonText = '';
		buttonLink = '';
		isActive = false;
		startDate = '';
		endDate = '';
		fieldErrors = {};
		editingId = null;
	}

	function openCreate() {
		resetForm();
		showForm = true;
	}

	function openEdit(p: Popup) {
		editingId = p.id;
		title = p.title;
		content = p.content;
		buttonText = p.buttonText ?? '';
		buttonLink = p.buttonLink ?? '';
		isActive = p.isActive;
		startDate = p.startDate ? p.startDate.slice(0, 16) : '';
		endDate = p.endDate ? p.endDate.slice(0, 16) : '';
		fieldErrors = {};
		showForm = true;
	}

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		fieldErrors = {};
		const parsed = popupSchema.safeParse({ title, content });
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				fieldErrors[issue.path[0] as 'title' | 'content'] = issue.message;
			}
			return;
		}
		submitting = true;
		error = null;
		const payload = {
			title,
			content,
			buttonText: buttonText || undefined,
			buttonLink: buttonLink || undefined,
			isActive,
			startDate: startDate ? new Date(startDate).toISOString() : null,
			endDate: endDate ? new Date(endDate).toISOString() : null
		};
		try {
			const res = await fetch('/api/admin/popups', {
				method: editingId ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload)
			});
			const data = await res.json();
			if (!data.success) {
				error =
					data.error ?? (editingId ? m.admin_popups_errors_update() : m.admin_popups_errors_create());
				return;
			}
			resetForm();
			showForm = false;
			await fetchPopups();
		} catch {
			error = editingId ? m.admin_popups_errors_update() : m.admin_popups_errors_create();
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: string) {
		if (!window.confirm(m.admin_popups_confirmDelete())) return;
		deletingId = id;
		try {
			const res = await fetch('/api/admin/popups', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_popups_errors_delete();
				return;
			}
			await fetchPopups();
		} catch {
			error = m.admin_popups_errors_delete();
		} finally {
			deletingId = null;
		}
	}

	function dateRange(p: Popup): string {
		if (!p.startDate && !p.endDate) return m.admin_popups_always();
		const s = p.startDate ? new Date(p.startDate).toLocaleDateString() : '…';
		const e = p.endDate ? new Date(p.endDate).toLocaleDateString() : '…';
		return `${s} - ${e}`;
	}

	onMount(fetchPopups);
</script>

<svelte:head><title>{m.admin_popups_title()}</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">{m.admin_popups_title()}</h1>
	<button
		onclick={() => (showForm ? ((showForm = false), resetForm()) : openCreate())}
		class="flex items-center gap-2 rounded-lg bg-[#ccdef0] px-3 py-2 text-sm font-medium text-[#111318]"
	>
		{#if showForm}<X class="h-4 w-4" /> {m.admin_popups_cancel()}{:else}<Plus class="h-4 w-4" />
			{m.admin_popups_newPopup()}{/if}
	</button>
</div>

{#if error}
	<div class="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>
{/if}

{#if showForm}
	<form onsubmit={onSubmit} class="mb-6 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-6">
		<h2 class="mb-4 text-lg font-semibold">
			{editingId ? m.admin_popups_form_editTitle() : m.admin_popups_form_createTitle()}
		</h2>

		<label class="mb-1 block text-sm text-[#cccccc]" for="p-title">{m.admin_popups_form_title()}</label>
		<input
			id="p-title"
			bind:value={title}
			placeholder={m.admin_popups_form_titlePlaceholder()}
			class="mb-1 w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
		/>
		{#if fieldErrors.title}<p class="mb-2 text-sm text-red-400">{fieldErrors.title}</p>{/if}

		<label class="mb-1 mt-3 block text-sm text-[#cccccc]" for="p-content"
			>{m.admin_popups_form_content()}</label
		>
		<textarea
			id="p-content"
			bind:value={content}
			rows="3"
			placeholder={m.admin_popups_form_contentPlaceholder()}
			class="mb-1 w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
		></textarea>
		{#if fieldErrors.content}<p class="mb-2 text-sm text-red-400">{fieldErrors.content}</p>{/if}

		<div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1 block text-sm text-[#cccccc]" for="p-btntext"
					>{m.admin_popups_form_buttonText()}</label
				>
				<input
					id="p-btntext"
					bind:value={buttonText}
					placeholder={m.admin_popups_form_buttonTextPlaceholder()}
					class="w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-[#cccccc]" for="p-btnlink"
					>{m.admin_popups_form_buttonLink()}</label
				>
				<input
					id="p-btnlink"
					bind:value={buttonLink}
					placeholder={m.admin_popups_form_buttonLinkPlaceholder()}
					class="w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-[#cccccc]" for="p-start"
					>{m.admin_popups_form_startDate()}</label
				>
				<input
					id="p-start"
					type="datetime-local"
					bind:value={startDate}
					class="w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-[#cccccc]" for="p-end"
					>{m.admin_popups_form_endDate()}</label
				>
				<input
					id="p-end"
					type="datetime-local"
					bind:value={endDate}
					class="w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
				/>
			</div>
		</div>

		<label class="mt-3 flex items-center gap-2 text-sm text-[#cccccc]">
			<input type="checkbox" bind:checked={isActive} /> {m.admin_popups_form_active()}
		</label>

		<button
			type="submit"
			disabled={submitting}
			class="mt-4 flex items-center gap-2 rounded-lg bg-[#ccdef0] px-4 py-2 text-sm font-medium text-[#111318] disabled:opacity-60"
		>
			{#if submitting}<Loader2 class="h-4 w-4 animate-spin" />{/if}
			{editingId ? m.admin_popups_form_update() : m.admin_popups_form_create()}
		</button>
	</form>
{/if}

{#if loading}
	<div class="flex items-center gap-2 text-[#888]"><Loader2 class="h-5 w-5 animate-spin" /> …</div>
{:else if popups.length === 0}
	<p class="text-[#888]">{m.admin_popups_empty()}</p>
{:else}
	<div class="overflow-hidden rounded-xl border border-[#2a2a2a]">
		<table class="w-full text-left text-sm">
			<thead class="bg-[#1e1e1e] text-[#888]">
				<tr>
					<th class="px-4 py-3">{m.admin_popups_table_title()}</th>
					<th class="px-4 py-3">{m.admin_popups_table_status()}</th>
					<th class="px-4 py-3">{m.admin_popups_table_dateRange()}</th>
					<th class="px-4 py-3">{m.admin_popups_table_created()}</th>
					<th class="px-4 py-3 text-right">{m.admin_popups_table_actions()}</th>
				</tr>
			</thead>
			<tbody>
				{#each popups as p (p.id)}
					<tr class="border-t border-[#2a2a2a]">
						<td class="px-4 py-3">{p.title}</td>
						<td class="px-4 py-3">
							<span
								class="rounded-full px-2 py-0.5 text-xs {p.isActive
									? 'bg-green-500/15 text-green-300'
									: 'bg-gray-500/15 text-gray-300'}"
								>{p.isActive ? m.admin_popups_statusActive() : m.admin_popups_statusInactive()}</span
							>
						</td>
						<td class="px-4 py-3">{dateRange(p)}</td>
						<td class="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
						<td class="px-4 py-3 text-right">
							<div class="flex items-center justify-end gap-3">
								<button
									onclick={() => openEdit(p)}
									aria-label={m.admin_popups_editAriaLabel({ title: p.title })}
									class="text-[#ccdef0] hover:text-white"><Pencil class="h-4 w-4" /></button
								>
								<button
									onclick={() => handleDelete(p.id)}
									disabled={deletingId === p.id}
									aria-label={m.admin_popups_deleteAriaLabel({ title: p.title })}
									class="text-red-400 hover:text-red-300 disabled:opacity-50"
								>
									{#if deletingId === p.id}<Loader2 class="h-4 w-4 animate-spin" />{:else}<Trash2
											class="h-4 w-4"
										/>{/if}
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
