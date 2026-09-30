# 实施计划 — ithacateens.com 重设计

> 来源 PRD：`.claude/PRPs/prds/ithacateens-redesign.prd.md`（框架层决策）
> + `.claude/PRPs/prds/prd.md`（§6.1 类型、§6.4 页面、§7 页面细则、§8.2 色板）
>
> 生成：2026-09-29 · 规模分级：**large** · 门禁：Gate 1（计划批准）/ Gate 2（提交前）

---

## 0. 现状核验结论（与 PRD 的差异）

本计划基于一次完整的代码库审计。以下是**推翻或修正 PRD 判断**的发现，按影响排序。

### 0.1 中文文案是人工撰写的，不是机翻（推翻 Q12 假设）

`messages/{en,zh}.json` 各 711 键（710 条消息 + `$schema`），**键位完全对等**。中文质量证据：

| 证据类型 | 实例 |
|---|---|
| 跨 key 边界的句式重构 | `programs_eliteInterview_faq_reachUsPrefix` / `_reachUsSuffix`：EN 是 `Reach us at` + `if you need more information.`；ZH 把条件从句整体前移成 `如需更多信息，请联系`，suffix 缩成 `。`。需要知道两个 key 在渲染时如何拼接 —— 机翻做不到 |
| 非直译成语化 | `skills they carry for life` → `锻造成陪伴一生的能力`；`why … are essential` → `何以不可或缺`；`coincides with` → `不期而遇`；`connect with` → `并肩前行` |
| 中文侧增写 | `home_highlights_item4Description` 尾部增 `激发集体智慧`（英文无对应）；`home_highlights_subheading` 增 `不断前行` |
| CJK 排版惯例 | 一致使用直角引号「」（`「现状」`、`「AI 惠及所有人」`）；Latin 串两侧空格一致（`AI 时代`、`13 周`） |
| 本地化改写 | `10:00 AM - 12:00 PM` → `上午 10:00 - 中午 12:00`（选"中午"而非机翻惯出的"下午 12:00"） |
| 选择性音译策略 | `Dr. Reza Moridi` / `Peter Teertstra` 保留拉丁，`Hinton` / `Bengio` 音译为 `杰弗里·辛顿` / `约书亚·本吉奥` —— 逐名的编辑判断 |
| 译者修正了原文错误 | EN `withthe`、`Grand Prize..` 在 ZH 中均已修正 |

**影响**：Phase 7 从"全量重写 711 条"缩为"新页面撰写 + 修复下列具体缺陷 + CJK 排版验收"。

已定位的中文/内容缺陷（全部需修）：

1. `home_highlights_item5Title` / `item5Alt` **两语种间标题与 alt 互换**。ZH title = `项目展示日`，而 Hinton 的内容落在 ZH alt；EN 恰好相反。ZH alt 另有错字 `诺贝奖` → `诺贝尔奖`
2. `home_highlights_item3*`：`item3Tag` = `Interview`，但 `item3Title` 描述的是 Sedra 学生设计中心参访 —— EN 侧撰写错误，ZH 忠实镜像了这个错误。ZH 另缺 `Sedra` 前的空格
3. 品牌名不统一：`伊萨卡家族学院`（12 处，含 `metadata_title`）vs `伊萨卡家庭学院`（4 处：`common_logoAlt`、`common_nav_homeLink`、`common_footerHomeAriaLabel`、`about_hero_imageAlt`）
4. `page_hello_body` 的 ZH **断言与 EN 相反**（EN 说"这是英文站"，ZH 说"这是中文站点"）
5. `programs_index_cards_eliteInterview_title` ZH 仍为旧名 `菁英访谈`；`nav_eliteInterviews` 同

### 0.2 设计系统：方向反了，规模也反了

**PRD 说**："cerulean 实际只铺了首页，重铺面小于预期"。
**实际**：`--accent` / `--accent-hover` 有 **0 个消费点**（`app.css:9-10` 声明 + `:37-38` 的 `@theme` 别名之外，全仓库无人使用）。cerulean（`--brand` / `--brand-bright` / `--action` / `--action-hover`）早已全站铺开，173 + 72 + 14 + 14 = 273 处。旧 accent 的**值** `#ccdef0` 没死，它被硬编码进 admin 面板（12 处 `bg-[#ccdef0]` / `text-[#ccdef0]`），与 token 脱钩。

**真正的重铺面**：token 层是干净的 13 值互换（`@theme inline` 保留了间接层，456 处 Tailwind 工具类自动跟随，含所有 `/5`…`/95` 透明度修饰符）。但以下**不会跟随**：

| 面 | 数量 | 说明 |
|---|---|---|
| `.svelte` 硬编码 hex（arbitrary value） | 154 处 / 25 文件 | 其中 **125 处在 admin 面板**（7 文件，完全未 token 化，自带灰阶 `#1e1e1e`/`#2a2a2a`/`#888`/`#cccccc`） |
| 公共站深色阶梯 | 29 处 / 18 文件 | `#0a0c10` < `#0c0e12` < `#0d0f14` < `#0e1015` < `#111318`，无 token |
| `app.css` 内 `rgba()` 字面量 | ~40 处 / 13 规则 | `rgba()` 吃不进 hex 变量，所以 `--brand` 的 12 处光晕全部通道拆解成 `rgba(62,143,199,…)` |
| `var()` 回退字面量 | 3 处 | `app.css:297,299` `var(--card-bg,#1e1e1e)`、`:320` `var(--brand,#3e8fc7)` |
| Tailwind 默认色 | 342 处 / 34 文件 | `text-white` 94、`text-white/60` 54 等 —— 与 `text-foreground`（50 处）混用于同一视觉角色，而 `--foreground` 是 `#f0f1f3` 不是纯白 |
| three.js 材质色 | 5 处 / 3 文件 | `EVSceneContents.svelte:94,101,104`、`FatLine.svelte:32`、`trike-geometry.ts:19-21`（常量名叫 `ACCENT*` 但存的是 brand 值） |

**方向问题（最关键）**：§8.2 是一套**浅色系统** —— `--color-ink: #111827` 是文字色，`--color-mist: #F5F7FA` / `--color-white` 是底色，规则写明"body text on mist/white uses ink；text on navy-900 is white"，navy 只作暗色区块。而当前站是**深色优先**：`--background: #111318`、`--foreground: #f0f1f3`，全部区块底色在 `#0a0c10`–`#111318`，照片遮罩一律 `from-black/80`。

照字面实施 §8.2 = 把整站从深色翻成浅色。那不是 token 重铺，是每个页面的视觉重做，且会同时作废所有照片遮罩、渐变、和 admin 面板。**这是一个品牌/审美决策，不是技术决策，必须由业主拍板。** 见 §1 决策点 D-1。

### 0.3 统计数字不是 `0`

`ImpactStats.svelte:10-13` 硬编码的是 `200+` / `6` / `10+` / `50+`。问题在于非 reduced-motion 分支：首帧渲染 `{Math.floor(counts[i].current)}` = 0（`:56`），**且整块 `opacity:0; translateY(60px)`**（`:50`），要等 IntersectionObserver 触发。所以 SSR/预渲染 HTML 和爬虫看到的是一个隐形的 `0+`。Q2 决定"先沿用现有的"，故本轮只需把这四个值 SSR 出来 + 动效从终值起算 + 去掉 `opacity:0` 初态（Chrome 不把 `opacity:0` 元素计入 LCP 候选）。

### 0.4 只有 ev-challenge 有硬编码详情条

`ev-challenge/+page.svelte:22-27` 的 `STATS` 五个值全是裸字面量（`'03'`、`'8 - 11'`、`'9 mo'`、`'Bi-weekly Sat'`、`'Sep 2026 - May 2027'`）。但同一页 `:30-55` 的 `DETAILS` **把同样的五个事实用消息键又写了一遍**（`Grades 8 - 11, Greater Toronto Area` / `September 2026 - May 2027 (9 months)` / …）—— 同一批数据在一个文件里存在两份。

其余页面（ai-entrepreneurship-camp、ithaca-dialogues）的详情条**已全部走消息键**，没有裸字面量。这意味着 Season 数据当前是被复制进 `en.json` **和** `zh.json` 两份的。接 Season 时要删掉这些消息键，改由 `Intl.DateTimeFormat` 按 locale 渲染。

### 0.5 其余核验结果

| 项 | 结论 |
|---|---|
| 新路由 | `/admissions`、`/results`、`/events` 均不存在 |
| program 页完成度 | 8 个目录：3 个完整页（ev-challenge 512 行、ai-entrepreneurship-camp 527 行、ithaca-dialogues 548 行）、**3 个 `PlaceholderProgram` 占位页**（engineering-projects 19 行、ithaca-night 16 行、summer-winter-camps 19 行）、2 个 308 重定向桩（ai-pioneers-interview、elite-interview）。**PRD 未标出占位页这一项** |
| nav 覆盖 | Programs 下拉只有 3 个真实项目 + 一条 `otherPrograms` 兜底（`nav.ts:20-23`）；索引页有 6 个 |
| `AdminUser` | **已不存在**。`prisma/migrations/20260926162933_drop_legacy_admin_users` 已执行。CLAUDE.md 与 `docs/CUTOVER.md` 的"不要写 DROP admin_users 迁移"禁令已无对象 —— 属文档漂移 |
| 公共页 server loader | **零**。全仓库无任何 `+page.server.ts`（公共与 admin 皆无）。根 `+layout.ts` 的 `prerender = true` 级联到整棵内容树 |
| sitemap | `sitemap.xml/+server.ts` 用 `import.meta.glob('/src/routes/**/+page.svelte')` 自动枚举 —— **新路由自动进 sitemap，Phase 8 这一项是白送的**。但 `static/robots.txt` 的 Sitemap 主机名是硬编码的 |
| OG 图覆盖 | **零**。12 个 `<Seo>` 调用点全部只传 `title` + `description`，全站共用 `/media/images/site/logo.png` |
| JSON-LD | 只有 Organization（`+layout.svelte:36` 构造、`:78` 注入） |
| CI | `deploy.yml` 只在 `prod` 分支构建镜像；`lighthouse.yml` 在 main + PR 跑。**`npm test` / `lint` / `check` 在 CI 中零出现**，15 个测试文件在裸奔 |
| Lighthouse 门禁 | `lighthouserc.json:25-35` 实际只有 **2 条 error 级**：LCP ≤ 4500ms、CLS ≤ 0.05；其余（perf 0.85、a11y 0.9、seo 0.9、FCP、TBT）全是 warn，拦不住任何东西。只审 `/`、`/about-us`、`/programs`、`/contact-us` 四条路由，8 个 program 详情页与全部 `/zh` 路由无覆盖。workflow 注释声称的"Performance ≥ 0.95 / LCP < 2.0s / CLS < 0.05"与实际配置不符（文档漂移） |
| Vitest 环境 | `environment: 'node'`，无 jsdom、无 `@testing-library/svelte`。`src/lib/components/**/*.test.ts` 都是纯逻辑测试，不是渲染测试 —— **UI 层验证只能靠 Playwright** |
| `check-i18n.ts` | 存在但**未接进 `package.json`**，纯手动。且只校验扁平键集对称，不校验值是否真被翻译、不校验占位符对等、不检测孤儿键 |
| 基线 | `.claude/PRPs/baselines/` 有 4 条 Lighthouse 记录，但全部抓自**迁移前的 Next.js 站**（2026-09-11，首页 LCP 12.6s / 5.85MB hero 视频）。SvelteKit 生产站无基线 |
| 缺失文档 | `docs/{DECISIONS,CONTENT-GAPS,LAUNCH-CHECKLIST,THIRD-PARTY}.md` 全部不存在 |
| 运维前置 | `scripts/prod.sh` 支持 `backup` / `restore` / `rollback`；`npm run prod:backup` 可用 |

### 0.6 新发现的缺陷（PRD 未记录）

1. **`contact-us/+page.svelte:69-76` 从不检查 HTTP 状态码** —— 只看 `data.success`。429（限流）、403（CSRF/origin）、500 全被当作普通错误文案显示，用户无从区分"你提交太频繁了"和"服务器挂了"
2. **`VimeoEmbed.test.ts:22` 断言已失效** —— 断言 `hover:border-accent/15`，组件实际渲染 `hover:border-brand/15`。因为 CI 不跑 `npm test`，这个失败从未被发现
3. `StudentHighlights.svelte` 两个分支（`:123-136` mobile、`:139-190` desktop）都无条件渲染全部 6 格 —— **12 个 `<enhanced:img>` 常驻 DOM**，6 个重复 `<h3>` + 重复 `<h2>` 进入无障碍树
4. `LanguageSwitcher.svelte:23,35` 的 `aria-label` 两语种都是硬编码，未走 Paraglide
5. `team.ts:15,20,25,30` 的 `Mr.` / `Ms.` 敬语是英文硬编码，在中文站原样渲染
6. `--spacing-nav`（`app.css:32`）事实上是死 token —— `pt-nav` / `h-nav` 等工具类 0 使用，全部走 `var(--nav-h)` 的 arbitrary value

### 0.7 依赖可用性（已验证）

| 包 | 版本 | 用途 |
|---|---|---|
| `@fontsource-variable/manrope` | 5.3.0 | Q9 字体切换（display） |
| `@fontsource-variable/inter` | 5.3.0 | Q9 字体切换（body） |
| `satori` | 0.33.5 | 每页 OG 图 |
| `@resvg/resvg-js` | 2.6.2 | SVG → PNG |
| `@playwright/test` | 1.63.0 | smoke + axe |
| `@axe-core/playwright` | 4.13.0 | 无障碍门禁 |

**Turnstile 不需要任何新依赖** —— Cloudflare 官方集成是一个 `<script>` + `<div class="cf-turnstile">`，服务端校验是一次普通 `fetch` 到 `https://challenges.cloudflare.com/turnstile/v0/siteverify`。`@marsidev/react-turnstile` 是 React 专有，不用。

---

## 1. 业主决策（Gate 1 — 已于 2026-09-29 答复）

| # | 决策 | 结果 |
|---|---|---|
| D-1 | 设计系统方向 | **照字面实施 §8.2 浅色系统** —— 整站深色→浅色翻转。业主在已知代价（29 处区块底色反转、342 处 `text-white` 改 ink、全部照片遮罩重设计、admin 面板 125 处硬编码重做、5 处 three.js 材质重调）的前提下选定。工作流 D 按选项 (a) 执行，任务量约为推荐方案的 3–4 倍 |
| D-2 | 执行范围 | **全量 A→K**（11 个工作流） |
| D-3 | Lighthouse 门禁 | **分阶段收紧** —— 保留 4500ms error，新增 2500ms warn；先补覆盖面（8 个 program 页 + `/zh` 镜像），待 E/J 落地实测达标后再把 error 收到 2500 |

以下为决策时呈示的选项与依据，保留作为 `docs/DECISIONS.md` 的来源。

### D-1 设计系统方向（阻塞 Phase 2 及其下游）

见 §0.2。三个选项：

**(a) 照字面实施 §8.2 浅色系统** —— 整站深色→浅色翻转。所有照片遮罩、渐变、区块底色、342 处 `text-white`、admin 面板全部重做。工作量最大，但完全符合 §8.2 字面。

**(b) 采用 §8.2 的色相家族，保持深色优先**（推荐）—— 把 navy/teal/amber 映射进现有的深色 token 结构：

| token | 现值 | 新值 | 来源 |
|---|---|---|---|
| `--background` | `#111318` | `#071426` | navy-950 |
| surface 阶梯 | `#0a0c10`…`#0e1015`（无 token） | 新增 `--surface-1/2/3`，取自 navy-950/900 之间 | — |
| `--card-bg` | `#181b21` | `#0B1F3A` | navy-900 |
| `--border` | `#252830` | `#14325C` | navy-700 |
| `--brand`（线条/图标/数字/焦点环） | `#3e8fc7` | `#0F8B8D` | teal-500 |
| `--brand-bright`（文字/标签） | `#5aa6db` | `#5FC3C4` | teal-300 |
| `--action`（实心 CTA 填充） | `#2a6ca8` | `#0B6E70` | teal-600 |
| `--highlight`（徽章/状态，新增） | — | `#F5A623` | amber-500 |
| `--foreground` | `#f0f1f3` | 不变 | — |

已算过的对比度（全部过 WCAG AA）：

| 前景 / 背景 | 比值 | 判定 |
|---|---|---|
| teal-300 `#5FC3C4` / navy-950 `#071426` | **8.87:1** | ✓ AAA |
| amber-500 `#F5A623` / navy-950 | **9.11:1** | ✓ AAA（仅徽章，§8.2 禁止用于正文） |
| white / teal-600 `#0B6E70`（CTA） | **6.04:1** | ✓ AA |
| teal-500 `#0F8B8D` / navy-950 | 4.48:1 | ✗ 正文不可用 → 仅限线条/图标/填充 |

最后一行正好对应现有 `--brand`（线条）/ `--brand-bright`（文字）的分工，无需改变使用纪律。

**(c) 本轮不动设计系统** —— 先在现有 cerulean 上把内容模型 + 招生路径做完，设计重铺另起一轮。

**推荐 (b)**：Decisions Log 里业主的原话是"按 §8.2 navy/teal/amber 重做 token"，理由记为"代价是重铺一套刚合并的品牌系统"—— 预期的是 token 层重烤，不是明暗翻转。(b) 兑现了色相决策，规避了会作废每张照片遮罩的翻转。

### D-2 本轮执行范围

PRD 定义的 MVP = Phase 1 + Phase 4 + Phase 7 的 `/admissions` 部分。完整交付是 11 个阶段。选项：

- **全量**：A→K 全部工作流（本文件 §2）
- **MVP 优先**：A（CI）+ B（基线/文档）+ C（内容模型）+ F（招生路径）+ I 的 admissions 中文 —— 足以验证核心假设，不等 `/results` 与全站设计重铺
- **自定义**：指定工作流子集

### D-3 Lighthouse 门禁收紧节奏

PRD 要求 LCP ≤ 2500ms 作为 error 级门禁。生产站当前 LCP 约 **4.0s**（cutover 记录）。立刻设成 2500 会让 CI 从第一天起就红。

- **推荐**：保留 4500ms error 不变，**新增 2500ms warn**；等 Phase 3（首页 SSR + 去 `opacity:0`）与 Phase 8 落地并实测达标后，再把 error 收到 2500。同时把缺失的路由（8 个 program 页 + `/zh` 镜像）加进审计列表 —— 覆盖面比阈值更重要
- 替代：立即收到 2500 error，接受 CI 短期红

---

## 1.5 进度（2026-09-30）

| 工作流 | 状态 | 落地内容 |
|---|---|---|
| A CI 门禁 | ✅ | `ci.yml`（lint/check/i18n/test/build/Playwright/axe）、`playwright.config.ts`、`e2e/{smoke,a11y}.spec.ts`、Lighthouse 按路由棘轮 |
| B 基线与文档 | ✅ | `docs/{DECISIONS,CONTENT-GAPS,LAUNCH-CHECKLIST,THIRD-PARTY}.md`、SvelteKit 生产基线 6 条 |
| C 内容模型 | ✅ | `src/lib/content/` 九文件 + `src/lib/seasons.ts` + 34 单测；5 条 Season 记录 |
| D 设计系统 | ✅ | §8.2 浅色全站铺开（35 组件）+ EV 页浅色化（D-4）+ ink logo 变体 |
| E 首页缺陷 | ✅ | 统计数字 SSR 真值、highlights 单一 DOM、item3/item5 文案修正 |
| F 招生路径 | ✅ | `/admissions` 五段 + 合格化表单 + Turnstile + `ContactMessage` 迁移 + 75×2 消息键 |
| H Program 接 Season | ✅ | `program-season.ts`、导航补齐 6 项、验收测试（含变异测试） |
| G `/results` | ⬜ | 未开始；部分内容为业主阻塞 |
| I 中文验收 | 🟡 | 新页面中文已随 F/H 落地；CJK 排版规范已在 `app.css`；微信真机验收未做 |
| J SEO 与埋点 | 🔄 | 进行中 |
| K 上线验收 | ⬜ | 未开始 |

**当前量化状态**：218 单测 / 24 文件 · 62 e2e · axe 双语零 serious/critical · 787 消息键 en/zh 对等 · `content:check` 15 项阻塞缺口（全部为业主待办内容，非代码缺陷）。

**已验证的关键契约**：`src/lib/season-contract.test.ts` — 修改一条 `Season` 的 `start`，hero 详情条 / 排期 FAQ / 索引卡 / `CourseInstance` JSON-LD 四处同时变化，双语；该测试经过变异测试（塞回硬编码值会红）。

## 2. 工作流与任务清单

依赖关系：`A` 与 `B` 无依赖，最先并行；`C`、`D` 依赖 `B`（文档骨架）；`E`、`F`、`G`、`H` 依赖 `C` + `D`；`I` 依赖 `E`/`F`/`G`/`H`；`J` 依赖 `F`/`G`/`H`；`K` 依赖全部。

---

### 工作流 A — CI 安全网（PRD Phase 9）· 最先、全程并行

只碰 `.github/workflows/` 与 `package.json`，与任何业务改动零冲突。**其余所有阶段都依赖它提供的安全网** —— 当前在无测试门禁的情况下改全站是本计划最大的工程风险。

| # | 任务 | 文件 | 验证 |
|---|---|---|---|
| A1 | 新建 PR 门禁 workflow：`npm ci --engine-strict=false` → `npm run check` → `npm run lint` → `npm test` → `npm run build` | `.github/workflows/ci.yml`（新） | 故意提交一个类型错误，PR 被拦下 |
| A2 | 把 `check-i18n.ts` 接进 `package.json` 为 `i18n:check`，纳入 A1 | `package.json` | `npm run i18n:check` 输出 `✓ PASS — 710 keys` |
| A3 | 修复已失效的断言 `hover:border-accent/15` → `hover:border-brand/15` | `src/lib/components/media/VimeoEmbed.test.ts:22` | `npm test` 全绿 |
| A4 | 装 Playwright，配 `playwright.config.ts`（`webServer: node build/index.js`） | `playwright.config.ts`（新）、`package.json` | `npx playwright test` 本地通过 |
| A5 | smoke spec：§5 全路由 × 双语返回 200；表单校验；语言切换保留路径 + query；Programs 下拉键盘可操作 | `e2e/smoke.spec.ts`（新） | 全绿 |
| A6 | axe spec：§6.4 页面 × 双语，零 serious/critical | `e2e/a11y.spec.ts`（新） | 全绿（基线若有既存问题，先记录再修） |
| A7 | Lighthouse：补齐缺失路由，按 D-3 调整阈值 | `lighthouserc.json`、`.github/workflows/lighthouse.yml` | 阈值与注释一致（修掉现有文档漂移） |

---

### 工作流 B — 基线与文档骨架（PRD Phase 0）

| # | 任务 | 产出 | 备注 |
|---|---|---|---|
| B1 | 重抓 SvelteKit 生产站 Lighthouse 基线：`/`、`/programs/ev-challenge`、`/contact-us` + `/zh` 镜像 | `.claude/PRPs/baselines/sveltekit-2026-09/*.json` + README 表格 | 现有基线是迁移前 Next.js 站的，不可作对照 |
| B2 | 询盘量基线：按月统计 `ContactMessage` | 写入 `docs/DECISIONS.md` | **需生产 DB 访问**（`npm run prod` → `shell`）。若不便，标为业主待办 |
| B3 | `/zh` 会话占比、program 页流量基线 | 同上 | **业主待办** —— 需 GA 控制台 |
| B4 | `docs/DECISIONS.md` —— 记录推翻 `prd.md` D1/D5、§8.2 选择（D-1 结果）、Q1–Q12 答复 | 新文件 | |
| B5 | `docs/CONTENT-GAPS.md` —— Q1–Q12 逐条 + §0.5 的 3 个占位 program 页 + 4 人完整简介 + 学费/政策文本 | 新文件 | 每个 PR 描述中更新 |
| B6 | `docs/LAUNCH-CHECKLIST.md` 骨架 | 新文件 | |
| B7 | `docs/THIRD-PARTY.md` —— Turnstile / satori / Playwright / fontsource 新增依赖登记 | 新文件 | |
| B8 | 修正文档漂移：CLAUDE.md 的 `AdminUser` 禁令（已无对象）、测试文件数（称 3 实为 15）、`docs/CUTOVER.md` §7 | `CLAUDE.md`、`docs/CUTOVER.md` | |

---

### 工作流 C — 内容模型地基（PRD Phase 1）· 不改任何 `.svelte`

| # | 任务 | 文件 | 验证 |
|---|---|---|---|
| C1 | 按 `prd.md` §6.1 落类型：`Locale` / `Localized<T>` / `Media` / `VimeoRef` / `Season` / `Program` / `Person` / `Result` / `Event` / `Highlight` / `Testimonial` / `FAQ` / `Stat` / `Partner` | `src/lib/content/types.ts`（新） | `npm run check` 通过 |
| C2 | Season 记录：EV Season 03、AI Camp cohort 1/2/3、Ithaca Dialogues Fall 2026 | `src/lib/content/seasons.ts`（新） | **数据冲突见下** |
| C3 | `currentSeason()` 实现 R-CONTENT-2（`registration !== 'closed'` 中 `end` 最晚者，否则最近一条）+ `seasonDuration()` + `formatSeasonWindow(locale)`（`Intl.DateTimeFormat`，时区 `America/Toronto`） | `src/lib/seasons.ts`（新） | **`src/lib/seasons.test.ts` 必须覆盖**：当前季选取（含全 closed 的回退分支）、时长计算、双语窗口格式化 |
| C4 | 其余内容文件：`programs` / `people` / `results` / `stats` / `partners` / `highlights` / `faq` | `src/lib/content/*.ts` | `Stat` 沿用 200/6/10/50（Q2），但 `source` 字段按 R-CONTENT-3 必填 —— 无出处的不渲染 |
| C5 | `scripts/content-check.ts` 实现 R-CONTENT-6 + `content:check` npm 脚本，接进 CI | `scripts/content-check.ts`（新）、`package.json` | 能列出全部 `TODO(content)` 缺口 |

**C2 的数据冲突（需业主确认，不自行选一个）**：
- AI Camp cohort 2：`programs_aiCamp_overview_p2` 说"2026 年 1 月 10 日开始，持续至 6 月，路演 6 月 13 日"，但 `prd.md` Appendix A 标注 FAQ 的"When does it run?"与 cohort-2 结束日期互相冲突
- AI Camp 详情条的 `schedule` = `September 2026`、`pitchDay` = `December 2026 (to be arranged)` —— 这是 cohort 3 的数据，却渲染在通用详情条里
- EV：`STATS` 说 `Sep 2026 - May 2027`，`DETAILS` 说 `September 2026 - May 2027 (9 months)` —— 这两处一致，可直接采信

---

### 工作流 D — 设计系统重铺（PRD Phase 2）· 取决于 D-1

以下按推荐方案 **(b)** 编写。若选 (a) 则任务量约为 3–4 倍；若选 (c) 则整个工作流跳过。

| # | 任务 | 文件 | 验证 |
|---|---|---|---|
| D1 | `:root` 13 个色值按 §1 D-1 表重映射；`@theme inline` 间接层保持不变 | `src/app.css:5-22` | 456 处 Tailwind 工具类自动跟随 |
| D2 | 新增 `--surface-1/2/3` token，替换公共站 29 处深色阶梯硬编码 | `src/app.css` + 18 个 `.svelte` | 无 `bg-[#0a0c10]` 残留 |
| D3 | `app.css` 内 ~40 处 `rgba()` 字面量改用 `color-mix(in srgb, var(--brand) 15%, transparent)` 或 `--brand-rgb` 通道变量 | `src/app.css:100-249` | 改 `--brand` 后光晕跟随 |
| D4 | 修 3 处 `var()` 回退字面量（`:297,299,320`） | `src/app.css` | |
| D5 | three.js 材质色改读常量（无法读 CSS 变量，需 JS 侧同步） | `EVSceneContents.svelte:94,101,104`、`FatLine.svelte:32`、`trike-geometry.ts:19-21` | 顺带把误导性的 `ACCENT*` 常量名改为 `BRAND*` |
| D6 | 字体切换（Q9）：装 `@fontsource-variable/{manrope,inter}`，定义 `--font-display` / `--font-sans`，保留 Noto Sans SC 的 `/zh` 门控 | `package.json`、`src/app.css:27-28,45,51`、`src/routes/+layout.svelte:5-9,64-68` | **重跑 LCP**：字体切换直接影响字体加载策略；`clamp()` 排版尺度需按新字体的 x-height 复核 |
| D7 | CJK 排版规范：行高 1.75、禁字距、中文标题关闭 `text-wrap: balance`、直角引号「」 | `src/app.css` | zh 页面目视 + axe |
| D8 | 统一 `text-white` 与 `text-foreground` 的使用（当前 94 + 50 处混用于同一角色，而 `--foreground` = `#f0f1f3` ≠ 纯白） | 34 个文件 | 视觉回归截图 |
| D9 | 状态色 token 化（`red-*` / `green-*` / `yellow-*` / `blue-*` 约 40 处，当前无 token 表示） | `src/app.css` + 表单/admin | |
| D10 | 清理死 token：`--accent`、`--accent-hover`、`--background-secondary`、`--spacing-nav` | `src/app.css` | |
| — | **admin 面板（125 处硬编码，7 文件）本轮不动** | — | 明确记入 `docs/DECISIONS.md` |

**验证**：§6.4 页面双语 axe 零 serious/critical 对比度问题；视觉回归截图经业主确认。

---

### 工作流 E — 首页缺陷修复（PRD Phase 3）

| # | 任务 | 文件 | 验证 |
|---|---|---|---|
| E1 | `ImpactStats`：从 `Stat` 记录 SSR 最终值；动效**从终值起算**；去掉 `opacity:0` 初态（Chrome 不把 `opacity:0` 元素计入 LCP 候选）；无 `source` 的 stat 不渲染（R-CONTENT-3，永不渲染 `0`） | `src/lib/components/home/ImpactStats.svelte` | 查看页面源码，`0+` 不出现 |
| E2 | `StudentHighlights`：合并为**单一** DOM（一个 `{#each}` + CSS 布局切换），消除 12 个 `<enhanced:img>` 与重复 `<h2>`/`<h3>` | `src/lib/components/home/StudentHighlights.svelte` | 每条 highlight 在 DOM 中只出现一次 |
| E3 | 修 item3 标签错配（`Interview` vs Sedra 参访内容）与 item5 的两语种 title/alt 互换 + 错字 `诺贝奖` | `messages/{en,zh}.json` | 人工核对 |
| E4 | 补全桌面端 stack 格子的 caption（索引 1/2/4/5 恒传 `showDescription=false`） | `StudentHighlights.svelte:178,181` | |
| E5 | hero 保持静态 poster（不恢复自动播放视频） | — | LCP 不劣于 B1 基线 |

---

### 工作流 F — 招生路径（PRD Phase 4）· MVP 核心

| # | 任务 | 文件 | 验证 |
|---|---|---|---|
| F1 | Prisma 迁移：`ContactMessage` **只加列**（`locale` / `grade` / `programs String[]` / `topic` / `source` / `status` / `notes`），全部可空或带默认值。不改不删既有列 | `prisma/schema.prisma` + 新迁移 | **迁移前必须 `npm run prod:backup`**。容器 CMD 启动即 `migrate deploy`，迁移一提交即在下次 `-kit` 发布时自动应用 |
| F2 | `/admissions` 五段：流程 Stepper / 季度日历（从 `Season` 生成）/ 学费（按 `Season.tuition.display`，Q3 先 placeholder）/ 政策 FAQ / `#book` | `src/routes/admissions/+page.svelte`（新） | 保持可预渲染（内容来自静态文件，不引入 SSR） |
| F3 | `#book`：`BOOKING_URL` 懒加载 iframe + 纯链接兜底；未配置时降级为表单 | 同上 | `BOOKING_URL` 当前未提供（Q6 未答此项）→ 走降级分支 |
| F4 | `?program=<slug>` 预选 | 同上 | 规避"表单字段 >4 降低完成率"的张力：program 由 URL 参数预填而非让用户选 |
| F5 | 表单合格化：program 多选 / grade / 语言偏好 / how-did-you-hear，更新 zod schema | `src/routes/contact-us/+page.svelte`、`src/routes/api/contact/+server.ts` | 沿用 `guardPublicPost` + `parseJsonBody` + `x-csrf-token` 现有模式 |
| F6 | Turnstile 服务端校验，未配置密钥时优雅降级（镜像 SMTP 的 no-op 模式） | `src/lib/server/turnstile.ts`（新）+ 端点 | **零新依赖**。`PUBLIC_TURNSTILE_SITE_KEY` 构建期内联，`TURNSTILE_SECRET_KEY` 运行时 |
| F7 | `STAFF_EMAIL` 硬编码 → 环境变量 `INQUIRY_TO`（Q1：`info@ithacateens.com`）。**凭据只进运行时 env，绝不入库** | `src/routes/api/contact/+server.ts:16`、`.env.example` | |
| F8 | 修复客户端不检查 HTTP 状态码的缺陷（§0.6-1）—— 429/403/500 需给出可区分的中文提示 | `src/routes/contact-us/+page.svelte:69-76` | 触发限流，看到正确文案 |
| F9 | 提交者确认邮件（按其 locale） | `src/lib/server/mail.ts` 调用点 | SMTP 未配置时不得使表单失败 |
| F10 | 失败态给出电话 + 微信兜底（二维码资产已在位：`static/media/images/qrcode/Joshua-WeChat.jpg`） | | |
| F11 | 新增约 40 个消息键 × 双语 | `messages/{en,zh}.json` | `npm run i18n:check` 通过 |

---

### 工作流 G — 成果页（PRD Phase 5）

| # | 任务 | 文件 |
|---|---|---|
| G1 | `/results`：按季度的成果时间线、竞赛结果表、Dialogues 访谈列表、校友去向 | `src/routes/results/+page.svelte`（新） |
| G2 | `consentVerified` 门禁（默认 `false`，涉及未成年人的记录未确认不渲染）；Q7 用通用同意模板 | `src/lib/content/results.ts` |
| G3 | `Partner.permissionVerified` 为 false 时降级为纯文本名称（Q5 已答"没有问题"，但仍保留门禁机制） | `src/lib/content/partners.ts` |
| — | **验证**：把某条记录的 `consentVerified` 翻成 `false`，该条从页面消失 | |

---

### 工作流 H — Program 页接 Season（PRD Phase 6）

| # | 任务 | 文件 |
|---|---|---|
| H1 | 删除 `ev-challenge` 的硬编码 `STATS`（5 个裸字面量），改读当前 `Season`；同时消除 `STATS` 与 `DETAILS` 的事实重复 | `src/routes/programs/ev-challenge/+page.svelte:22-55` |
| H2 | ai-camp、ithaca-dialogues 的详情条改读 `Season`，删除对应的消息键（当前 Season 数据被复制进 en.json + zh.json 两份） | 2 个页面 + `messages/{en,zh}.json` |
| H3 | programs 索引卡加季度状态徽章与年级段 | `src/routes/programs/+page.svelte`、`src/lib/data/programs.ts` |
| H4 | **Programs 下拉补齐全部 6 个项目**（当前只有 3 个 + `otherPrograms` 兜底），每条带季度状态 | `src/lib/data/nav.ts:19-24` |
| H5 | 命名收敛：`nav.ts:22` NavItem label、`nav.ts:38` NAV_LABEL 映射、`programs.ts:36` 卡片 id、`messages/{en,zh}.json` 的 `nav_eliteInterviews`（ZH 仍是旧名 `菁英访谈`）。改完可删 `nav.ts:10-12` 的注释 | 4 处 |
| H6 | 3 个占位 program 页（engineering-projects / ithaca-night / summer-winter-camps）需真实内容 | **业主阻塞** —— 记入 `docs/CONTENT-GAPS.md` |
| — | **验证**：修改一条 `Season` 的 `start`，详情条 / 索引卡 / FAQ / JSON-LD 四处同时变化（写成测试） | |

**H5 前置**：需与业主确认 "Elite Interviews" 是否仍是在用的对外叫法，还是已被 "Ithaca Dialogues" 取代。

---

### 工作流 I — 中文发布级（PRD Phase 7）· 范围已按 §0.1 收窄

| # | 任务 |
|---|---|
| I1 | 为 `/admissions`、`/results` 撰写中文（对齐现有人工译文的质量基线：成语化、直角引号、Latin 间距、日期中文惯例） |
| I2 | 修复 §0.1 列出的 5 处既存缺陷 |
| I3 | `LanguageSwitcher.svelte:23,35` 的硬编码 `aria-label` 走 Paraglide；`team.ts` 的 `Mr./Ms.` 敬语本地化 |
| I4 | 按 D7 的 CJK 排版规范验收 §6.4 页面 |
| I5 | 微信真机（iOS + Android）跑一遍表单、语言切换、分享卡片 —— **业主/人工执行** |
| — | **验证**：§6.4 页面零 `TODO(content)`；`npm run i18n:check` 键位对等 |

---

### 工作流 J — SEO 与分析（PRD Phase 8）

| # | 任务 | 文件 |
|---|---|---|
| J1 | `satori` + `@resvg/resvg-js` 生成每页 OG 图（home / program / default 三模板，1200×630，**中心 1:1 裁切后仍可读** —— 微信缩略图按中心方图裁） | `src/routes/og/[...slug]/+server.ts`（新） |
| J2 | 12 个 `<Seo>` 调用点补 `ogImage`；补 `twitter:image`、`og:image:width/height/alt`、`og:locale` | `src/lib/components/Seo.svelte` + 12 个页面 |
| J3 | `Course` + `CourseInstance` JSON-LD 从 `Season` 生成；`BreadcrumbList` 上内页 | `src/lib/seo.ts`、各 program 页 |
| J4 | `robots.txt` 主机名从硬编码改为 `PUBLIC_SITE_URL`（需从 `static/robots.txt` 改成 `+server.ts`）；`/admin` 与 `/dev/*` 排除出 sitemap 与索引 | `src/routes/robots.txt/+server.ts`（新） |
| J5 | 埋 6 个 GA4 事件：`inquiry_submit` / `booking_click` / `wechat_qr_view` / `phone_tap` / `program_cta_click` / `locale_switch`（Q10：用 GA4，不引入 Plausible） | `src/lib/analytics.ts`（新）+ 调用点 |
| — | sitemap 新路由**无需处理** —— `import.meta.glob` 已自动枚举 | |
| — | **验证**：微信与 iMessage 里分享三个不同页面，缩略图各不相同；GA 中能看到 `inquiry_submit` 与 `booking_click` | |

---

### 工作流 K — 上线验收（PRD Phase 10）

| # | 任务 |
|---|---|
| K1 | `docs/LAUNCH-CHECKLIST.md` 逐条过；§6.4 页面零 TODO |
| K2 | GSC 提交更新后的 sitemap |
| K3 | 微信 / iMessage OG 卡片抽查 |
| K4 | 表单打通到 `info@ithacateens.com` 收件箱 |
| K5 | 蓝绿发布：推 `prod` → GHCR 出镜像 → 在 `IthacaServer/apps/ithacafo-web-kit/docker-compose.yml` bump digest → provision。**绝不可 rm/stop `ithacafo-web`（蓝端），它托管着生产数据库** |
| K6 | 发布后 48h 内 Core Web Vitals 与询盘量无劣化 |

---

## 3. 风险登记

| 风险 | 等级 | 缓解 |
|---|---|---|
| **设计系统重铺规模被低估**（§0.2）：约 500 处颜色字面量不跟随 token 交换，且 §8.2 隐含深色→浅色翻转 | **H** | D-1 先定方向；推荐方案 (b) 把翻转风险降为零；D2–D5 把字面量收回 token 层 |
| **CI 无测试门禁下改全站**：15 个测试文件裸奔，已有一个失效断言（`VimeoEmbed.test.ts:22`）从未被发现 | **H** | 工作流 A 最先并行，在任何大改动落地前完成 |
| **内容就绪是关键路径**：3 个占位 program 页、4 人完整简介、学费、政策、Season 日期冲突全部依赖业主 | **H** | B5 建 `docs/CONTENT-GAPS.md`，每个 PR 描述中列出新增缺口 |
| **Prisma 迁移在生产自动应用**：容器启动即 `migrate deploy`；蓝端 `ithacafo-web` 托管着生产数据库（2026-09-23 曾因误停该容器导致数据库被清空） | **M** | F1 只做加列（全部可空或带默认值）；迁移前先 `npm run prod:backup` |
| **LCP 回退**：字体切换（D6）、新 hero 视觉、`/admissions` 预约 iframe 都是 LCP 杀手。历史上首页曾是 12.6s LCP / 5.85MB hero 视频 | **M** | 预约 embed 必须懒加载 + 纯链接兜底；入场动效不能让 LCP 元素以 `opacity:0` 起始（E1 正是此问题）；D6 后重跑 Lighthouse |
| **微信内置浏览器**：`muted + playsinline` 之外的视频不播；JS-SDK 分享签名 URL 必须与当前完整 URL 完全一致 | **M** | 不依赖任何视频自动播放；OG 图按中心 1:1 裁切仍可读来设计；I5 真机验收 |
| **Season 模型未经业主确认**，且 AI Camp 的日期存在三处互相冲突的说法 | **M** | C2 交付前先拿 EV Season 03 和 AI Camp cohort 3 两条真实记录对模型做验证；冲突项**问业主，不自行选一个** |
| 表单字段增加降低完成率（行业经验：>4 字段使高教漏斗完成率降 30–50%），与"合格化字段"目标存在张力 | **M** | F4 把 program 做成 URL 参数预填而非让用户选；可选字段明确标注 |

---

## 4. 交付与门禁

- **Gate 1**：本文件 §1 的 D-1 / D-2 / D-3 获业主答复后，方可写实现代码
- **Gate 2**：提交前呈示 diff 摘要与提交信息，待确认
- 提交规范：Conventional Commits，一个逻辑变更一次提交
- 安全审查触发：工作流 F 触及认证/用户输入/数据库/外部 API/凭据 → 必须跑 `security-reviewer`
- 测试要求：新增/变更行为须有测试；`src/lib/seasons.ts` 是"改一个日期、五处跟着变"的唯一逻辑点，**必须有单元测试**
