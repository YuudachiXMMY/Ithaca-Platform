@AGENTS.md

# ithaca-platform —— Claude Code 工作指引

上面导入的 `AGENTS.md` 是硬规矩（先 `cd` 进 app、不加根 manifest、跨 app 契约、发布分支）。
这里只补 Claude Code 特有的东西：文档地图、命令速查、以及几个会让你白走一趟的坑。

## 文档地图：该读哪一份

根目录这两份只管"仓库层面"。**具体某个 app 怎么写代码，答案一律在那个 app 的子目录里。**

| 想知道什么 | 读这个 |
|---|---|
| 为什么没有根 manifest / CI 为什么这么配 / 分支名为什么这么起 | `README.md`（根，带实测数字） |
| 官网怎么写代码 | `apps/web/CLAUDE.md` |
| 官网的内容与版式怎么改（文案、间距、配色、图片） | `apps/web/docs/EDITING-GUIDE.md` |
| 官网的设计 token | `apps/web/docs/DESIGN-TOKENS.md` |
| 官网偏离 PRD 的每一处决策 | `apps/web/docs/DECISIONS.md` |
| 官网的构建与发布 runbook | `apps/web/docs/DEPLOYMENT.md` |
| 官网的需求原文（代码注释里满地的 `prd.md §x` / `R-SEO-2`） | `apps/web/.claude/PRPs/prds/prd.md` |
| 排课系统怎么写代码 | `apps/scheduling/CLAUDE.md` |
| 排课系统的架构决策记录 | `apps/scheduling/docs/adr/` |
| 官网控制台是怎么搬到排课系统的 | `apps/scheduling/docs/site-admin/README.md` |
| 排课系统的 e2e 用例怎么写 | `apps/scheduling/tests/e2e/AUTHORING.md` |

两个 app 的 `.claude/PRPs/` 下还有成堆的 plan / prd / report / review。它们是**历史记录**，
不是现状描述 —— 当 PRP 和代码冲突时，代码赢。

## 命令速查

两边的脚本名字长得像，含义不一样。别凭记忆跨 app 套用。

| | `apps/web` | `apps/scheduling` |
|---|---|---|
| 装依赖 | `npm ci --engine-strict=false` | `npm ci` |
| 开发 | `npm run dev` → `:5173` | `./dev.sh` → `:3000`（含容器 Postgres） |
| 类型检查 | `npm run check`（Paraglide 编译 + svelte-check） | `npm run typecheck` |
| lint | `npm run lint`（eslint + prettier --check） | `npm run lint` |
| 单测 | `npm test`（vitest，`environment: 'node'`） | `npm test`（vitest，**需要一个跑着的 Postgres**） |
| e2e | `npm run build && npm run test:e2e` | `npm run test:e2e`（需要跑着的 app + 迁移过的库） |
| 构建 | `npm run build` | `npm run build` |

**提交前至少跑哪些**：官网是 `npm run lint && npm run check && npm test && npm run i18n:check`；
排课是 `npm run check && npm test`。两边的 e2e 都要先把应用跑起来，不是纯函数测试。

## 几个会让你白走一趟的坑

**官网没有数据库。** 无状态化改造（提交 `552a31c`，2026-10-10）删掉了 admin 面板、Better Auth
和 Prisma。如果你看到任何文档、PRP 或旧注释提到官网的 `DATABASE_URL`、`prisma/schema.prisma`、
`db:migrate`、`/admin/(protected)/**` —— 那是**腐烂的**，不是你漏看了目录。实际状态去
`apps/web/package.json` 和 `apps/web/.env.example` 确认。

**排课系统的租户隔离是两层的，但第二层不是许可证。** 应用层是 `forTenant(ctx)`
（`apps/scheduling/src/db/tenant.ts`），数据库层是 Postgres RLS：迁移
`apps/scheduling/drizzle/0026_tenant_rls.sql` 给 20 张带 `tenant_id` 的表开了 ROW LEVEL
SECURITY，运行时连接带 `-c role=app_rt` 降为受策略约束的角色（见
`apps/scheduling/docs/adr/0003-tenant-isolation-rls-enabled.md`；同目录的 `0001` 还写着"RLS 被
延后"，它已被 0003 作废、而且做法本身是错的，**别照它做**）。所以随手写一句
`db.select().from(classSection)`，在 app 代码里是读到 **0 行**、写入被拒，而不是把别人的数据端
上来。**但这只在 app 运行时成立**：`scripts/` 与 `tests/` 用的是 `@/db/admin`（超级用户、
BYPASSRLS），那里的裸查仍然真·跨租户；而且失败是无声的（空结果，不报错）。所以
`forTenant(ctx)` 仍是唯一合法路径，CI 里 `apps/scheduling/scripts/check-tenant-db-access.ts`
的三条规则也都还在：① allowlist 外的文件碰裸 `db` 的 CRUD；② app 代码 import `@/db/admin`；
③ `src/` 下自建 `postgres(...)` 不带 `RLS_ROLE_OPTIONS`。被拦住时的正确反应分别是改用
`forTenant`、改 import `@/db`、传 `connection: { options: RLS_ROLE_OPTIONS }` —— 不是往
allowlist 里加一行（唯一例外是压根不在租户模型内的表：`src/db/schema/site.ts` 那 5 张官网表
没有 `tenant_id`，`forTenant` 对它们过不了类型，只能登记进 allowlist 并写明理由，见
`apps/scheduling/CLAUDE.md`）。

**两个 app 都不能在根目录装依赖。** 见 `AGENTS.md`。

**`apps/*/node_modules` 当前是指向旧仓库的 symlink**（合并时留下的），`ls` 看起来存在但不是
这个仓库自己装的。在哪个 app 里做事，就先在那个 app 里 `npm ci` 一次。

## 文档维护

改了代码就顺手改文档，别攒着：

- 行为变了 → 改对应 app 的 `CLAUDE.md` / `AGENTS.md`
- 官网偏离 PRD 的新决策 → 追加到 `apps/web/docs/DECISIONS.md`
- 排课系统的结构性取舍 → 新开一份 `apps/scheduling/docs/adr/NNNN-*.md`
- 删掉一个子系统时，**同一笔提交里**把描述它的文档段落一起删。`552a31c` 没做这件事，于是
  `apps/web/CLAUDE.md` 留下 41 处指向已不存在的东西的引用 —— 一份这样的文档不是"不够新"，
  它是在主动给每个读它的 agent 喂错误前提。这次修复就是在还那笔债。
