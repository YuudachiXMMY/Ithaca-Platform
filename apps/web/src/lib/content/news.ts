import type { NewsItem } from './types';

/**
 * `/news` entries — the 2026-11 plan §4.3 board, and the 10-11 decision that the site needs a
 * news section at all.
 *
 * ## What this file is for
 *
 * It is the on-site sink for the media matrix. The 11-02 content calendar cuts the same material
 * up for several channels — interviews, campus visits, research topics, student projects,
 * admissions results — and the website carries the long-form text-and-image version. So an entry
 * here is usually the fullest version of something that exists in shorter form elsewhere, not a
 * separate piece of writing.
 *
 * ## Which entries are here, and which are not
 *
 * Every entry below is built from material the site ALREADY publishes: the Vimeo films on the
 * `Program` records, and the AIEC 2026 grand prize in `results.ts`. Nothing was invented to make
 * the feed look populated.
 *
 * The plan's first batch also names "走进 TMU 11-07" and the Waterloo Sedra visit. Those are in
 * the content calendar but the site has no copy, no photography and no film of either, so they
 * are NOT stubbed here — an entry whose body is a placeholder is worse than an absent entry,
 * because the feed is the one surface where an empty item is indistinguishable from a broken
 * one. They are recorded in `docs/CONTENT-GAPS.md` instead.
 *
 * `TODO(content)` markers below are advisory rather than blocking: `/news` is not one of
 * `prd.md` §6.4's must-ship-complete pages, so `scripts/content-check.ts` reports them without
 * failing. That is the right setting for a feed, which is never "finished".
 *
 * ## Ordering
 *
 * Reverse chronological is the RENDERED order, computed in the page from `date` — this array is
 * grouped by kind for readability. Do not rely on the array order anywhere.
 */
export const NEWS: readonly NewsItem[] = [
	// ── Interviews ───────────────────────────────────────────────────────────────────────────
	// The Moridi film is the homepage's featured video and has been since the site launched
	// (R-HOME-5). Making it the `featured` entry here is what lets the homepage Featured slot be
	// driven by this file (plan §3.1) instead of hard-coding the same Vimeo id in a component.
	{
		slug: 'moridi-ai-in-ontario',
		// The film is already published on the `ithaca-dialogues` record and has been the
		// homepage's featured video since launch; this entry restates what the site shows.
		consentVerified: true,
		kind: 'interview',
		title: {
			en: 'Dr. Reza Moridi on AI in Ontario',
			zh: 'Reza Moridi 博士谈安大略的人工智能'
		},
		// TODO(content): month-level precision is all the site publishes for this film. The exact
		// release date is in the Vimeo account; it is reduced-precision here rather than invented,
		// which `Result.date` already establishes as the honest encoding.
		date: '2026-09',
		body: {
			en: [
				'Ontario’s former Minister of Research, Innovation and Science sat down with Ithaca students to talk about where provincial AI policy has actually landed — and where it has not.',
				'The conversation was researched, outlined and led by the students themselves, which is how every Ithaca Dialogue works.'
			],
			zh: [
				'安大略省前研究、创新与科学厅长与伊萨卡学生对谈，讨论省级人工智能政策真正落地到了哪里，又有哪些没有。',
				'整场对话的调研、提纲与主持都由学生自己完成——每一场 Ithaca Dialogue 都是这样进行的。'
			]
		},
		video: {
			id: '1201561760',
			title: { en: 'Dr. Reza Moridi - AI in Ontario', zh: 'Reza Moridi 博士 —— 安大略的人工智能' }
		},
		programSlug: 'ithaca-dialogues',
		featured: true
	},
	{
		slug: 'teertstra-interview',
		// Published film on the `ithaca-dialogues` record.
		consentVerified: true,
		kind: 'interview',
		title: {
			en: 'A student interview with Dr. Peter Teertstra',
			zh: '学生采访 Peter Teertstra 博士'
		},
		date: '2026-06',
		// TODO(content): one paragraph of context — what the conversation covered, and which
		// student led it. The film is published; the write-up is not.
		body: {
			en: [
				'An Ithaca Dialogue conversation, student-led from the research through to the interview itself.'
			],
			zh: ['一场 Ithaca Dialogue 对谈，从前期调研到访谈现场均由学生主导。']
		},
		video: {
			id: '1118510980',
			title: {
				en: 'Student interview with Dr. Peter Teertstra',
				zh: '学生采访 Peter Teertstra 博士'
			}
		},
		programSlug: 'ithaca-dialogues'
	},
	{
		slug: 'scotiabank-interview',
		// Published film on the `ithaca-dialogues` record.
		consentVerified: true,
		kind: 'interview',
		title: {
			en: 'Andy Song interviews Scotiabank executives',
			zh: 'Andy Song 采访丰业银行高管'
		},
		date: '2026-06',
		// TODO(content): one paragraph of context for this interview.
		body: {
			en: ['An Ithaca Dialogue conversation inside one of Canada’s largest banks.'],
			zh: ['一场在加拿大最大的银行之一内部进行的 Ithaca Dialogue 对谈。']
		},
		video: {
			id: '1118098299',
			title: {
				en: 'Andy Song interviewing Scotiabank executives',
				zh: 'Andy Song 采访丰业银行高管'
			}
		},
		programSlug: 'ithaca-dialogues'
	},

	// ── Events ───────────────────────────────────────────────────────────────────────────────
	// This is the kind of entry `/student-life` used to carry. That page 308s here now (plan
	// §3.7), and this is where its content lands.
	{
		slug: 'honda-production-line-visit',
		// Published film on the `ev-team` record; the entry names an institution, not a person.
		consentVerified: true,
		kind: 'event',
		title: {
			en: 'The EV team visits the Honda production line',
			zh: 'EV 车队参观本田生产线'
		},
		date: '2026-05',
		// TODO(content): what the team saw and took back into the build. The film is published; a
		// paragraph of context is not.
		body: {
			en: [
				'Ithaca’s EV team spent a day on a working automotive production line — the same problems they solve at a one-car scale, at the scale of a factory.'
			],
			zh: [
				'伊萨卡 EV 车队在运转中的汽车生产线上度过了一天——他们在一辆车上解决的问题，在工厂规模上是什么样子。'
			]
		},
		video: {
			id: '1117749184',
			title: {
				en: 'Ithaca EV team visits Honda production line',
				zh: '伊萨卡 EV 车队参观本田生产线'
			}
		},
		programSlug: 'ev-team'
	},

	// ── Awards ───────────────────────────────────────────────────────────────────────────────
	// Cross-links to `/success-stories` rather than restating the result (plan §2 rule 6). The
	// `resultIds` field is what the two surfaces agree through.
	{
		slug: 'clossette-aiec-2026-grand-prize',
		// HELD BACK until the owner confirms. This entry goes further than anything the site
		// already publishes: the consent-verified `Result` it is the story behind
		// (`results.ts`, `aiec-2026-grand-prize`) says only "Teams from the AI Entrepreneurship
		// Bootcamp ... won the AIEC 2026 Grand Prize" — it names no team and makes no
		// company-formation claim. Grepping the repo for "Clossette" finds this file and one code
		// comment, i.e. nothing backs the specific claim. Both additions are about identifiable
		// third parties, which is exactly what §6.3 exists for.
		//
		// Flip to `true` once the owner confirms the team is happy to be named AND that the
		// incorporation is accurate — or cut the two additions back to what `results.ts` verifies,
		// at which point it is the same claim the site already makes and can ship.
		consentVerified: false,
		kind: 'award',
		title: {
			en: 'Clossette takes the AIEC 2026 Grand Prize',
			zh: 'Clossette 获得 AIEC 2026 全场大奖'
		},
		date: '2026',
		body: {
			en: [
				'A team out of the AI Entrepreneurship Bootcamp won the grand prize at AIEC 2026. Some of its members went on to register a real company and continue the work in Project Studio.'
			],
			zh: [
				'一支来自 AI 创业探索营的团队获得 AIEC 2026 全场大奖。部分成员随后注册了真实公司，并在 Project Studio 中继续推进。'
			]
		},
		programSlug: 'ai-entrepreneurship-bootcamp'
		// TODO(content): wire `resultIds` to the AIEC entry in `results.ts` once that record's id
		// is stable. Left unset rather than guessed — a dangling id renders as a missing link.
	}
];

/**
 * What the site actually renders — `NEWS` minus anything still waiting on §6.3 sign-off.
 *
 * Every surface that shows news reads THIS, not `NEWS`: `/news` and the homepage Featured slot
 * today. `NEWS` stays exported because the unverified copy has to remain reviewable (and the
 * tests assert over the full table), but an entry only reaches a visitor by passing through here.
 *
 * Filtering at the source rather than in each page is the point. A gate each consumer applies for
 * itself is a gate the next consumer forgets, and the failure mode — publishing an unverified
 * claim about a named third party — is not one that shows up as a broken page.
 */
export const PUBLISHED_NEWS: readonly NewsItem[] = NEWS.filter((item) => item.consentVerified);
