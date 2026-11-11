@AGENTS.md

# 课程排课系统（`apps/scheduling`）

`AGENTS.md` 是硬规矩（`forTenant` 唯一路径、`proxy.ts` 不是鉴权、`tenantId` 只来自 session、
两套权限宇宙、页面用 `requirePagePermission`、六条禁区）。这里是完整架构与操作细节。

## 这个系统是什么

Ithaca Family Academy 的课程排课与教务平台，`dashboard.ithacateens.com`。**多租户**
（一个部署服务多个机构），同时**兼任官网的运营后台**。

三类登录者，三个入口：

| 入口 | 谁 | 鉴权 |
|---|---|---|
| `/dashboard` | 员工（owner / admin / teacher / assistant） | Better Auth session + 组织 RBAC |
| `/portal` | 家长 / 学生 | Better Auth session，行级范围来自 `portalLink` |
| `/s/<token>` · `/sec/<token>` | 任何拿到链接的人 | **无鉴权**，token 本身就是凭据 |

外加两条机器入口：`/api/site/*`（官网服务端，共享密钥）和 `/api/[transport]`（Claude MCP，
静态 bearer）。

## 架构

```
Next.js 16 App Router（React 19 · Turbopack · output: 'standalone'）
 │
 ├─ proxy.ts              仅 UX：presence-check cookie → 跳 /login。不是鉴权（CVE-2025-29927）
 │
 ├─ (auth)/               /login
 │                       /signup → 302 /login（自助注册已关闭：单运营方部署。页面保留只为
 │                       不让旧书签 404；真正的后盾是 auth.ts 的 disableSignUp，
 │                       绕过页面直接打 /sign-up/email 也会被拒。首个账号靠 seed-admin）
 │
 ├─ dashboard/            员工工作台（Cache-Control: private, no-store）
 │   ├─ schedule          排课主视图
 │   ├─ courses           课程与班级（班级设置里给 teacher/assistant 挂 section_teacher）
 │   ├─ students          学生与选课
 │   ├─ teach/[sectionId] 教师本班工作台（分 tab：点名、课堂笔记……）
 │   ├─ reschedule        调课申请的审批
 │   ├─ reports           进度报告（AI 起草 → 人工定稿 → PDF）
 │   ├─ calendar          日历订阅 feed 管理
 │   ├─ notifications     站内通知中心（**通知的事实来源**，Web Push 只是尽力而为）
 │   ├─ users             员工 / 家长账号（分层鉴权见 src/auth/staff-authz.ts）
 │   ├─ account           改自己的密码与资料
 │   └─ site              **官网运营控制台**，仅 ctx.isPlatformAdmin
 │       ├─ contacts      询盘        ├─ subscribers  订阅者
 │       └─ emails        邮件群发    └─ popups       弹窗
 │
 ├─ portal/               家长 / 学生门户（private, no-store）
 │   └─ account · notes · notifications · reports · reschedule
 │
 ├─ s/[token]             公开只读：单个学生的课表（noindex + private, no-store）
 ├─ sec/[token]           公开只读：一个班级的课表（同上）
 ├─ privacy               隐私政策
 │
 └─ api/
     ├─ auth/[...all]     Better Auth handler
     ├─ health            {"ok":true}；探针自建连接但**同样降为 `app_rt`**，且**读一张真表**
     │                    （`select 1 from "organization" limit 0`）—— 角色是集群级的而 GRANT 是
     │                    库级的，所以「角色有、授权没有」是真实可达的状态；裸 `select 1` 不碰任何
     │                    表、不需要授权，在那个状态下仍返回绿（见 ADR 0003 的 consequences，
     │                    以及 ADR 0004 对其原理由的更正）
     ├─ [transport]       MCP Streamable HTTP（静态 bearer，恒定时间比对）
     ├─ cron/reminders    课前 24h / 1h 提醒派发（CRON_SECRET 把门，外部调度器 curl）
     ├─ calendar/[token]              iCal feed（学生）
     ├─ calendar/section/[token]      iCal feed（班级）
     ├─ export/student/[id]/{ics,png} 单学生课表导出
     ├─ export/section/[id]           班级导出（ZIP）
     ├─ reports/[id]/pdf              报告 PDF
     ├─ reports/section/[id]          班级批量报告
     └─ site/{contact,subscribe,popups/active}  官网写入/读取（SITE_INGEST_SECRET）
```

## 目录结构

| 路径 | 职责 |
|---|---|
| `src/auth` | **鉴权脊梁**，15 个模块，见下表 |
| `src/db/tenant.ts` | `forTenant(ctx, exec?)` —— 碰租户数据的正道；`withTenantScope(tenantId, fn)` —— 给 token 公开读取 / 批量写入这类合法例外用的显式作用域 |
| `src/db/admin.ts` | ⚠️ **绕过 RLS** 的超级用户客户端。只给 `scripts/` 与 `tests/`，app 代码 import 它会让 CI 红 |
| `src/db/rls-role.ts` | `-c role=app_rt` 这一个常量。单独成文件是为了让 `/api/health` 能复用它而不必 import `@/db`（那会把 10 连接的池建起来） |
| `src/db/schema/` | 21 个 schema 模块（见下） |
| `src/db/auth-schema.ts` | Better Auth **生成**的表（`user`/`session`/`organization`/`member`/…）。改它请跑 `npm run auth:generate`，不要手改 |
| `src/lib/*` | 业务核心逻辑，一律是可单测的纯函数 / core 函数（见下） |
| `src/lib/site/` | 官网控制台与写入端点的后端：`ingest-auth` `ingest-core` `admin-core` `campaigns-core` `recipients` `popup-active` `csv` `schemas` `authz` … |
| `src/mcp/` | `register-tools.ts`（8 个 MCP 工具）+ `message.ts` |
| `scripts/` | 运维与守卫脚本（见下） |
| `drizzle/` | 29 个**单向**迁移 + `meta/`。`0026` 启用 RLS，`0027`+`0028` 把 token 解析收进 SECURITY DEFINER 函数 |
| `tests/` | 99 个 vitest 单测 + `tests/e2e/` 的 Playwright 套件 |
| `docker/entrypoint.sh` | 容器启动序列（见「Docker」） |
| `.claude/PRPs`、`.claude/reviews` | PRD / plan / report / 安全审计 —— **历史记录**，与代码冲突时代码赢 |

### `src/auth` 各模块

| 文件 | 职责 |
|---|---|
| `auth.ts` | Better Auth 实例（organization + admin 插件）；`user.create.after` 钩子建组织与 owner member |
| `context.ts` | `getAuthContext()` / `requireAuthContext()` —— 每请求从 `member` 行重推 tenant+role，绕过 cookie 缓存 |
| `authorize.ts` | `can()` / `requirePermission()` / `requirePagePermission()` |
| `permissions.ts` | 两套 access control 的语句集与角色矩阵（含为前向稳定而**预留**的语句） |
| `roles.ts` | 纯标签与分层判断，**无 `server-only`**，客户端组件可以 import |
| `scope.ts` | 班级级收敛：`sectionIdsForActor` / `studentIdsForActor` / `actorOwns*` |
| `portal.ts` | 门户角色判断 + `resolveLinkedStudentIds` / `assertLinkedToStudent` |
| `staff-authz.ts` | 员工账号管理的分层授权：**只有超管能碰 owner/admin 账号** |
| `mcp-context.ts` | MCP 的替代主体源（env → 重推 role，`isPlatformAdmin` 恒为 false） |
| `provision.ts` | 开通家长/学生门户账号（无邮箱的微信用户合成占位邮箱） |
| `password.ts` / `password-policy.ts` | 密码哈希与强度策略 |
| `account-actions.ts` | 改自己的密码等自助操作 |
| `staff.ts` / `client.ts` | 员工查询 / 客户端 auth SDK |

### `src/db/schema` 各表

业务表（**都带 `tenant_id`**，经 `forTenant` 访问）：`student` `course` `section-teacher`
`enrollment` `lesson` `attendance` `grade` `note` `progress-report` `calendar-feed`
`share-link` `section-share-link` `portal-link` `notification` `push-subscription`
`reserved`（预留）。

辅助：`_helpers`（`primaryId`/`createdAt`/`updatedAt`）、`enums`、`relations`、`index`。

**特例 `site.ts`** —— 官网运营的 5 张表，**平台全局、没有 `tenant_id`**，`forTenant()` 不适用，
也**不启用 RLS**。碰它们的模块必须登记进 `scripts/check-tenant-db-access.ts` 的 ALLOWLIST。

### RLS（迁移 `0026`，`docs/adr/0003-tenant-isolation-rls-enabled.md`）

20 张带 `tenant_id` 的表都启用了 Row Level Security，策略是
`tenant_id = current_setting('app.tenant_id', true)`（`USING` + `WITH CHECK` 都有 —— 只有
`USING` 的话插入仍能把行塞进别的租户）。

三个必须知道的点：

1. **运行时不是超级用户。** `src/db/index.ts` 建连时带 `-c role=app_rt` 降为受约束角色（选项字符串
   在 `src/db/rls-role.ts`，`/api/health` 的探针共用同一个常量 —— **任何**自建连接的运行时代码
   都要带上它，否则就是一条绕过 RLS 的裸连接。这条现在由
   `scripts/check-tenant-db-access.ts` 的第三条规则机械保证，不靠人记得）。
   `DATABASE_URL` 里的 `app` 是超级用户且有 BYPASSRLS，**会忽略策略，连 `FORCE ROW LEVEL
   SECURITY` 都拦不住** —— ADR 0001 漏了这一层，照它写会得到一个装好了却一行都没拦的 RLS。
2. **GUC 未设时求值为 NULL ⇒ 读 0 行、写被拒。** 失败即关门，但只有读那一侧**无声** ——
   写会抛 `row-level security`，所以"0 行"和"抛异常"是两种要分开处理的失败。
3. **`scripts/` 与 `tests/` 走超级用户连接**（绕过策略）—— `tests/` 多数 import `@/db/admin`，
   `scripts/` 多数自己 `postgres(DATABASE_URL)`（`migrate.ts` / `purge-tenant.ts` /
   `cleanup-orphan-tenants.ts`）。迁移、跨租户清理、租户 purge、以及"建第二个租户来证明两者
   隔离"的 fixture，都必须能跨租户。

**token 表的例外已经收口**（迁移 `0027`+`0028`，`docs/adr/0004-token-resolver-functions.md`）。
`share_link` / `section_share_link` / `calendar_feed` 曾各带一条**仅 SELECT 且 `USING (true)`**
的宽松策略 `token_lookup`，因为按 token 查必须先于知道租户 —— 代价是任何**忘记** `forTenant`
的查询都能枚举全部租户的 token。现在这三张表和别的租户表一样 fail closed，按 token 解析走
`src/db/token-resolvers.ts` 里的三个 `SECURITY DEFINER` 函数。

你需要记住的三件事：

- **`src/db/token-resolvers.ts` 是全 app 唯一一处合法绕过 RLS 的读**（写侧的对应物是
  `src/db/admin.ts`）。要在无会话的公开路由上按 token 取数，调它，不要自己写裸 SELECT ——
  裸 SELECT 现在返回 0 行而不是报错，**无声**。
- 函数上的 `SET search_path = ''` **不能删**，但要知道它管的是什么：**只有** definer 加固
  （不加它，函数体里任何未限定的引用都可能被调用方控制的 schema 遮蔽、然后以 owner 权限执行，
  所以body 里每张表都写 `public.<t>`、每个函数都写 `pg_catalog.<f>`）。阻止 planner 内联
  `LANGUAGE sql` 函数的是 `SECURITY DEFINER` 本身，不是这个子句 —— 实测 PG 17.11：definer
  函数带不带 SET 都是 `Function Scan`，而 invoker 变体会内联成 `Seq Scan`。这条区分很要紧：
  一个维护者去验证「SET 阻止内联」这个说法、发现是假的，很可能顺手把子句一起删掉，连真正的
  加固一起删。
- 函数的 OUT 参数是**加引号的 camelCase**（`"tenantId"`）。`db.execute` 原样返回驱动的列名，
  drizzle 的 `casing: 'snake_case'` 不作用于裸 SQL；写成 snake_case 会让每个
  `share.tenantId` 读到 `undefined`，一路流进 `withTenantScope(undefined, …)`，渲染出一张空
  课表而不是 404。

### `src/lib` 的业务核心

命名约定：`*-core.ts` 是**可单测的纯逻辑**，Server Action 和 Route Handler 都调它，
两条路径因此不会行为分叉。

- **排课**：`schedule-core` `lesson-insert` `add-sessions` `materialize`（重复课实体化）
  `recurrence` `rrule-build` `conflict`（冲突检测）`schedule-summary` `schedule-card*`
- **调课**：`reschedule-core`（claim + move 在一个事务里原子提交）
- **报告**：`report-core` `report-data` `report-draft` `report-prompt`（含脱敏）
  `report-sanitize` `report-stats` `report-consent` `report-pdf*`
- **笔记**：`lesson-note-core` `note-schema`
- **通知**：`notification-core` `notification-row` `reminder-core` `push-core` `push-client`
  `push-endpoint`
- **分享与导出**：`share` `share-ttl` `ical-feed` `qr` `zip-entry-name` `browser`（headless
  Chromium，沙箱默认**开启**，见 `docs/adr/0002-chromium-sandbox.md`）
- **基础设施**：`errors`（`BusinessError` / `ConflictError`）`rate-limit` `security-headers`
  `timezone` `format-datetime` `mail` `markdown-view` `mcp-confirm`

## 跑起来

```bash
./dev.sh                  # 一条命令：.env + 依赖 + Postgres 容器 + 迁移 + next dev
```

`dev.sh` 幂等，随时可重跑。其它模式：`--setup-only`、`--full`（全进容器）、`--down`、
`--reset-db`。本地是 **Postgres 在 Docker 里（绑 127.0.0.1）+ Next 在宿主机**，为了热重载快。

### 命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | `next dev`，`:3000` |
| `npm run build` | Next 16 Turbopack → `.next/standalone/server.js` |
| `npm run check` | `typecheck` + `lint`（提交前至少跑这个） |
| `npm run typecheck` / `lint` / `format` | `tsc --noEmit` / `eslint .` / `prettier --write .` |
| `npm test` | vitest，97 个文件。**需要一个跑着的 Postgres** |
| `npm run test:e2e` / `:ui` / `:headed` / `:report` | Playwright，需要跑着的 app + 迁移过的库 |
| `npm run db:generate` | drizzle-kit 生成迁移 SQL |
| `npm run db:migrate` | 应用迁移（advisory lock 保护） |
| `npm run db:verify:resolvers` | 校验 0027/0028 的 token 解析在当前库上真的生效（只读；容器启动时自动跑） |
| `npm run db:studio` | drizzle studio |
| `npm run db:seed:admin` | 按 `ADMIN_*` 建平台超管（幂等） |
| `npm run db:seed:e2e` | 重建 e2e 固定租户（幂等，先清后建） |
| `npm run auth:generate` | Better Auth CLI 重新生成 `src/db/auth-schema.ts` |

`scripts/` 下的运维与守卫：

| 脚本 | 用途 |
|---|---|
| `check-tenant-db-access.ts` | **CI 守卫**，三条规则：① allowlist 外的文件碰裸 `db` CRUD 就红；② app 代码 import 绕过 RLS 的 `@/db/admin` 就红；③ `src/` 里 `postgres(...)` 不带 `RLS_ROLE_OPTIONS` 就红（前两条都假定连接已受 RLS 约束，第三条才管连接本身） |
| `migrate.ts` | 迁移执行器（幂等 + advisory lock；非零退出就绝不服务半迁移的 schema） |
| `verify-token-resolvers.ts` | **启动守卫**，entrypoint 第 4 步跑。只读、无锁、fail-closed。断言逻辑在 `token-resolver-checks.ts`（分开是为了入口能无条件执行 —— 条件式入口自检一旦判错就是「什么都没验还 exit 0」）。它要两条连接：超级用户读 `pg_proc`/`pg_policies` 并取一个活 token，`app_rt` 连接证明**应用真正用的角色**调得通 |
| `cleanup-orphan-tenants.ts` | 0016 加 `tenant_id` 外键前必须先跑，否则容器 crash-loop |
| `cleanup-room-overlaps.ts` | 0015 加 EXCLUDE 约束前必须先跑；`--fix` 会**取消重叠课节中较晚的那一节** |
| `purge-tenant.ts` | 彻底删除一个租户 |
| `seed-admin.ts` / `seed-e2e.ts` / `seed-env.ts` | 见上 |

### 环境变量

契约写在 `src/env.ts`（`@t3-oss/env-nextjs` + zod），**构建/启动时校验，缺一个就早失败**。

**必需**：`DATABASE_URL`、`BETTER_AUTH_SECRET`（≥32）、`BETTER_AUTH_URL`、
`NEXT_PUBLIC_APP_URL`。

**可选，且全部"未配置 ⇒ 惰性而非 fail-open"**：

| 变量组 | 不配置时的行为 |
|---|---|
| `MCP_BEARER_TOKEN`（≥32）/ `MCP_ORG_ID` / `MCP_USER_ID` / `MCP_RESOURCE_URL` | MCP 端点保持 **401** 惰性 |
| `CRON_SECRET`（≥32） | `/api/cron/*` 保持 **401**，提醒不派发 |
| `SITE_INGEST_SECRET`（≥32） | `/api/site/*` 保持 **401**，官网那边硬失败 |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` / `REPORT_PROVIDER` / `MINIMAX_*` | 报告起草**明确报错**，其余功能照常 |
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push 空转；站内通知行**始终写入**（它才是事实来源） |
| `SMTP_*`（含 `SMTP_TLS_INSECURE`） | 群发路径回 **503**，而不是把每个收件人记成已送达 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`（≥16） | seed 跳过并告警。但自助注册是关闭的，**首次部署漏了就没人能登录** —— 所以 docker-compose 用 `${ADMIN_EMAIL:?…}` 强制要求 |
| `PLAYWRIGHT_CHROMIUM_PATH` / `CHROMIUM_NO_SANDBOX` | 用 Playwright 自带 Chromium；沙箱**保持开启**（只有字面量 `'true'` 才关，且需接受 ADR 0002 记录的风险） |
| `PORTAL_EMAIL_DOMAIN` / `ADMIN_NAME` / `DEFAULT_ORG_*` | 用 zod 默认值 |

`MINIMAX_BASE_URL` 有个坑已写在 `src/env.ts`：**中国区 key 必须配 `api.minimaxi.com`**
（尾字母 `i`），Global key 配 `api.minimax.io`，弄反了会 404 或鉴权失败。

## MCP（Claude 连接器）

`/api/[transport]`，stateless Streamable HTTP，`runtime = 'nodejs'`（**必需** —— pg socket 与
`server-only` 模块跑不了 edge）。静态 bearer 门禁，恒定时间比对，且先做等长检查
（`timingSafeEqual` 长度不等会抛）。

8 个工具，**preview / confirm 两段式**用于一切写操作：

| 读 | 写（preview → confirm） |
|---|---|
| `list_classes` | `schedule_lesson_preview` → `schedule_lesson_confirm` |
| `list_students` | `reschedule_lesson_preview` → `reschedule_lesson_confirm` |
| `get_lesson_notes` | |
| `draft_parent_message` | |

每个工具都复用 dashboard 与导出路径**同一套**归属校验（`src/auth/scope.ts` 的
`actorOwns*` / `*IdsForActor`）—— 别为 MCP 新造一套。主体与权限约束见 `AGENTS.md`。

## 测试

**单测**（`npm test`，96 个文件）跑在 `environment: 'node'`，并且：

- `server-only` 被 alias 成 `tests/server-only-stub.ts` —— 否则它这颗毒丸会在 import `@/db`
  时直接中止测试，`forTenant()` 就根本测不了。
- **`fileParallelism: false`**，文件串行。DB 集成套件共用一个 Postgres 且用宽谓词清理
  （如 `delete from user where email like 'portal_%@portal.local'`），并行时一个文件的清理会删掉
  另一个文件正在开通的行。慢几秒，换确定性的绿。
- `setupFiles: ['dotenv/config']` —— vitest 不像 Next 会自动加载 `.env`。
- `tests/e2e/**` 被**硬排除**：那些 spec 调 Playwright 的 `test.describe()`，在 vitest 下会抛。

测试里密度最高的一片是鉴权：`tenant-isolation` `tenant-db-guard` `rbac-*`（scheduling /
reschedule / staff / teacher-scope 读写）`portal-*`（scope / consent / filter / report-scope）
`provision-authz` `section-share-authz` `push-subscription-authz` `security-headers`。
**改任何鉴权或范围逻辑，先看这些测试想守住什么。**

**e2e**（Playwright）跑**真实运行的 app** + 一个自动播种的固定租户：

```bash
cp .env.e2e.example .env.e2e   # E2E_DATABASE_URL 指向 app 的库（docker 下常是宿主 5433 端口）
npm run test:e2e
```

`global-setup.ts` 先播种再把各角色登录态签好。`scripts/seed-e2e.ts` **只**写
`e2e_org_main` 租户和 `@e2e.local` 账号，所以对共享的 dev 库是安全的。
套件分布：`auth/` `dashboard/`（schedule / courses / students / reschedule / reports /
calendar / teach-notes / users / rbac / smoke）`portal/` `public/`。
**写新 spec 前读 `tests/e2e/AUTHORING.md`。**

**CI**：`.github/workflows/scheduling-ci.yml`（在仓库根，按 `apps/scheduling/**` 过滤触发）——
装依赖 → **租户隔离守卫** → 容器内迁移+单测 → 起生产镜像 → Playwright → 失败时上传报告与日志。

## Docker

`docker/entrypoint.sh` 的顺序是有依赖的，**不要重排**：

```
1. cleanup-orphan-tenants.mjs      ← 必须在 migrate 前：0016 加 tenant_id 外键，
                                      库里有孤儿行就会让容器 crash-loop
2. cleanup-room-overlaps.mjs --fix ← 必须在 migrate 前：0015 加 EXCLUDE 约束，
                                      pre-0015 的同房间重叠课节会 crash-loop
3. migrate.mjs                     ← 幂等 + advisory lock；非零退出就绝不服务半迁移的 schema
4. verify-token-resolvers.mjs      ← 必须在 migrate 后：只读校验 0027/0028 在**这个库**上真的生效
                                      （owner 绕 RLS、app_rt 有 EXECUTE、PUBLIC 没有、token_lookup
                                      策略已消失、有活 token 时端到端解析得通）。配错不会报错也不会
                                      记日志，只是让每个 /s、/sec、.ics 静默 404，连 /api/health 都
                                      是绿的 —— 所以这里 fail-closed：崩溃循环好过静默服务
5. seed-admin.mjs                  ← 幂等；ADMIN_* 未设则跳过（exit 0），真错误才中止
6. exec node /app/server.js
```

这三个前置脚本都是幂等的、advisory-locked 的、对全新库安全的（0 行 / 还没有 schema 时空转）。

**⚠️ 第 2 步会修改数据**（取消重叠课节中较晚的那一节）。这是根 `README.md` 里"排课为什么不能
改成 image 模式"的核心论据：`ops env-edit` 一旦发现 `.env` 有 diff 就直接 `compose up -d`，
不 pull 不确认。image 模式下 `pull_policy: always` 会让"轮换一个 API key"变成一次带 schema
变更的生产发布 —— 无条件跑第 2 步再跑 26 个单向迁移。git-source 模式下同一条命令是代码中性的。

`next.config.ts` 几个不显眼但重要的点：

- `serverExternalPackages: ['playwright', 'archiver', 'web-push']` —— 它们 spawn 子进程或用
  动态 require，打包会坏。
- `outputFileTracingIncludes` 把 playwright 全量塞进 `/api/export/**` 的 trace。
  playwright-core 用运行时计算的路径加载 `browsers.json`，Next 的静态追踪看不见，于是
  standalone 里的拷贝不完整、PNG/ZIP 导出路由在 import 时就 500。
- `securityHeaders` 对所有路由生效，外加前述 `no-store` 规则。
- Server Actions 的 Origin===Host CSRF 校验通过 `experimental.serverActions.allowedOrigins`
  放行 `NEXT_PUBLIC_APP_URL`（反代后面必需）。
