# Plan: Phase 0 — 真实 bug 修复 + 依赖补丁

## Summary
修复 6 个当前就在线上的真实功能 bug(弹窗 CTA 失效、仪表盘联系人计数硬编码为 0、生产 GA 静默失效、Upstash 限流串配、页脚死链、middleware 对畸形 token 崩溃),同步升级 4 个存在 CVE 的依赖,并按 Next 16 约定把 `middleware.ts` 重命名为 `proxy.ts`。全部为低风险、低成本、高确定收益的改动,是"优化架构与性能"路线图的第一交付阶段。

## User Story
As a IFA 网站的管理员和访客,
I want 弹窗 CTA 能点、仪表盘显示真实线索量、生产环境采集到分析数据、页脚链接不 404、限流按各自配额生效,
So that 站点的核心功能真实可用、机构能基于真实数据决策、且依赖不再暴露已知 CVE。

## Problem → Solution
当前一批"能编译、类型全绿、但运行期静默错误"的功能 bug + 落后依赖 → 逐条修正到行为正确,依赖升到含补丁的版本,并对齐 Next 16 文件约定。

## Metadata
- **Complexity**: Medium
- **Source PRD**: `docs/architecture-review-2026-08.md`
- **PRD Phase**: Phase 0 — 真实 bug + 依赖补丁
- **Estimated Files**: ~14(修改 ~9 / 新建 ~5)

---

## UX Design

### Before
```
┌─────────────────────────────────────────────┐
│ 弹窗:管理员配了 CTA 链接 → 访客只看到 [关闭]  │
│ 仪表盘:总联系人 = 0(永远)                    │
│ 生产站:GA 脚本从不注入 → 零分析数据           │
│ 页脚:点 Privacy / Terms → 404                 │
└─────────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────────┐
│ 弹窗:CTA 按钮正常渲染并跳转                    │
│ 仪表盘:总联系人 = 真实计数                     │
│ 生产站:GA 脚本正确注入 → 正常采集              │
│ 页脚:Privacy / Terms → 真实法务页             │
└─────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| PopupBanner CTA | 配了链接仍只显示"关闭" | 显示 CTA 并跳转 | 字段名对齐 `buttonLink` |
| 后台仪表盘"总联系人" | 恒为 0 | 真实 `count()` | 新增 `/api/admin/contacts` |
| 生产环境 GA | 无脚本 | 正常加载 gtag | 构建期注入 build-arg |
| 页脚 /privacy /terms | 404 | 渲染法务页 | 新建 2 个 server 页 |

---

## Mandatory Reading

Files that MUST be read before implementing:

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/components/shared/PopupBanner.tsx` | 8-14, 127-144 | A1:字段名 `buttonHref` → `buttonLink` |
| P0 | `prisma/schema.prisma` | 58-72 | 确认 Popup 真源字段是 `buttonLink`(`@map("button_link")`) |
| P0 | `src/app/admin/page.tsx` | 27-63 | A2:`totalContacts: 0` 硬编码 + fetchStats 模式 |
| P0 | `src/lib/rate-limit.ts` | 83-117 | A4:Upstash 单例锁死首个 limit |
| P0 | `Dockerfile` | 12-23 | A3:build 阶段缺 GA build-arg |
| P0 | `.github/workflows/deploy.yml` | 全 | A3:CI 需传 `--build-arg` |
| P0 | `src/middleware.ts` | 全 | proxy 重命名 + getToken fail-closed |
| P1 | `src/app/api/admin/subscribers/route.ts` | 1-58 | A2 新端点的 auth+envelope 模式模板 |
| P1 | `src/app/api/admin/popups/active/route.ts` | 全 | GET 路由 + try/catch 模式模板 |
| P1 | `src/i18n/request.ts` | 22-34 | /privacy /terms 需登记新 `legal` namespace |
| P1 | `src/components/layout/Footer.tsx` | 112-125 | 死链目标 `/privacy` `/terms` |
| P1 | `src/app/not-found.tsx` | 全 | 新建静态页的样式/结构模板 |
| P2 | `package.json` | 1-40 | 依赖版本基线 |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Next 16 Proxy 约定 | `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` | Middleware 在 Next 16 更名 Proxy;文件放项目 `src/proxy.ts`,导出 `export function proxy(request)`(或 default),`config.matcher` 不变,功能不变 |
| next CVE 补丁 | `npm view next versions` / `npm audit` | 升到 ≥16.2.11(中间件绕过等通告范围) |
| next-auth getToken DoS | next-auth CHANGELOG 4.24.15 | `getToken` 对畸形 Bearer 抛未捕获异常 → 升 4.24.15 + middleware try/catch fail-closed |

---

## Patterns to Mirror

### API_ROUTE_AUTH_GUARD(admin GET 路由标准骨架)
```ts
// SOURCE: src/app/api/admin/subscribers/route.ts:8-58
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    // ...prisma op...
    return NextResponse.json({ success: true, data: /* ... */ });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

### DASHBOARD_FETCH(仪表盘并行取数)
```ts
// SOURCE: src/app/admin/page.tsx:27-57
const [subscribersRes, campaignsRes, popupsRes] = await Promise.all([
  fetch("/api/admin/subscribers?page=1&limit=1"),
  fetch("/api/admin/emails"),
  fetch("/api/admin/popups"),
]);
const subscribersData = await subscribersRes.json();
// ...
setStats({ totalSubscribers, totalContacts: 0, campaignsSent, activePopups });
```

### RATE_LIMIT_MEMORY_FALLBACK(每次调用都吃参数 — 正确参照)
```ts
// SOURCE: src/lib/rate-limit.ts:32-60
function memoryRateLimit(key, maxRequests, windowMs) { /* 每次按参数计算 */ }
```

### SERVER_PAGE_WITH_METADATA(server 页 + i18n)
```ts
// SOURCE: src/app/about-us/page.tsx 模式 + not-found.tsx 样式
import { getTranslations } from "next-intl/server";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: t("title"), description: t("description") };
}
```

### NEXT16_PROXY(重命名后的文件形态)
```ts
// SOURCE: node_modules/next/dist/docs/.../16-proxy.md:43-58
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function proxy(request: NextRequest) { /* ... */ }
export const config = { matcher: ["/admin/:path*"] };
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json` | UPDATE | 升 next / next-auth / nodemailer;删 `@auth/prisma-adapter` |
| `package-lock.json` | UPDATE | 随 `npm install` 自动更新 |
| `src/components/shared/PopupBanner.tsx` | UPDATE | A1:`buttonHref` → `buttonLink` |
| `src/app/api/admin/contacts/route.ts` | CREATE | A2:联系人计数端点 |
| `src/app/admin/page.tsx` | UPDATE | A2:接入真实 `totalContacts` |
| `Dockerfile` | UPDATE | A3:build 阶段注入 GA build-arg |
| `.github/workflows/deploy.yml` | UPDATE | A3:传 `--build-arg` |
| `src/lib/rate-limit.ts` | UPDATE | A4:按配置分键缓存 Upstash 实例 |
| `src/proxy.ts` | CREATE(由 `src/middleware.ts` 重命名) | Next 16 约定 + getToken fail-closed |
| `src/middleware.ts` | DELETE | 被 proxy.ts 取代 |
| `src/app/privacy/page.tsx` | CREATE | A5:修死链 |
| `src/app/terms/page.tsx` | CREATE | A5:修死链 |
| `messages/en/legal.json` | CREATE | /privacy /terms 英文文案 |
| `messages/zh/legal.json` | CREATE | /privacy /terms 中文文案 |
| `src/i18n/request.ts` | UPDATE | 登记 `legal` namespace |

## NOT Building

- 不做安全加固(admin CSRF / 安全头 / 登录限流)—— 属 Phase 1
- 不重构邮件流水线 —— 属 Phase 2
- 不做性能优化(blur-data / 缓存头 / R3F 门控)—— 属 Phase 3
- 不改 i18n 路由策略 / SEO / metadata 拆分 —— 属 Phase 4
- 不搭测试框架 / withApiHandler 工厂 / 补索引 —— 属 Phase 5
- 不修 A6 `cn()` clsx 语义(潜伏项、当前无误用调用)—— 留待 Phase 5 结构重构;本阶段不动 `utils.ts`
- /privacy /terms 仅提供**基础合规占位文案**,不做完整律师级法务文本

---

## Step-by-Step Tasks

### Task 1: 依赖升级 + 卸载死代码依赖
- **ACTION**: 升级 `next`→最新 16.2.x(≥16.2.11)、`next-auth`→`4.24.15`、`nodemailer`→最新 7.x;卸载 `@auth/prisma-adapter`;`eslint-config-next` 跟随 next 版本同步
- **IMPLEMENT**:
  ```bash
  npm install next@latest next-auth@4.24.15 nodemailer@latest eslint-config-next@latest
  npm uninstall @auth/prisma-adapter
  npm audit
  ```
- **MIRROR**: N/A(依赖管理)
- **IMPORTS**: N/A
- **GOTCHA**: `@auth/prisma-adapter` 全库零 import(死代码),卸载零风险;先 `grep -rn "@auth/prisma-adapter" src prisma` 确认为空再卸。next 升级后 `eslint-config-next` 版本需与 `next` 对齐(当前锁 `16.2.9`),否则 lint 报版本不匹配
- **VALIDATE**: `npm audit` 高危项减少;`npx tsc --noEmit` 全绿;`npm run build` 通过

### Task 2: A1 — PopupBanner 字段对齐 `buttonLink`
- **ACTION**: 把 `PopupData` 接口与两处使用从 `buttonHref` 改为 `buttonLink`,对齐 Prisma/API 真源字段
- **IMPLEMENT**: `src/components/shared/PopupBanner.tsx`
  - L13:`buttonHref?: string;` → `buttonLink?: string;`
  - L129:`{popup.buttonHref ? (` → `{popup.buttonLink ? (`
  - L132:`href={popup.buttonHref}` → `href={popup.buttonLink}`
- **MIRROR**: N/A
- **IMPORTS**: 无新增
- **GOTCHA**: `/api/admin/popups/active` 返回**原始 Prisma model**(见 `popups/active/route.ts:34` 直接返回 `activePopup`),字段就是 `buttonLink`(schema.prisma:63 `@map("button_link")`)。空串 `""` 被 `buttonLink ?` 正确判为假值(POST 存 `|| undefined`,PUT 存 `|| null`)—— 行为正确无需额外处理
- **VALIDATE**: `npx tsc --noEmit`;手动:后台建一个带 CTA 链接的 active 弹窗 → 公开站应显示 CTA 按钮且点击跳转

### Task 3: A2 — 联系人计数端点 + 仪表盘接入
- **ACTION**: 新建 `GET /api/admin/contacts` 返回 `count()`,仪表盘改为并行 fetch 该端点
- **IMPLEMENT**:
  - 新建 `src/app/api/admin/contacts/route.ts`,镜像 API_ROUTE_AUTH_GUARD:
    ```ts
    import { NextResponse } from "next/server";
    import { getServerSession } from "next-auth";
    import { prisma } from "@/lib/prisma";
    import { authOptions } from "@/lib/auth";
    import type { ApiResponse } from "@/types";

    export async function GET(): Promise<NextResponse<ApiResponse>> {
      try {
        const session = await getServerSession(authOptions);
        if (!session) {
          return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 },
          );
        }
        const total = await prisma.contactMessage.count();
        return NextResponse.json({ success: true, data: { total } });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
      }
    }
    ```
  - `src/app/admin/page.tsx`:
    - L29-33 `Promise.all` 增加 `fetch("/api/admin/contacts")`
    - L35-37 增加 `const contactsData = await contactsRes.json();`
    - L52-57 `totalContacts: 0` → `totalContacts: contactsData.data?.total ?? 0`
- **MIRROR**: API_ROUTE_AUTH_GUARD(subscribers/route.ts:8-58);DASHBOARD_FETCH(admin/page.tsx:27-57)
- **IMPORTS**: 新文件如上;page.tsx 无新增 import
- **GOTCHA**: 用 `prisma.contactMessage.count()` 而非 `findMany`,避免仪表盘 overfetch(`data-dashboard-overfetch`,拉 body HTML)。端点必须过 `getServerSession` 鉴权(ContactMessage 含 PII)。注意解构顺序:新增的 `contactsRes` 要与 `.json()` 顺序一一对应
- **VALIDATE**: `npx tsc --noEmit`;手动:登录后台 → 仪表盘"总联系人"显示真实数(先经 /contact-us 提交一条制造非零)

### Task 4: A3 — Dockerfile 注入 GA build-arg + CI 传参
- **ACTION**: build 阶段声明 `ARG NEXT_PUBLIC_GA_TRACKING_ID` 并提升为 `ENV`(在 `npm run build` 之前),CI 通过 `build-args` 传入
- **IMPLEMENT**:
  - `Dockerfile`(Stage 2 build,L18-23 之间,`RUN npm run build` 之前):
    ```dockerfile
    # NEXT_PUBLIC_* 变量在构建期被内联进产物,必须在 build 前提供
    ARG NEXT_PUBLIC_GA_TRACKING_ID=G-675W5PPJEJ
    ENV NEXT_PUBLIC_GA_TRACKING_ID=$NEXT_PUBLIC_GA_TRACKING_ID
    ```
  - `.github/workflows/deploy.yml`(`Build and push` step `with:` 下):
    ```yaml
          build-args: |
            NEXT_PUBLIC_GA_TRACKING_ID=${{ vars.NEXT_PUBLIC_GA_TRACKING_ID || 'G-675W5PPJEJ' }}
    ```
- **MIRROR**: N/A
- **IMPORTS**: N/A
- **GOTCHA**: **必须在 `RUN npm run build`(Dockerfile:23)之前**声明 ENV,否则内联时仍为 undefined。GA ID 是公开值(非机密),Dockerfile 里给默认值 `G-675W5PPJEJ` 保证即使 CI 未配 var 也能生效。`layout.tsx:57` 逻辑不变(`process.env.NEXT_PUBLIC_GA_TRACKING_ID` 会在构建期被替换为字面量)
- **VALIDATE**: `docker build --build-arg NEXT_PUBLIC_GA_TRACKING_ID=G-TEST . ` 后 `grep -r "G-TEST" .next/` 应命中;或本地 `NEXT_PUBLIC_GA_TRACKING_ID=G-TEST npm run build` 后确认产物含该 ID

### Task 5: A4 — Upstash 限流按配置分键缓存
- **ACTION**: 用 `Map<string, Ratelimit>`(键 `${maxRequests}:${windowMs}`)替换单例 `upstashRatelimit`,Redis client 仍只建一次;保留"init 失败回退 memory"语义
- **IMPLEMENT**: `src/lib/rate-limit.ts:83-117` 重写 `getUpstashRatelimit`:
  ```ts
  type UpstashRatelimit = import("@upstash/ratelimit").Ratelimit;
  type UpstashRedis = import("@upstash/redis").Redis;

  let redisClient: UpstashRedis | null = null;
  let redisInitAttempted = false;
  const ratelimitCache = new Map<string, UpstashRatelimit>();

  async function getUpstashRatelimit(
    maxRequests: number,
    windowMs: number,
  ): Promise<UpstashRatelimit | null> {
    const cacheKey = `${maxRequests}:${windowMs}`;
    const cached = ratelimitCache.get(cacheKey);
    if (cached) return cached;

    if (!redisInitAttempted) {
      redisInitAttempted = true;
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (url && token) {
        try {
          const { Redis } = await import("@upstash/redis");
          redisClient = new Redis({ url, token });
        } catch (err) {
          console.warn("[rate-limit] Upstash init failed, falling back to memory:", err);
          redisClient = null;
        }
      }
    }
    if (!redisClient) return null;

    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const windowSeconds = Math.ceil(windowMs / 1000);
      const rl = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
        analytics: false,
      });
      ratelimitCache.set(cacheKey, rl);
      return rl;
    } catch (err) {
      console.warn("[rate-limit] Upstash ratelimit build failed, falling back to memory:", err);
      return null;
    }
  }
  ```
- **MIRROR**: RATE_LIMIT_MEMORY_FALLBACK(每次吃参数的正确形态)
- **IMPORTS**: 无新增(动态 import 已有)
- **GOTCHA**: 之前的 bug 根因是 `upstashInitialised` 一旦置真就短路返回首个实例(rate-limit.ts:92-93),忽略后续 `maxRequests/windowMs`。改后每个 `(limit,window)` 组合各有独立 Ratelimit。`namespace` 已在 `key` 里做隔离(rate-limit.ts:129),缓存键**只**按 limit+window 即可(subscribe 10/60 与 contact 5/60 键不同)。Redis client 复用一份,不重复建连
- **VALIDATE**: `npx tsc --noEmit`;逻辑核对:subscribe(10,60000)与 contact(5,60000)产生不同 cacheKey;无 Upstash env 时 `getUpstashRatelimit` 返回 null 走 memory

### Task 6: proxy 重命名 + getToken fail-closed
- **ACTION**: 把 `src/middleware.ts` 重命名为 `src/proxy.ts`,导出函数改名 `proxy`,并用 try/catch 包裹 `getToken`,异常时**跳登录页(fail-closed)**
- **IMPLEMENT**:
  - `git mv src/middleware.ts src/proxy.ts`(或新建 proxy.ts 后删 middleware.ts)
  - 内容改为:
    ```ts
    import { NextResponse } from "next/server";
    import type { NextRequest } from "next/server";
    import { getToken } from "next-auth/jwt";

    export async function proxy(request: NextRequest) {
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        let token: Awaited<ReturnType<typeof getToken>> = null;
        try {
          token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
          });
        } catch {
          // 畸形 Bearer 头会让 getToken 抛异常 → fail-closed,当作未认证
          token = null;
        }

        if (!token) {
          const loginUrl = new URL("/admin/login", request.url);
          loginUrl.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(loginUrl);
        }
      }

      return NextResponse.next();
    }

    export const config = {
      matcher: ["/admin/:path*"],
    };
    ```
- **MIRROR**: NEXT16_PROXY(16-proxy.md:43-58)
- **IMPORTS**: 不变
- **GOTCHA**: **AGENTS.md 要求写 Next 专属代码前读 docs** —— 已确认 `16-proxy.md`:函数名必须是 `proxy`(named 或 default),文件位于 `src/proxy.ts`,`config.matcher` 不变。**只能有一个 proxy 文件**,务必删掉旧 `src/middleware.ts` 否则冲突。fail-closed 修的是 next-auth `getToken` 对畸形 Bearer 抛未捕获异常导致的自伤式 500
- **VALIDATE**: `npm run build` 应识别 proxy(不再有 middleware 弃用告警);手动:未登录访问 `/admin/subscribers` → 跳 `/admin/login?callbackUrl=...`;带畸形 `Authorization: Bearer xxx` 访问 → 跳登录而非 500

### Task 7: A5 — 新建 /privacy 与 /terms 法务页 + i18n
- **ACTION**: 新建两个 server 组件页(带 `generateMetadata`),新增 `legal` namespace 并在 `request.ts` 登记
- **IMPLEMENT**:
  - `messages/en/legal.json` / `messages/zh/legal.json`,结构:
    ```json
    {
      "legal": {
        "privacy": { "title": "Privacy Policy", "description": "...", "updated": "Last updated: ...", "body": "..." },
        "terms":   { "title": "Terms of Service", "description": "...", "updated": "Last updated: ...", "body": "..." }
      }
    }
    ```
    （zh 提供对应中文;body 可为基础合规占位段落)
  - `src/app/privacy/page.tsx` / `src/app/terms/page.tsx`,镜像 SERVER_PAGE_WITH_METADATA + not-found.tsx 的容器样式:
    ```tsx
    import type { Metadata } from "next";
    import { getTranslations } from "next-intl/server";

    export async function generateMetadata(): Promise<Metadata> {
      const t = await getTranslations("legal.privacy");
      return { title: t("title"), description: t("description") };
    }

    export default async function PrivacyPage() {
      const t = await getTranslations("legal.privacy");
      return (
        <section className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("title")}
          </h1>
          <p className="mb-8 text-sm text-foreground/50">{t("updated")}</p>
          <div className="prose-invert space-y-4 text-foreground/70 leading-relaxed">
            {t("body")}
          </div>
        </section>
      );
    }
    ```
  - `src/i18n/request.ts:23-32` 的 `Promise.all` 增加 `import(\`../../messages/${locale}/legal.json\`)`
- **MIRROR**: SERVER_PAGE_WITH_METADATA;not-found.tsx 的 section 容器/配色
- **IMPORTS**: 如上
- **GOTCHA**: CLAUDE.md 强制所有用户可见文案走 i18n —— 不可硬编码英文。新 namespace 必须在 `request.ts` 登记否则 `getTranslations("legal.*")` 抛 key 缺失。`en` 与 `zh` 的键必须完全对齐(`npm run i18n:check` 会校验)。页面是 server 组件(默认),无需 `"use client"`
- **VALIDATE**: `npm run i18n:check` 通过;手动:访问 `/privacy`、`/terms` 渲染正常,页脚链接不再 404;切换 `NEXT_LOCALE=zh` 显示中文

### Task 8: 文档同步(最小必要)
- **ACTION**: 更新根 `CLAUDE.md` 中与本阶段改动直接冲突的陈述,避免误导后续 AI agent(AGENTS.md 要求信任文档)
- **IMPLEMENT**:
  - 根 `CLAUDE.md` 的 GA 说明("hardcoded in `src/app/layout.tsx`")→ 改为"经 `NEXT_PUBLIC_GA_TRACKING_ID` 构建期注入(Dockerfile build-arg)"
  - `src/app/CLAUDE.md` 中间件条目 `../middleware.ts` → `../proxy.ts`
  - Changelog 追加一行 Phase 0 记录
- **MIRROR**: 现有 CLAUDE.md Changelog 表格格式
- **IMPORTS**: N/A
- **GOTCHA**: 仅改与本阶段直接相关的漂移;Resend/nodemailer、限流栈等其余文档漂移留待 Phase 5 统一处理(NOT Building)
- **VALIDATE**: 人工通读改动段落与代码一致

---

## Testing Strategy

> 本仓库当前**零测试**,测试基座属 Phase 5。Phase 0 以**类型检查 + lint + i18n 校验 + 构建 + 手动验证**为准入。下表为 Phase 5 落地时应补的目标(本阶段不写)。

### Unit Tests(Phase 5 目标,非本阶段交付)
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| rate-limit 分键 | subscribe(10,60000) 与 contact(5,60000) | 两个不同 Ratelimit 实例 | 是(A4 回归) |
| rate-limit 无 env | 无 UPSTASH_* | 返回 null 走 memory | 是 |
| contacts count 鉴权 | 无 session | 401 | 是 |

### Edge Cases Checklist
- [x] 空/畸形 Bearer token → proxy fail-closed 跳登录(Task 6)
- [x] popup `buttonLink` 为空串/null → 不渲染 CTA(Task 2)
- [x] 无 Upstash env → memory 回退(Task 5)
- [x] 联系人数为 0 → 显示 0 而非报错(Task 3)
- [ ] 并发访问(限流跨实例)—— 单实例部署,超出 Phase 0 范围

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: 零类型错误

### Lint
```bash
npm run lint
```
EXPECT: 不新增错误(注:仓库现有 ESLint red 属 Phase 5,勿在本阶段引入新违规)

### i18n Parity
```bash
npm run i18n:check
```
EXPECT: en/zh 键完全对齐(含新增 legal namespace)

### Build
```bash
npm run build
```
EXPECT: 构建成功;proxy 被识别、无 middleware 弃用告警

### Dependency Audit
```bash
npm audit
```
EXPECT: next / next-auth / nodemailer 相关高危项清除;`@auth/prisma-adapter` 已移除

### 数据库(无 schema 改动)
```bash
npm run db:migrate:status
```
EXPECT: 无待应用迁移(Phase 0 不改 schema)

### Manual Validation
- [ ] 后台建带 CTA 链接的 active 弹窗 → 公开站显示并跳转(A1)
- [ ] 提交一条 /contact-us → 仪表盘"总联系人"显示真实数(A2)
- [ ] `NEXT_PUBLIC_GA_TRACKING_ID=G-TEST npm run build` → 产物含 G-TEST(A3)
- [ ] 未登录访问 /admin/subscribers → 跳登录;畸形 Bearer 不再 500(Task 6)
- [ ] 点击页脚 Privacy / Terms → 渲染,不 404;zh 显示中文(A5/Task 7)

---

## Acceptance Criteria
- [ ] 8 个任务全部完成
- [ ] `tsc --noEmit` / `i18n:check` / `build` 全绿
- [ ] `npm audit` 目标 CVE 清除,`@auth/prisma-adapter` 已卸
- [ ] 弹窗 CTA、仪表盘联系人计数、GA 注入、页脚链接、限流分键、proxy fail-closed 手动验证通过
- [ ] 未引入新 lint 违规

## Completion Checklist
- [ ] 新代码遵循 API_ROUTE_AUTH_GUARD / ApiResponse envelope 模式
- [ ] 错误处理沿用 `error instanceof Error ? ... : "An unexpected error occurred"`
- [ ] 新增文案全部走 next-intl(legal namespace 已登记)
- [ ] 无硬编码值(GA ID 经 build-arg;收件人邮箱不在本阶段范围)
- [ ] CLAUDE.md 相关漂移已同步(GA / proxy)
- [ ] 未越界到 Phase 1-5 范围
- [ ] 自包含 —— 实施时无需再检索代码库

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| next 升级引入行为变更 | 中 | 中 | 只升 patch(16.2.x);升级后跑 build + 手动过关键页 |
| `eslint-config-next` 与 next 版本错配 | 中 | 低 | 同步升 `eslint-config-next@latest`,对齐 next 版本 |
| proxy 重命名遗漏删旧 middleware.ts | 低 | 中 | Next 只允许一个 proxy 文件;用 `git mv` + build 校验 |
| GA build-arg 位置写错(build 之后) | 中 | 中 | 明确要求 ENV 在 `RUN npm run build` 之前;grep 产物验证 |
| legal namespace en/zh 键不齐 | 中 | 低 | `npm run i18n:check` 作为准入闸 |
| Upstash 缓存改动破坏 memory 回退 | 低 | 中 | 保留 `redisClient` null → 返回 null 的路径;逐条核对 |

## Notes
- 对抗校验结论:Phase 0 全部为 S 成本、行为确定的修复,无 schema 迁移,可安全独立交付。
- `@auth/prisma-adapter` 虽有 critical CVE 但为死代码(全库零 import),卸载即消除,风险为零。
- proxy 重命名遵循 AGENTS.md「先读 `node_modules/next/dist/docs/`」硬性要求 —— 已核对 `16-proxy.md`,函数名 `proxy`、单文件、matcher 不变。
- 收件人邮箱硬编码(`contact/route.ts:68`)属报告 B 组(邮件流水线),Phase 2 处理,不在本阶段。
- A6(`cn()` clsx 语义)为潜伏项且当前无误用调用,留待 Phase 5,本阶段不动 `utils.ts` 以缩小改动面。
