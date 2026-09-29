import type { Person } from './types';

/**
 * Team and mentors — `prd.md` R-ABOUT-5, migrated from `src/lib/data/team.ts` plus the
 * `common_team_*` keys in `messages/{en,zh}.json`.
 *
 * This file does NOT replace `src/lib/data/team.ts`; migrating `TeamGrid.svelte` off the old
 * shape is a later workstream. Two differences are deliberate:
 *
 * 1. The English honorifics (`Mr.` / `Ms.`) that `data/team.ts` hardcodes into `name` are dropped.
 *    They render untranslated on the Chinese site (CONTENT-GAPS C-4), and `Localized` has nowhere
 *    honest to put them — Chinese puts the honorific after the surname, not before the full name.
 * 2. `name.zh` keeps the Latin spelling. That is the policy the site's Chinese translator already
 *    applies to Western names (`Dr. Reza Moridi`, `Peter Teertstra` are left in Latin while
 *    `Hinton` / `Bengio` are transliterated) — see docs/DECISIONS.md Q12.
 *
 * TODO(content): full bios for all four (CONTENT-GAPS C-4, docs/DECISIONS.md Q4). What is below
 * is the one-line description the live site publishes; R-ABOUT-5 wants an expandable full bio.
 * Two of the four are not bios at all — Jadyn Wu's is a focus area and Grant Bourne's is a single
 * credential.
 *
 * TODO(content): the instructor list. The site names no instructors at all, yet
 * `about_connect_educators_*` and `programs_aiCamp_team_educators_*` both describe a teaching
 * team, so `kind: 'instructor'` and `kind: 'mentor'` currently have no records.
 *
 * Photos are 365×365 headshots under `src/lib/assets/team/`. `Media.src` holds the import
 * specifier rather than a URL because `@sveltejs/enhanced-img` needs a static specifier at the
 * call site; the string documents which asset a record points at and drives the id→image map the
 * components build (same convention as `src/lib/data/programs.ts`).
 */
export const PEOPLE: readonly Person[] = [
	{
		id: 'joshua-wang',
		name: { en: 'Joshua Wang', zh: 'Joshua Wang' },
		role: { en: 'Founder & Principal', zh: '创始人兼校长' },
		bio: {
			en: 'Mr. Joshua Wang was an editorial writer of leading business media, adjunct professor at universities.',
			zh: '王先生曾任知名商业媒体专栏作家、大学兼职教授。'
		},
		photo: {
			src: '$lib/assets/team/joshua-wang.jpg',
			alt: { en: 'Joshua Wang', zh: 'Joshua Wang' },
			width: 365,
			height: 365
		},
		kind: 'team'
	},
	{
		id: 'jadyn-wu',
		name: { en: 'Jadyn Wu', zh: 'Jadyn Wu' },
		role: { en: 'Dean of Education & Technology', zh: '教育与科技学院院长' },
		bio: {
			en: 'Focusing on AI and Engineering Education for Youth',
			zh: '专注于青少年 AI 和工程教育'
		},
		photo: {
			src: '$lib/assets/team/jadyn-wu.png',
			alt: { en: 'Jadyn Wu', zh: 'Jadyn Wu' },
			width: 365,
			height: 365
		},
		kind: 'team'
	},
	{
		id: 'kristen-perry',
		name: { en: 'Kristen Perry', zh: 'Kristen Perry' },
		role: { en: 'Mentor of Business Module', zh: '商业模块导师' },
		bio: {
			en: 'Ms. Kristen Perry is a founder, educator, and investor who focuses on supporting entrepreneurs looking to tackle complex global challenges.',
			zh: 'Perry 女士是一位创始人、教育家和投资人，致力于支持解决复杂全球挑战的创业者。'
		},
		photo: {
			src: '$lib/assets/team/kristen-perry.png',
			alt: { en: 'Kristen Perry', zh: 'Kristen Perry' },
			// Not square: the source asset is 365×364. Recorded as-is so layout code that trusts
			// these numbers does not introduce a one-pixel shift.
			width: 365,
			height: 364
		},
		kind: 'team'
	},
	{
		id: 'grant-bourne',
		name: { en: 'Grant Bourne', zh: 'Grant Bourne' },
		role: { en: 'EV Program Lead & Coach', zh: 'EV 项目负责人兼教练' },
		bio: {
			en: '2025 Pirelli GT4 Champion',
			zh: '2025 年倍耐力 GT4 冠军'
		},
		photo: {
			src: '$lib/assets/team/grant-bourne.png',
			alt: { en: 'Grant Bourne', zh: 'Grant Bourne' },
			width: 365,
			height: 365
		},
		kind: 'team'
	}
];

/** Ids of the people who mentor a given program, for `Program.mentorIds`. */
export const EV_MENTOR_IDS: readonly string[] = ['grant-bourne'];
export const AI_CAMP_MENTOR_IDS: readonly string[] = ['kristen-perry'];
