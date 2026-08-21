# Ithaca FA Web — 架构与性能审查报告

- **日期:** 2026-08-21
- **范围:** 全代码库(`src/` ~10.8K LOC TSX+TS、Prisma schema、Dockerfile、CI、i18n、public 资产)
- **技术栈:** Next.js 16.2.9(App Router, `output:"standalone"`)· React 19.2.4 · next-intl v4 · next-auth v4 · Prisma 6 · Zod v4 · nodemailer · framer-motion / gsap / three(R3F)
- **方法:** 9 维度并行深挖 → 对每条 high/critical 发现做**对抗式校验**(逐条重读代码尝试证伪)→ 综合。评级已按 **低流量营销站 + 小型 JWT 后台 CMS** 的真实语境校准。
- **目的:** 为后续"优化架构与性能"提供现状基线与优先级路线图。

> 说明:对抗校验把多条初判为 critical/high 的发现按实际影响降级为 medium/low。本文呈现的是**校准后**的判断,不是告警清单。完整逐条发现见文末附录。

---

## 一、整体健康度评分

| 维度 | 评级 | 一句话结论 |
|------|------|-----------|
| 架构 Architecture | **良好** | App Router 组合规范(server 页 + client 叶子),动画/3D 代码分割纪律优秀;弱点是客户端组件蔓延 + 全站强制动态渲染 |
| 性能 Performance | **中等** | 图片/动画底子扎实;真实优化点集中在字体、blur-data、静态资源缓存、R3F 常驻渲染,但无一是灾难级 |
| 安全 Security | **中等** | 自研安全原语(常量时间 CSRF、双提交、Origin 校验、Upstash 限流)水平在线;短板是依赖 CVE + 后台无 CSRF + 无安全头 + 登录无防爆破 |
| 数据 Data | **中等** | schema 干净、迁移无漂移;缺索引 + status 字段裸字符串 + 联系人 PII 无治理 |
| 可维护性 Maintainability | **中等偏弱** | 类型纪律好(零 `any`、`tsc` 全绿)**但**零测试 + lint 当前红 + 文档漂移 + 路由样板重复 + 类型漂移已致真实 bug |
| SEO | **偏弱** | 双语内容投入被架构抵消:无 hreflang → 中文站几乎不可被索引;4 个核心页无独立 metadata。**与业务目标最不匹配的一环** |

**总评:** 一个由懂行的人手写、工程素养明显高于同类小型营销站的代码库(4 阶段 Dockerfile、隔离 prisma-cli、常量时间比较、reduced-motion 全覆盖、图片 `priority` 精确控制)。没有紧急的燃眉之火,但积累了一批**真实功能 bug + 依赖补丁 + 结构性技术债**。后续优化的真正杠杆是:**先补测试基座 → 再重构**,否则每次改动都可能像 PopupBanner 那样静默回归。

---

## 二、系统全景(现状)

```
Next.js 16.2.9 (App Router, output:standalone) + React 19.2.4
├─ 28 条路由全部 ƒ Dynamic(零 SSG/ISR)—— 源于 cookie 定位 + localePrefix:'never'
├─ i18n  next-intl v4,单 URL 双语(无 /zh 前缀),8 命名空间全量注水到每页
├─ 公开页  首页/about-us/programs×8/contact —— 首页、about-us 是 server 页;programs 等 4 个是整页 client
├─ 后台   /admin/* —— 全 client + SessionProvider;middleware 仅护 UI 页(不含 /api/admin/*)
├─ API    9 条 route —— 统一 ApiResponse<T> + Zod safeParse;公开路由有 CSRF+限流;admin 靠 getServerSession 逐个自查
├─ 数据   PostgreSQL + Prisma 6 —— 5 个扁平模型,零关系,零非唯一索引
├─ 邮件   nodemailer + SMTP(文档仍写 Resend)—— 群发实为串行逐封
└─ 部署   单实例 Node 容器,启动即 migrate deploy;GHCR 镜像打 sha+latest;无 CDN/测试门禁
```

---

## 三、亮点(值得保留,勿在重构中破坏)

1. **GSAP 生命周期管理堪称教科书** —— effect 内 `await import("gsap")` 动态加载,`cancelled` 标志防竞态,`useLayoutEffect` + `useEffect` 双重 `context.revert()` 清理(`HeroSection.tsx:62-69` 注释了 pin-spacer removeChild 竞态原因)。
2. **重型依赖严格代码分割** —— three/R3F 仅存在于 `EVModel3D`,`dynamic(ssr:false)`,916KB 的 gsap+three chunk 只落在 EV 页,不碰首页。
3. **reduced-motion 全覆盖** —— 每个动画组件都提供真实静态 fallback,而非简单禁用。
4. **next/image 用得干净** —— 零裸 `<img>`,每张图有精确 `sizes`,每页仅一处 `priority`。
5. **类型纪律好** —— `strict` 下 `tsc --noEmit` 全绿,全 `src` 零 `any`/`as any`/`@ts-ignore`。
6. **DevOps 细节到位** —— 隔离 prisma-cli 阶段解决 standalone 不 trace CLI 的坑;非 root 运行;fail-loud `migrate && node server.js`;`.env*` 从未入库。

---

## 四、核心发现(按主题,已去重、已校准)

### A. 现在就在线上的真实功能 bug(优先级最高,成本最低)

| # | 发现 | 影响 | 工作量 |
|---|------|------|--------|
| A1 | **PopupBanner 读 `buttonHref`,API 只发 `buttonLink`**(`PopupBanner.tsx:13` vs schema `button_link`);`res.json()` 是 `any`,类型不匹配却能编译 | 管理员配了 CTA 链接的弹窗,**在公开站永远只显示"关闭"按钮**——100% 复现 | S |
| A2 | **后台仪表盘"总联系人数"硬编码为 0**(`admin/page.tsx:54`),从不查库 | 员工永远看到 0,误判线索量 | S |
| A3 | **生产环境 GA 静默失效**:`NEXT_PUBLIC_GA_TRACKING_ID` 未在构建期注入(Dockerfile 无 build-arg),被固化为 `undefined` | **机构在生产环境采集不到任何分析数据**,且无报错、可长期无人察觉 | S |
| A4 | **Upstash 限流"首个调用者定义窗口"bug**(`rate-limit.ts:85-117`):模块级单例用第一个命中路由的 limit 构建,之后忽略各自参数 | 生产开 Upstash 时,subscribe(10/min)与 contact(5/min)其一静默套用了另一个的限额 | S |
| A5 | **页脚 `/privacy`、`/terms` 链接 404**(`Footer.tsx:114,121`,路由不存在) | 每页两个坏链——信任信号差 + soft-404 稀释 SEO | S |
| A6 | **`cn()` 未实现 clsx 合并语义**(`utils.ts:3`,只 `filter(Boolean).join`) | 潜伏:传 `cn("x",{active})` 会渲染成 `"x [object Object]"`。当前无此调用,但名/类型诱导误用 | S |

### B. 邮件群发流水线(单点集中的正确性 / 运维 / 合规风险)

全库风险最集中的一块。`emails/send` + `mail.ts` 存在一组关联缺陷:

- **状态转换非原子**(`send/route.ts:39-58`):read-check-write,`sending` 从不当锁 → 双击/超时重试会**向全体订阅者重复群发**。修法:`updateMany({where:{id,status:"draft"}})` 做 compare-and-set。
- **`sendMailBatch` 是串行逐封**(`mail.ts:50-57`):路由里 `BATCH_SIZE=50` 分批是**死代码**;几百订阅者 = 几百次串行 SMTP,请求阻塞至超时 → 诱发上面的重试双发。
- **无分批失败追踪**:第 480 个失败则整体标 `failed`、`recipientCount=0`,无法得知谁已收到。修法:`Promise.allSettled` + 累计真实成功数。
- **无退订链接(合规)**:`campaign.body` 原样作邮件 HTML,**无 unsubscribe**。加拿大机构受 **CASL** 约束,群发商业邮件必须提供退订。
- **收件人硬编码**:`joshua.wang@ithacafo.com` 写死在 `contact/route.ts:68`,应走环境变量。

### C. 安全(校准后:无在线可利用的 critical,是一份加固清单)

- **依赖 CVE(最高优先安全主题)**:`next@16.2.9`(中间件绕过等 9 条通告范围内,升 ≥16.2.11 / 最新 16.3.x)、`next-auth@4.24.14`(`getToken` 对畸形 Bearer 头抛未捕获异常 → 升 4.24.15,并在 `middleware` try/catch **fail-closed**)、`nodemailer@7.0.13`(升级)、`@auth/prisma-adapter`(**critical CVE 但死代码,从未 import → 卸载**)。
- **后台变更路由零 CSRF**:`assertCsrf` 只用在公开 subscribe/contact;删订阅者/发群发/改弹窗全无 CSRF,仅靠 next-auth 默认 `SameSite=Lax` 兜底。现代浏览器下无现成利用,但基础设施已存在、补上近零成本 → 给所有 admin 变更路由加 `assertCsrf`。
- **中间件不覆盖 `/api/admin/*`**:**非越权漏洞**——每个 handler 都调 `getServerSession`;但边缘层无纵深防御,依赖"每个新路由都记得自查",是架构隐患。
- **无任何安全头**(`next.config.ts` 无 `headers()`):无 CSP / X-Frame-Options / HSTS / nosniff → 后台可被 iframe 点击劫持。
- **登录端点无防爆破**(`auth.ts` authorize 无限流/锁定);**500 直接回传 `error.message`**(泄露 Prisma/DB 内部,含公开端点);**限流 IP 取 XFF 首段可伪造**;**`role` 字段存了却从不校验**(未来加第二角色即静默放权)。

### D. 性能(校准后:底子好,是一批中小型确定收益,非救火)

- **blur-data 111KB JSON 全量进客户端**(`blur-data.ts:1` 被 13+ client 组件 import,在 5+ chunk 重复)→ server 侧解析,只把单个字符串作 prop 下传。**(medium,最实在)**
- **`/public` 资源 `Cache-Control: max-age=0`**(校验纠正:不是每次重下,ETag 304 生效,但每次重访多一次校验往返)→ 给 `/media/*` 加缓存头;两个 MP4(5.7M+3.2M)在 Node 源站、无 CDN,建议移到对象存储/CDN。
- **R3F 画布 `frameloop:"always"` 常驻 60fps 无可见性门控**(`EVModel3D.tsx:631`)→ 停在 EV 页就持续烧 CPU/GPU/电量 → IntersectionObserver 暂停 / `frameloop:"demand"`。
- **字体(校验后 low)**:两族各 5 个静态字重;Noto Sans SC latin 子集与 Outfit 重复预加载(每页多约 25KB 冗余 preload)→ 改 `weight:"variable"` + Noto fallback 设 `preload:false`。
- **framer-motion 进入基线包**(Header+PopupBanner 是 root layout 里的 client 组件)→ 每条路由都带;可上 `LazyMotion`。
- **~27 张 >300KB 的 PNG 未重压** → **仅定向处理,不做全量 `--force` 重生**(历史记忆:全量重生净负收益、+43% 膨胀)。
- **全站强制动态渲染**(28/28 ƒ):cookie 定位 + `localePrefix:'never'` 的固有结果,非 bug;单实例无 CDN 下影响小。解法与 SEO 合并(Phase 4)。

### E. SEO(与业务目标最错位,双语投入被架构抵消)

- **中文站几乎不可被索引**:单 URL 双语 + 无 hreflang + 无 `metadataBase`/canonical。Googlebot 无 cookie → `request.ts` 永远落到 `en`,**~45KB 中文文案对搜索引擎不可见**。
- **4 个旗舰页无独立 metadata**(programs / contact-us / ev-challenge / ai-entrepreneurship-camp 是整页 client)→ 全部继承首页通用标题,搜索/社交卡片千篇一律。
- **无 sitemap、无 robots**;**Accept-Language 用朴素子串匹配**(`en-US...zh;q=0.2` 会被误判为中文)。

### F. 数据层

- **零非唯一索引**:3 个真实查询无索引,尤以 `popups/active`(**每次页面浏览都查一次**,无索引无缓存)最热 → 加 `@@index([isActive])`、`Subscriber.status/subscribedAt`、`ContactMessage.createdAt`;该热查询适合 **cache-aside**(短 `s-maxage=60` + SWR)。
- **status 裸字符串**(注释即枚举)→ 提升为 Prisma enum,自动生成 TS union。
- **ContactMessage 只写不读**:无列表/导出/删除路由,PII 无限期堆积、无留存策略 → 安省 **PIPEDA** 治理缺口。
- **仪表盘过度取数**:为算两个计数拉取含 `body`(完整邮件 HTML)的全表 → 改 `select` 或 `count()` 聚合。
- 时间戳 `TIMESTAMP(3)` 非 `timestamptz`(校验后 low:Prisma 按 UTC 往返,postgres 默认 UTC,现实影响小)——迁移时顺手改。

### G. 可维护性 / 结构(决定"能否安心重构"的地基)

- **零自动化测试** —— 结合 lint 当前红 + 已发现的 PopupBanner 静默 bug,这是为重构扫清障碍的**头号前置**。`escapeHtml`/`rateLimit`/CSRF 比较/Zod schema 都是纯函数,极易测。
- **9 条 API 路由样板重复**(auth 守卫 ×9、safeParse 块 ×8、try/catch 500 块遍布)→ 引入 `withApiHandler({auth,schema})` 工厂,顺带**补上目前完全缺失的服务端错误日志**。**全库最高杠杆的重构。**
- **`ApiResponse<T>` 客户端零复用** → 每个 `res.json()` 都是 `any`,正是 A1 的根因 → 加 `apiFetch<T>()` 包装。
- **实体类型重复声明**(Popup 形状有 Prisma model / create schema / update schema / client interface **4 份**,无单一真源)→ 从共享 Zod schema `z.infer` 派生。
- **ESLint 当前红**(比报告更红:motion.create-in-render、render 内 Math.random、4 处 set-state-in-effect);Next 16 已把 lint 移出 build,CI 也不跑 → 这道闸当前形同虚设。
- **文档漂移(会误导 AI agent,因 AGENTS.md 要求信任文档)**:CLAUDE.md 仍写 Resend/`resend.ts`(实为 nodemailer/`mail.ts`)、纯内存限流(实为 Upstash)、硬编码 GA(实为 env)、elite-interview(实为 ithaca-dialogues)。
- **死代码**:`StaggerContainer`/`StaggerItem`(零引用)、`routing.ts` 导航导出(零引用);两个组件都叫 `HeroSection`;`middleware.ts` 应按 Next 16 改名 `proxy.ts`。

### H. DevOps

- GA build-arg 缺失(见 A3);**每次启动都跑 `migrate deploy`**——前向、无回滚,镜像回滚不还原 schema → 移到一次性 init 步骤 + expand/contract 迁移纪律;`latest` 可变标签 + 无测试/lint 门禁;`node:20-alpine` 浮动标签未 pin、无 HEALTHCHECK、无 `engines`;`.env.example` 仍写 `RESEND_API_KEY`、无启动期 env 校验。

---

## 五、优化路线图(为"改架构与性能"排序)

按 **(影响 × 可能性) / 成本** 排序,每阶段可独立交付。

### Phase 0 — 真实 bug + 依赖补丁(1–2 天,几乎全 S)
升级 `next`→≥16.2.11 / `next-auth`→4.24.15 / `nodemailer`,卸载 `@auth/prisma-adapter`,重跑 `npm audit` → 修 A1 弹窗链接 / A2 联系人计数 / A3 生产 GA / A4 限流 → `getToken` try/catch fail-closed → 建 `/privacy`+`/terms` → `middleware.ts`→`proxy.ts`。

### Phase 1 — 安全加固(S–M)
admin 变更路由加 `assertCsrf` → `next.config` 加 `headers()`(CSP/X-Frame-Options/HSTS/nosniff/Referrer-Policy)→ 登录加限流(可选锁定)→ 500 不再回传原始 error、改服务端日志 → 所有 Zod string 加 `.max()` → XFF 取信任跳。

### Phase 2 — 邮件流程重构(M)
compare-and-set 状态锁 → 后台任务/队列化或限并发、立即返回 → 逐收件人追踪 + 真实 `recipientCount` + `allSettled` 分批失败 → **加 CASL 退订链接** → 收件人邮箱改 env。

### Phase 3 — 性能(S–M)
blur-data 移到 server 侧 → `/media` 加缓存头、两个 MP4 上 CDN/对象存储 → 字体改 variable + Noto `preload:false` → R3F 可见性门控 → framer-motion 上 LazyMotion → 定向重压 27 张大图(非全量)→ popups/active 加缓存 + 索引。

### Phase 4 — SEO(M–L,一举解决 SEO + 全动态两个问题)
**核心杠杆**——改路径式 locale(`/en` `/zh` + `generateStaticParams` + `setRequestLocale`),同时 (a) 恢复静态生成、(b) 产出可索引的中文 URL + hreflang;把 4 个 client 营销页拆成 server 页 + `generateMetadata`(client 子组件);加 `sitemap.ts`/`robots.ts`/`metadataBase`/canonical;规范 Accept-Language 协商。

### Phase 5 — 测试基座 + 结构重构(M–L,支撑上面一切)
搭 Vitest,先测纯函数(escapeHtml / rate-limit / csrf / Zod),再补路由集成测试 → `withApiHandler` 工厂 + 集中日志 → 共享 Zod schema 单一真源 + `apiFetch<T>` → status 提升为 Prisma enum + 补索引 + timestamptz → 修 ESLint 并把 `lint + tsc + i18n:check` 设为 CI 构建前门禁、优先用 sha 不可变标签 → 更新 CLAUDE.md 文档、删死代码、重命名 HeroSection → ContactMessage 留存策略 + 后台视图 → migrate 移出启动 CMD、pin 基础镜像、加 HEALTHCHECK。

---

## 六、快速见效清单(高影响 × S 成本)

`A1 弹窗链接` · `A2 联系人计数` · `A3 生产 GA` · `A4 限流` · `A5 页脚坏链` · 依赖补丁四连 · admin 加 CSRF · 安全头 · 停止泄露原始错误 · popups/active 加索引+缓存 · 删死代码 · 文档去漂移。

---

## 附录:逐条发现清单(9 维度 / 78 条,校验后 severity)

> `✓` = 经对抗校验;severity 为校验后校准值。位置为审查时实际打开的 `file:line`。

### 1. Rendering & App Router(渲染与路由)

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| render-all-dynamic-ssr | low ✓ | i18n/request.ts:5-6 | 全站 per-request SSR,零 SSG/ISR(cookie 定位固有代价) |
| render-client-pages-no-metadata | medium ✓ | programs/contact/ev/ai 页:1 | 4 旗舰页整页 client → 无独立 metadata |
| render-no-error-loading-boundaries | medium | src/app/ | 无 error.tsx/global-error.tsx/loading.tsx |
| render-footer-dead-routes | medium | Footer.tsx:114,121 | /privacy /terms 全站 404 |
| render-middleware-deprecated | medium | middleware.ts | Next 16 应改名 proxy.ts |
| render-client-sprawl | medium | programs/ev 等 | 整页 client 撑大营销包 + 阻断 server metadata |
| render-redirect-doc-drift | low | elite-interview/ai-pioneers | 运行期 redirect stub + 文档陈旧(307 非 301) |

### 2. Components & Animation(组件与动画栈)

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| anim-motion-create-in-render | medium | FadeIn.tsx:32; StaggerContainer.tsx:19 | `motion.create(as)` 在 render 内 → 每次重渲染重挂子树 |
| arch-client-section-sprawl | medium | about-us/sections/* | 静态 section 仅为入场动画被标 "use client" |
| perf-r3f-continuous-loop | medium | EVModel3D.tsx:631 | 3D 画布 60fps 常驻无可见性门控 |
| arch-abandoned-anim-primitives | low | animations/Stagger* | 动画原语建了又弃(死代码),fade-up 到处内联复制 |
| arch-button-link-full-reload | low | Button.tsx:71; PopupBanner.tsx:131 | Button `as="link"` 渲染裸 `<a>` → 内部 CTA 整页刷新 |
| arch-button-underused-inline-ctas | low | HeroSection.tsx:270-282 | 绕过 Button 原语手写 CTA;两个 HeroSection 同名 |
| perf-gsap-import-inconsistency | low | EV 组件 vs 首页 | GSAP 加载策略不一致(EV 顶层静态 import) |
| a11y-hero-video-ignores-reduced-motion | low | HeroSection.tsx:191-202 | reduced-motion 下背景视频仍自动播放 |

### 3. API & Backend

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| emailsend-partial-failure-resend | medium ✓ | emails/send/route.ts:82-116 | 无分批失败追踪,失败 campaign 可重发全体 |
| emailsend-double-send-race | medium ✓ | emails/send/route.ts:39-58 | 状态转换非原子 → 双击/超时重发全体 |
| emailsend-sync-blocking-fake-batch | medium | mail.ts:42-58 | 串行逐封 SMTP,BATCH_SIZE 死代码,阻塞请求 |
| error-message-leak-public | medium | subscribe/route.ts:82-88 | 原始内部错误回传客户端(含公开端点) |
| ratelimit-upstash-shared-config | medium | rate-limit.ts:85-117 | Upstash 限流套用首个调用者的 limit |
| email-failure-after-db-commit | medium | subscribe/route.ts:60-89 | 写库后发信失败返回 500(其实已订阅) |
| missing-input-length-limits | medium | contact/route.ts:11-17 | 无任何字符串长度上限(公开表单可存 MB 级) |
| doc-drift-resend-vs-nodemailer | low | lib/CLAUDE.md:38-47 | 文档写 @/lib/resend,实为 nodemailer |
| ratelimit-xff-spoofable | low | rate-limit.ts:66-70 | XFF 首段可伪造绕过限流 |
| popup-active-uncached-unindexed | low | popups/active/route.ts | 每次页面加载查无索引表,无缓存 |
| admin-lists-unpaginated | low | emails/route.ts:19-21 | emails/popups 列表无分页 |
| csrf-dead-ternary | info | csrf.ts:26-28 | 三元两分支相同,死代码 |

### 4. Security & Auth

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| sec-nextjs-cve-middleware-bypass | medium ✓ | package.json (next 16.2.9) | 在 middleware 绕过等 CVE 范围内(仅达空壳,API 独立鉴权) |
| sec-admin-mutations-no-csrf | medium ✓ | admin 变更路由 | admin 变更端点零 CSRF,仅 SameSite=Lax 兜底 |
| sec-nextauth-outdated-getToken-dos | medium ✓ | middleware.ts:9-12 | next-auth getToken 对畸形 Bearer 抛异常(自伤式 500) |
| sec-unused-vulnerable-auth-adapter | medium | package.json:14 | @auth/prisma-adapter critical CVE 但死代码 → 卸载 |
| sec-nodemailer-outdated-injection-cves | medium | mail.ts | nodemailer 7.0.13 落后于头注入/SSRF 补丁 |
| sec-no-brute-force-protection-login | medium | auth.ts:14-42 | 登录无限流/锁定/CAPTCHA |
| sec-no-security-headers-csp | medium | next.config.ts | 无 CSP/X-Frame-Options/HSTS/nosniff |
| sec-timing-username-enumeration | low | auth.ts:19-34 | 登录计时侧信道泄露邮箱是否存在 |
| sec-error-message-leakage | low | 全部 api/*/route.ts | 原始错误回传客户端 |
| sec-xff-spoofable-ratelimit-key | low | rate-limit.ts:66-70 | 限流 key 取 XFF 首跳可伪造 |
| sec-no-rbac-role-field-unused | info | schema.prisma:31; auth.ts | role 存入 JWT/session 但从不校验 |

### 5. Data Layer

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| data-status-free-text | medium | schema.prisma:14,49 | status 裸字符串,应为 Prisma enum |
| data-missing-indexes | medium | schema.prisma | 零非唯一索引,3 个真实查询无索引 |
| data-dashboard-hardcoded-zero | medium | admin/page.tsx:54 | 仪表盘"总联系人"硬编码 0 |
| data-dashboard-overfetch | medium | admin/page.tsx:29-50 | 拉全表(含 body HTML)算计数 |
| data-contact-no-readpath | medium | schema.prisma:21-31 | ContactMessage 只写不读,PII 无治理(PIPEDA) |
| data-raw-error-leak | medium | 全部路由 catch | 原始 Prisma 错误回传;P2002 竞态未捕获 |
| data-popup-hot-query-uncached | medium | popups/active/route.ts | 每次页面浏览查库,无缓存无索引 |
| data-timestamp-no-tz | low ✓ | schema.prisma | 时间戳 TIMESTAMP(3) 非 timestamptz(UTC 下影响小) |
| data-email-send-no-idempotency | low | emails/send/route.ts:55-116 | 群发无逐收件人追踪,崩溃即重发风险 |

### 6. Performance & Assets

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| perf-blurdata-shipped-to-client | medium | blur-data.ts:1 | 111KB blur JSON 全量进 13+ client 组件 |
| perf-homepage-fully-dynamic | medium | layout.tsx:55-56 | 首页及全部公开路由全动态 SSR |
| perf-public-no-cache-headers | low ✓ | next.config.ts | /public 资源 max-age=0(304 生效,多一次往返) |
| perf-font-static-weights-no-variable | low ✓ | layout.tsx:11-21 | 5 静态字重 + Noto latin 冗余 preload(~25KB) |
| perf-uncompressed-pngs | low | public/media/images | ~27 张 >300KB PNG/JPG(仅定向处理) |
| perf-framer-motion-eager-vs-gsap-lazy | low | home/* | framer-motion 静态 import 进基线包 |

### 7. i18n

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| i18n-no-hreflang-single-url | medium ✓ | routing.ts:10 | 单 URL + 无 hreflang → 中文站不可索引 |
| i18n-cookies-force-dynamic | medium | request.ts:5-6 | cookies()/headers() 强制全站动态 |
| i18n-client-pages-no-metadata | medium | 4 个公开页 | client 页无独立 metadata(标题重复) |
| i18n-naive-accept-language | low | request.ts:13-14 | Accept-Language 子串匹配忽略 q 值 |
| i18n-all-namespaces-shipped-client | low | request.ts:23-34 | 8 命名空间(含 admin)全量注水到每页 |
| i18n-unused-routing-exports | info | routing.ts:13 | createNavigation 导出为死代码 |

### 8. DevOps / Build / CI

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| ga-build-arg-missing | medium | layout.tsx:57-77; Dockerfile | 生产 GA 因 NEXT_PUBLIC 构建期未注入而静默失效 |
| migrate-deploy-on-every-boot | medium | Dockerfile:73-76 | 每次启动 migrate,前向无回滚 |
| no-security-headers | medium | next.config.ts:6-22 | 无安全头(与 sec-no-security-headers 同) |
| env-drift-and-no-validation | low | .env.example; dev.sh | .env.example 写 RESEND_API_KEY;无启动 env 校验 |
| ci-no-test-gate-mutable-latest | low | deploy.yml:7-53 | CI 无 lint/test 门禁;打可变 latest |
| unpinned-base-image | low | Dockerfile:5,13,30,36 | node:20-alpine 浮动标签;无 HEALTHCHECK/engines |
| tsconfig-target-es2017-noop | info | tsconfig.json:3 | target ES2017 对输出无影响(noEmit) |

### 9. Type System & Quality

| id | severity | 位置 | 摘要 |
|----|----------|------|------|
| correctness-popup-cta-field-drift | medium ✓ | PopupBanner.tsx vs popups/active | 线上 bug:buttonHref/buttonLink 漂移,CTA 永不显示 |
| architecture-api-route-boilerplate | medium ✓ | 全部 9 条 route | auth/safeParse/try-catch 样板重复(最高杠杆重构) |
| maintainability-entity-type-duplication | medium | schema/schemas/interface | Popup 形状 4 份手维护,无单一真源 |
| maintainability-no-test-suite | medium ✓ | 全库 | 零自动化测试 |
| correctness-cn-clsx-mismatch | medium | utils.ts:1-5 | cn() 未实现 clsx 合并语义(潜伏误用) |
| data-partial-batch-failure-not-recorded | medium | emails/send/route.ts:76-116 | 分批发信部分成功丢失 |
| maintainability-doc-drift-mail-ratelimit | medium | lib/CLAUDE.md | 文档描述 Resend + 纯内存栈(已不存在) |
| maintainability-apiresponse-not-reused-client | low ✓ | 各 client 调用点 | ApiResponse<T> 客户端零复用,res.json() 皆 any |
| maintainability-status-stringly-typed | low ✓ | schema.prisma:14,49 | status 裸字符串,无共享 TS union |
| devops-lint-gate-red | low ✓ | FadeIn/StaggerContainer/EVModel3D | ESLint 当前红(且 CI 不 enforce) |
| maintainability-csrf-dead-ternary | low | csrf.ts:26-28 | CSRF 比较死三元 |
| maintainability-herosection-naming-collision | low | home vs about-us HeroSection | 两个同名组件 |

---

*本报告由多 agent 审查工作流生成(9 维度并行 + 对抗式校验),并经人工一手复核最高风险面(auth / csrf / rate-limit / mail / admin 路由 / layout / i18n)。*
