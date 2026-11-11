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
 *
 * ## 2026-11 revamp
 *
 * Three records left and three arrived. `engineering-projects`, `summer-winter-camps` and
 * `ithaca-night` were placeholders with no published dates, no outcomes and no FAQ (the old
 * CONTENT-GAPS C-1), and all three are retired by decision rather than by neglect: the 10-11
 * meeting replaced Summer & Winter Camps with AI Investment Lab, Engineering Projects is
 * superseded by `engineering-foundations`, and Ithaca Night's content moves to `/news` as an
 * Event entry. Their URLs 308-redirect — see the `+page.ts` files under `src/routes/programs/`.
 *
 * The arrivals (`ai-investment-lab`, `engineering-foundations`, `project-studio`) are the
 * opposite case: finished copy from the 11-04 brochure, missing only photography. So they carry
 * `TODO(asset)` and not `TODO(content)` — which matters mechanically, because every
 * `/programs/<slug>` is a `prd.md` §6.4 page and a content marker on one of those fails
 * `scripts/content-check.ts`.
 */

/**
 * A hero whose IMAGE is a stand-in but whose ALT TEXT is not.
 *
 * The 2026-11 revamp added three programmes with finished copy and no photography of their own
 * (see the `TODO(asset)` at each call site). The alt text describes what the borrowed frame
 * actually shows, so a screen-reader user is never told about a picture that is not there.
 */
function placeholderHero(src: string, en: string, zh: string): Media {
	return { src, alt: { en, zh }, width: 1920, height: 1280 };
}

export const PROGRAMS: readonly Program[] = [
	// ── EV Team ──────────────────────────────────────────────────────────────────────────────
	{
		slug: 'ev-team',
		name: { en: 'EV Team', zh: 'EV 车队' },
		tagline: { en: 'Build. Race. Lead.', zh: '制造。竞速。领导。' },
		summary: {
			en: 'Design and build a real electric vehicle. Run a team. Compete at the Waterloo EV Challenge.',
			zh: '设计并制造真实的电动汽车，管理团队，参加滑铁卢 EV 挑战赛。'
		},
		category: 'engineering',
		board: 'projects',
		grades: { min: 8, max: 11 },
		format: 'in-person',
		location: { en: 'Greater Toronto Area', zh: '大多伦多地区' },
		hero: {
			src: '$lib/assets/programs/ev-team/EV26-1.jpg',
			alt: {
				en: 'Ithaca EV team with their electric vehicle at the track',
				zh: '伊萨卡 EV 车队与他们的电动汽车在赛道上'
			},
			width: 1920,
			height: 1280
		},
		gallery: [
			{
				src: '$lib/assets/programs/ev-team/EV25-12.jpg',
				alt: { en: 'Students building the EV chassis', zh: '学生制造 EV 底盘' },
				width: 1279,
				height: 1706
			},
			{
				src: '$lib/assets/programs/ev-team/EV25-8.jpg',
				alt: { en: 'Students testing the electric vehicle', zh: '学生测试电动汽车' },
				width: 1920,
				height: 2560
			},
			{
				src: '$lib/assets/programs/ev-team/EV26-2.jpg',
				alt: {
					en: 'Ithaca EV team at the Waterloo EV Challenge',
					zh: '伊萨卡 EV 车队参加滑铁卢 EV 挑战赛'
				},
				width: 1920,
				height: 1280
			},
			{
				src: '$lib/assets/programs/ev-team/EV26-5.jpg',
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

	// ── AI Entrepreneurship Bootcamp ─────────────────────────────────────────────────────────────
	{
		slug: 'ai-entrepreneurship-bootcamp',
		name: { en: 'AI Entrepreneurship Bootcamp', zh: 'AI 创业训练营' },
		tagline: {
			en: 'From first idea to investor-ready pitch in 13 weeks.',
			zh: '13 周内，从第一个创意到投资人级别的路演。'
		},
		summary: {
			en: 'A 13-week program where students build AI-powered startups, develop MVPs, and pitch to real investors.',
			zh: '为期 13 周的项目，学生打造 AI 驱动的初创公司，开发 MVP 并向真实投资人路演。'
		},
		category: 'ai-business',
		board: 'projects',
		grades: { min: 8, max: 12 },
		format: 'in-person',
		hero: {
			src: '$lib/assets/programs/ai-bootcamp/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg',
			alt: {
				en: 'Ithaca students pitching at OTLF Innovation Day 2026',
				zh: '伊萨卡学生在 2026 OTLF 创新日路演'
			},
			width: 1920,
			height: 1280
		},
		gallery: [
			{
				src: '$lib/assets/programs/ai-bootcamp/AI-Entrep_05.jpg',
				alt: { en: 'Students at AI Entrepreneurship Bootcamp', zh: 'AI 创业训练营的学生' },
				width: 1920,
				height: 1280
			},
			{
				src: '$lib/assets/programs/ai-bootcamp/AI-Entrep_12.jpg',
				alt: { en: 'Team working on an MVP', zh: '团队开发 MVP' },
				width: 1920,
				height: 1280
			},
			{
				src: '$lib/assets/programs/ai-bootcamp/AI-Entrep_81.jpg',
				alt: { en: 'Students at AI Entrepreneurship Bootcamp', zh: 'AI 创业训练营的学生' },
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
		// The SLUG stays plural while the NAME goes singular (plan §5 "brand naming"), and that
		// mismatch is deliberate. The 11-04 brochure settled on the singular "Ithaca Dialogue", so
		// every rendered string has to follow. The URL is a different kind of promise: it is the
		// 308 target of `/programs/elite-interview` and `/programs/ai-pioneers-interview`, it is
		// what `results.ts` back-links to, and it is in the OG card registry. Renaming it to match
		// the brand would buy nothing a visitor can see and would cost a third redirect hop.
		slug: 'ithaca-dialogues',
		name: { en: 'Ithaca Dialogue', zh: '伊萨卡菁英访谈' },
		tagline: { en: 'Conversations that broaden horizons.', zh: '拓宽视野的对话。' },
		summary: {
			en: 'A 10-week research and documentary program where students investigate AI and Canada’s future through interviews with experts in academia, industry, and policy.',
			zh: '为期 10 周的研究与纪录片项目，学生通过访谈学术界、行业和政策领域专家，调查 AI 与加拿大的未来。'
		},
		category: 'research',
		// The 10-26 decision and the 11-04 brochure both file Dialogue under the research board, so
		// `/research` is its primary landing page. It stays one of the four flagships, so
		// `/programs` keeps a cross-link card for it — flagship status and board membership are
		// different claims (plan §2 rule 5).
		board: 'research',
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
				src: '$lib/assets/programs/ai-bootcamp/ai-camp-HB8A5242.jpg',
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

	// ── AI Investment Lab ────────────────────────────────────────────────────────────────────
	// The fourth flagship (10-20), product locked 10-26, and the direct landing point of the
	// 10-11 decision that replaced Summer & Winter Camps with it. Copy is verbatim from the
	// 11-04 brochure via plan §4.1.
	{
		slug: 'ai-investment-lab',
		name: { en: 'AI Investment Lab', zh: 'AI 投资实验室' },
		tagline: {
			en: 'A real account, finance fundamentals, and AI as a working partner.',
			zh: '真实账户 · 金融学习 · AI 协作。'
		},
		summary: {
			en: 'Stock analysis, light modelling, risk management and an investment journal — building the background and application material a business or finance applicant needs.',
			zh: '选股分析、简单建模、风险管理与投资日志，面向商科与金融方向的背景与申请素材积累。'
		},
		category: 'ai-business',
		board: 'projects',
		grades: { min: 9, max: 12 },
		includesUniversity: true,
		format: 'in-person',
		// TODO(asset): the Lab has no photography of its own yet. The AI Bootcamp field-trip frame
		// stands in because it is the closest published image of students working with market data;
		// swap it when the first cohort is shot. Advisory, not blocking — §6.3's fallbacks render.
		hero: placeholderHero(
			'$lib/assets/programs/ai-bootcamp/AI-Entrep_05.jpg',
			'Ithaca students working through a market analysis',
			'伊萨卡学生进行市场分析'
		),
		gallery: [],
		videos: [],
		// Only 101 is promoted. 102 is mentioned as a one-liner and deliberately not expanded
		// (plan §4.2 "只主推 101"), so it is a `tracks` entry with no tags rather than a second
		// programme record — it is the same programme, one level up.
		tracks: [
			{
				name: { en: 'Lab 101 · 8 weeks · 16 sessions', zh: 'Lab 101 · 8 周 · 16 课时' },
				description: {
					en: 'Investment theory, working with AI tools, the basics of data modelling, and simulated trading.',
					zh: '投资理论 · AI 工具使用 · 数据建模基础 · 模拟投资操作。'
				},
				tags: ['Investment Theory', 'AI Tools', 'Data Modelling', 'Simulated Trading']
			},
			{
				name: { en: 'Lab 102 · Advanced · 6 weeks', zh: 'Lab 102 · 进阶 · 6 周' },
				description: {
					en: 'Builds on 101 and moves to small-scale real investing. Details on enquiry.',
					zh: '在 101 基础上转向真实小额投资实操。详询。'
				},
				tags: []
			}
		],
		outcomes: [
			{
				title: { en: 'An investment journal and review report', zh: '投资日志与复盘报告' },
				description: {
					en: 'A written record of every position taken and the reasoning behind it, reviewed at the end of the cycle.',
					zh: '每一笔持仓及其决策依据的书面记录，并在周期结束时完成复盘。'
				}
			},
			{
				title: {
					en: 'Real investing experience you can write about',
					zh: '一段可写入文书的真实投资经历'
				},
				description: {
					en: 'Not a case study and not a simulation dressed up as one — a cycle the student actually ran.',
					zh: '不是案例分析，也不是包装过的模拟盘，而是学生真正跑完的一个周期。'
				}
			},
			{
				title: { en: 'A method for working with AI', zh: 'AI 协作建模方法' },
				description: {
					en: 'How to put a model together with AI assistance, and how to check what it hands back.',
					zh: '如何在 AI 协助下搭建模型，以及如何检验它给出的结果。'
				}
			}
		],
		faq: [],
		mentorIds: [],
		resultIds: [],
		seasonIds: ['ail-101-f26']
	},

	// ── Engineering Foundations ──────────────────────────────────────────────────────────────
	// Replaces `engineering-projects` (plan §4.4). The five ENGR courses are the brochure's full
	// list; they are `tracks` rather than `curriculum` because they are parallel offerings a
	// student picks from, not phases of one programme.
	//
	// Presentation is deliberately restrained — not on the homepage, not in the `/programs` main
	// positions (10-20: lower grades are opportunistic intake, not an active push).
	{
		slug: 'engineering-foundations',
		name: { en: 'Engineering Foundations', zh: '工程启蒙课' },
		tagline: {
			en: 'The direct feeder into EV Team.',
			zh: 'EV 车队直通预备。'
		},
		summary: {
			en: 'Five hands-on courses from machining and structures through to autonomous systems and a global competition capstone.',
			zh: '五门动手课程，从机械加工与结构力学到自主系统，最后以一场全球赛事作为结业项目。'
		},
		category: 'engineering',
		board: 'projects',
		grades: { min: 7, max: 12 },
		format: 'in-person',
		// TODO(asset): no Engineering Foundations photography yet; the EV workshop frame stands in.
		hero: placeholderHero(
			'$lib/assets/programs/ev-team/EV26-3.jpg',
			'Students at work in the Ithaca engineering workshop',
			'学生在伊萨卡工程工作坊中动手实践'
		),
		gallery: [],
		videos: [],
		tracks: [
			{
				name: { en: 'ENGR 101 Machines & Structures', zh: 'ENGR 101 机械与结构' },
				description: {
					en: 'Machining and structural mechanics.',
					zh: '机械加工与结构力学。'
				},
				tags: ['Machining', 'Structures']
			},
			{
				name: { en: 'ENGR 201 Rocketry & Aerodynamics', zh: 'ENGR 201 火箭与空气动力学' },
				description: {
					en: 'Aerodynamics and flight design.',
					zh: '空气动力学与飞行设计。'
				},
				tags: ['Aerodynamics', 'Flight Design']
			},
			{
				name: { en: 'ENGR 301 Autonomous Systems', zh: 'ENGR 301 自主系统' },
				description: {
					en: 'Circuits, machine vision, and an autonomous ground vehicle.',
					zh: '电路、机器视觉与自主无人车。'
				},
				tags: ['Circuits', 'Machine Vision', 'Autonomy']
			},
			{
				name: { en: 'ENGR 302 Aerial Robotics', zh: 'ENGR 302 空中机器人' },
				description: {
					en: 'Drones — flight control and aerial robotics.',
					zh: '无人机——飞行控制与航空机器人。'
				},
				tags: ['Drones', 'Flight Control']
			},
			{
				name: { en: 'ENGR 303 Engineering Capstone', zh: 'ENGR 303 工程 Capstone' },
				description: {
					en: 'STEM Racing, the global competition formerly known as F1 in Schools.',
					zh: 'STEM Racing 全球赛事（原 F1 in Schools）。'
				},
				tags: ['STEM Racing', 'Competition']
			}
		],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		// No `Season`: the brochure states "按需成班、无固定开班日期" as the schedule, which is a
		// real answer rather than a gap. A `Season` with invented dates would make
		// `formatSeasonWindow()` publish a window the organisation explicitly does not commit to.
		seasonIds: []
	},

	// ── Project Studio ───────────────────────────────────────────────────────────────────────
	// The 11-04 brochure files Project Studio under the projects board, matching the 10-26
	// decision (plan §4.7). The brochure's internal third column still prints it under research,
	// which the plan flags as a layout artefact; the site follows the decision.
	{
		slug: 'project-studio',
		name: { en: 'Project Studio', zh: 'Project Studio' },
		tagline: {
			en: 'Incubating one student’s own project.',
			zh: '个人项目孵化。'
		},
		summary: {
			en: 'Secondary students incubate a real project inside a real startup environment; university students get a portfolio and an outlet for real work, with mentoring and introductions.',
			zh: '中学段在真实创业环境中孵化真实项目；大学段获得作品集与真实项目出口，并有导师辅导与资源对接。'
		},
		category: 'ai-business',
		board: 'projects',
		grades: { min: 11, max: 12 },
		includesUniversity: true,
		format: 'in-person',
		// TODO(asset): no Project Studio photography yet; the Innovation Day presentation frame
		// stands in, as the closest published image of a student presenting their own project.
		hero: placeholderHero(
			'$lib/assets/programs/ai-bootcamp/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg',
			'An Ithaca student presenting their own project',
			'伊萨卡学生展示自己的项目'
		),
		gallery: [],
		videos: [],
		tracks: [
			{
				name: { en: 'Secondary · G11-12', zh: '中学 · G11-12' },
				description: {
					en: 'Incubate a real project, work inside a real startup environment, and come away with AIF material.',
					zh: '真实项目孵化，经历真实创业环境，产出 AIF 素材。'
				},
				tags: ['Incubation', 'AIF Material']
			},
			{
				name: { en: 'University', zh: '大学' },
				description: {
					en: 'A portfolio and an outlet for real project work, with mentor coaching and introductions.',
					zh: '作品集与真实项目出口，导师辅导 + 资源对接。'
				},
				tags: ['Portfolio', 'Mentoring']
			}
		],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		// No `Season` on purpose. The previous brochure printed "12-16 weeks"; the 11-04 copy drops
		// it, and the plan says the duration does not go on the page. Encoding a window would put
		// back exactly the claim the latest copy removed.
		seasonIds: []
	}
];

/** Programs whose seasons `content:check` must validate — every program is live today. */
export const LIVE_PROGRAM_SLUGS: readonly string[] = PROGRAMS.map((program) => program.slug);

/**
 * Enquiry-form interest values that are deliberately NOT `Program.slug`s. See
 * `contact/EnquiryForm.svelte`'s `PROGRAM_OPTIONS` for why each one earns a box: they are the gap
 * between "what we file as a programme" and "what a parent writes in the box". The `track-`
 * prefix is load-bearing — it is what makes clear, in the inbox and in anything that later joins
 * on this column, that these resolve against no record.
 *
 * NOT folded into `LIVE_PROGRAM_SLUGS`: that list's other consumer is `scripts/content-check.ts`,
 * which demands a valid `Season` for every slug in it, and these three have no `Program` record
 * and therefore no seasons. Putting them there would turn a green content gate red.
 */
export const ENQUIRY_TRACK_SLUGS = [
	'track-academic-tutoring',
	'track-university-support',
	'track-research-lab'
] as const;

/**
 * Everything `/api/contact` accepts in `programs`, and the single source `EnquiryForm.svelte`
 * builds its checkboxes from.
 *
 * One table, two consumers — the same rule `src/lib/og/cards.ts` states for OG cards, and for the
 * same reason. When the form listed the three `track-` options on its own, the endpoint's enum
 * still only held `LIVE_PROGRAM_SLUGS`, so ticking any of them failed `safeParse` on the WHOLE
 * body: a valid name, email and message were rejected along with it, and the visitor got
 * `contact_form_errorInvalid` with nothing to fix. Deriving both sides from here is what makes
 * that class of drift unrepresentable rather than merely fixed.
 */
export const ENQUIRY_INTEREST_SLUGS: readonly string[] = [
	...LIVE_PROGRAM_SLUGS,
	...ENQUIRY_TRACK_SLUGS
];
