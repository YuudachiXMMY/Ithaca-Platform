# 手动修改网站内容与排版

这份文档回答一个问题：**我想改网站上的某样东西，该动哪个文件。**

面向需要亲手改文案、换图、调间距的人，不假设你熟悉 SvelteKit。它只讲"入口在哪、规矩是什么、改完怎么验"，
不讲架构 —— 架构看 [`CLAUDE.md`](../CLAUDE.md)，颜色的完整规则书看
[`docs/DESIGN-TOKENS.md`](DESIGN-TOKENS.md)，部署看 [`docs/DEPLOYMENT.md`](DEPLOYMENT.md)。

---

## 0. 三十秒速查：我要改的东西在哪？

| 我想改…                             | 动这里                                                        | 本文档                                   |
| ----------------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| 页面上的一句话、一个标题、按钮文字  | `messages/en.json` **和** `messages/zh.json`（两份都要）      | [§2](#2-改文案--messagesenzhjson)        |
| 数字带、FAQ、团队成员、项目卡片列表 | `src/lib/content/*.ts`、`src/lib/data/*.ts`                   | [§3](#3-改结构化内容--srclibcontentts)   |
| 间距、字号、栅格、板块顺序          | `src/routes/**/+page.svelte` 和 `src/lib/components/**`       | [§4](#4-改排版--组件里的-tailwind-class) |
| 颜色                                | `src/app.css` 的令牌（**不要**在组件里写色值）                | [§5](#5-改颜色--只动令牌)                |
| 图片、视频                          | `src/lib/assets/`（构建期处理）或 `static/media/`（直接引用） | [§6](#6-换图片与视频)                    |
| 导航栏条目                          | `src/lib/data/nav.ts`                                         | [§3](#3-改结构化内容--srclibcontentts)   |
| 联系方式、社交链接                  | `src/lib/data/contact.ts`                                     | [§3](#3-改结构化内容--srclibcontentts)   |

改完**一定**跑 [§7 的检查清单](#7-改完必须跑的检查)。

---

## 1. 起本地环境

三条命令，不需要数据库，也不需要任何密钥：

```bash
cp .env.example .env     # 本地什么都不填也能跑
npm ci --engine-strict=false
npm run dev              # 打开 http://localhost:5173
```

`npm run dev` 带热更新：存盘后浏览器自动刷新，不用重启。

> **2026-11-17 订正：** 这一节原本教人跑 `./scripts/dev-up.sh`，说它会起 PostgreSQL 容器、应用
> 数据库迁移、播种管理员账号。**那个脚本不存在，那些步骤也不存在** —— 官网在 `552a31c`
> （2026-10-10）无状态化时就删掉了 admin 面板、Better Auth 和 Prisma。照着旧版本做只会得到一个
> "command not found"。本站唯一的后端依赖是排课系统的 `/api/site/*`，不配也能跑（询盘/订阅会
> 500，弹窗降级为"无弹窗"，这是刻意的降级行为）。

> **不要用 `npm run build` + `npm run start` 来预览改动。** 生产服务器启动时只索引
> `build/client` 一次，重新构建后新文件名全部 404 —— 页面还能显示（HTML 是预渲染的），但不会水合：
> 点什么都没反应，导航栏卡在初始状态，而且**不报错**。
> 真要看生产构建用 `npm run preview:prod`（服务于 `:4399`，可用 `PORT=` 覆盖），
> 它会在构建**之前**先释放端口，保证服务进程比它要服务的文件更新。
>
> 另外预渲染的 HTML 带 `Last-Modified` 且没有 `Cache-Control`，浏览器可能握着旧文档。
> 本地页面重建后看起来"死了"，先硬刷新（<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>）再怀疑代码。

---

## 2. 改文案 — `messages/{en,zh}.json`

所有面向用户的文字都走 Paraglide，**不写在组件里**。两份文件扁平下划线命名，
**键集合必须完全一致**（`npm run i18n:check` 会把当前条数打出来 —— 这里不写死那个数字，
理由就是下面「英文文案约定」里自己立的那条：不在文档里写死会变的数量）。

```jsonc
// messages/en.json
"home_hero_empowerment": "Empowering youth to explore the future and build the skills to thrive in the AI era.",

// messages/zh.json
"home_hero_empowerment": "赋能青少年探索未来，在 AI 时代锻造真正属于自己的竞争力。",
```

组件里对应 `{m.home_hero_empowerment()}`。

### 工作流：从页面反查键名

1. 在浏览器上看到想改的那句话
2. 在 `messages/en.json` 里搜这句英文 → 拿到键名
3. 改 `messages/en.json` 和 `messages/zh.json` **同一个键**
4. 存盘，浏览器自动刷新；`/` 看英文，`/zh` 看中文

### 加新键

两个文件都要加。然后：

```bash
npm run i18n:check   # 校验 en/zh 键是否对齐，少一边就报错
npm run check        # 重新编译 Paraglide，新键才能在组件里用
```

`src/lib/paraglide/` 是编译产物，**不要手改、不要提交**（已 gitignore）。

### 英文文案约定

2026-11-14 对全部英文页做过一轮措辞审校，立下几条约定。新写或改写 `en` 文案时照着来，
否则下一轮审校又要把同样的东西再清一遍：

- **不用 em dash（`—`）。** 改用逗号、冒号、括号，或者拆成两句。页面标题的站名分隔符统一用
  `|`。这条只管英文：中文文案里的「——」是正常标点，不动。
- **句子里的范围写 `to`**（`20 to 30 minute`、`Grades 8 to 11`）。由代码格式化出来的日期区间
  （`September 2026 – May 2027`）保留 en dash，那是 `formatSeasonWindow()` 的输出，不是文案。
- **拼写统一用加拿大英语**：`program`（不是 programme）、`standardized`、`organization`、
  `inquiry`（不是 enquiry）、`modelling`、`centre`、`enrolment`。代码里的标识符、文件名
  （`EnquiryForm.svelte`、`email_enquiry_*` 这类 key）不在此列，别为了拼写去改名。
- **不写 `actually`，不在一句里叠两个 `real`。** 它们几乎从不承载信息。
- **散文里不用缩写**（maths、CS、U of T、Mgmt），不用分词开头的残句
  （`Touring the facility, …` → `Students toured the facility …`）。
- **不在文案里写死会变的数量**（「Four Tracks」正是这样过期的），这条和 `DECISIONS.md` 里
  `/academics` meta 那次的教训是同一条。

同一句英文常常**同时**存在于 `messages/en.json` 和 `src/lib/content/*.ts` 的 `en:` 字段里
（后者喂 JSON-LD 和内容模型）。改一处要搜另一处，两边都改。

### 中文排版

`/zh` 页面的中文字距/行高由 `src/app.css` 里 `html:lang(zh)` 作用域的规则统一处理，
组件不需要加 class。改中文文案不用操心这部分。

> CJK 字体是通过构建期子集化（`npm run fonts:cjk`）引入的。**不要**自行加 preload 或第三个字重 ——
> 那会影响性能基线，需要重新测量后才能动。

---

## 3. 改结构化内容 — `src/lib/content/*.ts`

列表型内容不在 `messages` 里，而是 TypeScript 常量数组。双语在这里是内联对象，
形如 `{ en: 'Students', zh: '学生' }`。

| 文件                             | 内容                                           | 影响页面                             |
| -------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `src/lib/content/stats.ts`       | 首页数字带                                     | `/`                                  |
| `src/lib/content/programs.ts`    | 项目列表与 slug                                | `/`、`/programs`、各项目页           |
| `src/lib/content/season-data.ts` | 期次日期                                       | 各项目页、`/programs`、`/admissions` |
| `src/lib/content/faq.ts`         | FAQ 条目                                       | 各项目页、`/admissions`              |
| `src/lib/content/highlights.ts`  | 学生成果亮点                                   | `/`                                  |
| `src/lib/content/people.ts`      | 人员                                           | `/about-us`                          |
| `src/lib/content/partners.ts`    | 合作方                                         | `/about-us`                          |
| `src/lib/content/admissions.ts`  | 招生流程数据                                   | `/admissions`                        |
| `src/lib/data/nav.ts`            | 导航栏条目                                     | 全站                                 |
| `src/lib/data/contact.ts`        | 联系方式、社交链接                             | 全站页脚、`/contact-us`              |
| `src/lib/data/team.ts`           | 团队成员（头像在 `static/media/images/team/`） | `/about-us/our-team`                 |

每个文件的头部注释写了它自己的规矩，**改之前先读那段注释**。几条典型的：

- **`stats.ts` 的每条数字必须有 `source` 字段。** 没有来源的数字不会被渲染 —— 这是刻意的约束，
  防止再次出现以前那种无依据的数字。
- **`season-data.ts` 里被在售项目引用的期次必须有可用的 `start`/`end`**，否则 `content:check` 报错。

### 两种 TODO 标记，区别很重要

```ts
// TODO(content): 只有负责人能提供的内容 → 在关键页面上算【阻断项】
// TODO(asset):   仓库缺的文件        → 永远只是提示，已有兜底渲染
```

```bash
npm run content:check   # 扫描这些标记并校验期次日期
```

关键页面（`/`、`/programs`、各项目页、`/admissions`、`/contact-us`）上留一个
`TODO(content)` 会让这个检查判为阻断。已知的**文案缺陷**不要用标记写，用 `NOTE:` 注释 ——
这个检查回答"还缺什么"，不回答"哪里写错了"。

> **这个检查目前就是红的**（撰写时：15 个 §6.4 缺口，退出码 1），因为还有内容没从负责人那里拿到。
> 它**不在** CI 的 PR 门禁里，所以 main 是绿的 —— 它是一张"还欠什么"的清单，不是回归测试。
>
> 所以用法是**比较，而不是求绿**：改之前跑一次记下输出，改完再跑一次，确认你只减少了条目、
> 没有新增。等内容补齐、它第一次变绿之后，再把它当门禁用。

还欠负责人提供的内容清单在 [`docs/CONTENT-GAPS.md`](CONTENT-GAPS.md)。

---

## 4. 改排版 — 组件里的 Tailwind class

结构是「**路由负责组装，组件负责排版**」。

### 找到要改的组件

页面文件只做组装。首页 `src/routes/+page.svelte` 实质上就七行：

```svelte
<HeroSection />
<MissionSection />
<ProgramsShowcase />
<ImpactStats />
<FeaturedSection />
<StudentHighlights />
<ContactSection />
```

所以：

- **调整板块顺序、删掉某个板块** → 改 `+page.svelte`
- **调某板块内部的间距/字号/栅格** → 进它对应的 `.svelte` 组件

通用的找法：打开 `src/routes/<路径>/+page.svelte`，看它 `import` 了哪些组件，进去改。

组件按页面分目录：

| 目录                             | 负责                                     |
| -------------------------------- | ---------------------------------------- |
| `src/lib/components/home/`       | 首页各板块                               |
| `src/lib/components/about/`      | `/about-us` 各板块                       |
| `src/lib/components/admissions/` | `/admissions` 各板块                     |
| `src/lib/components/programs/`   | 项目页                                   |
| `src/lib/components/contact/`    | 咨询表单、微信二维码                     |
| `src/lib/components/layout/`     | `Header.svelte`、`Footer.svelte`（全站） |
| `src/lib/components/shared/`     | `PageHero`、`Reveal`（滚动显现）等复用件 |
| `src/lib/components/media/`      | 自适应视频、Vimeo 嵌入                   |

### 排版约定

间距、宽度、字号都是 Tailwind v4 的 class。以 `MissionSection.svelte` 的容器为例：

```svelte
<div class="mx-auto max-w-[1100px] px-5 pt-24 pb-14 sm:px-8 md:px-[6vw] md:pt-36 md:pb-20">
```

读法：水平居中、最大宽 1100px、左右内距 `px-5`、上下内距 `pt-24 pb-14`；
`sm:` / `md:` 是响应式断点，窗口变宽后覆盖前面的值。改数值即可。

- **字号**优先用流体值：`text-[clamp(2.5rem,6vw,4.5rem)]` —— 小屏到大屏连续缩放，不用写一堆断点。
  **最大值不要超过最小值的 2.5 倍**：`vw` 不随浏览器缩放变大，比例拉太开会让文字到不了 WCAG
  1.4.4 要求的 200%
- **页面容器宽度**有个全局令牌 `--container: 1200px`（`src/app.css`），各板块也可以自己定 `max-w-[...]`
- **导航栏高度**是 `--nav-h: 4.5rem`，改它会影响全站吸顶偏移
- **滚动显现动画**用 `<Reveal y={24}>` 包住内容，`y` 是起始位移。它只做透明度/位移，SSR 安全
- **不要给带背景或边框的元素写 `text-wrap: balance`**：它只改文字在容器里怎么折行，不改容器宽度，
  于是框右边会空出一块。标题（无框）才用它

### 区块的那套「手册语言」（2026-11-17）

每个区块醒目、但不靠重色 —— 这套形制照搬自 2026-11 的产品手册，定义在 `src/app.css` 的
**SECTION FURNITURE** 一节。要加新区块，用这几个类而不是自己拼：

| 类              | 用在哪                                                   |
| --------------- | -------------------------------------------------------- |
| `.b-card`       | 区块里的一张卡：浅底 + 细边 + 左侧品牌渐变竖条，自带内距 |
| `.b-card-media` | 同上，但内距移到内层，**照片可以贴着上边和侧边**         |
| `.b-edge`       | 只要左侧那根渐变竖条（宿主需 `relative` + 裁剪）         |
| `.b-panel`      | 区块级的大面板，包住别的内容时用                         |
| `.b-rule`       | 标题底下那根渐变分隔线                                   |
| `.b-numeral`    | 描边空心的区块序号（装饰，调用点要 `aria-hidden`）       |
| `.b-chip`       | 药丸标签；`.b-chip-brand` 是品牌色版本                   |
| `.b-quote`      | 左侧品牌竖边的强调块，用于正文里需要加重的一段           |
| `.b-display`    | 加在标题上。**只对中文生效**，补字重（见下）             |

三条规则：

1. **区块背景只有两档**：`bg-background`（白）和 `bg-sea-tint`，**逐区块交替**。
2. **卡片底色和它所在的区块反着来**：区块是白的 → 卡片用 `.b-card`（浅蓝底）；区块是
   `bg-sea-tint` → 卡片加 `.b-card-on-tint` 翻成白底。这样卡片才浮得起来。
3. **`.b-display` 只管中文。** 自建的 Noto Sans SC 子集只有 300/400/700 三个字重，而 Manrope 能
   到 800 —— 同样写 `font-extrabold`，中文标题会明显比旁边的英文轻。这个类用一道同色细描边补上，
   拉丁字不需要所以不生效。**每个标题都该带上它**，哪怕你现在只看英文页。

这些类在 `@layer components` 里，所以调用点写 `p-8` 能正常覆盖它们的内距。

---

## 5. 改颜色 — 只动令牌

颜色全部走 `src/app.css` 的语义令牌。组件里只写**角色名**，不写色值：

```svelte
<!-- 对 -->
<p class="text-foreground-muted">…</p>
<!-- 错 -->
<p class="text-[#374151]">…</p>
```

要换品牌色，改 `src/app.css` 里令牌的**值**，全站一起变。2026-11-17 就是这么做的：主色从 teal
`#0B6E70` 换到手册的 sea `#1C5A8C`，**只动了第 4 区的几行别名**，约 230 处 utility 自己跟上。
（`--teal-*` 色阶仍然留着 —— OG 图渲染和 three.js 材质读的是字面值，不走令牌。）

`src/app.css` 的八个分区：

| 分区               | 内容                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| 1. PALETTE         | 调色板原值（navy / **sea** / teal / amber / 中性色）                 |
| 2. DERIVED PALETTE | 为满足对比度算出来的补充值                                           |
| 3. SURFACE LADDER  | 五级浅色表面 `--surface-0` … `--surface-4`（**区块背景已不用它**）   |
| 4. SEMANTIC TOKENS | `--foreground`、`--brand`、`--border` 等 —— **名字是冻结的，只改值** |
| 5. INVERTED BAND   | 深色色带里用的一整套对应令牌                                         |
| 6. STATUS          | 成功/警告/危险/信息，浅底一套、色带一套，**不要混用**                |
| 7. PHOTO SCRIM     | 图片上的遮罩                                                         |
| 8. ADMIN LEGACY    | 管理后台仍用旧的深色灰，本轮**不动**                                 |

### 动手前必须知道的三条硬规则

这些是量过对比度的结果，不是风格偏好。完整版在
[`docs/DESIGN-TOKENS.md` §3.0](DESIGN-TOKENS.md)，优先级 **R-FILL → R-SCRIM → R-OPACITY**：

1. **R-FILL** — 改任何 `text-*` 之前，先读完同一个 `class` 里有没有填充色。
   文字颜色由它所在的填充决定，而不是由周围的明暗环境决定。
2. **R-SCRIM** — 压在照片上的文字算"色带环境"，**只有三个文字令牌合法**：
   `text-band-foreground`、`text-band-foreground/80`、`text-band-brand-strong`。
   `-muted` / `-subtle` / `text-band-brand` 在遮罩上全部不达标 —— 遮罩上的层级靠**字号和字重**做，
   不靠再加一级灰。
3. **R-OPACITY** — 需要"淡一点"时，换成对应的实色令牌，不要叠透明度。

另外几个容易踩的：

- `--teal-500` **只能做图形，不能承载文字**（白底 4.12:1，不达 AA）
- `--line` 只能画装饰细线；控件边框必须用 `--border-strong`（装饰线只有 1.24:1）
- amber 永远不做正文文字；需要警告文字用 `--amber-800`

---

## 6. 换图片与视频

两条路，按用途选：

| 需求                                      | 放哪里            | 怎么引用                                                                   |
| ----------------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| 需要构建期处理（自动多尺寸 + webp，推荐） | `src/lib/assets/` | `import x from '$lib/assets/…?enhanced'` 然后 `<enhanced:img src={x} … />` |
| 运行时直接引用（视频、二维码等）          | `static/media/`   | 路径写 `/media/…`                                                          |

`src/lib/assets/` 已有的分组：`pillars/`、`programs/`、`highlights/`、`team/`、`site/`。
`static/media/` 下是 `images/` 和 `videos/`。

用 `<enhanced:img>` 时记得：

- `alt` 要给真实替代文字（走 Paraglide 消息，别留空）
- `sizes` 要如实描述它的显示宽度，例如 `sizes="(max-width: 768px) 100vw, 50vw"`
- 首屏之外的图加 `loading="lazy"`

> 注意：**首屏大图/视频直接决定 Lighthouse 的 LCP 门槛**（按路由分四档的 LCP 棘轮 +
> CLS ≤ 0.05，见 `lighthouserc.json`）。换首屏素材后请跑一次性能检查，别只看着好看就提交。

---

## 7. 改完必须跑的检查

### 必过 —— 这四条就是 CI 的 PR 门禁

`.github/workflows/web-ci.yml`（在仓库根，不在本目录）里跑的正是这些，本地先过能省一轮往返：

```bash
npm run lint          # ESLint + Prettier（报格式问题就跑 npm run format 自动修）
npm run check         # Paraglide 编译 + svelte-check（类型 + 无障碍）
npm run i18n:check    # en/zh 键对齐
npm test              # 单元测试
npm run build         # 必须产出 build/index.js
```

### 参考 —— 不在 PR 门禁里，但该看

```bash
npm run content:check # TODO(content) 标记 + 期次日期；目前是红的，见 §3 的用法说明
```

### 动了排版或配色，再跑端到端

```bash
npm run build         # 必须先构建
npm run test:e2e
```

它跑在**生产构建**上（端口 4321），不是 `vite dev`。几个会专门咬你的用例：

| 用例                        | 它守什么                                                             | 在 CI 里？ |
| --------------------------- | -------------------------------------------------------------------- | ---------- |
| `smoke.spec.ts`             | 路由覆盖**由 `/sitemap.xml` 推导**，新页面自动进套件；含导航栏吸顶态 | ✅ 是      |
| `a11y.spec.ts`              | axe 扫描，关键页面两个语言都不许有 serious/critical                  | ✅ 是      |
| `header-contrast.spec.ts`   | 采样导航栏**背后**的像素，断言每个链接 4.5:1 —— 改首屏配色极易踩中   | ❌ 仅本地  |
| `nav-single-line.spec.ts`   | 导航栏不许换行 —— 加导航条目或改字号会踩中                           | ❌ 仅本地  |
| `seo.spec.ts`               | 标题 / 描述 / hreflang                                               | ❌ 仅本地  |
| `admissions-funnel.spec.ts` | 招生转化路径                                                         | ❌ 仅本地  |

CI 只跑前两个（`smoke` + `a11y`），所以**改配色或导航后请在本地跑全套 `npm run test:e2e`** ——
`header-contrast` 和 `nav-single-line` 不会在 PR 上帮你兜住。

性能另有一条独立工作流 `.github/workflows/web-lighthouse.yml`（**手动触发 + 每周定时，不是
PR 门禁**）。硬门槛是 `lighthouserc.json` 里**按路由分四档**的 LCP 棘轮 ——
`/programs/ev-team` ≤ 6100ms、`/zh/programs/ev-team` ≤ 7800ms、其余 `/zh*` ≤ 5800ms、
其余 ≤ 4500ms —— 外加全站 CLS ≤ 0.05。2026-10-15 之前 ev-team 是一条 `.*ev-team.*` 盖两个
locale 的 7800，后来按 locale 拆开，EN 那条才收到 6100；所以如果你在别处看到"三档"，那是旧的。
其它指标（perf 0.85、a11y 0.9、seo 0.9、FCP、TBT）都只是 warn。换首屏大图或视频后要留意它。

---

## 8. 一个完整的例子

把首页 Mission 板块的大标题换一句话，并把它下面那段的间距收紧：

```bash
npm run dev                 # 1. 起环境（见 §1）
```

2. 在浏览器 http://localhost:5173 看到那句话，在 `messages/en.json` 里搜到它，
   键名是 `home_hero_empowerment`
3. 改 `messages/en.json` 和 `messages/zh.json` 里**同一个键**的值
4. 在 `src/lib/components/home/MissionSection.svelte` 找到标题下方那段的 `mt-8`，改成 `mt-5`
5. 浏览器自动刷新，确认 `/` 和 `/zh` 两个语言都对
6. 跑检查：

```bash
npm run i18n:check && npm run check && npm run lint
```

---

## 9. 常见陷阱速查

| 症状                           | 原因                                                                     |
| ------------------------------ | ------------------------------------------------------------------------ |
| 页面能显示但点什么都没反应     | 在运行中的生产服务器下面重新构建了。用 `npm run preview:prod`，或硬刷新  |
| 新加的消息键在组件里报"不存在" | 没跑 `npm run check`（Paraglide 需要重新编译）                           |
| `i18n:check` 失败              | 只改了 en 或只改了 zh                                                    |
| `content:check` 失败           | 它**本来就是红的**（见 §3）。只需确认条目数没因你的改动增加              |
| 数字带里某条数据不显示         | 该条缺 `source` 字段 —— 刻意行为，不是 bug                               |
| `header-contrast` 测试失败     | 改了首屏配色/遮罩，导航栏文字对比度掉到 4.5:1 以下                       |
| 改了颜色但页面没变             | 在组件里写了硬编码色值而不是令牌，或者改错了分区（后面的分区覆盖前面的） |
| 中文页行高/字距不对            | 不要在组件里修 —— 改 `src/app.css` 的 `html:lang(zh)` 区块               |

---

## 相关文档

- [`CLAUDE.md`](../CLAUDE.md) —— 架构总览、技术栈、环境变量
- [`docs/DESIGN-TOKENS.md`](DESIGN-TOKENS.md) —— 颜色令牌的完整规则书与查表
- [`docs/CONTENT-GAPS.md`](CONTENT-GAPS.md) —— 还欠负责人提供的内容
- [`docs/DECISIONS.md`](DECISIONS.md) —— 每一处偏离 PRD 的决策记录
- [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) —— 构建与上线流程
- [`docs/LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md) —— 发布关卡
