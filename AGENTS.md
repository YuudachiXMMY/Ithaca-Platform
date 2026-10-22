<!-- BEGIN:ithaca-platform-agent-rules -->

# ithaca-platform —— 动手前必读

Ithaca Family Academy 的两个应用，一个仓库。**它们共享一个 git 历史，不共享任何构建产物。**

```
apps/
  web/          ithacateens.com            SvelteKit 2 · 无状态 · 发布分支 prod
  scheduling/   dashboard.ithacateens.com  Next.js 16 · PostgreSQL 17 · 发布分支 prod-scheduling
```

## 第一条规则：先 `cd` 进 app

**仓库根目录没有 `package.json`，也没有 lockfile，这是刻意的。** 每个 app 自带
`package.json` + lockfile + 自己的 `node_modules`。在根目录跑 `npm ci` / `npm run build` /
`npx` 只会得到一个找不到 manifest 的错误，或者更糟 —— 装出一棵和两边都不一样的依赖树。

```bash
cd apps/web        && npm ci --engine-strict=false && npm run dev   # :5173
cd apps/scheduling && npm ci                        && ./dev.sh     # :3000 + 容器里的 Postgres
```

**不要"顺手"加根 manifest / npm workspaces。** 根 `README.md` 用实测数字列了四条会同时引爆的
后果（三份 lockfile 必须三合一、两份 Dockerfile 的 `COPY` 直接坏掉、hoist 会把排课的
`playwright` + `next`(199 MB) 装进官网镜像、ESLint 9 与 10 大版本分叉）。要动这件事之前
先读那一节。

## 第二条规则：改动不跨 app

两个 app 的技术栈没有交集 —— SvelteKit/Svelte 5 runes/Paraglide/Vitest 对
Next 16/React 19/Drizzle/Better Auth。一次提交应该只落在一个 `apps/*` 子树里；真要同时改
两边（只有跨 app 契约变更才需要），在提交信息里说清两侧各改了什么。

CI 按 `paths:` 过滤触发，所以只碰一个 app 的 PR 只会跑那一侧的流水线。

## 跨 app 契约

官网把**询盘 / 订阅 / 弹窗**三类数据交给排课系统，鉴权是共享密钥 `X-Site-Secret`
（`SITE_INGEST_SECRET`，两边必须完全一致）：

| 官网端点 | 调排课系统 | 失败语义 |
|---|---|---|
| `/api/contact` | `POST /api/site/contact` | **硬失败 500** |
| `/api/subscribe` | `POST /api/site/subscribe` | **硬失败 500** |
| `/api/popups/active` | `GET /api/site/popups/active` | **软降级为"无弹窗"** |

失败语义的不对称是刻意的，改它之前必须明白为什么：悄悄丢一条询盘比报错糟得多；而弹窗读取在
**每个公开页的热路径**上，不该因另一个服务抖动把整站带下去。

- 官网侧的客户端：`apps/web/src/lib/server/site-api.ts`（含 8s 写 / 3s 读超时预算）
- 官网侧的软降级缓存：`apps/web/src/lib/server/popup-cache.ts`（**这个缓存是承重的**，不是优化）
- 排课侧的端点：`apps/scheduling/src/app/api/site/`，鉴权在 `src/lib/site/ingest-auth.ts`
- 排课侧的数据表：`apps/scheduling/src/db/schema/site.ts` —— **平台全局，没有 `tenant_id`**

官网的 `/admin/*` 已没有自己的实现，由 `hooks.server.ts` 302 跳到排课系统的
`/dashboard/site` 控制台。

## 发布

| app | 发布分支 | 机制 |
|---|---|---|
| `apps/web` | `prod` | push → `web release` 推 GHCR 镜像 → `ssh iweb ops deploy` |
| `apps/scheduling` | `prod-scheduling` | push → 服务器 clone 该分支**现场构建** → `ssh icourse ops deploy` |

部署编排在另一个仓库 `IthacaServer`。两个"看起来该统一"的地方都有不可逆的理由，动手前读根
`README.md`：分支名为什么不能叫 `prod/ithaca`（git ref 路径冲突），排课为什么不能改成 image
模式（`ops env-edit` 会把"轮换一个 API key"变成一次带 schema 变更的生产发布）。

## 提交信息

Conventional Commits 前缀 + **中文正文**，scope 用 app 名或子系统名。本仓库的惯例是在
`——` 后面写**为什么**，而不只是写改了什么：

```
ci(web-release): 加 workflow_dispatch —— paths 过滤让建分支式发布静默空转
test(e2e): teach-notes 的两个用例也要取消「对外开放」—— 我上一笔只修了一半
refactor(scheduling): 把排课系统整体移入 apps/scheduling/
```

## 查历史要注意

两边历史完整保留，commit SHA **未重写**，所以旧 PR 和文档里的 SHA 引用仍然解析。代价是路径
迁移那一刀：

```bash
git log --follow -- apps/web/src/lib/server/site-api.ts   # ✅ 穿过改名
git log -- apps/web/src                                   # ⚠️ 只有 1 条(移动那次)
```

`--follow` 只支持单文件，**目录级 log 加 `--follow` 也没用**。查目录历史请改查具体文件，或去
归档的旧仓 `YuudachiXMMY/IthacaFA-web` / `YuudachiXMMY/Course-Scheduling-System`。

## 每个 app 自己的规矩

进了子目录就以那边的 `AGENTS.md` / `CLAUDE.md` 为准，它们记的是真正会咬人的东西：

- `apps/web/AGENTS.md` —— 这个 app 是**无状态**的（没有数据库），Svelte 5 runes
- `apps/scheduling/AGENTS.md` —— 租户隔离两层：`forTenant(ctx)` 加 RLS，**前者仍是唯一合法路径**

<!-- END:ithaca-platform-agent-rules -->
