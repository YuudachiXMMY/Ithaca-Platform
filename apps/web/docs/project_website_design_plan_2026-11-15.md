# 首页设计批评 → 执行方案（2026-11-15）

**输入**：`project_website_design_critique_2026-11-15.md`
**对象**：`apps/web`（ithacateens.com），核验基线 = `main` @ `c9f4950`
**模式**：方案，未改任何代码。
**设计方向**（落 `.impeccable.md` 用，草稿见文末附录）：institutional calm premium。

每条批评都回到代码核验过，不照抄。结论分四档：

| 档 | 含义 | 条数 |
|---|---|---|
| ✅ 确认 | 代码里确有此事，可直接动手 | 9 |
| ♻️ 重写 | 现象是真的，但批评给的诊断或处方错了 | 3 |
| ❌ 驳回 | 与当前代码不符 | 2 |
| ⛔ 冲突 | 与 `+page.svelte` / `DECISIONS.md` 里已记录的决策正面冲突，需要你先裁决 | 2 |

---

## 一、先看两处冲突（动手前必须你拍板）

批评文档的第 1、2 条优先建议不是「还没做」，而是**推翻已经做过并写下理由的决策**。

### ⛔ C-1 重写首屏（批评优先级 1）

`src/routes/+page.svelte:19-21` 写着：

> The Cavafy quotation hero and the Our Approach pillars are untouched — both are **brand-locked with the 11-04 brochure**.

批评的处方是「一行定位语当主标题，Cavafy 降为 kicker，换含学生的 hero 图，Mission 折进首屏」。四件事全部落在 brand-lock 范围内。另外两个附带成本：

- `HeroSection.svelte:30-37` 的 poster 带 `fetchpriority="high"`，`DECISIONS.md` #7 记着 hero 视频是为 LCP 砍掉的（2026-09-11 基线 12.6s LCP / 5.85MB）。换图要重跑 LCP。
- Mission 承载**全页唯一的 `<h1>`**（`MissionSection.svelte:52`）。折进首屏等于重排 heading 结构，`e2e/` 里有单 h1 断言。

**批评本身的论证是站得住的**：首屏确实没有一句话说明「这是谁、在哪、提供什么」，唯一的描述词 "Family Academy" 烤在 48px 的 logo 位图里（`Header.svelte:27`、`:390`）。而站点主要入口是微信分享（`nav.ts:29` 以下、`AcademicsShowcase.svelte:11` 都以此为前提），也就是说**绝大多数访客到达时对 Ithaca 一无所知** —— 这恰好是「首屏必须自我介绍」的最强论据，而且是项目自己文档里写的。

**成本最低的折中**（不碰 brand-lock，不碰 LCP 图）：在 `HeroSection.svelte:64` 那行作者署名的位置，或 CTA 上方，加一行 16-18px 的定位语（offer + 受众 + 地点），Cavafy 引言与图都不动。一次 message 新增 + 一处 markup，可独立评估效果。

→ **需要你选**：(a) 维持 brand-lock，只加这一行定位语；(b) 解锁，按批评全量重写首屏；(c) 两条都不做。

### ⛔ C-2 页面重排（批评优先级 2）

批评要的顺序：Hero → Journey → Academics + Programs → Results → 压缩版 Approach → Highlights → Contact。

现顺序与逐条理由在 `+page.svelte:16-30`，是 2026-11 的刻意重排，三条论证分别是：Journey 先于任何单个产品带、Academics 先于 Programs（「家长不该为了确认我们教 AP 而先滑过一台赛车」）、Results 紧跟 Programs（且这是 Results 退出导航栏换来的补偿，见 `nav.ts`、`ResultsStrip.svelte:10-14`）。

**这三条批评其实没有反对** —— 它要动的实质只有一件事：把 Mission/Approach 从第 2 位挪到 Highlights 之前并压缩。批评测得 Mission + Approach 在移动端占 2,161px（2.7 屏），全页 9,939px。看代码可以印证密度确实低：`MissionSection.svelte:80-112` 是两个 `py-14 md:py-20` 的交替图文行，加 `:118-143` 一个 `min-h-[clamp(24rem,55vh,34rem)]` 的整幅收尾带 —— 三个支柱各占一个大块，信息量是各一个标题加一段话。

但 Approach 同样 brand-locked。**可做的无冲突版本**：保留顺序与锁定，只压缩垂直尺寸 —— 两个图文行的 `py-14 md:py-20` 收一档、收尾带的 `min-h` 下调。这拿回约 2-3 屏而不触碰任何决策。

→ **需要你选**：(a) 只压缩 Approach 的高度，顺序不动（推荐）；(b) 按批评把 Approach 后移并改成三列一行，同步改 `+page.svelte` 注释和 `DECISIONS.md`；(c) 不动。

---

## 二、❌ 驳回两条（代码里不是这样）

| # | 批评原文 | 核验结果 |
|---|---|---|
| R-1 | "Hero quote is marked up as paragraphs, not a blockquote" | **不成立**。`HeroSection.svelte:48` 就是 `<blockquote>`，四行 `<p>` 在它里面 —— 这是 blockquote 的正确用法。无需改动。 |
| R-2 | "Inquiry form marks *Student's grade* as required inside a block titled optional" | **不成立**。`EnquiryForm.svelte:428-433`：`<label>` 文案是 `contact_form_gradeLabel` = "Student's grade"，不带任何 required 标记；`<select>` 没有 `required` 属性（全文件搜 `required` 只命中一条注释：「Only `name` and `email` are required」）；首项是空值 `contact_form_gradeUnset`；`/api/contact` 的 Zod schema 里它是 optional。整条链路上没有任何地方把它标成必填。 |

R-2 大概是把浏览器对同组内别的字段的原生提示读串了。两条都不要动。

---

## 三、♻️ 重写三条（现象真、诊断错）

### ♻️ W-1 「五条赛道」与「7 Programs」的计数

批评说「'View all five tracks' 配四张卡，IB 被点名却没有卡片」和「'7 Programs' 配四张节目卡」，处方是「补 IB 卡片」。两个诊断都不对，但底下各藏着一个真问题。

**赛道数**：`/academics` 实际是**正好五条** —— AP、OSSD、SAT/ACT、University Support、Tutoring（`src/routes/academics/+page.svelte:44-61`，`nav.ts:88-94` 一致）。所以 "View all five tracks" 是**真话**。首页只放四张是刻意的，理由写在 `AcademicsShowcase.svelte:16-23`：省掉的是 One-to-one Tutoring（GTA 每家机构都做，最不具区分度）。**IB 从来就没有卡片，也不该有。**

**但 IB 这里有个真问题，批评擦到了边**：IB 在文案里被当作一条独立赛道宣传 —— `journey_academic_line`（首页 Journey 正文）、`academics_hero_description`、`metadata_academics_description` 都把它和 AP/OSSD/SAT 并列成「六条」。而站点只有五条，IB 实际只存在于 tutoring 之内（`academics_tutoring_cardDescription`、`tutoring_hero_description` 都只说「单科 AP/IB/OSSD 支持」）。**这是文案承诺大于交付**，而不是缺一张卡片。
→ 处方：三处文案把 IB 的并列地位降级（例如改为「AP、OSSD、SAT/ACT、大学课程支持，以及覆盖 AP/IB/OSSD 的单科辅导」），或者给 IB 建真实赛道页。前者是三条 message 的改动，后者是产品决策。

**「View all five tracks」的残余问题**：literal 为真，但一个写着「五条」的链接压在四张卡上方，读者第一反应是数不对。
→ 处方（便宜）：把「四中之五」说清楚，例如副标题 `home_academics_subheading` 或链接文案改成「Four of five tracks · View all」。不要补卡片。

**「7 Programs」**：`src/lib/content/stats.ts:34` value=7，source 写着「/programs 的六条 `Program` 记录 + Research Lab（owner ruling 2026-11-14）」—— 有出处、经得起查。它和首页四张卡也不相邻（`ImpactStats` 在 `ResultsStrip` 之后，隔了一个 section）。批评的「四张卡旁边写 7」在渲染顺序上不成立。
→ **但我自己查出一处真的文档腐烂**：`stats.ts:28-33` 的注释开头写着 "Still **six** after the 2026-11 revamp"，紧接着 `value: 7`。注释和值自相矛盾，`source` 字符串才是对的。这条注释要改（独立于本次设计工作，属于 bug）。
→ 另外批评的「把这个数字链到 /programs」是个不错的小改进，卡片四张、数字七个，一个链接就能消解。

### ♻️ W-2 语言提示浮层

**现象确认**：`LocaleSuggestion.svelte:252` 是 `fixed top-[calc(6rem+0.75rem)] right-3 z-30`，不随滚动消失，只有点掉才走。批评实测它遮住了 mission 标题、一个支柱标题、Journey step 03 和 University Support 卡片 —— 以这个定位，可信。

**但批评的处方「改成 header 上方的细条」会踩进一块雷区**：`LocaleSuggestion.svelte:44-79` 用 36 行记录了这个 z-index 和偏移量是怎么一寸寸试出来的 —— `PopupBanner` 占 `z-50` 底部通栏、`Header` 是 `fixed z-40` 且画在它上面、移动端抽屉和 backdrop 是 `</header>` 的**兄弟节点**所以 z 在根层叠上下文、桌面 dropdown 是 header 后代所以跟着 header 走。还有一条已经被 `e2e/locale-suggestion.spec.ts` 抓过的回归：偏移量取 token 而非「未滚动时的实际 bar 高度」，会让卡片滑到通栏 `z-40` 底下、dismiss 按钮点不着。改成 header 上方的通栏条等于重做这整套层叠，并且会挤压布局（CLS）。
→ **处方取批评的第二个选项**：首次滚动即自动消失。这是在现有 `close('dismissed')` 路径上加一个 scroll 监听（文件里已有 `Decision` 类型和 `close()`，`:188`），不动任何定位和 z-index。顺手给 `e2e/locale-suggestion.spec.ts` 加一条「滚动后卡片消失」。

### ♻️ W-3 Ithaca Dialogue 的命名

批评说「卡片写 Ithaca Dialogue，URL 是 /programs/ithaca-dialogues，二者挑一个」。

核验：**所有面向用户的文案都是单数 "Ithaca Dialogue"**，完全一致（`home_programs_elite_title`、`about_highlights_andySong_program`、`about_programs_eliteInterviews_label`、FAQ 正文）。复数只出现在 slug 和 message key 里。

而这个 slug 是承重的：`$lib/program-cta` 按 slug 生成全部七个节目 CTA（`DECISIONS.md` K-3，`program-cta.test.ts` 对每个 live slug 回跑解析），`season-contract.test.ts` 按 slug 串联节目页/卡片/JSON-LD，再加 sitemap 和已被索引的线上 URL。改 slug = 加 301 + 吃一轮 SEO 波动，换来的用户可见收益是**零**（没人对着 URL 读单复数）。
→ **驳回改 slug**。如果一致性确实让人不适，便宜的方向是反过来：把文案改成复数 "Ithaca Dialogues" 对齐 slug（约 5 条 message，两个 locale）。但这是品牌命名，归你。我的建议是两边都不动。

---

## 四、✅ 确认九条（无冲突，可直接做）

按「收益 / 成本」排，分三批。

### 批次 1 — 可访问性下限（批评优先级 5，最该先做）

| # | 问题 | 位置 | 处方 |
|---|---|---|---|
| A-1 | newsletter 邮箱输入框只有 placeholder，没有 label 也没有 `aria-label` | `NewsletterForm.svelte:113-122` | 加 `aria-label={m.newsletter_emailLabel()}`（或 sr-only `<label for>`）。新增一条 message × 2 locale。**这是真 bug，不是品味问题** —— 读屏用户在这个字段上听不到任何提示。 |
| A-2 | 正文区 29 个元素小于 12px | 首页实测：`text-[11px]` × 12、`text-[10px]` × 2、`text-[9px]` × 1。具体：`HeroSection.svelte:64`（署名）、`MissionSection.svelte:49,71`（eyebrow）、`ResultsStrip.svelte:37`（h2）、`JourneyStrip.svelte:71,85,92,112`、`StudentHighlights.svelte:109,162,172`、`ProgramsShowcase.svelte:129` | 设 12px 下限：`text-[11px]`/`[10px]`/`[9px]` → `text-xs`(12px)。注意 `StudentHighlights.svelte:150` 的 48/64px 大数字是 `aria-hidden` 装饰，不在此列。eyebrow 收字号会动 `tracking`，需要一轮视觉确认。 |
| A-3 | 移动端触控目标：行内链接 20px、footer 链接 17px、法务链接 16px，低于 WCAG 2.2 的 24px | footer 文字块 `Footer.svelte:155` 是 `text-xs`；行内链接散落在各 section | 给链接加垂直 padding 凑到 44px（批评建议值，高于 WCAG 底线）。纯 padding，不影响视觉尺寸。 |
| A-4 | 两张截图卡上的文字与叠加标题互撞，照片上的对比度在实际中不达标 | `StudentHighlights.svelte` 的 `appImg`（`assets/programs/app.png`，一个网页截图）与 AI Bootcamp 的幻灯片帧 | 换成照片。这是素材缺口不是代码问题，`ProgramsShowcase.svelte:13-15` 已经为 AI Investment Lab 挂了同类 `TODO(asset)`。建议并入同一份素材清单。 |

### 批次 2 — 一致性（成本中等，收益在「看起来是一套」）

| # | 问题 | 位置 | 处方 |
|---|---|---|---|
| S-1 | section header 三种形制、两种对齐 | eyebrow + 大标题（`MissionSection.svelte:49-56`，左）；eyebrow 单独当 11px h2（`ResultsStrip.svelte:37`、`JourneyStrip.svelte:71`）；大标题无 eyebrow（`AcademicsShowcase.svelte:44` 左 / `ProgramsShowcase.svelte:149` 居中 / `ImpactStats.svelte:59` 居中 / `ContactSection.svelte:124` 居中 / `StudentHighlights.svelte:105` 左） | 抽一个 `shared/SectionHeader.svelte`（eyebrow? + h2 + 可选 subheading + 可选右侧链接），统一左对齐。顺带解决 A-2 里 Results/Journey 的 11px h2 —— 它们当前**是 h2 却长得像标签**，这正是批评「强调方向与说服力倒挂」的机制。 |
| S-2 | 首页在用 16 种字号（9px–64px），section 标题落在 24/30/36/44 四档 | 统计见上。h2：`text-2xl md:text-4xl`（24/36）× 3、`text-xl md:text-3xl`（20/30）× 1、`text-3xl md:text-[2.75rem]`（30/44）× 1、`font-mono text-[11px]` × 2 | 收到约 8 档，section h2 只保留一档。注意 `ContactSection.svelte:121-123` 的注释：44px（`2.75rem`）是 §8.2 规定的 h2 上限且是刻意取到顶的，收敛时要么以它为唯一值、要么同步改那条注释和 §8.2。 |
| S-3 | eyebrow 和统计数字用 `ui-monospace` 系统栈，字形随操作系统变 | `app.css:319-321,349,464-465` 只定义了 `--font-sans` / `--font-display`（Manrope + Inter + Noto Sans SC），**没有 `--font-mono`** → 所有 `font-mono` 落到 Tailwind v4 默认系统栈。批评的诊断准确。 | 两条路：① 载入一款 mono（+ 一个字体请求，和 `DECISIONS.md` 的 LCP 纪律冲突，要先量）；② 数字改用 Manrope 的 tabular figures（`font-variant-numeric: tabular-nums`，零新增请求）。**推荐 ②**，统计数字（`ImpactStats.svelte:75`）尤其该这么做 —— tabular 本来就是数字对齐的正解。eyebrow 则可以直接用 display 字体加大 tracking。 |
| S-4 | logo 是 96×96 位图显示在 48px，wordmark 烤在图里 | `Header.svelte:27-28`（`logo.png?enhanced&w=96;192;288`、`logo-ink.png`）、`:390` | 换成 SVG 标记 + 实文字 lockup。顺带解决两件事：C-1 说的「唯一描述词不可读」，以及 `Header.svelte:380` 记录的「header logo 在 `/` 和 `/zh` 的 18 个样本里全是 LCP 元素」—— SVG 会让那个 LCP 大幅变轻。`:177-180` 记着明暗两套位图是因为原图 wordmark 是 50% 白；实文字 lockup 一次性消掉这个双图维护。**这条的性能收益可能比设计收益大。** |

### 批次 3 — 转化路径与内容（需要一点文案决策）

| # | 问题 | 位置 | 处方 |
|---|---|---|---|
| T-1 | 三个转化标签指向两个目的地：header "Admissions" → `/admissions`，"Get in touch" 和 "Contact Us" → `/contact-us`，而 `/contact-us` 不解释区别 | `HeroSection.svelte:76`、`ContactSection.svelte:169-182`、`nav.ts` | 统一成一个主标签。批评建议 "Book a free consultation"，对齐收尾段已经承诺的 20–30 分钟咨询。注意 `DECISIONS.md` M-4：节目页 CTA 已统一到 `/admissions?program=<slug>#book`，并由 `program-cta.test.ts` + `admissions-funnel.spec.ts` 钉死。**首页应该并进这套既有机制，而不是另起一套** —— 也就是说首页主 CTA 指向 `/admissions#book`，`/contact-us` 退为次级（一般咨询）。这比批评的处方更贴合现状。 |
| T-2 | WeChat 只在 footer，收尾联系块只有地址/电话/邮箱 | `Footer.svelte:123-132` 已有 `contact/WeChatQr.svelte`（带 `location` 和 `showId`）；`ContactSection.svelte:136-167` 没有 | 在 Get in Touch 块复用 `<WeChatQr location="home_contact" />`。组件现成，一行。**`Footer.svelte:123-126` 的注释本身就是最强论据**：微信是本站主要到达路径，家长在微信内置浏览器里长按二维码比填一个会失败的表单更可行，而那条注释正是在说 `wechat_qr_view` 事件因此几乎测不到 —— 把二维码放进转化区同时解决曝光和可测量性。 |
| T-3 | highlight 卡描述被省略号截断且无法展开 | `StudentHighlights.svelte:167`（`line-clamp-3` 标题）、`:172`（`line-clamp-2` 11px 描述）；`<article>` 不可点击，整个 section 只有末尾一个 `/news` 链接（`:208`） | 两条：① 砍文案到放得下（`:156-159` 的注释已说明 clamp 是为了防长标题把描述挤出最小格 380×42%）；② 每张卡链到对应 `/news` 条目。②更好但需要 news 侧的对应条目存在。可先做①。 |
| T-4 | 窄桌面宽度下联系信息行在数值中间断行（电话、邮编） | `ContactSection.svelte:136`（`flex ... sm:flex-row sm:justify-center sm:gap-6`）、`:149,157`（`text-sm` 值，无 `whitespace`） | 给电话和邮编加 `whitespace-nowrap`。两个 class，零风险。 |

### 另外：批评没提，我查出来的

| # | 问题 | 位置 |
|---|---|---|
| X-1 | `stats.ts` 注释与数值自相矛盾：注释写 "Still **six** after the 2026-11 revamp"，紧跟 `value: 7`。`source` 字符串（6 records + Research Lab）是对的，注释是腐烂的。 | `src/lib/content/stats.ts:28-34` |
| X-2 | IB 在三处文案里与 AP/OSSD/SAT 并列成独立赛道，但站点只有五条赛道、IB 只存在于 tutoring 之内 —— 文案承诺大于交付。 | `journey_academic_line`、`academics_hero_description`、`metadata_academics_description`（见 W-1） |
| X-3 | 批评提到「一个空的未命名 iframe」。我这次没定位到它（渲染态问题，静态读码看不见）。如果要清，需要跑起来抓 DOM。 | 待定 |

---

## 五、建议的执行顺序

```
第 1 步  A-1 newsletter label        真 a11y bug，10 分钟，无争议
第 2 步  T-4 nowrap + T-2 WeChat QR  两处各一两行，立即见效
第 3 步  W-2 首滚即消的语言提示       不碰层叠，加一条 e2e
第 4 步  A-2 + A-3 字号与触控下限     需要一轮视觉确认
第 5 步  S-1 SectionHeader 组件       带走 S-2 的一半和「强调倒挂」
第 6 步  S-3 tabular-nums            零请求
第 7 步  S-4 logo 换 SVG             设计 + 性能双收益，要新素材
第 8 步  T-1 统一转化标签             并进 M-4 的既有机制，需要你定文案
第 9 步  X-1 / X-2 文案与注释修正
挂起     C-1 / C-2                   等你裁决
挂起     A-4 / T-3②                  等摄影素材
```

每批次完成后按项目规矩跑 `npm run lint && npm run check && npm test && npm run i18n:check`（`apps/web` 内）。涉及 e2e 的（W-2、A-3）还要 `npm run build && npm run test:e2e`。

文档同步义务（`CLAUDE.md`「文档维护」）：A-2/S-2 改字号 → `docs/DESIGN-TOKENS.md`；S-3 改字体栈 → 同上；T-1 改转化路径 → `docs/DECISIONS.md` 追加一条；若 C-1/C-2 解锁 → 改 `+page.svelte:16-30` 的注释并在 `DECISIONS.md` 记明作废了哪条。

---

## 附录：`.impeccable.md` 草稿

技能要求设计上下文落盘。以下从 `prd.md` / `DESIGN-TOKENS.md` / `DECISIONS.md` / `nav.ts` 读出，按你确认的方向写。**本次未创建此文件**（方案模式），要用的话我再落。

```markdown
# Design Context — apps/web (ithacateens.com)

## Target audience
安省（主要是 GTA）华人家庭的家长，以及 9–12 年级学生。主要到达路径是**微信分享**
——绝大多数访客在落地时对 Ithaca 一无所知，且相当一部分在微信内置
WKWebView 里浏览（不自动播放视频、表单提交失败率高）。

## Use cases
1. 家长评估一家升学/项目机构：先确认「教不教 AP/OSSD」，再看有没有成果。
2. 家长或学生找一个具体项目（EV、AI Bootcamp、Dialogue、Investment Lab）。
3. 已决定的人要尽快约上一次 20–30 分钟咨询。
4. 微信内长按二维码加顾问，而不是填表。

## Brand personality / tone
Institutional calm premium。克制的 teal + navy，真实学生摄影，具名证据
（AIEC 2026、Hinton 讲座、Moridi 博士、Sedra 设计中心），不炫技。
Manrope（display）+ Inter（body）+ Noto Sans SC（中文）。
明亮为主：§8.2 已把全站从深色迁到浅色，照片上的 scrim 是可读性手段而非深色残留
（DECISIONS D-4）。

## Constraints
- SvelteKit 2 + Svelte 5 runes，Paraglide 做 URL 式 i18n（en / zh），**无数据库**。
- LCP 是纪律而非愿望：hero 视频为此砍掉（DECISIONS #7），header logo 是 `/` 和
  `/zh` 的实测 LCP 元素。任何新字体/新大图都要先量。
- 可访问性有 e2e 闸门：`e2e/a11y.spec.ts`、`header-contrast.spec.ts`
  会抓对比度回归；band / non-band token 的分野见 DESIGN-TOKENS §2。
- 文案一律走 Paraglide，两个 locale 必须同步（`npm run i18n:check`）。

## Brand locks (2026-11)
- Hero 的 Cavafy 引言
- Our Approach 三支柱
两者与 11-04 宣传册绑定，改动需所有者裁决。

## Differentiation
名字本身：Cavafy 的《Ithaca》—— 旅程重于终点。站点结构就是这个隐喻
（01 Academic → 02 Projects → 03 Research 三块板）。记得住的那一件事应该是
「这家机构把路径讲清楚了」，不是某个视觉效果。
```
