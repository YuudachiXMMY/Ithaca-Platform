<!-- BEGIN:sveltekit-agent-rules -->

# 这个 app 是**无状态**的，而且不是你熟悉的那个 SvelteKit

两件事会让凭经验或凭旧文档动手的人立刻踩坑：

1. **没有数据库。** 提交 `552a31c`（2026-10-10，官网无状态化）删掉了 admin 面板、Better Auth
   和 Prisma。没有 `DATABASE_URL`，没有 `prisma/`，没有 `db:*` 脚本，没有 `/admin` 页面，
   Dockerfile 里也没有 `migrate deploy`。询盘 / 订阅者 / 弹窗这三类数据归**排课系统**所有，
   本站通过 HTTP 调它的 `/api/site/*`。
2. **SvelteKit 2 + Svelte 5 runes 模式。** API 与老 Svelte、以及大多数训练数据都不一样。写之前
   对着 `package.json` 里锁定的版本确认，别照 Svelte 4 的写法来。

## 技术栈

- **框架**：SvelteKit 2 + `@sveltejs/adapter-node` → 独立产物 `build/index.js`（听 `:3000`）
- **UI**：Svelte 5 **runes**（`$state` / `$derived` / `$effect` / `$props`）—— 在
  `vite.config.ts` 里对 app 代码强制开启（`node_modules` 除外）
- **样式**：Tailwind CSS v4，经 `@tailwindcss/vite`
- **i18n**：Paraglide（`@inlang/paraglide-js`），`messages/{en,zh}.json` 编译到
  `src/lib/paraglide`；**locale 只从 URL 取**（`/` = en，`/zh` = zh）
- **字体**：Inter（正文）+ Manrope（标题），自托管；中文走 `scripts/build-cjk-subset.ts` 自建子集
- **3D**：Threlte（`@threlte/core` + `@threlte/extras`）over three.js
- **动效**：Svelte transitions + GSAP
- **图标**：`lucide-svelte`
- **校验**：`zod` v4
- **邮件**：nodemailer SMTP（`src/lib/server/mail.ts`）—— 未配置 SMTP 时**优雅空转**
- **OG 图**：satori + `@resvg/resvg-js`，构建期预渲染成 PNG

**没有 `svelte.config.js`。** SvelteKit / Paraglide / enhanced-img / adapter / CSRF / prerender
全部**内联配在 `vite.config.ts`**。动配置前先读那个文件。

## 约定

- 路径别名只有 `$lib` → `src/lib`（SvelteKit 默认）。**没有** `@/*`。
- `src/lib/server/**` 是服务端专属，**绝不能**被客户端代码 import。
- HTTP 端点是 `src/routes/api/**` 下的 `+server.ts`；表单用 SvelteKit **form actions**。
- 每一句面向用户的文案都走 Paraglide：key 要**同时**加进 `messages/en.json` 和
  `messages/zh.json`，然后跑 `npm run check`（它会编译 Paraglide）。`npm run i18n:check` 校对齐。
- 所有公开页都是**预渲染**的。这条约束比它看起来重：运行时环境变量改不了一个已经是静态 HTML
  的页面，所以任何要进页面的配置必须是 `PUBLIC_*` 且在 `vite build` **之前**就位。
- 公开的 JSON POST 端点统一走 `src/lib/server/guard.ts` 的安全前置：
  来源白名单 → 双提交 CSRF → 滑动窗口限流，顺序固定且逐级短路。别在新端点里重新手写一遍。

## 浏览器支持地板 —— 比你以为的低一截

**`prd.md` §14 R-COMPAT-1 要求 iOS Safari 16+ 与微信内置浏览器（iOS WKWebView 和 Android
X5）。`docs/DESIGN-TOKENS.md` §1.8 实测 X5/XWeb 常见为 Chromium ≤ 107。**
微信分享是本站的主要到站路径，所以这是生产风险而不是理论问题。

**有效地板 ≈ Chromium 107（2022-10）+ iOS Safari 16.0（2022-09）。**

这条写在这里，是因为它在 PRD 和 DESIGN-TOKENS 里时工具链读不到 —— `vite.config.ts` 的
`build.target` 曾经没设，于是取 Vite 8 默认的 `baseline-widely-available`
（`chrome111 / safari16.4 / ios16.4`），比我们承诺的高出一整代。现在它被显式写成
`['chrome107', 'safari16']`，**要抬它必须和 R-COMPAT-1 一起抬**。

几个会被误判为"现代化欠账"的东西，其实是地板外、**不该动**：

| 特性                                                     | 状态                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `popover`、invoker commands（`command`/`commandfor`）    | ⛔ Safari iOS 18.3 / 26.2                                                           |
| `::details-content`、`interpolate-size`                  | ⛔ Safari 18.4 / Chrome-only                                                        |
| `@starting-style`、`transition-behavior: allow-discrete` | ⛔ Safari 17.4+                                                                     |
| 滚动驱动动画（`animation-timeline`）                     | ⛔ Safari 26；降级后元素停在 `opacity: 0`，内容直接不可见                           |
| `light-dark()`、`:user-invalid`、`field-sizing`          | ⛔                                                                                  |
| `scrollbar-color` / `scrollbar-width`                    | ⚠️ Safari 26.2 / 18.2 —— 所以 `app.css` 的 `::-webkit-scrollbar` 回退块是**承重的** |
| `color-mix()`                                            | ⚠️ 这就是 `app.css` 里 28 个 `@supports` 守卫存在的原因，见 DESIGN-TOKENS §1.8      |

**地板内可用、值得用**的：`<dialog>` + `showModal()`（2022-03）、`<details>`、`inert`、
独立 transform 属性（`translate`/`rotate`/`scale`，2022-08）、`aspect-ratio`、`dvh`、
`clamp()`、容器查询、`:has()`、`overflow: clip`。

**一个已查明的误报**，省得下一个人重查：设 `build.target` 之前，产物 CSS 里有 19 处
`oklch()`（Chromium ≤ 107 不支持），全是 Tailwind 自己的默认调色板 token。它们确实被
`.text-red-400` / `.bg-red-500/10` 这类工具类引用，**但那些类在任何预渲染页面里都出现 0 次**
—— Tailwind 4 会扫 CSS 文件里的类名，而 `app.css:114` 的一段散文注释恰好点了四个类名。
所以当时是死 CSS，不是渲染缺陷。

设上 `build.target` 之后 Lightning CSS 把它们全部降级，产物里 `oklch(` 归零，代价是 brotli
**+305 字节（+0.07%）**、文件数不变。所以这条配置不只是"防未来"：它顺带让 Tailwind 的默认
调色板在 X5 上真正可用了 —— 哪天有人真用上 `text-red-500`，不会再静默失效。
（2026-11-16 查证并实测。）

## 动手前

- 读 `vite.config.ts`（配置都在里面）。
- 代码注释里满地的 `prd.md §x` / `R-SEO-2` 指的是 `.claude/PRPs/prds/prd.md`。
- `src/lib/content/` 是 PRD §6.1 的**内容模型**（programs / seasons / people / results / faq /
  partners / highlights / stats / admissions）。`src/lib/data/` 是**展示用数据**（nav 结构、
  首页卡片列表、contact、team）。两者都有 `programs.ts`，**不是重复** —— `content` 是记录，
  `data` 是索引卡列表，后者用 slug 指回前者。
- `docs/EDITING-GUIDE.md` 说清了"改文案 / 改间距 / 改配色 / 换图"各自该碰哪个文件。
- `docs/DECISIONS.md` 记录每一处偏离 PRD 的决策，`docs/CONTENT-GAPS.md` 记录内容方还欠什么。
  **做完就追加，别攒着。**
- `TODO(content):` 是"等内容方供稿"的标记，`scripts/content-check.ts` 会在它出现在 PRD §6.4
  要求完整的页面上时让 CI 红。

## 不要做的事

- **不要在跑着的 `node build/index.js` 底下重新构建。** adapter-node 用 sirv 服务
  `build/client`，那个目录**只在启动时索引一次**，所以重建后每个新哈希的 chunk 都 404。页面照样
  渲染（HTML 是预渲染的）但永远不 hydrate —— 什么都点不动，header 卡在初始状态，**而且不报任何
  错**。用 `npm run preview:prod`，它在构建**之前**先腾出端口。
- **不要给 `TURNSTILE_SECRET_KEY` 配上却不配 `PUBLIC_TURNSTILE_SITE_KEY`。** site key 是构建期
  内联的；secret 有而 site key 空 ⇒ 组件不渲染 ⇒ 不产生 token ⇒ 校验硬失败 ⇒ `/api/contact`
  对每个访客 403。
- **不要往 Dockerfile 里加占位的 `DATABASE_URL` / `BETTER_AUTH_*`。** 它们当年存在只是因为
  Better Auth 在模块加载时实例化。现在没有任何模块在加载期读 env，而"一个从不用来签名的烘焙
  密钥"离"被用来签名"只差一次重构。
- **不要靠放宽 `lighthouserc.json` 的门限来修 Lighthouse 红。** 那些数字是在作者本机量的，放宽
  等于把回归藏起来。

<!-- END:sveltekit-agent-rules -->
