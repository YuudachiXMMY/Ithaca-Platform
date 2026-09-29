import type { Highlight } from './types';

/**
 * Student Highlights carousel — `prd.md` R-HOME-6, migrated from the `home_highlights_item*` keys
 * and the image order in `StudentHighlights.svelte`.
 *
 * `Highlight.caption` is optional in §6.1 and the live copy has exactly one description per item,
 * so the published description becomes the caption and the shorter label becomes the title.
 *
 * NOTE (not a `TODO(content)` — the copy exists, it is in the wrong slot, and fixing it means
 * editing `messages/{en,zh}.json`, which belongs to the homepage workstream; recorded in
 * CONTENT-GAPS "Known copy defects" 1–2):
 *   • item 3's tag reads "Interview" while its title and caption describe the Sedra Student
 *     Design Centre tour. Both locales carry the same mistake, so it is an authoring error in the
 *     English source, not a translation error.
 *   • item 5's title and alt are swapped between locales: the English title is the Hinton lecture
 *     and the Chinese title is 项目展示日, with the Hinton copy sitting in the Chinese *alt*. The
 *     Chinese alt also misspells 诺贝奖 (should be 诺贝尔奖).
 * Both are migrated exactly as published (R-CONTENT-4) so that this file and the message
 * catalogue cannot silently disagree while the fix is in flight.
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
		programSlug: 'ev-challenge'
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
			src: '$lib/assets/programs/ev-challenge/EV25-5s.png',
			alt: {
				en: 'Students working on electric vehicle components during workshop',
				zh: '学生在工作坊中组装电动车零部件'
			},
			width: 1500,
			height: 1200
		},
		programSlug: 'ev-challenge'
	},
	{
		id: 'sedra-design-centre',
		// See the file header: the tag contradicts the title in the published copy.
		tag: { en: 'Interview', zh: '访谈' },
		title: {
			en: "Visiting the Sedra Student Design Centre at the University of Waterloo's Department of Engineering",
			zh: '参观滑铁卢大学工程学院的Sedra学生设计中心'
		},
		caption: {
			en: 'Professional interviews with industry leaders, developing communication skills and career insights.',
			zh: '与行业领袖进行专业访谈，锻炼沟通能力，积累职业洞见。'
		},
		media: {
			src: '$lib/assets/highlights/wechat-img-187.jpg',
			alt: { en: 'Student interviewing an industry expert', zh: '学生采访行业专家' },
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
			src: '$lib/assets/programs/ev-challenge/EV25-7-fixed.jpg',
			alt: { en: 'Students collaborating on a team project', zh: '学生共同协作完成团队项目' },
			width: 1920,
			height: 2560
		}
	},
	{
		id: 'hinton-lecture',
		// See the file header: title and alt are swapped between locales in the published copy.
		tag: { en: 'Showcase', zh: '成果展示' },
		title: {
			en: 'Featuring University of Toronto Professor Geoffrey Hinton, a Nobel laureate, sharing insights on artificial intelligence',
			zh: '项目展示日'
		},
		caption: {
			en: 'Semester projects showcased to educators and industry mentors, building public speaking confidence.',
			zh: '学期成果向教育者与行业导师展示，培养公众演讲自信心。'
		},
		media: {
			src: '$lib/assets/highlights/wechat-img-197.jpg',
			alt: {
				en: 'Student presenting their project on presentation day',
				zh: '参与多伦多大学诺贝奖获得者辛顿教授关于人工智能的讲座'
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
