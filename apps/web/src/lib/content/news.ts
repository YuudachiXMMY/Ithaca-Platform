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
 * Every entry below is built from a film that actually exists in the owner's Vimeo account —
 * either already shown elsewhere on the site (the `Program` records, `Highlights.svelte`) or
 * handed over directly as a raw Vimeo link with no further write-up. The 2026-11-19 batch is the
 * second kind: `title`/`body` are translations of the Vimeo clip's own on-platform caption (fetched
 * via Vimeo's public oEmbed endpoint), not invented copy, and `date` is that film's Vimeo upload
 * date reduced to month precision — same convention `moridi-ai-in-ontario` already uses below.
 * Nothing here was invented to make the feed look populated, and nothing is published without a
 * caption or date to point to.
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
				'Ontario’s former Minister of Research, Innovation and Science joined Ithaca students to discuss where provincial AI policy has made progress and where gaps remain.',
				'The conversation was researched, outlined, and led by the students themselves, as is every Ithaca Dialogue.'
			],
			zh: [
				'安大略省前研究、创新与科学厅长与伊萨卡学生对谈，讨论省级人工智能政策真正落地到了哪里，又有哪些没有。',
				'整场对话的调研、提纲与主持都由学生自己完成——每一场 Ithaca Dialogue 都是这样进行的。'
			]
		},
		video: {
			id: '1201561760',
			title: { en: 'Dr. Reza Moridi on AI in Ontario', zh: 'Reza Moridi 博士 —— 安大略的人工智能' }
		},
		programSlug: 'ithaca-dialogues',
		featured: true
	},
	{
		slug: 'teertstra-interview',
		// Published film on the `ithaca-dialogues` record.
		//
		// NOTE (2026-11-19): the original id (1118510980) is privacy-restricted — Vimeo's oEmbed
		// returns dimensions but no title for it, same as the two `Highlights.svelte` ids that
		// only work there because that component appends the video's private embed hash (`h=`),
		// which `VimeoEmbed.svelte` does not. It would not actually play on `/news`. Swapped for
		// a public re-upload of the same interview (Phoebe Li and Sarah Wang's questions for Dr.
		// Teertstra) that the owner supplied directly — real student names are in that video's
		// own caption but are not repeated here, consistent with the gap this entry already names.
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
				'An Ithaca Dialogue conversation led by students from initial research through to the interview itself.'
			],
			zh: ['一场 Ithaca Dialogue 对谈，从前期调研到访谈现场均由学生主导。']
		},
		video: {
			id: '1234583398',
			title: {
				en: 'Student interview with Dr. Peter Teertstra',
				zh: '学生采访 Peter Teertstra 博士'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ithaca-dialogues'
	},
	{
		slug: 'scotiabank-interview',
		// Published film on the `ithaca-dialogues` record.
		//
		// NOTE (2026-11-19): the original id (1118098299) is privacy-restricted, same issue as
		// `teertstra-interview` above — swapped for a public re-upload the owner supplied directly.
		// The body below now names the two executives; that is NOT new exposure introduced here —
		// `results.ts`'s consent-verified `andy-song-princeton` entry already names both in detail
		// (the same wording is reused below), so the §6.3 bar for this record was already cleared
		// on that surface. Withdrawing consent would mean editing both files; see the NOTE there.
		consentVerified: true,
		kind: 'interview',
		title: {
			en: 'Andy Song interviews Scotiabank executives',
			zh: 'Andy Song 采访丰业银行高管'
		},
		date: '2026-06',
		body: {
			en: [
				'Andy Song, in an Ithaca Dialogue conversation, interviewed Mr. Carlos Orencio Horta, Director of AI at Scotiabank, and Mr. Tanaby Zibamanzar, Director of Data Analytics.'
			],
			zh: [
				'伊萨卡家族学院邀请ScotiaBank AI赋能与机器学习部总监Mr.Carlos Orencio Horta 以及 ScotiaBank 数据科学与分析部总监 Mr. Tanaby Zibamanzar Mofrad，接受学生们的采访。'
			]
		},
		video: {
			id: '1248480059',
			title: {
				en: 'Andy Song interviewing Scotiabank executives',
				zh: 'Andy Song 采访丰业银行高管'
			}
		},
		programSlug: 'ithaca-dialogues'
	},

	// The 2026-11-19 batch below: raw Vimeo links handed over with no write-up, titled from each
	// clip's own Vimeo caption rather than invented copy (see the file-level doc comment above).
	// `consentVerified: false` on all of them — every one either names an identifiable guest or
	// shows students on camera, and none has gone through the §6.3 sign-off `moridi-ai-in-ontario`
	// and its siblings above already have. Flip to `true` per entry once the owner confirms.
	//
	// (The Phoebe Li/Sarah Wang interview with Prof. Teertstra that was originally a separate
	// entry here now lives at `teertstra-interview` above — the owner identified it as a public
	// re-upload of that entry's long-broken private video, not a second piece of footage.)
	{
		slug: 'ev-teertstra-program-intro',
		consentVerified: false,
		kind: 'interview',
		title: {
			en: 'Dr. Peter Teertstra on leading the EV Challenge',
			zh: 'Peter Teertstra 教授谈 EV Challenge 项目理念'
		},
		date: '2026-10',
		body: {
			en: [
				'Dr. Peter Teertstra, professor of engineering and director of the Student Design Centre at the University of Waterloo, on what leading the EV Challenge brings to students.'
			],
			zh: [
				'滑铁卢大学工程学院教授、学生设计中心主任 Peter Teertstra 博士接受采访，分享他作为项目负责人对 EV Challenge 的理念，以及这个项目能给学生们带来什么。'
			]
		},
		video: {
			id: '1234583275',
			title: {
				en: 'Dr. Peter Teertstra on the EV Challenge',
				zh: 'Peter Teertstra 教授谈 EV Challenge'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ev-team'
	},
	{
		slug: 'otlf-pitch-day-teacher-interview',
		consentVerified: false,
		kind: 'interview',
		// NOTE: 1246867068 below has the identical caption and runtime (79s). Confirm whether that
		// is a second cut of this same interview before publishing both.
		title: {
			en: "A teacher's take on the AI Entrepreneurship Bootcamp pitch day",
			zh: '伊萨卡年会——创业项目路演活动现场（教师采访）'
		},
		date: '2026-10',
		body: {
			en: ['A short interview with an Ithaca teacher on the pitch-day floor at the annual gala.'],
			zh: ['伊萨卡年会创业项目路演活动现场的教师采访片段。']
		},
		video: {
			id: '1234583590',
			title: {
				en: 'AI Entrepreneurship Bootcamp pitch day — teacher interview',
				zh: '创业项目路演活动现场（教师采访）'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ai-entrepreneurship-bootcamp'
	},
	{
		slug: 'otlf-pitch-day-teacher-interview-2',
		consentVerified: false,
		kind: 'interview',
		// NOTE: see 1234583590 above — identical caption and runtime, uploaded five weeks later.
		title: {
			en: "A teacher's take on the AI Entrepreneurship Bootcamp pitch day",
			zh: '伊萨卡年会——创业项目路演活动现场（教师采访）'
		},
		date: '2026-11',
		body: {
			en: ['A short interview with an Ithaca teacher on the pitch-day floor at the annual gala.'],
			zh: ['伊萨卡年会创业项目路演活动现场的教师采访片段。']
		},
		video: {
			id: '1246867068',
			title: {
				en: 'AI Entrepreneurship Bootcamp pitch day — teacher interview',
				zh: '创业项目路演活动现场（教师采访）'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ai-entrepreneurship-bootcamp'
	},
	{
		slug: 'dialogue-carmi-levy-ai-journalism',
		consentVerified: false,
		kind: 'interview',
		title: {
			en: 'An Ithaca Dialogue with Carmi Levy on AI in journalism',
			zh: '伊萨卡菁英访谈：对话 Carmi Levy，谈 AI 与新闻业'
		},
		date: '2026-10',
		body: {
			en: [
				'Students from the Ithaca Dialogues programme speak with Carmi Levy, a regular AI commentator on CTV and CBC, about AI in journalism and creative writing, and its ethics.'
			],
			zh: [
				'伊萨卡菁英访谈项目的学生对话 AI 观察家、CTV 和 CBC 电视台常驻嘉宾 Carmi Levy，探讨 AI 在新闻业与创意写作中的应用与伦理。'
			]
		},
		video: {
			id: '1234583901',
			title: {
				en: 'A conversation with Carmi Levy on AI in journalism',
				zh: '对话 Carmi Levy，谈 AI 与新闻业'
			}
		},
		programSlug: 'ithaca-dialogues'
	},
	{
		slug: 'dialogue-kristen-perry-incubator',
		consentVerified: false,
		kind: 'interview',
		title: {
			en: 'An Ithaca Dialogue with Kristen Perry on startup incubation',
			zh: '伊萨卡菁英访谈：对话 Kristen Perry，谈创业孵化'
		},
		date: '2026-10',
		body: {
			en: [
				'Students speak with Kristen Perry, who has mentored many entrepreneurs and early-stage investors, about startup incubation.'
			],
			zh: [
				'学生对话孵化器领域嘉宾 Kristen Perry。Kristen 长期辅导创业者与早期投资人，对 AI 创业感兴趣的项目组成员与她相谈甚欢。'
			]
		},
		video: {
			id: '1234583900',
			title: {
				en: 'A conversation with Kristen Perry on startup incubation',
				zh: '对话 Kristen Perry，谈创业孵化'
			}
		},
		programSlug: 'ithaca-dialogues'
	},
	{
		slug: 'dialogue-shane-harding-oncology-ai',
		consentVerified: false,
		kind: 'interview',
		title: {
			en: 'An Ithaca Dialogue with Dr. Shane Harding',
			zh: '伊萨卡菁英访谈：对话 Shane Harding 博士'
		},
		date: '2026-10',
		body: {
			en: [
				'Students interview Dr. Shane Harding, a scientist at the Princess Margaret Cancer Centre who also holds a faculty appointment and runs a lab at the University of Toronto.'
			],
			zh: [
				'学生采访 Shane Harding 博士——玛格丽特公主癌症中心的科学家，同时在多伦多大学担任教职并拥有自己的实验室。'
			]
		},
		video: {
			id: '1234583879',
			title: { en: 'A conversation with Dr. Shane Harding', zh: '对话 Shane Harding 博士' }
		},
		programSlug: 'ithaca-dialogues'
	},
	{
		slug: 'dialogue-zifei-han-mylearningspace',
		consentVerified: false,
		kind: 'interview',
		title: {
			en: 'An Ithaca Dialogue with Zifei Han, founder of My Learning Space AI',
			zh: '伊萨卡菁英访谈：对话 My Learning Space AI 创始人 Zifei Han'
		},
		date: '2026-10',
		body: {
			en: [
				"Students speak with Zifei Han, founder of My Learning Space AI. Han holds a Master's from the University of Toronto, worked in AI consulting at Deloitte, was a researcher at Carnegie Mellon University, and went on to found an AI startup in education."
			],
			zh: [
				'学生对话 My Learning Space AI 创始人 Zifei Han。Han 毕业于多伦多大学硕士项目，曾在德勤从事人工智能咨询，后于卡耐基梅隆大学担任研究员，并创办了教育领域的 AI 创业公司。'
			]
		},
		video: {
			id: '1234583909',
			title: {
				en: 'A conversation with Zifei Han, founder of My Learning Space AI',
				zh: '对话 My Learning Space AI 创始人 Zifei Han'
			}
		},
		programSlug: 'ithaca-dialogues'
	},

	// ── Events ───────────────────────────────────────────────────────────────────────────────
	// This is the kind of entry `/student-life` used to carry. That page 308s here now (plan
	// §3.7), and this is where its content lands.
	{
		slug: 'honda-production-line-visit',
		// Published film on the `ev-team` record; the entry names an institution, not a person —
		// the real video does name Honda Canada's CEO, Jean Marc Leclerc, but that is not repeated
		// here without a fresh §6.3 sign-off on naming an individual.
		//
		// NOTE (2026-11-19): the original id (1117749184) is privacy-restricted, same issue as
		// `teertstra-interview` and `scotiabank-interview` above. Swapped for a public re-upload
		// the owner supplied directly; its own caption dates the visit "3月10日" (March 10), more
		// specific than the '2026-05' this entry previously carried, so `date` moved to match.
		consentVerified: true,
		kind: 'event',
		title: {
			en: 'The EV team visits the Honda production line',
			zh: 'EV 车队参观本田生产线'
		},
		date: '2026-03',
		// TODO(content): what the team saw and took back into the build. The film is published; a
		// paragraph of context is not.
		body: {
			en: [
				'Ithaca’s EV team spent a day on a working automotive production line and saw the problems they solve on a single vehicle addressed at factory scale.'
			],
			zh: [
				'伊萨卡 EV 车队在运转中的汽车生产线上度过了一天——他们在一辆车上解决的问题，在工厂规模上是什么样子。'
			]
		},
		video: {
			id: '1248478548',
			title: {
				en: 'Ithaca EV team visits Honda production line',
				zh: '伊萨卡 EV 车队参观本田生产线'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ev-team'
	},
	{
		slug: 'ev-s2-intro-grant-bourne',
		consentVerified: false,
		kind: 'event',
		// TODO(content): who Grant Bourne is (sponsor, judge, Waterloo staff?) and whether he is
		// comfortable being named in full — the clip's own caption gives no role, only a name.
		title: {
			en: 'Grant Bourne introduces the EV Challenge',
			zh: 'Grant Bourne 介绍 EV Challenge 项目'
		},
		date: '2025-12',
		body: {
			en: ['An introduction to the EV Challenge, recorded December 2025.'],
			zh: ['2025 年 12 月录制的 EV Challenge 项目介绍。']
		},
		video: {
			id: '1246866945',
			title: {
				en: 'Grant Bourne — EV Challenge Intro',
				zh: 'Grant Bourne —— EV Challenge 项目介绍'
			}
		},
		programSlug: 'ev-team'
	},
	{
		slug: 'otlf-pitch-day-joshua-summary',
		consentVerified: false,
		kind: 'event',
		// TODO(content): confirm Joshua's full name and whether he is comfortable being named.
		title: {
			en: "Pitch day at the Ithaca annual gala — Joshua's closing remarks",
			zh: '伊萨卡年会创业路演现场——Joshua 老师总结'
		},
		date: '2026-10',
		body: {
			en: [
				"Footage from the pitch-day floor at the Ithaca annual gala, closing with instructor Joshua's summary of the AI Entrepreneurship Bootcamp teams' pitches."
			],
			zh: ['伊萨卡年会创业项目路演活动现场片段，由 Joshua 老师对本次路演做总结分享。']
		},
		video: {
			id: '1234583633',
			title: {
				en: 'AI Entrepreneurship Bootcamp pitch day — summary',
				zh: '创业项目路演活动现场（Joshua 老师总结）'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ai-entrepreneurship-bootcamp'
	},
	{
		slug: 'dialogue-training-session-1-sruthi',
		consentVerified: false,
		kind: 'event',
		title: {
			en: "Ithaca Dialogues, lesson one: interview training with CTV's Sruthi",
			zh: '伊萨卡菁英访谈项目第一堂课：CTV 编导 Sruthi 指导采访准备'
		},
		date: '2026-10',
		body: {
			en: [
				"CTV producer Sruthi walks the programme's students through how to prepare for an interview, reach out to guests, hold the conversation, and edit the footage afterward."
			],
			zh: ['CTV 编导 Sruthi 指导项目组成员如何做采访准备、如何联系嘉宾、如何对话以及后期制作。']
		},
		video: {
			id: '1234583877',
			title: {
				en: 'Ithaca Dialogues lesson one: interview training',
				zh: '伊萨卡菁英访谈项目第一堂课'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ithaca-dialogues'
	},
	{
		slug: 'dialogue-training-session-2-carmi-levy-practice',
		consentVerified: false,
		kind: 'event',
		title: {
			en: 'Ithaca Dialogues, lesson two: a practice interview with Carmi Levy',
			zh: '伊萨卡菁英访谈项目第二次课程：连线 Carmi Levy 做采访练习'
		},
		date: '2026-10',
		body: {
			en: [
				"The students' second lesson: a practice interview over video call with AI commentator Carmi Levy, ahead of their first real Dialogues conversations."
			],
			zh: ['项目组第二次课程，连线 AI 专家 Carmi Levy 做采访练习，为正式开展菁英访谈做准备。']
		},
		video: {
			id: '1234583880',
			title: {
				en: 'Ithaca Dialogues lesson two: practice interview',
				zh: '伊萨卡菁英访谈项目第二次课程'
			},
			aspectPadding: '177.78%'
		},
		programSlug: 'ithaca-dialogues'
	},

	// The two season-highlight reels and three b-roll clips below are already published and
	// rendered on `/programs/ev-team` (`Program.videos` on the `ev-team` record, plus the page's
	// own `SEASON_FILMS`/`CLIPS`) — this is the "reuse already-shown footage in `/news`" half of
	// the 2026-11-19 batch, so `consentVerified: true` rather than the `false` default above.
	{
		slug: 'ev-season-2-highlights',
		consentVerified: true,
		kind: 'event',
		title: {
			en: 'Season 2: 2025-26 Highlights',
			zh: '第二赛季 2025-26 精彩回顾'
		},
		date: '2026-06',
		body: {
			en: [
				"A highlight reel from the EV team's second season, already shown on the EV Challenge page."
			],
			zh: ['EV 车队第二赛季（2025-26）的精彩回顾片段，已在 EV Challenge 页面展示。']
		},
		video: {
			id: '1202133392',
			title: { en: 'Season 2: 2025-26 Highlights', zh: '第二赛季 2025-26 精彩回顾' }
		},
		programSlug: 'ev-team'
	},
	{
		slug: 'ev-season-1-highlights',
		consentVerified: true,
		kind: 'event',
		title: {
			en: 'Season 1: 2024-25 Highlights',
			zh: '第一赛季 2024-25 精彩回顾'
		},
		date: '2026-06',
		body: {
			en: [
				"A highlight reel from the EV team's first season, already shown on the EV Challenge page."
			],
			zh: ['EV 车队第一赛季（2024-25）的精彩回顾片段，已在 EV Challenge 页面展示。']
		},
		video: {
			id: '1202133393',
			title: { en: 'Season 1: 2024-25 Highlights', zh: '第一赛季 2024-25 精彩回顾' }
		},
		programSlug: 'ev-team'
	},
	{
		slug: 'ev-team-clip-waterloo-race-reflection',
		consentVerified: true,
		kind: 'event',
		title: {
			en: "The EV team's 2024–25 season, in their own words",
			zh: 'EV 车队回顾 2024-2025 赛季'
		},
		date: '2025-10',
		body: {
			en: [
				"On October 4th, Ithaca's EV team returned to the University of Waterloo track. From September 2024 to October 2025 the season brought its share of setbacks as well as wins — a stretch the team hopes stays with every member as part of their own story."
			],
			zh: [
				'伊萨卡 EV 车队 10 月 4 日再度走上滑铁卢大学赛场。从 2024 年 9 月到 2025 年 10 月，这一路有挫折与沮丧，也有光荣与胜利，愿这段经历成为每位队员的青春记忆。'
			]
		},
		video: {
			id: '1202133767',
			title: { en: 'EV team clip', zh: 'EV 车队短片' },
			aspectPadding: '177.78%'
		},
		programSlug: 'ev-team'
	},
	{
		slug: 'ev-team-clip-welding',
		consentVerified: true,
		kind: 'event',
		title: {
			en: 'First time welding on the EV build',
			zh: 'EV 项目：第一次焊接'
		},
		date: '2026-06',
		body: {
			en: [
				"A finished car is made of hundreds of details like this one — the team's first time welding, captured mid-build."
			],
			zh: ['EV 项目进行中，大家都是第一次做焊接，有些兴奋——一辆成品车，由无数这样的细节构成。']
		},
		video: {
			id: '1202133768',
			title: { en: 'EV team clip', zh: 'EV 车队短片' },
			aspectPadding: '177.78%'
		},
		programSlug: 'ev-team'
	},
	{
		slug: 'ev-team-clip-workshop',
		consentVerified: true,
		kind: 'event',
		title: {
			en: 'In the EV workshop',
			zh: 'EV 项目花絮：车间里的女生们'
		},
		date: '2026-06',
		body: {
			en: [
				"Behind-the-scenes from the EV workshop — the team's students, including its girls, working just as hard on the shop floor."
			],
			zh: ['EV 项目花絮：女生在车间里也很卖力。']
		},
		video: {
			id: '1202133769',
			title: { en: 'EV team clip', zh: 'EV 车队短片' },
			aspectPadding: '177.78%'
		},
		programSlug: 'ev-team'
	},

	// ── Program ──────────────────────────────────────────────────────────────────────────────
	{
		slug: 'dialogue-program-launch-promo',
		consentVerified: false,
		kind: 'program',
		title: {
			en: 'The Ithaca Dialogues programme kicks off',
			zh: '伊萨卡菁英访谈项目启动预告'
		},
		date: '2026-02',
		body: {
			en: [
				'A short announcement for the launch of the Ithaca Dialogues programme: students talking with the future, and exploring it.'
			],
			zh: ['伊萨卡菁英访谈项目启动预告片：孩子们对话未来，探索未来。']
		},
		video: {
			id: '1234583878',
			title: { en: 'Ithaca Dialogues programme launch', zh: '伊萨卡菁英访谈项目启动预告' }
		},
		programSlug: 'ithaca-dialogues'
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
