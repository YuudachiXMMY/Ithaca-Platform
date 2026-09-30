import type { Media, Program } from './types';
import { AI_CAMP_FAQ, DIALOGUES_FAQ, EV_FAQ } from './faq';
import { AI_CAMP_MENTOR_IDS, EV_MENTOR_IDS } from './people';
import { AI_CAMP_RESULT_IDS, DIALOGUES_RESULT_IDS } from './results';

/**
 * Program records — `prd.md` §6.1 / §7.4, migrated from the three built program pages, the
 * programs index cards in `src/lib/data/programs.ts`, and `messages/{en,zh}.json`.
 *
 * This file does not replace `src/lib/data/programs.ts` (the index-card list). Migrating the
 * pages onto these records is a later workstream; until then the two coexist and the card list
 * stays the thing the index page reads.
 *
 * `Media.src` holds a `$lib/assets/…` import specifier rather than a URL: `@sveltejs/enhanced-img`
 * requires a static specifier at the call site, so the string documents which asset a record
 * points at and drives the id→image map each component builds. Widths and heights are the real
 * pixel dimensions of the source files, so a consumer can reserve space without loading them.
 *
 * `format` is `'in-person'` everywhere. Nothing on the site states a format explicitly, but all
 * three built programs publish clock-time sessions at a physical location, so this is a reading
 * of published facts rather than a new claim.
 */

// The three placeholder programs publish no grade band of their own. The academy-wide band is
// published (`about_hero_facts_gradesValue` "4-12", and the AI Camp FAQ "Grades 4 through 12 are
// eligible to join our programs"), so it stands in until the owner supplies per-program bands.
const ACADEMY_GRADES = { min: 4, max: 12 };

function placeholderHero(src: string, en: string, zh: string): Media {
	return { src, alt: { en, zh }, width: 1920, height: 1280 };
}

export const PROGRAMS: readonly Program[] = [
	// ── EV Team ──────────────────────────────────────────────────────────────────────────────
	{
		slug: 'ev-challenge',
		name: { en: 'EV Team', zh: 'EV 车队' },
		tagline: { en: 'Build. Race. Lead.', zh: '制造。竞速。领导。' },
		summary: {
			en: 'Design and build a real electric vehicle. Run a team. Compete at the Waterloo EV Challenge.',
			zh: '设计并制造真实的电动汽车，管理团队，参加滑铁卢 EV 挑战赛。'
		},
		category: 'engineering',
		grades: { min: 8, max: 11 },
		format: 'in-person',
		location: { en: 'Greater Toronto Area', zh: '大多伦多地区' },
		hero: {
			src: '$lib/assets/programs/ev-challenge/EV26-1.jpg',
			alt: {
				en: 'Ithaca EV team with their electric vehicle at the track',
				zh: '伊萨卡 EV 车队与他们的电动汽车在赛道上'
			},
			width: 1920,
			height: 1280
		},
		gallery: [
			{
				src: '$lib/assets/programs/ev-challenge/EV25-12.jpg',
				alt: { en: 'Students building the EV chassis', zh: '学生制造 EV 底盘' },
				width: 1279,
				height: 1706
			},
			{
				src: '$lib/assets/programs/ev-challenge/EV25-8.jpg',
				alt: { en: 'Students testing the electric vehicle', zh: '学生测试电动汽车' },
				width: 1920,
				height: 2560
			},
			{
				src: '$lib/assets/programs/ev-challenge/EV26-2.jpg',
				alt: {
					en: 'Ithaca EV team at the Waterloo EV Challenge',
					zh: '伊萨卡 EV 车队参加滑铁卢 EV 挑战赛'
				},
				width: 1920,
				height: 1280
			},
			{
				src: '$lib/assets/programs/ev-challenge/EV26-5.jpg',
				alt: { en: 'The Ithaca electric trike on track', zh: '伊萨卡电动三轮车在赛道上' },
				width: 1920,
				height: 1280
			}
		],
		// The first two are the season-highlight films the page features; the last three are the
		// portrait clips it lays out in a grid. Past EV seasons have no `Season` record (see
		// season-data.ts), so their films hang off the program instead.
		videos: [
			{
				id: '1202133392',
				title: { en: 'Season 2 — 2025-26 Highlights', zh: '第二赛季 2025-26 精彩回顾' }
			},
			{
				id: '1202133393',
				title: { en: 'Season 1 — 2024-25 Highlights', zh: '第一赛季 2024-25 精彩回顾' }
			},
			{ id: '1202133768', title: { en: 'EV team clip', zh: 'EV 车队短片' } },
			{ id: '1202133767', title: { en: 'EV team clip', zh: 'EV 车队短片' } },
			{ id: '1202133769', title: { en: 'EV team clip', zh: 'EV 车队短片' } },
			{
				id: '1117749184',
				title: {
					en: 'Ithaca EV team visits Honda production line',
					zh: '伊萨卡 EV 车队参观本田生产线'
				}
			},
			{
				id: '1118090619',
				title: { en: 'EV program hands-on workshop experience', zh: 'EV 课程动手工作坊体验' }
			}
		],
		tracks: [
			{
				name: { en: 'Engineering', zh: '工程' },
				description: {
					en: 'Design, build, and test a functioning electric vehicle. CAD modeling, chassis fabrication, electrical wiring, battery systems, and iterative performance testing.',
					zh: '设计、制造并测试一辆真实运行的电动汽车。CAD 建模、底盘制造、电气布线、电池系统以及迭代性能测试。'
				},
				tags: ['CAD Design', 'Chassis Build', 'Electrical Systems', 'Testing']
			},
			{
				name: { en: 'Business', zh: '商业' },
				description: {
					en: 'Run the team as a real operation. Sponsorship acquisition, budget management, logistics coordination, and organizational skills that make a racing team function.',
					zh: '将团队作为真实运营来管理。赞助商开发、预算管理、后勤协调，以及让赛车队正常运转所需的组织能力。'
				},
				tags: ['Sponsorship', 'Budget', 'Logistics', 'Team Mgmt']
			}
		],
		roles: [
			{
				name: { en: 'Engineering Design', zh: '工程设计' },
				description: {
					en: 'CAD modeling, structural analysis, and electrical systems layout for the EV chassis and powertrain.',
					zh: 'EV 底盘和动力系统的 CAD 建模、结构分析和电气系统布局。'
				}
			},
			{
				name: { en: 'Assembly & Testing', zh: '组装与测试' },
				description: {
					en: 'Hands-on fabrication, component integration, and systematic performance validation on the vehicle.',
					zh: '动手制造、零部件集成以及对车辆的系统性性能验证。'
				}
			},
			{
				name: { en: 'Racing & Test Driving', zh: '赛车与试驾' },
				description: {
					en: 'Track testing protocols, endurance race strategy, and driver skill development under competition conditions.',
					zh: '赛道测试规程、耐久赛策略以及在竞赛条件下的驾驶技能培养。'
				}
			},
			{
				name: { en: 'Team Operations', zh: '团队运营' },
				description: {
					en: 'Sponsorship outreach, budget planning, logistics coordination, and cross-functional project management.',
					zh: '赞助商拓展、预算规划、后勤协调和跨职能项目管理。'
				}
			}
		],
		outcomes: [
			{
				title: { en: 'Real engineering project experience', zh: '真实的工程项目经验' },
				description: {
					en: 'Design thinking, hands-on fabrication, and cross-discipline collaboration on a vehicle that actually races.',
					zh: '在一辆真正参赛的车辆上进行设计思维、动手制造和跨学科协作。'
				}
			},
			{
				title: { en: 'Business and leadership capabilities', zh: '商业与领导力' },
				description: {
					en: 'Fundraising, sponsorship acquisition, resource management, and the experience of building a team from scratch.',
					zh: '募资、赞助商开发、资源管理，以及从零开始组建团队的经历。'
				}
			},
			{
				title: { en: 'Competitive university applications', zh: '竞争力强的大学申请' },
				description: {
					en: 'A distinctive portfolio piece for top engineering and business programs across North America.',
					zh: '北美顶尖工程与商业项目申请中独具特色的作品集亮点。'
				}
			}
		],
		faq: [...EV_FAQ],
		mentorIds: [...EV_MENTOR_IDS],
		// TODO(content): the site publishes no placement for Seasons 1 or 2, so R-PT-9 has nothing
		// to show on the EV page (see results.ts).
		resultIds: [],
		seasonIds: ['ev-s03']
		// NOTE: `model3d` is intentionally unset. §9.5 assumes a Draco GLB, but the EV viewer on
		// this site is procedural Threlte geometry (`trike-geometry.ts`) with no model file in the
		// repository — there is nothing for `model3d.src` to point at, and inventing a path would
		// make R-PT-3's "render when model3d is set" branch lie.
	},

	// ── AI Entrepreneurship Camp ─────────────────────────────────────────────────────────────
	{
		slug: 'ai-entrepreneurship-camp',
		name: { en: 'AI Entrepreneurship Camp', zh: 'AI 创业营' },
		tagline: {
			en: 'From first idea to investor-ready pitch in 13 weeks.',
			zh: '13 周内，从第一个创意到投资人级别的路演。'
		},
		summary: {
			en: 'A 13-week program where students build AI-powered startups, develop MVPs, and pitch to real investors.',
			zh: '为期 13 周的项目，学生打造 AI 驱动的初创公司，开发 MVP 并向真实投资人路演。'
		},
		category: 'ai-business',
		grades: { min: 8, max: 12 },
		format: 'in-person',
		hero: {
			src: '$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg',
			alt: {
				en: 'Ithaca students pitching at OTLF Innovation Day 2026',
				zh: '伊萨卡学生在 2026 OTLF 创新日路演'
			},
			width: 1920,
			height: 1280
		},
		gallery: [
			{
				src: '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_05.jpg',
				alt: { en: 'Students at AI Entrepreneurship Camp', zh: 'AI 创业营的学生' },
				width: 1920,
				height: 1280
			},
			{
				src: '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_12.jpg',
				alt: { en: 'Team working on an MVP', zh: '团队开发 MVP' },
				width: 1920,
				height: 1280
			},
			{
				src: '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_81.jpg',
				alt: { en: 'Students at AI Entrepreneurship Camp', zh: 'AI 创业营的学生' },
				width: 1920,
				height: 1280
			}
		],
		// TODO(content): the AI Camp page embeds no video. If a cohort demo or pitch-day reel
		// exists on Vimeo it belongs here (R-PT-10).
		videos: [],
		outcomes: [
			{
				title: { en: 'A portfolio-ready AI startup project', zh: '可入作品集的 AI 初创项目' },
				description: {
					en: 'Each team delivers a complete project package: an innovation prototype, MVP demo video, market-validation brief, pitch deck, growth report, and social-media coverage materials.',
					zh: '每支团队交付完整的项目包：创新原型、MVP 演示视频、市场验证摘要、路演 PPT、增长报告和社交媒体宣传素材。'
				}
			},
			{
				title: { en: 'Highly competitive experiences and skills', zh: '极具竞争力的经历与技能' },
				description: {
					en: 'Students develop real-world entrepreneurship capabilities by working through a rigorous innovation pipeline, from problem discovery to customer validation to investor-ready pitching.',
					zh: '学生通过严格的创新流程（从问题发现到客户验证再到投资人级别路演）培养真实的创业能力。'
				}
			},
			{
				title: { en: 'Substantive AI entrepreneurship exposure', zh: '深度 AI 创业体验' },
				description: {
					en: 'Through field trips to leading financial institutions and hands-on workshops, students gain first-hand exposure to the intersection of technology and business innovation.',
					zh: '通过参观顶级金融机构和动手工作坊，学生亲身体验科技与商业创新交汇的前沿。'
				}
			},
			{
				title: { en: 'Access to a high-value mentor community', zh: '接触高价值导师社群' },
				description: {
					en: 'Students connect with professionals from engineering, AI, and finance. Outstanding participants may receive mentor recommendation letters for university applications.',
					zh: '学生与工程、AI 和金融领域的专业人士建立连接。优秀学员可获得导师推荐信，用于大学申请。'
				}
			}
		],
		faq: [...AI_CAMP_FAQ],
		mentorIds: [...AI_CAMP_MENTOR_IDS],
		resultIds: [...AI_CAMP_RESULT_IDS],
		// Cohort 3 is listed as current but is undated — see season-data.ts / CONTENT-GAPS C-2.
		seasonIds: ['aiec-c1', 'aiec-c2', 'aiec-c3']
		// TODO(content): a week-by-week curriculum. The page describes the camp as a "dual path"
		// and lists an optional 12-hour contest module, but never says what happens in weeks 1-13,
		// so R-PT-5 has nothing to render.
	},

	// ── Ithaca Dialogues ─────────────────────────────────────────────────────────────────────
	{
		slug: 'ithaca-dialogues',
		name: { en: 'Ithaca Dialogues', zh: '伊萨卡菁英访谈' },
		tagline: { en: 'Conversations that broaden horizons.', zh: '拓宽视野的对话。' },
		summary: {
			en: 'A 10-week research and documentary program where students investigate AI and Canada’s future through interviews with experts in academia, industry, and policy.',
			zh: '为期 10 周的研究与纪录片项目，学生通过访谈学术界、行业和政策领域专家，调查 AI 与加拿大的未来。'
		},
		category: 'research',
		grades: { min: 9, max: 12 },
		format: 'in-person',
		hero: {
			src: '$lib/assets/site/about-hero.jpg',
			alt: {
				en: 'Ithaca students in conversation with an industry expert',
				zh: '伊萨卡学生与行业专家对话'
			},
			width: 1920,
			height: 1280
		},
		gallery: [
			{
				src: '$lib/assets/programs/ai-interview/carmi-levy.png',
				alt: { en: 'An Ithaca Dialogues interview session', zh: '伊萨卡菁英访谈的访谈现场' },
				width: 1920,
				height: 1092
			},
			{
				src: '$lib/assets/programs/ai-camp/ai-camp-HB8A5242.jpg',
				alt: { en: 'Students preparing interview questions', zh: '学生准备采访提纲' },
				width: 1920,
				height: 1280
			}
		],
		// The Moridi interview is the homepage's featured video (R-HOME-5); it is a Dialogues
		// output, so the canonical record lives here and the homepage references it by id.
		videos: [
			{
				id: '1201561760',
				title: { en: 'Dr. Reza Moridi - AI in Ontario', zh: 'Reza Moridi 博士 —— 安大略的人工智能' }
			},
			{
				id: '1118510980',
				title: {
					en: 'Student interview with Dr. Peter Teertstra',
					zh: '学生采访 Peter Teertstra 博士'
				}
			},
			{
				id: '1118098299',
				title: {
					en: 'Andy Song interviewing Scotiabank executives',
					zh: 'Andy Song 采访丰业银行高管'
				}
			}
		],
		tracks: [
			{
				name: { en: 'Policy', zh: '政策' },
				description: {
					en: 'From $20B in sovereign compute to “AI for All” - do government milestones actually work?',
					zh: '从 200 亿的主权算力到「AI 惠及所有人」——政府里程碑真的有用吗？'
				},
				tags: []
			},
			{
				name: { en: 'Talent', zh: '人才' },
				description: {
					en: 'Why does top AI talent keep flowing south? Is immigration policy a trump card or an illusion?',
					zh: '为什么顶尖 AI 人才不断南流？移民政策是王牌还是幻觉？'
				},
				tags: []
			},
			{
				name: { en: 'Capital', zh: '资本' },
				description: {
					en: 'World-class research, scale-up fatigue. From Element AI to Cohere.',
					zh: '世界级的研究，规模化的疲态。从 Element AI 到 Cohere。'
				},
				tags: []
			},
			{
				name: { en: 'Industry', zh: '行业' },
				description: {
					en: 'Banks, hospitals, farms still struggle to adopt AI. What is blocking real productivity gains?',
					zh: '银行、医院、农场仍在挣扎于 AI 落地。是什么阻碍了真正的生产力提升？'
				},
				tags: []
			},
			{
				name: { en: 'Education', zh: '教育' },
				description: {
					en: 'Is Ontario preparing high schoolers for the AI era? You are the stakeholder on this one.',
					zh: '安大略省正在为高中生的 AI 时代做准备吗？你就是这个问题的利益相关者。'
				},
				tags: []
			}
		],
		curriculum: [
			{
				phase: { en: 'Research — weeks 1-3', zh: '研究 —— 第 1-3 周' },
				description: {
					en: 'Background literature review, interview outline design, guest outreach and scheduling.',
					zh: '背景文献综述、采访提纲设计、嘉宾邀约与日程安排。'
				}
			},
			{
				phase: { en: 'Fieldwork — weeks 4-7', zh: '田野调查 —— 第 4-7 周' },
				description: {
					en: 'Lead and support interviewing, camera and audio operation, note-taking and role rotation.',
					zh: '主导与辅助采访、摄像与录音操作、记录与角色轮换。'
				}
			},
			{
				phase: { en: 'Production — weeks 8-10', zh: '制作 —— 第 8-10 周' },
				description: {
					en: 'Research report drafting, documentary rough-cut editing, screening and public release.',
					zh: '研究报告撰写、纪录片初剪、放映与公开发布。'
				}
			}
		],
		outcomes: [
			{
				title: { en: 'English Research Report', zh: '英文研究报告' },
				description: {
					en: 'Literature review, interview evidence, and original conclusions. Directly usable as a university application portfolio piece.',
					zh: '文献综述、采访证据和原创结论。可直接作为大学申请作品集素材使用。'
				}
			},
			{
				title: { en: 'English Mini-Documentary', zh: '英文迷你纪录片' },
				description: {
					en: 'Interview footage, narration, and data visualization. Edited and publicly released.',
					zh: '采访片段、旁白和数据可视化。剪辑后公开发布。'
				}
			}
		],
		faq: [...DIALOGUES_FAQ],
		// TODO(content): the Dialogues page promises mentor-arranged introductions to domain
		// experts but names no mentor, so R-PT-7 has nobody to list.
		mentorIds: [],
		resultIds: [...DIALOGUES_RESULT_IDS],
		seasonIds: ['dialogues-f26']
	},

	// ── Placeholder programs ─────────────────────────────────────────────────────────────────
	// The three below render `PlaceholderProgram.svelte` today (CONTENT-GAPS C-1). Everything
	// that exists — name, tag, one-line description and the index-card photo — is encoded; the
	// rest is empty, which R-PT's "omit a section when its data is empty" rule already handles.
	//
	// TODO(content): Engineering Projects, Summer & Winter Camps and Ithaca Night each need, per
	// prd.md §7.4: the grade band, when it runs (a `Season`), what students do, what they walk
	// away with, 3-5 FAQ entries, and photographs. All three are prd.md §6.4 pages, so these are
	// launch blockers. `grades` below falls back to the academy-wide 4-12 band.
	{
		slug: 'engineering-projects',
		name: { en: 'Engineering Projects', zh: '工程项目' },
		tagline: {
			en: 'Robotics, IoT, and sustainable technology.',
			zh: '机器人、物联网与可持续技术。'
		},
		summary: {
			en: 'Real-world engineering projects covering robotics, IoT, and sustainable technology solutions.',
			zh: '涵盖机器人、物联网和可持续技术解决方案的真实世界工程项目。'
		},
		category: 'stem',
		grades: ACADEMY_GRADES,
		format: 'in-person',
		hero: placeholderHero(
			'$lib/assets/programs/ev-challenge/EV26-3.jpg',
			'Students working on an engineering project',
			'学生进行工程项目'
		),
		gallery: [],
		videos: [],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		seasonIds: []
	},
	{
		slug: 'summer-winter-camps',
		name: { en: 'Summer & Winter Camps', zh: '暑期与冬令营' },
		tagline: {
			en: 'Technology, creativity, and the outdoors.',
			zh: '科技、创意与户外体验。'
		},
		summary: {
			en: 'Intensive seasonal camps blending technology, creativity, and outdoor experiences.',
			zh: '融合科技、创意与户外体验的强化季节性营地。'
		},
		category: 'seasonal',
		grades: ACADEMY_GRADES,
		format: 'in-person',
		hero: placeholderHero(
			'$lib/assets/programs/ai-camp/ai-camp-HB8A5065.jpg',
			'Students at an Ithaca seasonal camp',
			'伊萨卡季节性营地的学生'
		),
		gallery: [],
		videos: [],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		seasonIds: []
	},
	{
		slug: 'ithaca-night',
		name: { en: 'Ithaca Night', zh: '伊萨卡之夜' },
		tagline: { en: 'Where students show their work.', zh: '学生展示成果的舞台。' },
		summary: {
			en: 'Community showcase events where students present their work and celebrate achievements.',
			zh: '社区展示活动，学生展示成果并庆祝成就。'
		},
		category: 'community',
		grades: ACADEMY_GRADES,
		format: 'in-person',
		hero: placeholderHero(
			'$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg',
			'Ithaca Night community showcase',
			'伊萨卡之夜社区展示活动'
		),
		gallery: [],
		videos: [],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		seasonIds: []
	}
];

/** Programs whose seasons `content:check` must validate — every program is live today. */
export const LIVE_PROGRAM_SLUGS: readonly string[] = PROGRAMS.map((program) => program.slug);
