import type { Result } from './types';

/**
 * Results — awards, placements, admissions and milestones (`prd.md` R-HOME-4, R-PT-9, R-RES-1).
 *
 * Consent (§6.3): items already published on the live site migrate with `consentVerified: true`;
 * anything new that names or pictures a minor defaults to `false` and does not render until the
 * owner confirms. Both records below are already public — the AIEC award names a team rather than
 * a student, and §6.3 calls out the named alumnus and his university explicitly.
 *
 * `date` carries the precision the copy actually states. `'2026'` means "the site says AIEC 2026
 * and nothing narrower"; writing `'2026-06-13'` would be borrowing the Ithaca roadshow date for
 * an award handed out by a different organisation.
 */
export const RESULTS: readonly Result[] = [
	{
		id: 'aiec-2026-grand-prize',
		// Reduced ISO precision on purpose — see the file header.
		date: '2026',
		programSlug: 'ai-entrepreneurship-bootcamp',
		type: 'award',
		title: { en: 'AIEC 2026 Grand Prize', zh: 'AIEC 2026 大奖' },
		detail: {
			en: 'Teams from the AI Entrepreneurship Bootcamp competed in the AI Entrepreneurship Contest and won the AIEC 2026 Grand Prize.',
			zh: 'AI 创业训练营的团队参加人工智能创业大赛，荣获 AIEC 2026 大奖。'
		},
		evidence: {
			src: '$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg',
			alt: {
				en: 'Ithaca students receiving the AIEC 2026 Grand Prize at OTLF Innovation Day',
				zh: '伊萨卡学生在 OTLF 创新日领取 AIEC 2026 大奖'
			},
			width: 1920,
			height: 1280
		},
		consentVerified: true
	},
	{
		id: 'andy-song-princeton',
		// The copy states the month, not the day.
		date: '2025-09',
		programSlug: 'ithaca-dialogues',
		type: 'admission',
		title: {
			en: 'Andy Song begins studies at Princeton University',
			zh: 'Andy Song 入读普林斯顿大学'
		},
		detail: {
			en: 'Andy interviewed Mr. Carlos Orencio Horta, Director of AI at Scotiabank, and Mr. Tanaby Zibamanzar, Director of Data Analytics. Andy graduated from high school in June 2025 and began his studies at Princeton University in September 2025.',
			zh: 'Andy 采访了丰业银行人工智能总监 Carlos Orencio Horta 先生与数据分析总监 Tanaby Zibamanzar 先生。Andy 于 2025 年 6 月高中毕业，并于 2025 年 9 月入读普林斯顿大学。'
		},
		// prd.md §6.3 names this item as already-published and therefore consent-verified.
		//
		// NOTE: this is the one record whose subject is also named OUTSIDE the consent gate. The
		// Ithaca Dialogues film `1118098299` is titled "Andy Song interviewing Scotiabank
		// executives" and lives on `Program.videos`, and §6.1's `VimeoRef` has no `consentVerified`
		// field — so flipping the flag below removes this entry from `/results` and the homepage
		// proof band but NOT that film's title, on `/results` or on `/programs/ithaca-dialogues`.
		// Withdrawing consent for this alumnus therefore means editing `programs.ts` as well.
		// Not a content gap (consent is on record today), which is why it is a NOTE and not a
		// `TODO(content)`; recorded here because the gate cannot see it.
		consentVerified: true
	}

	// TODO(content): Waterloo EV Challenge placements for Seasons 1 and 2. The site publishes
	// highlight videos from both seasons but never states how the team finished, so there is no
	// EV `Result` to put in the homepage proof band (R-HOME-4) or the program page (R-PT-9).
	// It is also why `/results` renders no competition-results table: R-RES-1 asks for one, and
	// the single award below is already a timeline entry — a one-row table restating it adds a
	// heading and no information. The table earns its place with these placements in it.
	//
	// TODO(content): further alumni destinations. R-RES-1 wants a destination list and R-HOME-4 a
	// proof tile; one named alumnus is all the live site has. Any new name needs consent under
	// §6.3 before it can be added with `consentVerified: true`. Note that §6.1's `Result` has no
	// destination field either — the university is prose inside `title`/`detail` — so a genuine
	// destinations list needs both the records and a place to put the institution.
	//
	// TODO(content): guests and dates for the Ithaca Dialogues interviews. R-RES-1 wants title,
	// guest, date and video for each; §6.1's `VimeoRef` carries only an id and a title, and no
	// interview date or guest name is published anywhere on the site. `/results` therefore lists
	// each film by title alone. Several titles name their guest in prose ("Dr. Reza Moridi — AI in
	// Ontario"), which is not the same as having the field.
];

/** Ids of the results shown on a given program page, for `Program.resultIds`. */
export const AI_CAMP_RESULT_IDS: readonly string[] = ['aiec-2026-grand-prize'];
export const DIALOGUES_RESULT_IDS: readonly string[] = ['andy-song-princeton'];
