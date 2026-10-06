export type ProgramSpan = 'featured' | 'medium' | 'compact';

export interface ProgramCard {
	/** Card id — also the message-key suffix: programs_index_cards_<id>_{title,tag,description}. */
	readonly id: string;
	readonly href: string;
	/**
	 * `Program.slug` — the key into `$lib/content/programs` and `$lib/content/season-data`.
	 * `prd.md` R-PROG-2 wants each card to carry its current season's label, status and grade band,
	 * and those come from the records, not from here. Declared rather than sliced out of `href` so
	 * the two cannot drift silently.
	 */
	readonly slug: string;
	/**
	 * Source asset path relative to public/media/images (mirror of $lib/assets).
	 * The build-time `?enhanced` import is resolved in the page (enhanced-img needs
	 * a static specifier); this string documents the source and drives the id→image map.
	 * Omitted for photo-less cards (rendered with a deep base + brand hairline).
	 */
	readonly image?: string;
	readonly imageAlt: string;
	readonly span: ProgramSpan;
}

// Ported from the Next app's src/app/programs/page.tsx PROGRAMS array. The card id is the
// message-key suffix and `slug` the content-record key; both now read `ithacaDialogues` /
// `ithaca-dialogues`, matching the canonical route (elite-interview and ai-pioneers-interview
// 308-redirect to it).
export const PROGRAM_CARDS: readonly ProgramCard[] = [
	{
		id: 'evTeam',
		href: '/programs/ev-challenge',
		slug: 'ev-challenge',
		image: 'programs/ev-challenge/EV26-5.jpg',
		imageAlt: 'EV Challenge electric vehicle',
		span: 'featured'
	},
	{
		id: 'aiCamp',
		href: '/programs/ai-entrepreneurship-bootcamp',
		slug: 'ai-entrepreneurship-bootcamp',
		image: 'programs/ai-bootcamp/AI-Entrep_81.jpg',
		imageAlt: 'Students at AI Entrepreneurship Bootcamp',
		span: 'medium'
	},
	{
		id: 'ithacaDialogues',
		href: '/programs/ithaca-dialogues',
		slug: 'ithaca-dialogues',
		image: 'programs/ai-interview/carmi-levy.png',
		imageAlt: 'Ithaca Dialogues session',
		span: 'medium'
	},
	{
		id: 'engineering',
		href: '/programs/engineering-projects',
		slug: 'engineering-projects',
		image: 'programs/ev-challenge/EV26-3.jpg',
		imageAlt: 'Engineering Projects',
		span: 'compact'
	},
	{
		id: 'summerWinter',
		href: '/programs/summer-winter-camps',
		slug: 'summer-winter-camps',
		image: 'programs/ai-bootcamp/ai-camp-HB8A5065.jpg',
		imageAlt: 'Summer and Winter Camps',
		span: 'compact'
	},
	{
		id: 'ithacaNight',
		href: '/programs/ithaca-night',
		slug: 'ithaca-night',
		image: 'programs/ai-bootcamp/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg',
		imageAlt: 'Ithaca Night community event',
		span: 'compact'
	}
] as const;
