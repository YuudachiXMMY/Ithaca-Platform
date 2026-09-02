export type ProgramSpan = 'featured' | 'medium' | 'compact';

export interface ProgramCard {
	/** Card id — also the message-key suffix: programs_index_cards_<id>_{title,tag,description}. */
	readonly id: string;
	readonly href: string;
	/**
	 * Source asset path relative to public/media/images (mirror of $lib/assets).
	 * The build-time `?enhanced` import is resolved in the page (enhanced-img needs
	 * a static specifier); this string documents the source and drives the id→image map.
	 * Omitted for gradient-only cards.
	 */
	readonly image?: string;
	readonly imageAlt: string;
	readonly span: ProgramSpan;
}

// Ported verbatim from the Next app's src/app/programs/page.tsx PROGRAMS array.
// eliteInterview → /programs/ithaca-dialogues (canonical route; elite-interview redirects).
export const PROGRAM_CARDS: readonly ProgramCard[] = [
	{
		id: 'evTeam',
		href: '/programs/ev-challenge',
		image: 'programs/ev-challenge/EV26-5.jpg',
		imageAlt: 'EV Challenge electric vehicle',
		span: 'featured'
	},
	{
		id: 'aiCamp',
		href: '/programs/ai-entrepreneurship-camp',
		image: 'programs/ai-entrepreneurship/AI-Entrep_81.jpg',
		imageAlt: 'Students at AI Entrepreneurship Camp',
		span: 'medium'
	},
	{
		id: 'eliteInterview',
		href: '/programs/ithaca-dialogues',
		image: 'programs/ai-interview/carmi-levy.png',
		imageAlt: 'Ithaca Dialogues session',
		span: 'medium'
	},
	{
		id: 'engineering',
		href: '/programs/engineering-projects',
		imageAlt: 'Engineering Projects',
		span: 'compact'
	},
	{
		id: 'summerWinter',
		href: '/programs/summer-winter-camps',
		imageAlt: 'Summer and Winter Camps',
		span: 'compact'
	},
	{
		id: 'ithacaNight',
		href: '/programs/ithaca-night',
		imageAlt: 'Ithaca Night community event',
		span: 'compact'
	}
] as const;
