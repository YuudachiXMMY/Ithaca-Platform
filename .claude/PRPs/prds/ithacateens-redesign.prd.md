# ithacateens.com 重设计

> **本文件取代 `prd.md` 的框架层决策（§2 D1/D5、§8.2、§10、§15），但保留其需求 ID（`R-HOME-3` 等）与页面细则（§6、§7）作为详细规格。**
> 两份文件冲突时以本文件为准；`prd.md` 剩余部分继续作为实现细节的查阅源。
>
> 生成于 2026-09-29 · 状态：DRAFT，含 12 项待业主确认的开放问题

---

## Problem Statement

Ithaca Family Academy 的招生对象家长群体以中文为母语、主要通过微信链接在手机上访问官网，但站点把他们导向一个 5 字段的通用联系表单——没有项目选择、没有年级、没有语言偏好、没有咨询预约，也没有任何关于招生流程、开课季度、学费或退费政策的信息。同时机构手上最强的说服材料（AIEC 2026 大奖、滑铁卢 EV Challenge 参赛、校友 2025 年 9 月入读普林斯顿）要么埋在页面深处，要么被一个服务端渲染成 `0+` 的统计模块代表。

不解决的代价：已经付出获客成本引来的中文家长流量，在"想了解怎么报名"这一步无路可走，只能退回微信私聊——这条路径不可度量、不可扩展，且完全依赖单个人的响应速度。

## Evidence

**已在代码中证实：**

- 统计数字服务端渲染为 `0+`：`src/lib/components/home/ImpactStats.svelte:17` 用 `new Tween(0, ...)` 初始化，`started` 初值 `false`（:19），非 reduced-motion 分支渲染 `{Math.floor(counts[i].current)}{stat.suffix}`（:56）。在 `oninview` 触发前（:36），SSR 与首帧输出的字面值就是 `0+`。
- 联系表单只有 5 个字段：`src/routes/contact-us/+page.svelte:219-277` — name / email / phone / message / subscribe。无 program、无 grade、无语言偏好。提交走 `fetch('/api/contact')`（:64-68），无 captcha（全仓库 `turnstile|recaptcha|hcaptcha` 零命中）。
- 不存在招生路径：`/admissions`、`/results`、`/events` 三条路由在 `src/routes/` 下均无目录、无 nav 条目（`src/lib/data/nav.ts:13-27` 顶层仅 home / aboutUs / programs / contactUs）、无注释残留。
- **导航只露出 6 个项目中的 3 个**：`nav.ts:19-24` 的 Programs 下拉只有 `evTeam`、`aiEntrepreneurshipCamp`、`eliteInterviews` 三条真实项目 + 一条 `otherPrograms` 兜底指回 `/programs`。`engineering-projects`、`summer-winter-camps`、`ithaca-night` 无法从导航直达，只能经索引页。
- 不存在内容模型：`src/lib/data/` 只有 `nav.ts` / `programs.ts` / `team.ts` / `contact.ts`，其中 `ProgramCard`（`programs.ts:3-16`）只有 `id/href/image/imageAlt/span`。无 Season、无报名状态、无学费概念。EV 页的季度编号、年级段、时长、上课节奏、开课窗口全部是 `src/routes/programs/ev-challenge/+page.svelte:22-27` 里的裸字面量。
- 分享卡片全站同图：`src/lib/seo.ts:11` 写死 `ogImage: '/media/images/site/logo.png'`，`src/routes/` 下零处覆盖 —— 每个页面被分享到微信/iMessage 时缩略图都是 logo。
- 结构化数据只有 Organization：`src/routes/+layout.svelte:36` 构造 `orgJsonLdScript`，:78 注入。无 Course / CourseInstance / Event / BreadcrumbList。
- 首页 Student Highlights 在 DOM 中渲染两次：`StudentHighlights.svelte:123-136`（mobile grid，`md:hidden`）与 `:139-190`（desktop mosaic，`hidden md:block`）都是无条件渲染，靠 CSS 切换而非 `{#if}`。标签错配已确认：`home_highlights_item3Title` 描述的是 Sedra Student Design Centre 参访，标签却是 "Interview"；`item5Title` 是 Geoffrey Hinton 场次，标签是 "Showcase"。桌面端 4 个 stack 格子（索引 1/2/4/5，:178/:181）恒传 `showDescription=false`，其 caption 永不渲染。

**市场侧（外部来源，附链接）：**

- 私立 K-12 学校官网访客 → 咨询表单转化率多数低于 2%，建议目标 3–5%；桌面端转化率比移动端高 17.6%，尽管移动流量是桌面的 6 倍。<https://cubecreative.design/blog/private-school-marketing/website-conversion-benchmarks>
- 教育类落地页转化率中位数 8.4%（全行业 6.6%）。<https://unbounce.com/conversion-benchmark-report/education-conversion-rate/>
- 微信内置浏览器（iOS WKWebView）不会像 Safari 一样播放 `<video autoplay>`，且第三方站点**无法**修改微信自己的 WebView 配置；只有 `muted + playsinline` 的静音循环视频能稳定内联播放。<https://www.thomasvisser.me/2018/06/26/wkwebview-media/> · <https://developers.weixin.qq.com/doc/subscription/en/guide/h5/adapt_ios.html>
- Hero 自动播放视频实测为 LCP +3.2s 的主因（浏览器优先下载视频、挤占关键 CSS/字体带宽）。<https://mintec.co/blog/video-lcp-hero-performance-2026/>
- 参考站 itorontoacademy.com 的中文版走 `/Chinese/` 子路径 + 独立域名 `tiaschools.cn` 双轨制，说明官网本身仍需承担中文转化面，微信/小红书是上游获客而非替代。<https://www.itorontoacademy.com/Chinese/pages/facultyAll.php>

**尚未验证（假设，需要业主或数据确认）：**

- 当前询盘量/月、咨询预约量/月 —— 无基线。`ContactMessage` 表有历史数据可查，但本 PRD 编写时未查询。
- `/zh` 当前会话占比 —— GA 中应有数据，未查。
- `messages/zh.json` 现有 711 条中文是人工撰写还是机器翻译 —— `R-CONTENT-5` 要求人工撰写，当前状态未知。

## Proposed Solution

在**现有 SvelteKit 2 生产站上增量演进**，不重建。四条工作线：

1. **建立 `Season` 单一数据源**——所有日期、年级段、上课节奏、报名状态、学费从一条记录渲染，program 页 / 索引卡 / 首页卡 / 招生日历 / JSON-LD 全部读同一份。
2. **新建 `/admissions` 招生路径**——流程步骤、季度日历、学费披露、政策 FAQ、咨询预约；联系表单升级为含 program / grade / 语言偏好的合格化表单。
3. **新建 `/results` 成果页 + 首页统计数字服务端渲染真实值**——把奖项、竞赛结果、大学去向、导师从埋藏状态提到一屏之内。
4. **`/zh` 中文内容达到发布级**——§6.4 页面的中文为人工撰写，且过一遍 CJK 排版专项检查。

选择增量而非重建的理由：SvelteKit 站 2026-09-11 才上线生产，Next.js 树在 8/27 已删除；重建意味着丢弃整个 8 月的迁移工作量和已调优到 ≤4.0s 的 LCP 基线。缺的是**内容模型和招生路径**，不是框架。

## Key Hypothesis

> 我们相信，**一条母语为中文、可在手机上走完的招生路径（含项目/年级合格化字段与咨询预约），加上首屏可见的真实成果证明**，会把当前只能退回微信私聊的中文家长转化为**站内可度量的合格询盘**。
>
> 验证标准：`/admissions` 上线后连续 8 周内，(a) 站内询盘量相对基线有可观测增长，(b) 带 program + grade 字段的询盘占比 ≥ 60%，(c) `/zh` 会话占比相对基线上升。
>
> **基线尚未测量**——见 Phase 0。具体目标数值在拿到基线后填入，不在此处预设。

## What We're NOT Building

| 不做 | 原因 |
|---|---|
| 换框架到 Next.js | 已由业主决定推翻 `prd.md` D1；SvelteKit 站刚上线 18 天，Next.js 树已删除 |
| 迁移到 Vercel | 已由业主决定推翻 `prd.md` D5；现有 Docker + Traefik 蓝绿拓扑零迁移成本，且蓝端托管着生产数据库 |
| 在线支付、带文档上传的申请流程、家长/学生 portal | `prd.md` §3 非目标，归入 Phase 4 独立 PRD |
| CMS UI（Payload 等） | `prd.md` D4；本轮内容用仓库内 typed content |
| Blog / 每日简报归档 | `prd.md` §3 非目标 |
| 中国大陆主机或 ICP 备案 | `prd.md` §3 非目标 |
| 恢复首页 hero 自动播放视频 | 已被刻意移除以保 LCP（`HeroSection.svelte:5-7` 注释）；微信 WKWebView 不会自动播放，收益为零而 LCP 风险明确。`prd.md` R-HOME-1 的视频要求作废 |
| `prd.md` §10 的 React 组件库（Aceternity UI / React Bits） | React 专有，在 SvelteKit 下不可用 |
| 暗色模式切换 | `prd.md` §8.2 明确不做 |

## Success Metrics

| 指标 | 目标 | 测量方式 |
|---|---|---|
| 站内询盘量/月 | **TBD** —— 待 Phase 0 测出基线后设定 | `ContactMessage` 表按月计数 |
| 合格化询盘占比（含 program + grade） | ≥ 60% | `Inquiry` 表字段非空率 |
| 咨询预约点击量/月 | **TBD** | 分析事件 `booking_click` |
| `/zh` 会话占比 | 相对基线上升（基线 TBD） | GA，按路径前缀分段 |
| Program 页 → 询盘 CTR | **TBD**（行业参考：私校官网 < 2% 常见，3–5% 为良好目标，来源见 Evidence） | 分析事件 `program_cta_click` / 页面浏览 |
| 微信二维码曝光、电话点击 | 计数存在即可（当前为 0，无埋点） | 分析事件 `wechat_qr_view` / `phone_tap` |
| Lighthouse mobile（`/`、`/programs/ev-challenge`、`/contact-us`） | Performance ≥ 90 · A11y ≥ 95 · SEO ≥ 95 · Best Practices ≥ 95 | CI 门禁（`prd.md` R-PERF-1） |
| Core Web Vitals | LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 | 现有 `lighthouse.yml` 门禁已是 LCP ≤ 4500ms / CLS ≤ 0.05，需收紧到本目标 |
| axe-core | §6.4 页面双语零 serious/critical | Playwright + axe（**当前 CI 不存在此门禁**） |

> ⚠️ 所有标 TBD 的指标都**不要**凭空填数字。Phase 0 的唯一产出就是这些基线。

## Open Questions

来自 `prd.md` §20 且仍未解决：

- [ ] Q1 公开邮箱：线上站暴露的是个人地址；当前代码里 `api/contact/+server.ts:16` 硬编码 `STAFF_EMAIL = 'jadyn.wu@ithacafo.com'`。需要一个角色地址（如 admissions@）
  - 使用 `info@ithacateens.com | app_aaaaaaxwr99wk21bl7joo9knasvttfobwr0a`
- [ ] Q2 统计数字：students / programs / mentors / projects 的真实值与出处（`Stat.source` 必填，无出处则不渲染该项）
  - 先沿用现有的，后续提醒我
- [ ] Q3 每个 season 的学费与包含项；退费、出勤、安全政策文本
  - 先留placeholder，后续提醒我
- [ ] Q4 Joshua Wang / Jadyn Wu / Kristen Perry / Grant Bourne 的完整简介；讲师名单
  - 先保留placerholder，后续提醒我
- [ ] Q5 合作方/场地 logo 使用许可（Honda、滑铁卢大学、金融机构参访东道主）
  - 没有问题
- [ ] Q6 微信二维码图片、小红书账号、预约链接（`BOOKING_URL`）
  - 微信使用 `static/media/images/qrcode/Joshua-WeChat.jpg`, 小红书账号先不放，后续提醒我
- [ ] Q7 新增 result / testimonial / 未成年人照片的知情同意确认
  - 先用通用模板
- [ ] Q8 上线目标日期与要对齐的招生节点
  - 好的

本次调研新发现，需要决策：

- [ ] **Q9 字体是否也按 §8.2 换**：你已选定按 §8.2 重做色板。但 §8.2 同时指定 Manrope（display）+ Inter（body），而当前是 `@fontsource/outfit` + `@fontsource/noto-sans-sc`（`app.css:27-28`，Noto Sans SC 仅在 `/zh` 加载）。**建议保留 Outfit**——换字体会影响所有 `clamp()` 排版尺度与 LCP 字体加载策略，收益不明确。需你确认。
  - 字体按照8.2更换
- [ ] **Q10 分析工具**：`prd.md` D6 默认 Plausible，但 GA4 已在 `hooks.server.ts:25-27` 接好且自托管无 Vercel Analytics 绑定。**建议启用 D6 的 override 分支（GA4），不引入 Plausible。**
  - 采用建议D6
- [ ] **Q11 邮件发送**：`prd.md` §12 指定 Resend，但 `src/lib/server/mail.ts` 的 nodemailer SMTP 已有实现 + 测试 + SMTP 未配置时的优雅降级。**建议保留 nodemailer，不引入 Resend。**
  - 保留 nodemailer，不引入 Resend
- [ ] **Q12 中文文案来源**：`messages/zh.json` 现有 711 条，是人工撰写还是机翻？`R-CONTENT-5` 要求人工。若为机翻，Phase 7 的工作量要按"全量重写"而非"补缺口"估。
  - 先用机翻，后续人工审查

发现的文档漂移（不阻塞，但应修正）：

- `CLAUDE.md` 与 `docs/CUTOVER.md` 称遗留 `AdminUser` 模型"保留至 cutover 验证完成"，但当前 `prisma/schema.prisma` 与 `prisma/migrations/` 中**已不存在该模型**。CLAUDE.md 的"不要写 DROP admin_users 迁移"禁令可能已无对象。
- `CLAUDE.md` 测试策略节称有 3 个测试文件，实际有 15 个。

---

## Users & Context

**主要用户：中文家长（决策者）**

- **是谁**：安大略省（主要大多伦多地区）4–12 年级学生的家长，中文母语、英文可读但非首选
- **当前行为**：从微信群/朋友圈/小红书点链接进站，在手机微信内置浏览器中浏览 → 读到项目介绍 → 想知道怎么报名 → 站内无路径 → 退回微信加 `joshuawong2015` 私聊
- **触发时刻**：招生季前夕，或看到其他家长分享的竞赛成绩/大学录取消息
- **成功状态**：在手机上、用中文、不离开网站，提交一份说明了孩子年级和感兴趣项目的询盘，或直接预约一次咨询

**Job to Be Done**

> 当**我在微信里看到别的家长分享 IFA 的比赛成绩、想知道我孩子能不能报、怎么报、多少钱**时，我想要**用中文一次看完项目适合谁、什么时候开课、孩子能学到什么、有什么实证，然后当场留下联系方式**，这样我就**不用先加陌生人微信、再逐条问问题，也不用担心问了半天发现年级不匹配**。

**次要用户**

| 用户 | 语言 | 设备 | 需要的路径 |
|---|---|---|---|
| 学生（4–12 年级） | EN | 移动/桌面 | 浏览项目 → 看学长作品、竞赛结果、导师 |
| 潜在导师/教育者 | EN | 桌面 | About → Team → Join us → contact |
| 员工（业主、校长） | EN/中文 | 桌面 | 更新 season、活动、成果而不弄坏页面 |

**非目标用户**

- 中国大陆境内访问者（无 ICP、无大陆 CDN，不为其优化加载）
- 寻找全日制私立学校/OSSD 学分课程的家庭（IFA 是课外项目，与 itorontoacademy.com 的定位不同）
- 4 年级以下 / 已毕业的学生

---

## Solution Detail

### Core Capabilities (MoSCoW)

| 优先级 | 能力 | 理由 |
|---|---|---|
| **Must** | `Season` 单一数据源 + 内容类型（`prd.md` §6.1） | 所有其他 Must 项都读它；不先做则日期漂移会被复制到新页面 |
| **Must** | `/admissions` 招生页（流程、季度日历、学费、政策、FAQ、预约） | 假设的核心；当前完全不存在 |
| **Must** | 联系表单合格化（program / grade / 语言偏好 + Turnstile） | 询盘质量指标直接依赖；当前 5 字段且无 captcha |
| **Must** | `/results` 成果页 + 首页统计数字 SSR 真实值 | 消除 `0+`；把证明提到一屏内（G3） |
| **Must** | `/zh` §6.4 页面人工中文 + CJK 排版规范 | 主要用户的语言（G2） |
| **Must** | 首页 Student Highlights 去重 + 标签/caption 修正 | 已证实的 DOM 缺陷，影响可信度 |
| **Must** | 设计系统按 §8.2 重铺 token（navy/teal/amber） | 业主决定；且要重跑对比度检查 |
| **Should** | 每页 OG 图（Course / Event / default 模板） | 微信分享缩略图现在全是 logo；直接影响微信渠道点击率 |
| **Should** | Course + CourseInstance + BreadcrumbList JSON-LD（从 `Season` 生成） | SEO；且验证 Season 单一数据源确实贯通 |
| **Should** | CI 补齐 `npm test` / `lint` / `check` + Playwright smoke + axe | **当前两个 workflow 都不跑任何测试**，这是在无网的情况下改全站 |
| **Should** | 分析事件埋点（`inquiry_submit` / `booking_click` / `wechat_qr_view` / `phone_tap` / `program_cta_click` / `locale_switch`） | 没有埋点就无法验证假设 |
| **Could** | `/events` + `/events/[slug]` + ICS + Event JSON-LD | `prd.md` §7.7；业主未选入 v1 |
| **Could** | Program 页 Tier 1 动效（section reveal、DECAB 五边形绘制） | 现有 GSAP + `runGsapOnMount` 已可支撑 |
| **Could** | 家长证言（`consentVerified` 门禁，≥2 条才渲染） | 依赖 Q7 同意确认 |
| **Won't** | 首页 hero caustics（`prd.md` §9.4 Tier 2） | 纯装饰，LCP 风险，且 §14 预算未验证。EV 的 Threlte 3D 已是站内唯一 WebGL canvas，够了 |
| **Won't** | 恢复 hero 自动播放视频 | 见 What We're NOT Building |
| **Won't** | `/dev/ui` kitchen sink 作为独立路由 | 无 React 组件库要 vendored 后，其主要用途消失；EN/ZH 状态检查并入 Playwright |

### MVP Scope

验证假设的最小集合 = **Phase 1 + Phase 4 + Phase 7 的 `/admissions` 部分**：

`Season` 类型 → `/admissions` 页（含季度日历 + 学费披露 + 预约或表单）→ 合格化表单字段 → `/zh/admissions` 中文版 → 埋 `inquiry_submit` 与 `booking_click` 事件。

这已经能回答"中文家长有了母语招生路径会不会转化"，不需要等 `/results` 和全站设计重铺。

### User Flow（价值最短路径）

```
微信分享链接
  → /zh/programs/ev-challenge （手机，中文）
      · 一屏内：这是给谁的 · 什么时候开课 · 孩子学到什么 · 证明（AIEC 大奖 / 滑铁卢 / 普林斯顿）
      · 主 CTA「报名」→ /zh/admissions?program=ev-challenge
  → /zh/admissions（program 已预选）
      · 流程 5 步 · 本季开课日历 · 学费与包含项 · 政策 FAQ
      · #book 预约咨询   或   合格化表单（姓名/邮箱/电话/语言/年级/项目/留言）
  → 提交
      · 服务端 zod 校验 + Turnstile + 限流 → 落 DB → 通知员工邮箱 → 中文确认邮件
      · 失败态给出电话 + 微信兜底
```

---

## Technical Approach

**可行性：HIGH**

现有 SvelteKit 站已经具备这次要做的事所需的**全部基础设施**：Prisma + Postgres、Better Auth、nodemailer（含优雅降级）、Paraglide（711 key 双语对等 + URL 定位策略）、限流（`guardPublicPost`）、CSRF、`@sveltejs/enhanced-img`、Threlte 3D、GSAP + `runGsapOnMount` 生命周期助手、sitemap 含 hreflang。缺的是**内容模型层**和**三条新路由**——纯增量。

### `prd.md` §10 / §15 的 React → Svelte 等价映射

D1 override 生效后，`prd.md` §10 整表与 §15 技术栈作废，替换为：

| `prd.md` 原指定 | 本项目实际用 | 状态 |
|---|---|---|
| Next.js App Router | SvelteKit 2 + adapter-node | ✅ 已有 |
| React Server Components | SvelteKit `+page.server.ts` / `+server.ts` | ✅ 已有（公开页当前**零** server loader，新页需要） |
| Motion (`motion/react`) | **GSAP**（已装，已有 `runGsapOnMount` + 测试）+ Svelte transitions | ✅ 已有。`prd.md` R-COMP-1「禁用 GSAP」条款作废——GSAP 已是本仓库的动画引擎 |
| anime.js v4（DECAB 五边形绘制） | 用 `stroke-dashoffset` + GSAP 实现，**不新增依赖** | 建议不装 |
| `@react-three/fiber` + `drei` | **Threlte**（`@threlte/core` + `@threlte/extras`） | ✅ 已有，EV viewer 已在用 |
| Aceternity UI / React Bits | 手写组件（仓库既有约定：无外部 UI 库） | 沿用现状 |
| `next/font` | `@fontsource/outfit` + `@fontsource/noto-sans-sc` | ✅ 已有（字体选型见 Q9） |
| `next/image` | `@sveltejs/enhanced-img` | ✅ 已有 |
| `next-intl` | Paraglide（`@inlang/paraglide-js`） | ✅ 已有 |
| `next/og`（每页 OG 图） | `satori` + `@resvg/resvg-js`，在 `+server.ts` 端点生成 | ⬜ 需新增 |
| `next.config` redirects | SvelteKit `+page.ts` 中 `redirect()`（现有 `ai-pioneers-interview/+page.ts` 已是此模式） | ✅ 模式已有 |
| Vercel | 自托管 Docker + Traefik + Cloudflare | ✅ 已有（业主决定） |
| Plausible | GA4（`hooks.server.ts:25-27`） | 见 Q10 |
| Resend | nodemailer SMTP（`src/lib/server/mail.ts`） | 见 Q11 |
| Prisma + Postgres · zod v4 · Turnstile · lucide · Vitest | 同名，直接沿用（Turnstile 需新增） | 大部分 ✅ |
| Playwright | 未安装 | ⬜ 需新增（CI 门禁） |

### 架构要点

- **内容模型落在 `src/lib/content/`**（不是 `prd.md` §15 的 `src/content/`，以匹配本仓库 `$lib` 别名约定）。类型定义照搬 `prd.md` §6.1，`Localized<T>` 与 Paraglide 并存：UI 字符串走 `m.xxx()`，内容字段走 `Localized`。
- **`src/lib/seasons.ts`** 实现 `R-CONTENT-2`（当前 season 选取：`registration !== 'closed'` 中 `end` 最晚者，否则最近一条）与时长计算。**必须有单元测试**——这是唯一一处"改一个日期，五处显示跟着变"的逻辑。
- **公开页首次引入 server loader**。现状是所有公开页零 `+page.server.ts`（纯预渲染）。新页面需要权衡：season 数据是静态内容文件 → 可继续预渲染；表单提交走已有的 `+server.ts` API 模式。**保持可预渲染是 LCP 的前提，不要为了 season 引入 SSR。**
- **表单升级沿用现有模式**：`fetch('/api/contact')` + `x-csrf-token` + `guardPublicPost` 限流，而不是改成 SvelteKit form action（`prd.md` §15 的说法与本仓库现状不符）。新增 Turnstile 服务端校验。
- **`Inquiry` 模型扩展**：现有 `ContactMessage`（name/email/phone/message/subscribe/createdAt）需加 `locale` / `grade` / `programs[]` / `topic` / `source` / `status` / `notes`。**这是一次需要迁移的 schema 变更，且容器 CMD 在启动时跑 `prisma migrate deploy`——迁移一旦提交即在下次 `-kit` 发布时自动应用。**

### 技术风险

| 风险 | 可能性 | 缓解 |
|---|---|---|
| **设计系统重铺回归**：按 §8.2 换掉 navy/teal/amber 会触及每个组件的视觉，而 `app.css:14-15` 显示 cerulean 只铺了首页、其他页仍用 `--accent`，实际是"两套并存"状态 | **H** | 先做 token 层审计：列出所有 `--accent` / `--brand` / `--action` 的消费点，一次性映射；重铺后对 §6.4 页面双语跑 axe 对比度 + 视觉回归截图 |
| **CI 无测试门禁下改全站**：`deploy.yml` 只在 `prod` 分支构建镜像，`lighthouse.yml` 只跑性能，**两者都不跑 `npm test` / `lint` / `check`**，而仓库有 15 个测试文件在裸奔 | **H** | **Phase 9 提前并行启动**，在任何大改动落地前把 test/lint/check 加进 PR 门禁 |
| **Prisma 迁移在生产自动应用**：容器启动即 `migrate deploy`；且蓝端 `ithacafo-web-kit` 的对端 `ithacafo-web` **托管着生产数据库**（2026-09-23 曾因误停该容器导致数据库被清空） | **M** | `Inquiry` 扩展只做加列（全部可空或带默认值），不改不删既有列；迁移前先 `npm run prod:backup` |
| **LCP 回退**：新 hero 视觉、Tier 1 动效、`/admissions` 的预约 iframe 都是 LCP 杀手。历史上首页曾是 12.6s LCP / 5.85MB hero 视频 | **M** | 门禁收紧到 LCP ≤ 2.5s；预约 embed 必须懒加载 + 纯链接兜底；入场动效不能让 LCP 元素以 `opacity:0` 起始（Chrome 不把 `opacity:0` 元素计入 LCP 候选） |
| **微信内置浏览器**：`muted + playsinline` 之外的视频不播；JS-SDK 分享签名 URL 必须与当前完整 URL 完全一致，域名要在"JS安全域名"里注册，否则静默失败 | **M** | 不依赖任何视频自动播放；OG 图按中心 1:1 裁切仍可读来设计；在真机微信里验收 §6.4 页面 |
| **中文内容是机翻**（Q12 未确认） | **M** | Phase 7 开工前先抽查 20 条 `zh.json`；若判定机翻，工作量按全量重写估，且 Phase 7 需提前启动 |
| **Season 模型与实际招生流程不匹配**：`prd.md` §6.1 的 `Season` 是推演出来的，未经业主确认 | **M** | Phase 1 交付前先拿 EV Season 03 和 AI Camp cohort 3 两条真实记录对模型做验证 |
| **内容就绪是关键路径**：简介、日期、学费、政策、中文、同意书全部依赖业主（Q1–Q8） | **H** | Phase 0 即建立 `docs/CONTENT-GAPS.md`，每个 PR 描述中列出新增缺口 |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: 可并发的阶段
  DEPENDS: 必须先完成的阶段
  PRP: 生成实现计划后回填
-->

| # | Phase | 交付物 | Status | Parallel | Depends | PRP Plan |
|---|---|---|---|---|---|---|
| 0 | 基线与内容缺口 | 询盘量/`/zh` 占比/Lighthouse 基线；`docs/{DECISIONS,CONTENT-GAPS,LAUNCH-CHECKLIST}.md` | pending | with 9 | - | - |
| 1 | 内容模型地基 | `src/lib/content/types.ts` + `src/lib/seasons.ts` + 数据文件 + 单测 | pending | with 2, 9 | 0 | - |
| 2 | 设计系统重铺 | §8.2 navy/teal/amber token、对比度审计、CJK 排版规范 | pending | with 1, 9 | 0 | - |
| 3 | 首页缺陷修复 | 统计数字 SSR 真实值、Highlights 去重+标签修正、LCP 守门 | pending | with 6 | 1, 2 | - |
| 4 | 招生路径 | `/admissions` + 表单合格化 + Turnstile + `Inquiry` 迁移 + 预约 | pending | with 5, 6 | 1, 2 | - |
| 5 | 成果页 | `/results` + `Result` 内容 + 同意门禁 | pending | with 4, 6 | 1, 2 | - |
| 6 | Program 页接 Season | 6 个 program 页详情条/FAQ/索引卡全部读 `Season` | pending | with 4, 5 | 1, 2 | - |
| 7 | 中文发布级 | §6.4 页面人工中文 + CJK 排版验收 + 微信真机 | pending | - | 3, 4, 5, 6 | - |
| 8 | SEO 与分析 | 每页 OG 图、Course/Breadcrumb JSON-LD、sitemap 补新路由、埋点 | pending | with 7 | 4, 5, 6 | - |
| 9 | CI 门禁补齐 | `npm test`/`lint`/`check` 进 PR、Playwright smoke、axe、LCP 收紧 | pending | with 0, 1, 2 | - | - |
| 10 | 上线验收 | `LAUNCH-CHECKLIST.md` 全绿、§6.4 零 TODO、业主签字 | pending | - | 7, 8, 9 | - |

### Phase Details

**Phase 0：基线与内容缺口**
- **目标**：拿到验证假设所需的"之前"数字，并把业主待办显性化
- **范围**：查 `ContactMessage` 历史询盘量；GA 拉 `/zh` 会话占比与 program 页流量；跑一次三个参考路由的 Lighthouse 存档；建 `docs/DECISIONS.md`（记录本 PRD 推翻的 D1/D5 与 §8.2 选择）、`docs/CONTENT-GAPS.md`（Q1–Q12）、`docs/LAUNCH-CHECKLIST.md` 骨架
- **成功信号**：Success Metrics 表里所有 TBD 被替换为真实基线数字

**Phase 1：内容模型地基**
- **目标**：建立"改一处、五处跟着变"的单一数据源
- **范围**：按 `prd.md` §6.1 落 `Localized` / `Media` / `Season` / `Program` / `Person` / `Result` / `Event` / `Highlight` / `Testimonial` / `FAQ` / `Stat` / `Partner` 类型到 `src/lib/content/types.ts`；`src/lib/seasons.ts` 实现 `R-CONTENT-2` 当前 season 选取与时长计算；把 EV Season 03 与 AI Camp cohort 1–3 录成真实 `Season` 记录（日期冲突按 `prd.md` Appendix A 标注的不一致项**问业主**，不自行选一个）；`scripts/content-check.ts` 实现 `R-CONTENT-6`
- **成功信号**：`npm test` 覆盖 `seasons.ts` 的当前季选取与时长计算；`content:check` 能列出全部缺口；**此阶段不改任何 `.svelte`**

**Phase 2：设计系统重铺**
- **目标**：`app.css` 的 token 层换成 §8.2 色板，并消除 cerulean / `--accent` 两套并存
- **范围**：审计所有 `--accent` / `--brand` / `--action` / `--background*` / `--foreground*` 消费点；按 §8.2 定义 navy-950/900/700/500、teal-600/500/300/100、amber-600/500/200、ink/ink-2/mist/line；执行"正文不用 amber""照片上文字加 navy 渐变遮罩 ≥40%"；补 CJK 排版规范（行高 1.75、禁字距、中文标题关闭 `text-wrap: balance`、直角引号「」）
- **成功信号**：§6.4 页面双语 axe 零 serious/critical 对比度问题；视觉回归截图经业主确认
- **注意**：字体是否一并换成 Manrope/Inter 取决于 Q9，未确认前**不动字体**

**Phase 3：首页缺陷修复**
- **目标**：消除三个已证实的首页缺陷
- **范围**：`ImpactStats.svelte` 改为从 `Stat` 记录服务端渲染最终值、动效从最终值起算（reduced-motion 下静态）；无 `source` 的 stat 不渲染（`R-CONTENT-3`，永不渲染 `0`）；`StudentHighlights.svelte` 合并为**单一**响应式轮播（`{#if}` 或单一 DOM + CSS 布局切换，不是两份 DOM），修正 item3 / item5 标签错配，补全桌面端 stack 格子的 caption；hero 保持静态 poster
- **成功信号**：查看页面源码，`0+` 不出现、highlights 每条只出现一次；Lighthouse LCP 不劣于 Phase 0 基线

**Phase 4：招生路径**（MVP 核心）
- **目标**：中文家长能在站内走完询盘/预约
- **范围**：`/admissions` 五段（流程 Stepper / 季度日历从 `Season` 生成 / 学费按 `Season.tuition.display` / 政策 / FAQ）+ `#book` 预约（`BOOKING_URL` 懒加载 iframe + 纯链接兜底，未配置时降级为表单）+ `?program=<slug>` 预选；`Inquiry` schema 迁移（**只加列，全部可空或带默认值**）；表单加 program 多选 / grade / 语言偏好 / how-did-you-hear + Turnstile 服务端校验；`STAFF_EMAIL` 改为环境变量（Q1）
- **成功信号**：端到端提交落 DB + 进收件箱；限流与 Turnstile 生效；中文错误提示正确；迁移前已执行 `prod:backup`

**Phase 5：成果页**
- **目标**：把证明材料集中可引用
- **范围**：`/results`——按季度的成果时间线、竞赛结果表、Dialogues 访谈列表、校友去向；`consentVerified` 门禁（默认 `false`，涉及未成年人的记录未确认不渲染）；`Partner.permissionVerified` 为 false 时降级为纯文本名称
- **成功信号**：把某条记录的 `consentVerified` 翻成 `false`，该条从页面消失

**Phase 6：Program 页接 Season**
- **目标**：兑现 `prd.md` §7.4 验收条件"改一个日期，详情条/索引卡/FAQ/JSON-LD 全变"
- **范围**：6 个 program 页的详情条改读当前 `Season`；`ev-challenge/+page.svelte:22-27` 的硬编码 STATS 删除；programs 索引卡加季度状态徽章与年级段；**Programs 下拉补齐全部 6 个项目**（当前 `nav.ts:19-24` 只有 3 个 + 一条 `otherPrograms` 兜底），每条带季度状态
- **命名收敛**：`nav.ts:10-12` 有一条刻意留下的注释——"do NOT normalize `ithaca-dialogues`; the route dir mismatch is reconciled in a later phase"。**本阶段就是那个 later phase。** 改名涉及四处：`nav.ts:22`（NavItem label）、`nav.ts:38`（NAV_LABEL 映射）、`programs.ts:36`（卡片 id）、以及 `messages/{en,zh}.json` 里的 `nav_eliteInterviews` 键。改前先与业主确认"Elite Interviews"是否是仍在使用的对外叫法，还是已被"Ithaca Dialogues"取代
- **成功信号**：修改一条 `Season` 的 `start`，四处显示同时变化（可写成测试）；`nav.ts` 顶部那条注释可以删除

**Phase 7：中文发布级**
- **目标**：§6.4 页面的中文达到可发布质量
- **范围**：先抽查现有 711 条判定人工/机翻（Q12）；`/`、`/programs`、6 个 program 页、`/admissions`、`/contact-us` 及其 `/zh` 镜像的中文人工撰写/校订；CJK 排版按 Phase 2 规范验收；微信真机（iOS + Android）跑一遍表单、语言切换、分享卡片
- **成功信号**：§6.4 页面零 `TODO(content)`；`scripts/check-i18n.ts` 键位对等；微信真机验收通过

**Phase 8：SEO 与分析**
- **目标**：让微信分享有正确缩略图，让假设可度量
- **范围**：`satori` + `@resvg/resvg-js` 生成每页 OG 图（home / program / default 三个模板，1200×630，**中心 1:1 裁切后仍可读**）；`Course` + `CourseInstance` JSON-LD 从 `Season` 生成、`BreadcrumbList` 上内页；sitemap 补 `/admissions` `/results`；埋 6 个分析事件；`/admin` 与 `/dev/*` 排除出 sitemap 与索引
- **成功信号**：微信与 iMessage 里分享三个不同页面，缩略图各不相同；GA 中能看到 `inquiry_submit` 与 `booking_click`

**Phase 9：CI 门禁补齐**（尽早并行）
- **目标**：让 15 个既有测试真正拦得住东西
- **范围**：把 `npm test` / `npm run lint` / `npm run check` 加进 PR 触发的 workflow（当前**两个 workflow 都不跑**）；装 Playwright，写 smoke（§5 全路由双语 200、表单校验、语言切换保留路径、Programs 下拉键盘可操作）；Playwright + axe 跑 §6.4 页面；`lighthouse.yml` 门禁从 LCP ≤ 4500ms / CLS ≤ 0.05 收紧到 LCP ≤ 2500ms / CLS ≤ 0.1
- **成功信号**：故意提交一个类型错误，PR 被拦下

**Phase 10：上线验收**
- **目标**：可回滚地发布
- **范围**：`LAUNCH-CHECKLIST.md` 逐条过；§6.4 页面零 TODO；GSC 提交更新后的 sitemap；微信/iMessage OG 卡片抽查；表单打通到收件箱；蓝绿发布按 `docs/DEPLOYMENT.md` 与 `scripts/prod.sh`
- **成功信号**：业主签字；发布后 48h 内 Core Web Vitals 与询盘量无劣化

### Parallelism Notes

- **Phase 9（CI）应最先并且全程并行**——它只碰 `.github/workflows/`，与任何业务改动零冲突，而其他所有阶段都需要它提供的安全网。当前在无测试门禁的情况下改全站是本计划最大的工程风险。
- **Phase 1（内容模型）与 Phase 2（设计系统）文件不相交**：前者只写 `src/lib/content/` 与 `src/lib/seasons.ts`，后者只写 `src/app.css` 与 token 消费点。可完全并行。
- **Phase 4 / 5 / 6 三条线并行**：分别建 `/admissions`、`/results`、改 `src/routes/programs/**`。唯一共享点是 Phase 1 的类型，已先完成。注意 Phase 4 会动 `prisma/schema.prisma`，其他两条不要碰。
- **Phase 3 与 Phase 6 并行**：前者改 `src/lib/components/home/`，后者改 `src/routes/programs/`。
- **Phase 7（中文）必须在 3/4/5/6 全部完成后**——新页面的英文文案定稿前无法撰写对应中文，否则会翻译两遍。
- **Phase 8 可与 Phase 7 并行**：OG 图与 JSON-LD 依赖路由存在（4/5/6 完成即可），不依赖中文文案定稿。

---

## Decisions Log

| 决策 | 选择 | 考虑过的方案 | 理由 |
|---|---|---|---|
| 框架（推翻 `prd.md` D1） | 留在 SvelteKit 2 增量演进 | Next.js 重建；只做 Phase 0 补丁 | SvelteKit 站 2026-09-11 已上线生产、Next.js 树 8/27 已删除。重建会丢弃整个 8 月迁移工作量与已调优的 LCP 基线。缺的是内容模型与招生路径，不是框架。启用 `prd.md` D1 自带的 override 分支 |
| 托管（推翻 `prd.md` D5） | 保持自托管 Docker + Traefik + Cloudflare | Vercel + Neon/Vercel Postgres | 零迁移成本；且蓝端 `ithacafo-web` 托管着生产数据库，动它风险极高（2026-09-23 有过数据库被清空的先例） |
| 设计系统（`prd.md` §8.2） | 按 §8.2 navy/teal/amber 重做 token | 沿用 PR #67 的 cerulean；cerulean 打底补齐 | 业主决定。代价是重铺一套刚合并的品牌系统，但 `app.css:14-15` 显示 cerulean 实际只铺了首页，重铺面小于预期 |
| v1 范围 | 中文 /zh 完整版 + `/admissions` + Season 单一数据源 + `/results` 四块全要 | 分批发布 | 业主决定（四项全选） |
| `prd.md` §10 组件库 | 整表作废，改用 Threlte / GSAP / 手写组件 | 找 Svelte 版 Aceternity 等价物 | Aceternity UI 与 React Bits 是 React 专有。本仓库既有约定就是无外部 UI 库、手写组件 |
| `prd.md` R-COMP-1「禁用 GSAP」 | 作废 | 改用 `motion` vanilla API | GSAP 已是本仓库装好的动画引擎，有 `runGsapOnMount` 生命周期助手与测试。为遵守一条针对 React 栈写的禁令而换引擎不合理 |
| anime.js v4 | 不新增依赖 | 按 `prd.md` §10 引入 | DECAB 五边形绘制用 `stroke-dashoffset` + 既有 GSAP 即可 |
| Hero 视频（`prd.md` R-HOME-1） | 不恢复，保持静态 poster | 恢复 muted 循环视频 | 曾为 LCP 刻意移除；微信 WKWebView 不自动播放，中文家长主流量看不到；行业实测 hero 视频 = LCP +3.2s |
| Tier 2 caustics（`prd.md` §9.4） | 不做 | 按 §9.4 实现 | 纯装饰、LCP 风险、§14 预算未验证；EV 的 Threlte viewer 已是站内唯一 WebGL canvas |
| 表单提交方式 | 沿用 `fetch('/api/contact')` + CSRF header | 改成 SvelteKit form action | `prd.md` §15 的说法与本仓库现状不符；现有模式已有限流与 CSRF |
| 内容模型目录 | `src/lib/content/` | `src/content/`（`prd.md` §15） | 匹配本仓库 `$lib` 别名约定 |

---

## Research Summary

**市场情报**

- 四家 GTA 同类机构中 3 家学费为纯 "contact us"，仅 Exceed Robotics 部分披露（"限时 $165/月"横幅），最终仍导向"预约免费试听"。**没有一家把微信二维码当作主 CTA。**<https://exceedrobotics.com/> · <http://www.realprogramming.com/>
- 中文版不是标配：4 家中仅 itorontoacademy.com 有，且是 `/Chinese/` 子路径 + 独立 CN 域名 `tiaschools.cn` 双轨制。这支持"官网本身要承担中文转化面"的判断，微信/小红书是上游获客而非替代。
- 行业营销顾问共识（非学术数据）：隐藏学费短期推高咨询量但拉低线索质量、损害信任，建议"公开学费或区间 + 说明包含项/奖学金"。<https://www.enrollmentcatalyst.com/2025/03/13/why-your-school-should-post-tuition-on-your-website/>
- 嵌入式预约日历相对纯表单有 30–70% 的咨询转化提升报告（供应商自述案例，非独立统计）；内联嵌入优于弹窗式 30–40%；高客单价场景建议"先短问卷筛选、再进日历"混合模式。<https://webgate.digital/use-cases/boosting-website-leads-using-calendly-forms/>
- 表单字段超过 4 个会使高教咨询漏斗完成率下降 30–50%（营销代理商经验值）。**与本 PRD 的"合格化字段"目标存在张力**——缓解办法是把 program 预选做成 URL 参数而非让用户选，并把可选字段标注清楚。<https://www.acceleroi.com/blog/higher-education-conversion-rates>
- CJK 排版已知坑：方块字无基线概念，与 Latin 混排易纵向错位；多数中文字体无独立粗体/斜体字重，`font-weight:bold` 视觉上"失效"；建议直角引号「」、段落间距代替首行缩进。<https://simular.co/blog/post/2-中文-css-排版原则指南>
- **未找到可靠来源**（不要编造）：GTA 同类机构的官方定价数字；小红书/微信渠道针对北美教育机构的转化率统计；WeChat JS-SDK 分享卡片 `imgUrl` 的官方确切像素尺寸（只查到公众号文章封面规格 400×400，两者未必相同）。

**技术现状**

- 全部证据见本文件 Evidence 节，均带 `file:line`。
- 值得单独强调的三条：(1) **CI 无任何测试/类型/lint 门禁**，而仓库有 15 个测试文件；(2) 公开页当前**零 server loader**，全预渲染——这是 LCP 的前提，新功能不要破坏它；(3) Paraglide 双语已 711 key 对等且 sitemap 已含 hreflang + x-default，i18n 基础设施比 `prd.md` 假设的完善得多，缺的只是内容质量与新页面覆盖。

---

*生成时间：2026-09-29*
*状态：DRAFT —— 12 项开放问题待业主确认，Success Metrics 中的 TBD 待 Phase 0 测量*
