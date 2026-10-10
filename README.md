# Ithaca Platform

Ithaca Family Academy 的两个应用，一个仓库。

```
apps/
  web/          ithacateens.com            SvelteKit 2 · 无状态 · DEPLOY_TYPE=image
  scheduling/   dashboard.ithacateens.com  Next.js 16 · PostgreSQL 17 · DEPLOY_TYPE=git-source
```

部署编排在另一个仓库 `IthacaServer`（`apps/ithacafo-web/` 与 `apps/course-scheduling/`）。

两个 app 通过 HTTP 集成：官网把询盘 / 订阅 / 弹窗交给排课系统的 `/api/site/*`，鉴权是共享密钥 `X-Site-Secret`。失败语义是刻意不对称的——**写入硬失败**（悄悄丢一条询盘比报错糟得多），**弹窗读取软降级**（它在每个公开页的热路径上，不该因另一个服务抖动把整站带下去）。

---

## 为什么没有根 manifest（不要"顺手"加上）

这里**刻意**不使用 npm workspaces、根目录没有 `package.json` 也没有 lockfile。每个 app 自带 `package.json` + `package-lock.json` + 自己的 `node_modules`。

加根 manifest 会同时引爆四个已实测的问题：

1. **lockfile 必须三合一。** 官网 1 份（216 KB），排课 **2 份**并存且刻意同提交双写（`package-lock.json` 494 KB + `pnpm-lock.yaml` 287 KB）。workspaces 只认一个根 lockfile，三份都得删掉重新解析，两边所有传递依赖在同一个提交里重算——hoist 后的树与现在不同，幽灵依赖会开始或停止解析。
2. **两份 Dockerfile 的 `COPY package.json package-lock.json*` 直接坏掉。** workspaces 的 `npm ci` 要求根 manifest + 根 lockfile + **每个** workspace 的 `package.json` 同时在场。两个 Dockerfile 的 deps 阶段都得重写，没有一边能原样保留。
3. **hoist 会把对面的重依赖装进自己的镜像。** 排课的 `playwright` 在 **dependencies**（不是 devDependencies），且它的 Dockerfile 靠 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` 才避开约 300 MB 的浏览器下载——官网的 Dockerfile 没有这个变量。根 `npm ci --omit=dev` 会把 `next`(199 MB)、`openai`(27 MB)、`@anthropic-ai`(13 MB)、`playwright` 一起装进官网 runner 并触发 chromium 下载。
4. **ESLint 大版本分叉。** 官网 `^10` + `eslint-plugin-svelte` + `includeIgnoreFile`，排课 `^9` + `eslint-config-next`（它的注释说明用 `FlatCompat` 会在 ESLint 9 下崩）。两个大版本不可能共用一份根配置。

代价只有一个：装依赖要进各自目录。这个代价远小于上面四条。

## 发布分支

| app | 发布分支 | 怎么发 |
|---|---|---|
| `apps/web` | `prod` | push → `web release` 推 GHCR → `ssh iweb ops deploy` |
| `apps/scheduling` | `prod-scheduling` | push → 服务器 clone 该分支**现场构建** → `ssh icourse ops deploy` |

**为什么排课的分支叫 `prod-scheduling` 而不是 `prod/ithaca`：** `prod` 与 `prod/ithaca` 作为 git ref **不可能共存**——前者是 `refs/heads/prod` 这个文件，后者需要同一路径是目录。两个方向都会报 `cannot lock ref`，`git pack-refs --all` 也救不了。已实测 `prod` 与 `prod-scheduling` 同仓共存无冲突。

**为什么排课不改成 image 模式**（看起来能统一管线，实际会开一个不可逆的坑）：`ops env-edit` 在检测到 `.env` 有 diff 后会直接 `compose up -d`，**不 pull、不确认**。image 模式下 `pull_policy: always` 会让它解析出 registry 当前的 `latest`，于是"轮换一个 API key"变成一次带 schema 变更的生产发布——entrypoint 无条件跑 `cleanup-room-overlaps --fix`（会取消重叠课节），再跑 26 个单向迁移。git-source 下同一条命令是代码中性的（用本机已构建镜像，迁移是 no-op）。

## CI

根目录四个 workflow，各带 `paths:` 过滤：`web-ci` / `web-release` / `web-lighthouse` / `scheduling-ci`。

GitHub **只读仓库根目录**的 `.github/`，所以它们必须在这里。合并前各 app 自己那份在 git 历史里（`apps/*/.github/workflows/`），同一笔提交里删除。

几个容易踩的点，都已在各 workflow 的注释里写明原因：

- `defaults.run.working-directory` **只作用于 `run` 步骤**，不作用于 `uses`。所以 `setup-node` 要显式 `cache-dependency-path`、buildx 要显式 `context:`、`upload-artifact` 要写全路径。写错是**静默**失败（空缓存、或 artifact 从不上传）。
- **Actions 缓存是 per-repository 10 GB 硬上限，付费买不到更多。** 合并前两仓各占 5.30 / 5.74 GB，合计已超。所以 `cache-to` 一律 `mode=min` 且带 scope，PR 事件**只读不写**（一个 PR 不该挤掉 main 的热缓存）。被 LRU 挤掉的总是最久没碰的那批，也就是只在发布日才用到的发布层——而那恰好是直通生产的构建。
- `web-lighthouse` 改成了 `workflow_dispatch` + 周定时。合并前它是官网仓 67% 的 CI 分钟数且 65 跑 59 红。那个红是**真实的 LCP 债**不是抖动，但 runner 自身方差太大（`/` 三次采样 6304 / 6509 / 10420 ms，对 4500 ms 门限），当 per-PR 门禁不合适。**不要**通过放宽 `assertMatrix` 来"修"它——配置注释记录了那些数字是在作者本机量的，放宽等于藏回归。

## 历史

两边历史都完整保留，commit SHA **未重写**（所以旧 PR、提交信息、文档里的 SHA 引用仍然解析）。代价是路径迁移那一刀：

```bash
git log --follow -- apps/web/src/lib/server/site-api.ts   # ✅ 穿过改名，看到原始提交
git blame apps/web/src/lib/server/site-api.ts             # ✅ 归属落在原始提交，并显示原路径
git log -- apps/web/src                                   # ⚠️ 只有 1 条(移动那次)
```

**目录级 log 要加 `--follow` 也没用**（`--follow` 只支持单文件）。查某个目录的历史请改为查具体文件，或去归档的旧仓：`YuudachiXMMY/IthacaFA-web` 与 `YuudachiXMMY/Course-Scheduling-System`（已归档、只读，原始 SHA 永久保留）。

## 本地开发

```bash
cd apps/web        && npm ci --engine-strict=false && npm run dev   # :5173
cd apps/scheduling && npm ci                        && ./dev.sh     # :3000 + 容器里的 Postgres
```

两个 app 的 `.env.example` 各在自己目录下。**根目录的 `.gitignore` 是仓库范围的安全网**，与子目录里的条目重复是刻意的——合并时两边的 `.gitignore` 都随 app 移进了子目录，根上一度毫无防护，而那个状态下一次 `git add -A` 会把官网留在根上的 `.env`（含 `SITE_INGEST_SECRET`）和 443 MB 的 `.archive/` 永久压进 pack。
