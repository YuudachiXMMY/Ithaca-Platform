# 三件未做项的执行细则（2026-11-15）

承接 PR #19（分支 `worktree-web-design-critique-2026-11-15`）。那一笔落地了 9 条，
这三件当时留下，各有不同的卡点：**一件卡在你定文案，一件卡在要肉眼迭代，一件卡在素材。**
下面把每件都写到「可以直接照着做」的粒度，并标出各自真正的风险在哪。

---

## 一、统一转化路径（卡点：要你定文案 + 一处会撞 CI 的宽度门禁）

### 现状：四个入口、三种文案、两个目的地

| 入口 | 文件 | 文案 key（英 / 中） | 去向 |
|---|---|---|---|
| header CTA 按钮 | `Header.svelte:420` + `nav.ts:170` `CTA_HREF` | `nav_admissions` "Admissions" / 「招生入学」 | `/admissions` |
| 首屏主 CTA | `HeroSection.svelte:92` | `home_hero_ctaPrograms` "View programs" / 「探索项目」 | `/programs` |
| 首屏次 CTA | `HeroSection.svelte:98` | `home_hero_ctaContact` "Get in touch" / 「联系我们」 | `/contact-us` |
| 收尾 CTA | `ContactSection.svelte:190` | `home_contact_cta` "Get in touch" / 「立即联系」 | `/contact-us` |
| footer | `nav.ts` `FOOTER_LINKS` | `nav_contactUs` "Contact Us" | `/contact-us` |

两个具体毛病：

1. **"Get in touch" 出现两次指向同一页，而 "Admissions" 指向另一页，`/contact-us` 不解释区别。**
2. **收尾段自己拆了自己的台。** `home_contact_subtext` 已经承诺「先从一次**免费 20–30 分钟**的
   升学与成长路径规划、项目选择咨询开始」，紧挨着的按钮却写「立即联系」并通向一个通用表单 ——
   页面刚刚给出的那个具体承诺，在按钮上消失了。

### 先说一个会撞 CI 的坑

**不要把 header 按钮改成 "Book a free consultation"。** `nav.ts:215-222` 记着导航栏的宽度算式，
`e2e/nav-single-line.spec.ts` 守着桌面导航单行不折。`Admissions` 作为按钮约 150px，
而 `Book a free consultation` 是它的两倍还多 —— 中文「预约咨询」很短，英文不短，这条门禁会红。
而且 header 按钮指向的是**一个页面**，用页面名是对的。

所以推荐方案是：**header 不动，两个页内 CTA 统一到「预约免费咨询」。**

### 具体改动

**① 新增构造器。** `$lib/program-cta.ts` 现在只有 `registerHref` / `brochureHref`，两者都要 slug。
加一个不要 slug 的：

```ts
/**
 * `/admissions#book` — 站点通用的「约一次咨询」。
 *
 * 和 `registerHref` 同一个落点（M-4：`#book` 指向 /admissions 六段里的最后一段「Talk to us」），
 * 区别只是没有 programme 预选。写成构造器而不是各处手写字面量，理由同 K-3：
 * 一个调用点忘掉 `#book`，读者就会落在页顶，要滑过 glance strip、五个步骤、季节日历和 FAQ
 * 才能见到他刚刚点名要的那张表。
 */
export function consultHref(): string {
	return localizeHref('/admissions#book');
}
```

**② 新增文案。** 两个 locale 都加：

```json
"common_cta_bookConsult": "Book a free consultation"
"common_cta_bookConsult": "预约免费咨询"
```

**③ 改四处调用点。**

| 文件 | 改什么 |
|---|---|
| `ContactSection.svelte:190` | `href={localizeHref('/contact-us')}` → `href={consultHref()}`；`{m.home_contact_cta()}` → `{m.common_cta_bookConsult()}`。这里收益最大：按钮终于和它上方那句承诺是同一件事 |
| `HeroSection.svelte:98` | 同上一组改动。首屏次 CTA 变成「预约免费咨询」，主 CTA「探索项目」不动 —— 一个给还在看的人，一个给已经决定的人，这个分工是对的 |
| `nav.ts` `FOOTER_LINKS` | `/contact-us` 保留，但它从此是**通用咨询**入口，不是主转化 |
| `messages/*.json` | `home_contact_cta` / `home_hero_ctaContact` 两个 key 失去调用点，删掉（`npm run i18n:check` 只校对齐不校孤儿，`knip` 也不扫 message，所以**必须手动删**，否则它们会以「看起来还在用」的状态留在目录里） |

**④ 让 `/contact-us` 说明区别。** 现在两条路都通向它却不解释。在 `/contact-us` 顶部加一句
分流：「要约咨询请走『预约免费咨询』；这里是一般问询（课程细节、费用、排期）。」
文案归你，但这句的存在是必要的 —— 否则统一标签只是把困惑从按钮挪到了落地页。

### 验证

- `program-cta.test.ts` 加一条：`consultHref()` 的输出在两个 locale 下都要带 `#book`。
- `e2e/admissions-funnel.spec.ts` 已有「hop 之后 `#book` 真的在视口里」的断言，**把首页这条新路径
  加进去** —— 这正是那个套件存在的理由（各单项都绿、整条路走不通，是它抓过的历史故障）。
- `analytics.spec.ts`：`booking_click` 挂在 `/admissions` 自己的预约链接上，首页 CTA 不触发它，
  不需要改。若你想单独量首页这条入口，那要新开一个 `EventLocation`，属于另一个决定。

---

## 二、SectionHeader 组件 + 字号阶梯（卡点：要肉眼迭代）

### 现状：八个 section，三种形制，两种对齐

| Section | 文件:行 | 现在的 h2 | 对齐 | eyebrow |
|---|---|---|---|---|
| Our Mission | `MissionSection.svelte:71` | `<h1>` clamp(2.5–4.5rem) | 左 | 有 |
| Our Approach | `MissionSection.svelte:90` | 无 h2，只有一个 `<p>` eyebrow | **居中** | 有 |
| 三支柱 | `MissionSection.svelte:121,153` | `text-2xl md:text-3xl lg:text-4xl` | 左 | 无 |
| The Journey | `JourneyStrip.svelte:71` | **`text-xs` 字距 0.28em 大写** | 左 | 即 h2 本身 |
| Academics | `AcademicsShowcase.svelte:44` | `text-2xl md:text-4xl` | 左 | 无 |
| Our Programs | `ProgramsShowcase.svelte:149` | `text-2xl md:text-4xl` | **居中** | 无 |
| Success Stories | `ResultsStrip.svelte:35` | **`text-xs` 字距 0.28em 大写** | 左 | 即 h2 本身 |
| Impact | `ImpactStats.svelte:59` | `text-2xl md:text-4xl` | **居中** | 无 |
| Featured | `FeaturedSection.svelte:59` | `text-xl md:text-2xl` | 左 | 有（独立 `<p>`） |
| Highlights | `StudentHighlights.svelte:105` | `text-xl md:text-3xl` | 左 | 无（右侧有副文） |
| Get in Touch | `ContactSection.svelte:129` | `text-3xl md:text-[2.75rem]` | **居中** | 无 |

**批评里「强调方向与说服力倒挂」的机制就在这张表里**：Journey（最清楚地解释了产品模型）和
Success Stories（唯一的成果证据）是全页仅有的两个「是 h2 却长得像标签」的段落，
而通用的 Impact 统计拿到了 36px 大标题。修字号阶梯的同时这件事就被带走了。

### 建议的八档

| 档 | 值 | 用途 |
|---|---|---|
| display | `clamp(2.5rem,6vw,4.5rem)` | 只给 `<h1>`（Mission），全页一次 |
| 4xl 36px | `text-2xl md:text-4xl` | **所有 section h2，唯一一档** |
| 3xl 30px | | 卡片大标题 / 支柱标题 |
| xl 20px | | 卡片标题 |
| lg 18px | | 引导段 |
| base 16px | | 正文 |
| sm 14px | | 副文、链接 |
| xs 12px | | eyebrow、标签（**下限**，已在 PR #19 落地） |

需要退场的：`text-5xl`、`text-6xl`、`text-[2.75rem]`、`text-[48px]`、`text-[64px]`。

**两个必须单独处理的例外**，别一刀切：

- **`ContactSection` 的 44px（`2.75rem`）**。它第 126-128 行的注释写着这是 §8.2 规定的 h2 上限、
  且是刻意取到顶的（全站最大 h2 = 首页收尾 CTA）。要么把它也降到 36px 并**同步删掉那段注释、
  改 §8.2**，要么把它登记为唯一例外。我倾向后者：让收尾 CTA 比其它段落重，本来就是对的，
  而「一档 h2」的精神是消除**无意义**的差异，不是消除所有差异。
- **`ImpactStats` 的数字**（`text-4xl md:text-5xl lg:text-6xl`）和 `StudentHighlights` 的
  48/64px 装饰序号。前者是 display 角色不是正文标题，后者 `aria-hidden` + `select-none`，
  和 12px 下限的豁免同理。

### 组件形状

`src/lib/components/shared/SectionHeader.svelte`：

```svelte
<script lang="ts">
	interface Props {
		/** 必须保留 —— 四个 section 用 aria-labelledby 指向它 */
		id?: string;
		eyebrow?: () => string;
		heading: () => string;
		sub?: () => string;
		/** 居中只在明确记录过理由的地方用 */
		align?: 'left' | 'center';
		/** 右侧的「查看全部」一类链接 */
		action?: Snippet;
	}
</script>
```

**迁移时最容易踩的坑**：`aria-labelledby` 的四个 id 必须原样保留 ——
`home-academics-heading`、`home-results-heading`、`journey-heading`、`home-featured-heading`。
删掉其中任何一个，`<section>` 的无障碍名就没了，而 **axe 不会报错**（没有名字的 section
是合法的），`a11y.spec.ts` 照样绿。

### 迁移顺序（每步跑一次 `npm run check && npm test`，最后整轮 e2e）

1. **ResultsStrip + JourneyStrip** —— 两个 11px 的伪标签 h2 升成真标题。收益最大、风险最小。
2. **AcademicsShowcase / ProgramsShowcase / ImpactStats** —— 已经是 `text-2xl md:text-4xl`，
   只是换组件、把居中改成左对齐。
3. **StudentHighlights / FeaturedSection** —— 两个偏小的 h2 升到统一档。
4. **ContactSection** —— 最后，并带上对 §8.2 注释的决定。
5. **MissionSection 的两个支柱标题** —— 它们不是 section header，是卡片标题，走 3xl 档。

跑完更新 `docs/DESIGN-TOKENS.md` §10（PR #19 新加的那节）把阶梯表写进去。

---

## 三、摄影素材（卡点：素材本身）

### ⚠️ 先更正批评文档的一个事实错误

批评说「两张卡用了截图（AI Entrepreneurship Bootcamp：一张幻灯片；Hands-On Innovation：一个网页）」。
我把两张原图都打开看过 —— **只有一张是截图，另一张是真照片，所以处方不一样。**

#### (a) `assets/programs/app.png` —— 是截图，而且问题比批评说的大

1792×1546，用在 `StudentHighlights` 第 6 张卡「Hands-On Innovation」。它是一个产品落地页的截图：

- 页头品牌写 **QuizR**，而正文第一句写 **"LevelQ uses advanced AI to generate…"** ——
  **同一张图里两个产品名互相矛盾**，像个没定稿的半成品；
- 它自带整套导航与 **"Get Started" / "Sign In" / "Pricing"** 按钮 ——
  等于在 Ithaca 自己的卡片里放了一套**别家的转化入口**；
- 它的青色接近但不等于 Ithaca 的品牌青，并排看会显脏；
- 底部还有 "246+ Unit Tests / 10 DB Tables / IRT-Powered" 这类面向开发者的指标。

卡片是 `aspect-square`（移动）/ 马赛克格（桌面）+ `object-cover`，所以实际只会裁出中间一块大字标题，
再压上卡片自己的标题 —— 批评说的「图里的文字和叠加标题互撞」属实。

> **建议：这张不要「换一张更好的截图」，建议直接撤掉这张卡或换成照片。**
> 一个学生做的产品当然值得展示，但展示方式应该是「学生在做这件事」的照片 + 文字说明，
> 而不是把半成品落地页原样贴在机构首页上。这件事超出设计范畴，需要你拍板。

#### (b) `assets/programs/ai-bootcamp/AI-Entrep_68.jpg` —— 是真照片，不用换

1920×1280，用在 `ProgramsShowcase` 的 AI Bootcamp 卡。内容是**两名学生西装、持麦、在亚克力讲台后作路演**，
身后投影着他们自己的竞品分析页。这是很好的学生摄影，批评把它判成「一张幻灯片」是错的。

真正的问题窄得多，而且是**构图**不是**素材**：

- 投影字「Closest competitors: Toast (POS) / Self-serving kiosks (eg. McDonald's) / QR ordering tools」
  在画面上半部清晰可读，喧宾夺主；
- 画面下沿还有「…ble to restaurant / …compared to」的半截字，而卡片的渐变与标题正压在下沿。

> **建议：裁剪，不要替换。** 两名学生在画面中左，裁一个更紧的构图（人物占满，投影只留虚化背景）
> 就同时解决这两点。或者从同一组照片里换一帧 —— 这是同一次活动的连拍，大概率有不带大字的帧。
> 附带好处：裁掉之后首页也不再清晰地印着 McDonald's 和 Toast 的品牌名。

#### (c) 已经挂着的那条，顺便一起解决

`ProgramsShowcase.svelte:13-15` 有一条现成的 `TODO(asset)`：AI Investment Lab 没有自己的照片，
现在借用 AI Bootcamp 的一张外拍帧（`AI-Entrep_05.jpg`）。三件事并成一份拍摄清单最省事。

### 拍摄 / 选片规格

| 用途 | 最小宽度 | 构图要求 |
|---|---|---|
| `ProgramsShowcase` 大格 | 1920px | `sizes` 为 66vw，1400px 容器下渲染约 924px，2× 即 1848px |
| `ProgramsShowcase` 小格 | 1200px | 34vw ≈ 476px，2× 即 952px |
| `StudentHighlights` 各格 | 1200px | 桌面列宽 360–520px，2× 即 1040px；移动端 50vw |

**所有卡片共通的一条**：卡面渐变是 `from-overlay/95 via-overlay/70 to-transparent`，
即**下三分之一会被压暗并叠上标题与说明文字**。所以选片时下三分之一要留给「可以被盖住的内容」——
不要是人脸，不要是关键文字。这条在 `AI-Entrep_68.jpg` 上正好踩中了。

---

## 建议的推进顺序

```
1. 第三件的 (b) 裁图        最便宜，一次裁剪，立刻见效
2. 第一件                   等你定两句文案（CTA 标签 + /contact-us 的分流句）
3. 第三件的 (a)             需要你拍板是撤卡还是补拍
4. 第二件                   需要整块时间 + npm run dev 下肉眼迭代
```

第一件和第二件都会动 `docs/DECISIONS.md`：前者要记「首页转化并入 M-4 的 `#book` 机制」，
后者要记字号阶梯的收敛与 §8.2 的处置。
