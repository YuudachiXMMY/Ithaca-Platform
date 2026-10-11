<!-- BEGIN:scheduling-agent-rules -->

# 课程排课系统 —— 动手前必读

多租户 SaaS。**租户隔离没有数据库层兜底**，全靠一条代码路径。这是你在这个 app 里要记住的
第一件事，也是唯一一件会造成真实数据泄露的事。

## 铁律一：`forTenant(ctx)` 是碰租户数据的唯一一条路

```ts
// ✅ 唯一合法写法
const rows = await forTenant(ctx).select(classSection)

// ❌ 静默跨租户 —— 没有报错，没有空结果，只是把别人的数据端上来
const rows = await db.select().from(classSection)
```

`src/db/tenant.ts` 的 `forTenant(ctx)` 做三件事：读/改/删一律 AND 上
`tenantId = ctx.tenantId`；写入时**强制注入** `tenantId`；update/delete 把 `tenantId` 和 `id`
从传入的 values 里剥掉，所以一次写入永远不可能把行搬去别的租户或改写它的 id。

**Postgres RLS 被延后了**（`docs/adr/0001-tenant-isolation-rls.md`），所以这层纪律是**唯一**的
防线。`tests/tenant-isolation.test.ts` 是行为回归测试，它抓不住一条没人测过的**新**绕行路径 ——
所以 CI 里还有 `scripts/check-tenant-db-access.ts`：任何不在 allowlist 里的文件碰裸 `db` 的
`select/insert/update/delete` 就让 CI 红。

**它拦住你的时候，正确反应是改用 `forTenant`，不是往 allowlist 里加一行。** 真要加，必须在
那一行旁边写明**为什么 `forTenant` 不适用**。

例外只有一类，并且已经写在代码里：`src/db/schema/site.ts` 的五张官网运营表是**平台全局**的
（只有一个官网，给市场站的询盘按机构分片没有意义），它们**没有 `tenant_id` 列**。它们的门是
另外两道：`/dashboard/site` 控制台查 `ctx.isPlatformAdmin`，`/api/site/*` 写入端点查
`SITE_INGEST_SECRET`。

## 铁律二：`proxy.ts` 不是鉴权

本项目用的是 Next 16 的 `proxy.ts`（不是 `middleware.ts`）。它只做一件事：**presence-check
session cookie，然后把没 cookie 的人跳到 `/login`**。它不验证签名，不查库，纯 UX 优化。

这是 CVE-2025-29927 的直接后果 —— 中间件头可被伪造。所以：

**每一个 Server Action、每一个 Route Handler、每一个 Server Component 数据加载，都必须自己调
`requireAuthContext()` + `requirePermission()`。** 不许依赖"反正 proxy 挡过了"。

## 铁律三：`tenantId` 只能来自已验证的 session

`getAuthContext()`（`src/auth/context.ts`）每个请求都从数据库的 `member` 行**重新推导**
tenant 与 role，并且显式 `disableCookieCache: true` 绕过 Better Auth 的 5 分钟 cookie 缓存 ——
这样被降权（`setRole`）或被封禁（session 删除）的用户**立刻**失去访问，而不是靠一个签过名的
缓存 cookie 再滑行 5 分钟。

**绝不要**从请求参数、body 或 cookie 里取 `tenantId`。一个过期或伪造的 cookie 永远换不来访问，
因为我们只返回用户真的有 `member` 行的那个组织。

## 技术栈

| 关注点 | 选择 |
|---|---|
| 框架 | Next.js 16（App Router、Turbopack、`output: 'standalone'`） |
| UI | React 19.3，Tailwind CSS v4 |
| DB / ORM | PostgreSQL 17 + Drizzle ORM（`postgres.js` 驱动） |
| 鉴权 | Better Auth 1.7（organization + admin 插件） |
| 主键 | `text` + `nanoid`（不可猜，租户安全） |
| 时间 | Luxon + `rrule`（重复课）+ `@touch4it/ical-timezones` |
| 环境变量 | `@t3-oss/env-nextjs` + zod，`src/env.ts` 在构建/启动时校验 |
| AI | `@anthropic-ai/sdk`（默认）或 MiniMax（`REPORT_PROVIDER=minimax`），用于报告起草 |
| MCP | `mcp-handler` + `@modelcontextprotocol/server`，挂在 `/api/[transport]` |
| 导出 | `@react-pdf/renderer`（PDF）、Playwright（PNG）、`archiver`（ZIP）、`ical-generator` |
| 测试 | vitest（96 个单测文件，**要一个跑着的 Postgres**）+ Playwright e2e |

## 两套权限宇宙，别混

1. **组织角色**（`member.role`）管租户内的日常业务。`owner` / `admin` / `teacher` /
   `assistant`，外加门户角色 `parent` / `student`。**可以是逗号分隔的多角色字符串**，所以每个
   helper 都先 split 再判断 —— 别写 `role === 'teacher'`。
2. **平台角色**（`user.role` 含 `superadmin` → `ctx.isPlatformAdmin`）是跨租户运维身份，
   `requirePermission` 对它直接放行。

在此之上还有**班级级收敛**（`src/auth/scope.ts`）：`teacher` 和 `assistant` 只能看见自己被
`section_teacher` 关联的班级、以及那些班级里在读的学生。只有 `owner`/`admin` 和平台超管是
全租户视角。**空列表意味着"这个人什么都看不到"**，调用方必须在 `inArray([])` 之前短路
（那是非法 SQL）。

门户侧（`parent`/`student` 登录 `/portal`）的行级范围**只**从 `portalLink` 按已验证的
`ctx.userId` 推导，绝不从请求参数取。

## 页面里用 `requirePagePermission`，不要用 `requirePermission`

`requirePermission` 抛 `AuthError`。在页面渲染里这会落到通用的 `dashboard/error.tsx`，而它的
"重试" `reset()` 重渲染同一段 → 再抛 → **无限循环**；更糟的是生产环境会把消息脱敏，边界甚至
判断不出这是个 FORBIDDEN。

`requirePagePermission` 改用 `notFound()`，那是框架**中断**而不是抛错：开发与生产一致，落到
最近的 not-found 边界，没有 reset 循环，而且 404（而非 403）不会向无权者确认这个页面存在。

- **页面** → `requirePagePermission`
- **Server Action / 数据加载器** → `requirePermission`（它们 catch `AuthError` 并作为数据返回）

## 不要做的事

- **不要加 `webpack()` 配置。** Turbopack 构建一旦检测到它就失败。
- **不要把 `/dashboard` 或 `/portal` 的 `Cache-Control` 放宽。** 它们是 `private, no-store`，
  原因是真事故：origin 曾发 `private, max-age=60`，Cloudflare 的 "Cache Everything" 规则认为可
  缓存并**跨用户投递** —— 一个匿名 GET `/dashboard/schedule` 返回了别人 session 的 RSC 载荷。
  同样的理由覆盖 `/s/:token`、`/sec/:token` 和 `/api/site/*`。
- **不要把提醒改成进程内定时器。** 它会在每次重新部署时死掉或重复。调度在**外部**，
  每 5 分钟 curl 一次 `/api/cron/reminders`（`CRON_SECRET` 把门，`dedupeKey` 让重叠/重试幂等）。
- **不要给 MCP 主体放 `isPlatformAdmin`。** `src/auth/mcp-context.ts` 把它**永远**设为 false ——
  一个 MCP token 绝不该拿到跨租户上帝模式。MCP 的主体来自服务端 env（`MCP_ORG_ID` /
  `MCP_USER_ID`），**绝不**来自工具参数，而且每个工具照样走 `requirePermission` + `forTenant`。
- **不要在运行时环境里设 `SKIP_ENV_VALIDATION`。** 它只在 `NEXT_PHASE=phase-production-build`
  时生效（镜像构建期没有密钥）。放开这个限制等于让密钥强度校验（`BETTER_AUTH_SECRET` /
  `MCP_BEARER_TOKEN` / `CRON_SECRET` 的 `.min(32)`、`ADMIN_PASSWORD` 的 `.min(16)`）被静默绕过。
- **不要把可选的 env 变成 fail-open。** 本项目的约定是**未配置 ⇒ 惰性 401 / 明确 503**，
  而不是"假装成功"。`/api/site/*` 没有 `SITE_INGEST_SECRET` 时保持 401；群发没有 SMTP 时回
  503，而不是把每个收件人记成已送达。

<!-- END:scheduling-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
