import type { Highlight } from './types';

/**
 * Student Highlights carousel — `prd.md` R-HOME-6, migrated from the `home_highlights_item*` keys
 * and the image order in `StudentHighlights.svelte`.
 *
 * `Highlight.caption` is optional in §6.1 and the live copy has exactly one description per item,
 * so the published description becomes the caption and the shorter label becomes the title.
 *
 * Items 3 and 5 were published with their copy in the wrong slots — item 3 tagged "Interview"
 * over a Sedra Student Design Centre tour, item 5's title and alt swapped between locales with
 * 诺贝奖 for 诺贝尔奖. Both were fixed in `messages/{en,zh}.json` (workstream E) after opening the
 * source photographs: `wechat-img-187.jpg` shows the MIDNIGHT SUN and electrium mobility garage
 * bays — Waterloo student design teams housed in the SDC — and `wechat-img-197.jpg` shows a
 * Convocation Hall slide reading "Frontiers of AI: Insights from a Nobel Laureate". This file now
 * mirrors the corrected catalogue; R-CONTENT-4's "migrate verbatim" applies to the published copy,
 * not to a published mistake.
 *
 * No `consentVerified` field exists on `Highlight` in §6.1 — the consent gate for photographs of
 * minors lives on `Result` and `Testimonial`. Every image below is already published on the live
 * site, and none of them names a student, so §6.3's default-false rule has nothing to hold back
 * here; a *new* highlight that names or pictures an identifiable minor must go through the
 * consent template (docs/DECISIONS.md Q7) before it is added.
 */
export const HIGHLIGHTS: readonly Highlight[] = [
	{
		id: 'honda-production-line',
		tag: { en: 'Field Visit', zh: '实地参观' },
		title: { en: 'Honda Production Line Visit', zh: '本田生产线参观' },
		caption: {
			en: 'Touring the Honda EV production facility, witnessing cutting-edge manufacturing and sustainable engineering.',
			zh: '参观本田 EV 生产设施，亲历前沿制造工艺与可持续工程实践。'
		},
		media: {
			src: '$lib/assets/highlights/wechat-img-189.jpg',
			alt: {
				en: 'Students visiting Honda electric vehicle production line',
				zh: '学生参观本田电动车生产线'
			},
			width: 1707,
			height: 2560
		},
		programSlug: 'ev-team'
	},
	{
		id: 'ev-workshop',
		tag: { en: 'Workshop', zh: '工作坊' },
		title: { en: 'EV Program Workshop', zh: 'EV 课程工作坊' },
		caption: {
			en: 'Designing and assembling EV components, learning motor systems and energy management.',
			zh: '设计并组装 EV 零部件，学习电机系统与能源管理知识。'
		},
		media: {
			src: '$lib/assets/programs/ev-team/EV25-5s.png',
			alt: {
				en: 'Students working on electric vehicle components during workshop',
				zh: '学生在工作坊中组装电动车零部件'
			},
			width: 1500,
			height: 1200
		},
		programSlug: 'ev-team'
	},
	{
		id: 'sedra-design-centre',
		tag: { en: 'Campus Visit', zh: '校园参访' },
		title: {
			en: "Visiting the Sedra Student Design Centre at the University of Waterloo's Department of Engineering",
			zh: '参观滑铁卢大学工程学院的 Sedra 学生设计中心'
		},
		caption: {
			en: "Touring the student design teams' workshops, seeing how university engineering projects are built from the ground up.",
			zh: '走访学生设计团队的工作间，了解大学工程项目如何从零搭建。'
		},
		media: {
			src: '$lib/assets/highlights/wechat-img-187.jpg',
			alt: {
				en: "Students touring the design-team workshops at the University of Waterloo's Sedra Student Design Centre",
				zh: '学生参观滑铁卢大学 Sedra 学生设计中心的团队工作间'
			},
			width: 1279,
			height: 1706
		}
	},
	{
		id: 'team-collaboration',
		tag: { en: 'Teamwork', zh: '团队合作' },
		title: { en: 'Team Collaboration', zh: '团队协作' },
		caption: {
			en: 'Cross-disciplinary projects combining technical expertise with creative problem-solving.',
			zh: '跨学科项目将技术专长与创意解题相结合，激发集体智慧。'
		},
		media: {
			src: '$lib/assets/programs/ev-team/EV25-7-fixed.jpg',
			alt: { en: 'Students collaborating on a team project', zh: '学生共同协作完成团队项目' },
			width: 1920,
			height: 2560
		}
	},
	{
		id: 'hinton-lecture',
		tag: { en: 'Guest Lecture', zh: '嘉宾讲座' },
		title: {
			en: 'Featuring University of Toronto Professor Geoffrey Hinton, a Nobel laureate, sharing insights on artificial intelligence',
			zh: '多伦多大学诺贝尔奖获得者辛顿教授分享人工智能洞见'
		},
		caption: {
			en: 'Joining a packed University of Toronto lecture hall, hearing a Nobel laureate on the frontiers of artificial intelligence.',
			zh: '走进座无虚席的多伦多大学讲堂，聆听诺贝尔奖获得者解读人工智能前沿。'
		},
		media: {
			src: '$lib/assets/highlights/wechat-img-197.jpg',
			alt: {
				en: "Attending Nobel laureate Professor Geoffrey Hinton's lecture on artificial intelligence at the University of Toronto",
				zh: '参与多伦多大学诺贝尔奖获得者辛顿教授关于人工智能的讲座'
			},
			width: 1706,
			height: 1279
		}
	},
	{
		id: 'hands-on-innovation',
		tag: { en: 'Innovation', zh: '创新实践' },
		title: { en: 'Hands-On Innovation', zh: '动手创新' },
		caption: {
			en: 'From prototyping to coding, building solutions that address real challenges in technology.',
			zh: '从原型制作到编程，构建解决真实技术挑战的创新方案。'
		},
		media: {
			src: '$lib/assets/programs/app.png',
			alt: { en: 'Students engaged in hands-on innovation activities', zh: '学生参与动手创新活动' },
			width: 1792,
			height: 1546
		}
	}
];
