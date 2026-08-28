import { z } from 'zod';

// Popup CTA links must be http(s). A bare z.string().url() also accepts
// javascript:/data: URLs, which then execute in every visitor's browser through
// the <a href={popup.buttonLink}> in PopupBanner.svelte (stored XSS). Reject any
// non-http(s) scheme (also blocks protocol-relative //, mailto:, tel:, vbscript:).
const httpUrl = z
	.string()
	.url('Must be a valid URL')
	.refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) URL');

export const createPopupSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	content: z.string().min(1, 'Content is required'),
	buttonText: z.string().optional().nullable(),
	buttonLink: httpUrl.optional().nullable().or(z.literal('')),
	isActive: z.boolean().default(false),
	startDate: z.string().datetime().optional().nullable(),
	endDate: z.string().datetime().optional().nullable(),
	displayRules: z.string().optional()
});

export const updatePopupSchema = z.object({
	id: z.string().min(1, 'Popup ID is required'),
	title: z.string().min(1, 'Title is required').optional(),
	content: z.string().min(1, 'Content is required').optional(),
	buttonText: z.string().optional().nullable(),
	buttonLink: httpUrl.optional().nullable().or(z.literal('')),
	isActive: z.boolean().optional(),
	startDate: z.string().datetime().optional().nullable(),
	endDate: z.string().datetime().optional().nullable(),
	displayRules: z.string().optional().nullable()
});
