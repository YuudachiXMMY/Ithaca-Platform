@AGENTS.md

# Ithaca Family Academy 官网（`apps/web`）

`AGENTS.md` 是硬规矩（无状态、runes、配置内联在 `vite.config.ts`、预渲染的后果、四条禁区）。
这里是完整架构与操作细节。

> **上一版这份文档有 41 处引用指向已经不存在的东西**（admin 面板、Better Auth、Prisma、
> 6 个 `db:*` 脚本、`DATABASE_URL`）。那些子系统在 `552a31c`（2026-10-10）被删除。如果你从别处
> 看到它们，以 `package.json` 与 `.env.example` 为准。

## 这个站是什么

Ithaca Family Academy（安大略省的青少年教育机构，方向是 AI / 工程 / 创业）的**公开官网**，
英中双语。它只有一类用户：**浏览者**（家长与学生）。运营端（询盘管理、订阅者、邮件群发、
弹窗配置）已经整体搬到排课系统的 `/dashboard/site`。

主要到站路径是**微信分享**，这解释了代码里很多看起来过度的取舍：OG 卡的中心正方形构图、
自建 CJK 字体子集、`/zh` 单独的 Lighthouse 门限、移动端是 Playwright 的一等目标。

## 架构

```
SvelteKit 2（Svelte 5 runes · adapter-node → build/index.js · 全站预渲染）
 │
 ├─ i18n          Paraglide，locale 只从 URL 取 ⇒ 预渲染安全（不读 cookie/header）
 │                '/' = en，'/zh/*' = zh；/api/* 与 /admin/* 不本地化
 │                strategy 与 urlPatterns 内联在 vite.config.ts
 │
 ├─ 公开页        /                      首页
 │                /about-us  /about-us/our-team
 │                /academics/{ap,ossd,stem,tutoring}
 │                /admissions            招生漏斗（整站存在的理由）
 │                /programs/*            10 个项目页 + 索引
 │                /results  /success-stories  /student-life
 │                /contact-us
 │                /privacy  /terms
 │
 ├─ 生成端点      /sitemap.xml   由 import.meta.glob 枚举路由 ⇒ 新页自动进站点图
 │                /robots.txt
 │                /og/[...slug] satori + resvg 渲染的 OG PNG（构建期预渲染进 build/）
 │
 ├─ 公开 API      POST /api/contact         硬失败：写不进去就 500
 │                POST /api/subscribe       硬失败
 │                GET  /api/popups/active   软降级：上游挂了就"无弹窗"
 │
 └─ /admin/*      302 → 排课系统的 /dashboard/site（hooks.server.ts，有硬编码兜底）
```

**这个 app 没有自己的持久层。** 唯一的后端依赖是排课系统的 `/api/site/*`，详见根
`AGENTS.md` 的「跨 app 契约」与 `src/lib/server/site-api.ts`。

## 目录结构

| 路径                 | 职责                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes`         | 页面（`+page.svelte`）、loader（`+page.ts`）、端点（`+server.ts`）                                                                        |
| `src/lib/content`    | **内容模型**，PRD §6.1 的逐字移植：`programs` `season-data` `people` `results` `faq` `partners` `highlights` `stats` `admissions` `types` |
| `src/lib/data`       | **展示用数据**：`nav`（含每个项目的季节状态）、`programs`（索引卡列表）、`contact`、`team`                                                |
| `src/lib/components` | 手写组件，按页分组：`about` `admissions` `contact` `home` `layout` `media` `programs` `results` `shared`。**没有外部组件库。**            |
| `src/lib/server`     | 服务端专属：`site-api` `popup-cache` `mail` `csrf` `guard` `validation` `rate-limit` `turnstile` `og/`（satori 字体与渲染）               |
| `src/lib/og`         | `cards.ts` —— OG 卡注册表，**一张表两个消费者**（PNG 渲染端点 + `Seo.svelte` 的 `og:image`），不许各自为政                                |
| `src/lib/motion`     | GSAP 封装与生命周期（`gsap-lifecycle.ts`）                                                                                                |
| `src/lib/actions`    | Svelte action：`focus-trap` `inview`                                                                                                      |
| `src/lib/assets`     | 构建期处理的图片（`@sveltejs/enhanced-img`）                                                                                              |
| `src/lib/paraglide`  | Paraglide 编译产物 —— **生成的，已 gitignore**                                                                                            |
| `src/lib/*.ts`       | 业务纯函数，就近放 `*.test.ts`：`seasons` `program-season` `program-cta` `admissions` `results` `analytics` `seo` `utils`                 |
| `messages`           | Paraglide 扁平词条：`en.json` / `zh.json`（**一个 locale 一个文件**，不是命名空间目录）                                                   |
| `static`             | 运行时静态资源：`media/{images,videos}`、自建的 `fonts/`                                                                                  |
| `scripts`            | 见下方「脚本」                                                                                                                            |
| `e2e`                | Playwright（8 个套件）                                                                                                                    |
| `.claude/PRPs`       | PRD / plan / report / review —— **历史记录**，与代码冲突时代码赢                                                                          |

### 根层那几个关键文件

- `src/hooks.server.ts` —— 两件事，都不涉及会话（会话随 Better Auth 一起没了）：
  ① i18n locale 注入 `<html lang dir>` + GA 片段注入 + **只预加载两个 latin 字体切片**
  （`type === 'font'` 会让 SvelteKit 预载全部 13 个 subset，约 10 倍字节，是个陷阱）；
  ② `/admin/*` **302** 跳转（不是 301 —— 永久跳转会被浏览器和 Cloudflare 缓存住）。
- `src/hooks.ts` —— `reroute`，把 `/zh/about-us` 映射回 `/about-us`。**纯函数**，客户端也跑，
  所以不能读 cookie/header。
- `src/app.css` + `src/routes/layout.css` —— 设计 token 的落点，细节见 `docs/DESIGN-TOKENS.md`。

## 跑起来

```bash
cp .env.example .env     # 本地什么都不填也能跑
npm ci --engine-strict=false
npm run dev              # :5173
```

**本地不需要 Postgres，不需要任何密钥。** 未配置时的降级行为是刻意设计的：SMTP 不配 ⇒ 不发信
但表单成功；Turnstile 不配 ⇒ 跳过校验；排课系统不配 ⇒ 询盘/订阅 500、弹窗无。

生产产物（以及 Docker 镜像）听 `:3000`。要在本地验生产构建，**用 `npm run preview:prod`**
（`:4399`），不要手工 `build` + `start`（原因见 `AGENTS.md` 的第一条禁区）。

### 脚本

| 命令                                 | 说明                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                        | Vite dev server，`:5173`                                                                                          |
| `npm run build`                      | `fonts:cjk` → `vite build` → `fonts:verify`。**CJK 子集是构建的一部分**，不是可选步骤                             |
| `npm run preview:prod`               | 先腾端口再构建再服务，`:4399`（`PORT` 可覆盖）；它拒绝杀非 preview 进程                                           |
| `npm run check`                      | Paraglide 编译 + `svelte-kit sync` + `svelte-check`（类型 + a11y）                                                |
| `npm run lint` / `format`            | `eslint . && prettier --check .` / `prettier --write .`                                                           |
| `npm test` / `test:watch`            | vitest（`environment: 'node'`）                                                                                   |
| `npm run i18n:check`                 | en/zh 词条 key 对齐                                                                                               |
| `npm run content:check`              | 内容就绪门禁：PRD §6.4 页面上残留 `TODO(content)`、或 live 项目引用了没有有效 `start`/`end` 的 `Season`，则退出 1 |
| `npm run test:e2e` / `:ui`           | Playwright。**需要先 `npm run build`**                                                                            |
| `npm run fonts:cjk` / `fonts:verify` | 生成 / 校验自建 Noto Sans SC 子集                                                                                 |
| `npm run lhci`                       | 本地跑 Lighthouse CI                                                                                              |
| `npm run prod:*`                     | `deploy` `logs` `status` `backup` `rollback` —— 经 SSH 包装 IthacaServer 的 `ops.sh`                              |

`scripts/` 下还有 `docker-smoke.sh`（生产镜像端到端冒烟：构建 + 公开路由 + `/admin` 跳转 +
弹窗软降级路径）、`check-i18n.ts`、`content-check.ts`、`build-cjk-subset.ts`、
`preview-prod.sh`、`prod.sh`，以及一次性的 `migrate-messages.ts`。

### 环境变量

全部是可选的或有兜底的，**除了 `ORIGIN`**。

| 变量                                                                     | 时机                   | 说明                                                                                                                                             |
| ------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ORIGIN`                                                                 | 运行时（生产**必须**） | adapter-node 的 CSRF 来源 + 绝对 URL。`csrf.ts` 没有它会**全部关门**，于是每个公开 POST 403                                                      |
| `PUBLIC_SITE_URL`                                                        | **构建期**             | SEO / OG / hreflang / sitemap 的规范 origin                                                                                                      |
| `PUBLIC_GA_TRACKING_ID`                                                  | **构建期**             | GA ID（Dockerfile 里有默认值）                                                                                                                   |
| `COURSE_SCHEDULING_API_URL`                                              | 运行时                 | 排课系统 `/api/site/*` 的基址（无尾斜杠）                                                                                                        |
| `SITE_INGEST_SECRET`                                                     | 运行时                 | 共享密钥，两边必须完全一致。未配 ⇒ 询盘/订阅 500、弹窗软降级                                                                                     |
| `PUBLIC_SITE_ADMIN_URL`                                                  | 运行时                 | `/admin/*` 跳哪。`hooks.server.ts` 有硬编码兜底，不配也能跳                                                                                      |
| `INQUIRY_TO`                                                             | 运行时                 | 询盘收件地址。不配兜底到原硬编码地址，避免某次部署忘了就静默丢询盘                                                                               |
| `ADDRESS_HEADER` / `PROTOCOL_HEADER` / `HOST_HEADER` / `BODY_SIZE_LIMIT` | 运行时                 | Cloudflare 后面取真实客户端信息（已烘进 Dockerfile）                                                                                             |
| `SMTP_*`（含 `SMTP_TLS_INSECURE`）                                       | 运行时                 | nodemailer / Stalwart。不配 = 不发信但表单成功。`SMTP_TLS_INSECURE=1` **只**用于内网别名 `stalwart`                                              |
| `PUBLIC_TURNSTILE_SITE_KEY`                                              | **构建期**             | 配 secret 就必须配它，否则全站表单 403（见 `AGENTS.md`）                                                                                         |
| `TURNSTILE_SECRET_KEY`                                                   | 运行时                 | 不配 = 跳过校验（底下还有 CSRF + 限流托着，降级成"同源 + 限流"而非"开放中继"）                                                                   |
| `PUBLIC_BOOKING_URL`                                                     | **构建期**             | `/admissions#book` 的预约链接。不配则降级为联系表单。**PRD §18 把它写成运行时 `BOOKING_URL`，那是做不到的** —— `/admissions` 是预渲染的静态 HTML |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`                                      | 运行时                 | 分布式限流。不配 = 进程内滑动窗口（单实例够用）                                                                                                  |

**`PUBLIC_*` 经 Vite 在构建期内联**，所以必须在 `vite build` **之前**就位；Docker/CI 里以
build-arg 传入。非 `PUBLIC_` 的变量全部只在函数内部读（`$env/dynamic/private`），**没有任何
模块在加载期读 env** —— 这是 Dockerfile 不再需要占位密钥的前提，请保持。

## 测试

`npm test` 的 vitest 跑在 `environment: 'node'`，**没有 jsdom，也没有
`@testing-library/svelte`**。所以每个 `*.test.ts` 都是纯逻辑测试，包括放在
`src/lib/components/` 下面的那些。**UI 层的验证是 Playwright 的活，不是 vitest 的。**

Playwright 跑**生产构建**（`node build/index.js`，`:4321`），不是 `vite dev` —— 发布的是预渲染
产物，而预渲染的 bug 在 dev 下看不见。`reuseExistingServer: false`：端口被占就响亮失败，而不是
悄悄把整个套件指向别人的服务。

| 套件                        | 它守住什么                                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smoke.spec.ts`             | 路由覆盖**由 `/sitemap.xml` 推导** ⇒ 新页自动入列；外加语言切换、键盘导航、表单校验、重定向，以及 header 的滚动态（这同时是**唯一**能发现 header 没 hydrate 的检查 —— 一个冻住的 header 能通过所有对比度断言） |
| `a11y.spec.ts`              | axe，PRD §6.4 每一页、两种语言、零 serious/critical。还没上线的路由也列着并显式 skip，落地当天自动进门禁                                                                                                       |
| `header-contrast.spec.ts`   | 采样 header **背后**的像素，断言每个导航链接 4.5:1。axe 做不到这件事：它把图上文字的对比度报成 `incomplete`，于是 84 个元素里有 40 个低于 AA 还一路绿灯                                                        |
| `nav-single-line.spec.ts`   | 桌面导航栏单行不折。栏目涨到七项后余量只剩约 10px，而折了之后"完全合法"——过 axe、过对比度，只是丑                                                                                                              |
| `admissions-funnel.spec.ts` | 整条招生漏斗走通。其它套件各查一个关节，这个查关节连不连 —— 曾经 `/admissions` 只存在于 sitemap 里，这条路走不通而每个单项测试照样绿                                                                           |
| `analytics.spec.ts`         | 六个 GA4 事件真的接在用户动作上，且 `dataLayer` 里**不含任何表单字段值**                                                                                                                                       |
| `seo.spec.ts`               | 规范链接 / OG / JSON-LD，覆盖范围同样由 sitemap 推导                                                                                                                                                           |
| `locale-suggestion.spec.ts` | 中文入口的可发现性（header 语言切换下沉到 footer 之后的补偿）                                                                                                                                                  |

**本地直接 `npm run test:e2e` 会红 19 条，而 CI 是绿的 —— 这不是 flake。** `analytics.spec.ts`
整套（外加 `locale-suggestion` 的 `locale_switch` 和 `admissions-funnel` 的中文提交）断言的是
`dataLayer` 里的 GA4 事件，而 GA 片段只在 `PUBLIC_GA_TRACKING_ID` 有值时才注入；它是**构建期
内联**的，CI 在 `npm run build` 前设了它，本地 `.env` 没有就等于在测一个没有 GA 的站。
复现 CI 的条件要连 build 一起带上：

```bash
PUBLIC_GA_TRACKING_ID=G-675W5PPJEJ PUBLIC_SITE_URL=https://ithacateens.com npm run build
npm run test:e2e
```

`header-contrast.spec.ts:282`（「still legible once the bar paints its own background」）在满负载
跑全套时偶发失败，单独跑和重跑全套都过 —— 2026-10-16 实测过三次。看到它红先重跑，别先改代码。

**CI**（在仓库根，不在这个目录）：

- `web-ci.yml` —— PR 门禁：lint、check、i18n 对齐、单测、构建、Playwright、axe
- `web-release.yml` —— push `prod` 分支 → 推 GHCR 镜像
- `web-lighthouse.yml` —— **`workflow_dispatch` + 周定时，不是 per-PR 门禁**。它曾占官网仓
  67% 的 CI 分钟且 65 跑 59 红；那个红是真实的 LCP 债，但 runner 自身方差太大（`/` 三次采样
  6304 / 6509 / 10420 ms）不适合当门禁

`lighthouserc.json` 的门限是**按 URL 的 `assertMatrix`**，每条都是"卡在实测值上的棘轮"而不是
余量 —— 例如 `/zh` 的 LCP 门限就压在当前测得的值上，页面变快就往下调，**永远不往上调**。
`/zh` 比英文页多一个 CJK 字体（900 个汉字、两个字重、251 KB，已经压到极限），那 +1.28s 是
机构方知情后选择支付的成本。

## 写代码时

- **i18n**：新 key 同时进两个 `messages/*.json`，然后 `npm run check`。
- **内容 vs 数据**：记录进 `src/lib/content/`，索引卡/导航进 `src/lib/data/`。
  `src/lib/content/types.ts` 的字段名是**和 PRD 对齐的契约**，JSON-LD 生成器、招生日历、
  `$lib/seasons` 都按那些名字写的 —— 改名会破坏一个写在文档里而不是代码里的约定。
- **新端点**：用 `guard.ts` 的 `guardPublicPost` + `validation.ts` 的 Zod 400 封装，别重写前置。
- **OG 卡**：改 `src/lib/og/cards.ts` 这一张表；它的词条存的是 message **函数**而不是字符串，
  因为渲染发生在请求之外、拿不到 `getLocale()`。
- **GSAP / Threlte**：注册与清理走 `src/lib/motion/gsap-lifecycle.ts`，并尊重
  reduced-motion；`three` 经 `ssr.noExternal` 打进 SSR 包。
- **图片**：构建期处理的放 `src/lib/assets`（`<enhanced:img>`），运行时静态的放 `static/media`。
- **预渲染是默认**（根 `+layout.ts` 的 `prerender = true`）。要加一个真正动态的页面，得在那个
  页面上显式 `export const prerender = false`，并想清楚它对 Lighthouse 与缓存的影响。

## Docker

多阶段构建 → adapter-node 独立服务，`:3000`。`CMD` 就是 `node build/index.js`，**没有
`migrate deploy &&` 前缀**（没有库可迁移，也因此没有 P3009 那种会冻住后续部署的失败模式）。

`libc6-compat` **不是 Prisma 的遗留** —— 它是构建期 musl 原生插件要的：`@resvg/resvg-js`
（渲染 OG PNG）和 `@sveltejs/enhanced-img` 背后的 sharp。删了它坏的是 `vite build`，不是运行时。
runner 阶段刻意没装它，因为那两个包是 devDependencies，`npm ci --omit=dev` 根本不会装。
