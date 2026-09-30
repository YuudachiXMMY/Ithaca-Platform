import type { FAQ } from './types';

/**
 * FAQ records, migrated verbatim from `messages/{en,zh}.json` (R-CONTENT-4).
 *
 * These live in their own file rather than inline in `programs.ts` because `prd.md` R-ADM-5 also
 * wants an admissions FAQ that is not attached to any program, and because a schedule answer that
 * quotes a date has to be reviewed against the `Season` record it duplicates — easier when they
 * are all in one place.
 *
 * NOTE: two answers below restate a date that also lives in `season-data.ts` (`EV_FAQ` "What does
 * the schedule look like?", `AI_CAMP_FAQ` "When does it run?"). Workstream H fixed that WHERE IT IS
 * RENDERED: both pages now fill a parameterized Paraglide template from the `Season`, so a visitor
 * can no longer be told a date the detail strip contradicts.
 *
 * These two records still carry the pre-H prose, because a `FAQ.a` is a plain `Localized` string
 * with nowhere to put `{window}`. Nothing renders them yet — the pages read the message catalogue,
 * not `Program.faq` — so the copy is stale but not published. Whoever migrates the pages onto
 * `Program.faq` has to give `FAQ` a way to express a derived value first; until then, editing these
 * two strings changes nothing a visitor sees.
 */

export const EV_FAQ: readonly FAQ[] = [
	{
		q: { en: 'Who can join the EV team?', zh: '谁可以加入 EV 车队？' },
		a: {
			en: 'Students in Grades 8 through 11 in the Greater Toronto Area. We welcome anyone interested in engineering, automotive technology, or team-based projects. No prior experience is required.',
			zh: '大多伦多地区 8 至 11 年级的学生。我们欢迎任何对工程、汽车技术或团队项目感兴趣的人。无需任何先前经验。'
		}
	},
	{
		q: { en: 'Do I need engineering experience?', zh: '我需要有工程经验吗？' },
		a: {
			en: 'No. The program teaches everything from the ground up. Roles span engineering design, assembly, test driving, and team operations. Every team member contributes regardless of technical background.',
			zh: '不需要。项目从零开始教授一切。角色涵盖工程设计、组装、试驾和团队运营。无论技术背景如何，每位团队成员都能做出贡献。'
		}
	},
	{
		q: { en: 'What is the Waterloo EV Challenge?', zh: '什么是滑铁卢 EV 挑战赛？' },
		a: {
			en: 'An electric vehicle endurance race organized by the University of Waterloo Faculty of Engineering. High school teams design, build, and race their own EVs. The 2027 competition is scheduled for late May.',
			zh: '由滑铁卢大学工程学院主办的电动汽车耐久赛。高中队伍自行设计、制造并竞速自己的 EV。2027 年比赛定于 5 月下旬举行。'
		}
	},
	{
		// NOTE: duplicates ev-s03's start/end/cadence/sessionTimes. The RENDERED answer
		// (`programs_evChallenge_faq_items_schedule_answer`) now reads all four from the Season; this
		// record is unrendered prose awaiting the `Program.faq` migration. See the file header.
		q: { en: 'What does the schedule look like?', zh: '课程安排是怎样的？' },
		a: {
			en: 'Sessions run bi-weekly on Saturdays from September 2026 through May 2027. Morning session covers 10:00 AM to 12:00 PM, afternoon session runs 1:00 PM to 3:00 PM.',
			zh: '课程于 2026 年 9 月至 2027 年 5 月每两周周六举行。上午场为上午 10:00 至中午 12:00，下午场为下午 1:00 至 3:00。'
		}
	},
	{
		q: { en: 'What will my child take away?', zh: '我的孩子能带走什么？' },
		a: {
			en: 'Beyond the EV itself, students gain project management skills, technical documentation experience, presentation abilities, and real sponsorship negotiation practice. These are portfolio-ready experiences for university applications.',
			zh: '除了 EV 本身，学生还将获得项目管理技能、技术文档经验、演讲能力和真实的赞助商谈判经历。这些都是大学申请中的高质量作品集素材。'
		}
	}
];

export const AI_CAMP_FAQ: readonly FAQ[] = [
	{
		q: { en: 'What is Ithaca?', zh: '伊萨卡是什么？' },
		a: {
			en: 'Ithaca Family Academy is a youth organization empowering young people to explore the future and build the skills to thrive in the AI era. Students learn through real-world projects: building, testing, collaborating, and presenting.',
			zh: '伊萨卡家族学院是一家青少年组织，致力于赋能年轻人探索未来，培养在 AI 时代蓬勃发展所需的技能。学生通过真实项目学习：构建、测试、协作与展示。'
		}
	},
	{
		q: { en: 'Who can participate in Ithaca programs?', zh: '谁可以参加伊萨卡项目？' },
		a: {
			en: 'Students in Grades 4 through 12 are eligible to join our programs. We group participants by age and experience level to ensure the best learning environment for everyone.',
			zh: '4 至 12 年级的学生均可加入我们的项目。我们按年龄和经验水平分组，确保每位学员都能获得最佳学习环境。'
		}
	},
	{
		// NOTE: this answer is one of the three conflicting date sources catalogued in
		// season-data.ts / CONTENT-GAPS C-2. The RENDERED answer
		// (`programs_aiCamp_faq_items_when_answer`) now comes from `aiec-c3`, which retired the
		// defect on the live page; this record is unrendered prose. See the file header.
		q: { en: 'When does it run?', zh: '项目什么时候进行？' },
		a: {
			en: 'The program runs from January 10 to March 28, 2026. Main classes are held from 1:00 PM to 3:00 PM, with an optional contest coaching session from 3:00 PM to 4:00 PM. Pitch Day is scheduled for April 2026 (date TBD).',
			zh: '项目从 2026 年 1 月 10 日运行至 3 月 28 日。主课时间为下午 1:00 至 3:00，可选竞赛辅导为下午 3:00 至 4:00。路演日定于 2026 年 4 月（日期待定）。'
		}
	},
	{
		q: { en: 'Is this only for advanced coders?', zh: '这个项目只适合高级程序员吗？' },
		a: {
			en: 'No. This is an entrepreneurship and product development program. Teams are cross-functional, with roles in design, business, and communication alongside technical work. Technical depth is supported but not required to participate and succeed.',
			zh: '不是。这是一个创业和产品开发项目。团队是跨职能的，设计、商业和沟通角色与技术工作并重。鼓励技术深度，但参与和成功并不以此为前提。'
		}
	},
	{
		q: { en: 'What exactly do students take away?', zh: '学生究竟能带走什么？' },
		a: {
			en: 'Students receive a complete six-item package: an innovation project, MVP demo video and market-validation brief, pitch deck and video, growth report, social-media coverage, and alumni-community access. Outstanding students may also receive mentor recommendation letters.',
			zh: '学生将获得完整的六件套：创新项目、MVP 演示视频和市场验证摘要、路演 PPT 和视频、增长报告、社交媒体宣传素材，以及校友社群权限。优秀学员还可获得导师推荐信。'
		}
	}
];

export const DIALOGUES_FAQ: readonly FAQ[] = [
	{
		q: { en: 'What is the Ithaca Dialogues program?', zh: '菁英访谈项目是什么？' },
		a: {
			en: 'A research and documentary program where students investigate a major societal question through real interviews with experts in academia, industry, and policy. Each student claims one research track and contributes to a team documentary.',
			zh: '这是一个研究与纪录片项目，学生通过对学术界、行业和政策领域专家进行真实采访，调查一个重大社会问题。每位学生认领一条研究轨道，并为团队纪录片做出贡献。'
		}
	},
	{
		q: {
			en: 'Do students need prior interview or filmmaking experience?',
			zh: '学生需要有采访或影视制作经验吗？'
		},
		a: {
			en: 'No. The research phase covers methodology, interview technique, and documentary production basics. Students learn by doing, with mentor guidance at every step.',
			zh: '不需要。研究阶段涵盖方法论、采访技巧和纪录片制作基础。学生在导师全程指导下边做边学。'
		}
	},
	{
		q: { en: 'How are interview contacts arranged?', zh: '采访联系人如何安排？' },
		a: {
			en: 'Our mentors provide guaranteed initial introductions to domain experts. Students also develop their own outreach skills through guided cold-contact exercises. All interviews follow consent and likeness-release protocols.',
			zh: '我们的导师为领域专家提供有保障的初步引荐。学生也将通过有指导的冷门联系练习培养自己的拓展技能。所有采访均遵循知情同意和肖像授权协议。'
		}
	},
	{
		q: { en: 'Is the program conducted in English or Chinese?', zh: '项目以英语还是中文进行？' },
		a: {
			en: 'All deliverables are produced in English. Interviews may be conducted in either language depending on the guest. Classroom instruction is primarily in English.',
			zh: '所有交付成果均以英文制作。采访可根据嘉宾情况以任一语言进行。课堂教学主要以英文进行。'
		}
	},
	{
		q: { en: 'What do students take away?', zh: '学生能带走什么？' },
		a: {
			en: 'Two portfolio-ready deliverables in English: a research report suitable for university applications, and an 8-12 minute documentary that is publicly released. Both demonstrate real-world research and communication skills.',
			zh: '两份英文的可入作品集成果：适用于大学申请的研究报告，以及一部 8-12 分钟公开发布的纪录片。两者均展示真实的研究和沟通能力。'
		}
	}
];

/**
 * Admissions FAQ — `prd.md` R-ADM-5.
 *
 * TODO(content): admissions FAQ, plus the refund / attendance / safety policy text that R-ADM-4
 * requires (CONTENT-GAPS C-3, docs/DECISIONS.md Q3). Nothing about the admissions process is
 * published anywhere today: the live site's only path is a four-field contact form. `/admissions`
 * is a `prd.md` §6.4 page, so this is a launch blocker and `content:check` reports it as one.
 */
export const ADMISSIONS_FAQ: readonly FAQ[] = [];
