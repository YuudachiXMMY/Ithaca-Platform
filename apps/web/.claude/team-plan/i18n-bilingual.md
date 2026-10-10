# Team Plan: i18n-bilingual

## 概述

为 Ithaca Family Academy Next.js 16 网站实现 `next-intl` 中英双语支持，采用同 URL（无 locale 前缀）+ Cookie 持久化方案，覆盖全站约 49 个文件、443 个文本实例。

## Codex 分析摘要

> Codex 因 token 认证失败未返回结果。以下为手动深度分析替代。

**后端架构分析：**
- `next-intl` 官方支持 `localePrefix: 'never'` 配置，与项目的同 URL 需求完全匹配
- `getRequestConfig` 支持从 Cookie 读取 locale，无需 `[locale]` 路由段
- 现有 `src/middleware.ts` 仅匹配 `/admin/:path*`，与 next-intl middleware 合并时需扩展 matcher 至全站
- `output: "standalone"` 模式与 next-intl 兼容（通过 `createNextIntlPlugin` 包装 next.config.ts）
- API 路由的错误消息可通过 `getTranslations()` 在 server 端翻译

## Gemini 分析摘要

> Gemini 因免费层停用未返回结果。以下为手动 UI/UX 分析替代。

**前端 UI/UX 分析：**
- 语言切换器应放置在 Header 右侧（Contact Us 旁），采用 `EN | 中文` 简洁切换样式
- 移动端放在 MobileNav 底部，与现有导航风格一致（13px uppercase tracking）
- 中文字体推荐：`Noto Sans SC`（Google Fonts）+ 系统字体 fallback
- GSAP/Framer Motion 动画中的文本替换不影响动画逻辑（文本长度变化可能影响布局，需逐个验证）
- `as const` 数组改为翻译键后类型从字面量退化为 `string`，可接受
- 表单验证消息通过 `useTranslations` 在 Zod schema 外部翻译（Zod 报错 -> 翻译键映射）

## 技术方案

### 核心架构决策

1. **路由策略**：`localePrefix: 'never'`，同 URL，无 `[locale]` 路由段
2. **Locale 存储**：Cookie (`NEXT_LOCALE`)，持久化 1 年
3. **Locale 检测**：首次访问时读取 `Accept-Language` header，中文浏览器自动展示中文
4. **翻译加载**：按命名空间拆分 JSON 文件，`getRequestConfig` 中合并加载
5. **组件翻译**：Server 组件用 `getTranslations()`，Client 组件用 `useTranslations()`
6. **字体策略**：Outfit (latin) + Noto Sans SC (CJK)，通过 `next/font/google` 加载
7. **Middleware 合并**：next-intl middleware 处理 locale -> 然后执行 JWT auth 逻辑

### 翻译文件结构

```
messages/
  en/
    common.json       # 共享 UI 文本（按钮、标签、Footer）
    nav.json          # 导航标签（NAV_ITEMS）
    home.json         # 首页 6 个 section
    about.json        # About Us 22 个 section
    programs.json     # Programs 7 个页面
    contact.json      # Contact Us 页面 + 表单
    admin.json        # Admin 面板 6 个页面
    metadata.json     # SEO metadata（title, description, OG）
  zh/
    (镜像结构)
```

### 新增文件清单

| 文件 | 用途 |
|------|------|
| `src/i18n/routing.ts` | defineRouting 配置（locales, defaultLocale, localePrefix） |
| `src/i18n/request.ts` | getRequestConfig（Cookie 读取 + 消息加载） |
| `src/components/shared/LanguageSwitcher.tsx` | 语言切换器 UI 组件 |
| `messages/en/*.json` (8 files) | 英文翻译文件 |
| `messages/zh/*.json` (8 files) | 中文翻译文件 |

### 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `next.config.ts` | 包装 `createNextIntlPlugin` |
| `src/middleware.ts` | 合并 next-intl middleware + JWT auth |
| `src/app/layout.tsx` | 添加 Noto Sans SC、NextIntlClientProvider、动态 `lang` 属性 |
| `src/types/index.ts` | NAV_ITEMS/TEAM_MEMBERS 改为翻译键驱动 |
| `src/components/layout/Header.tsx` | 集成 LanguageSwitcher、使用 useTranslations |
| `src/components/layout/Footer.tsx` | 使用 useTranslations |
| `src/components/home/*.tsx` (6+ files) | 替换硬编码文本为翻译键 |
| `src/components/shared/*.tsx` (2 files) | 替换硬编码文本 |
| `src/components/contact/ContactForm.tsx` | 表单标签 + 验证消息翻译 |
| `src/app/about-us/**/*.tsx` (23 files) | 替换硬编码文本 |
| `src/app/programs/**/*.tsx` (8 files) | 替换硬编码文本 |
| `src/app/contact-us/page.tsx` | 替换硬编码文本 |
| `src/app/admin/**/*.tsx` (6 files) | 替换硬编码文本 |

## 子任务列表

### Task 1: i18n 基础设施搭建

- **类型**: 后端 + 配置
- **文件范围**:
  - `package.json` (install only)
  - `next.config.ts`
  - `src/i18n/routing.ts` (NEW)
  - `src/i18n/request.ts` (NEW)
  - `src/middleware.ts`
  - `messages/en/*.json` (empty skeletons)
  - `messages/zh/*.json` (empty skeletons)
- **依赖**: 无
- **实施步骤**:
  1. 安装 `next-intl`：`npm install next-intl`
  2. 创建 `src/i18n/routing.ts`：
     - `defineRouting({ locales: ['en', 'zh'], defaultLocale: 'en', localePrefix: 'never' })`
     - 导出 `createNavigation(routing)` 的 `Link, useRouter, usePathname`
  3. 创建 `src/i18n/request.ts`：
     - 从 Cookie `NEXT_LOCALE` 读取 locale
     - 无 Cookie 时从 `Accept-Language` header 检测（含 `zh` 则用中文）
     - 动态 import 各命名空间 JSON 并合并为 messages 对象
  4. 修改 `next.config.ts`：用 `createNextIntlPlugin()` 包装
  5. 修改 `src/middleware.ts`：
     - 导入 `createMiddleware` from `next-intl/middleware`
     - 创建 intlMiddleware 实例
     - 在 export function middleware 中：先调用 intlMiddleware（设置 locale）-> 再执行 JWT 检查
     - 扩展 matcher 至全站（排除 `_next`, `api`, 静态资源）
  6. 创建 16 个空 JSON 骨架文件（`messages/{en,zh}/{common,nav,home,about,programs,contact,admin,metadata}.json`），内容为 `{}`
- **验收标准**:
  - `npm run build` 成功
  - 访问任意页面不报错
  - Cookie `NEXT_LOCALE` 被自动设置
  - 中文浏览器首次访问时 locale 被检测为 `zh`

### Task 2: 根布局 + 字体 + Provider

- **类型**: 前端
- **文件范围**:
  - `src/app/layout.tsx`
- **依赖**: Task 1
- **实施步骤**:
  1. 导入 `Noto_Sans_SC` from `next/font/google`，配置 `subsets: ['latin']`、weight 与 Outfit 对齐
  2. 将 `<html lang="en">` 改为动态：通过 `getLocale()` from `next-intl/server` 获取当前 locale
  3. 在 `className` 中添加 Noto Sans SC 的 CSS 变量
  4. 导入 `NextIntlClientProvider` 和 `getMessages`，用 Provider 包装 body children
  5. 将静态 `metadata` 改为 `generateMetadata()` 函数，使用 `getTranslations('metadata')`
  6. 更新 `globals.css` 的 `font-family` 以包含 Noto Sans SC 作为 CJK 回退
- **验收标准**:
  - `<html lang>` 随 locale 动态变化
  - 中文页面正确显示中文字体
  - 所有 client 组件可访问 `useTranslations`

### Task 3: 语言切换器 + Header 迁移

- **类型**: 前端
- **文件范围**:
  - `src/components/shared/LanguageSwitcher.tsx` (NEW)
  - `src/components/layout/Header.tsx`
  - `messages/en/nav.json` (填充)
  - `messages/zh/nav.json` (填充)
- **依赖**: Task 1, Task 2
- **实施步骤**:
  1. 创建 `LanguageSwitcher.tsx`：
     - "use client" 组件
     - 读取 `useLocale()` 获取当前语言
     - 渲染 `EN | 中文` 切换按钮（当前语言高亮）
     - 点击时设置 Cookie `NEXT_LOCALE` + `router.refresh()`
     - Desktop 样式：与导航一致的 13px tracking uppercase
     - Mobile 样式：在 MobileNav 底部渲染
  2. 修改 `Header.tsx`：
     - 在 RIGHT_NAV 后添加 `<LanguageSwitcher />`（Desktop）
     - 在 MobileNav `<ul>` 底部添加 `<LanguageSwitcher />`（Mobile）
     - 将 `item.label` 替换为 `useTranslations('nav')` 的翻译键
     - 同步更新 `aria-label` 等可访问性文本
  3. 填充 `nav.json`（英中两版导航标签）
- **验收标准**:
  - Header 显示语言切换按钮
  - 点击切换后页面文本变为对应语言
  - 导航标签正确翻译
  - 刷新后保持选定语言

### Task 4: Types 常量重构 + Footer 迁移

- **类型**: 前端
- **文件范围**:
  - `src/types/index.ts`
  - `src/components/layout/Footer.tsx`
  - `messages/en/common.json` (填充)
  - `messages/zh/common.json` (填充)
- **依赖**: Task 1
- **实施步骤**:
  1. 重构 `src/types/index.ts`：
     - `NAV_ITEMS`：`label` 字段改为翻译键（如 `"nav.home"`），组件中通过 `t(item.label)` 渲染
     - `TEAM_MEMBERS`：`name` 保持不变（人名不翻译），`title` 和 `description` 改为翻译键
     - `CONTACT_INFO`：地址、邮箱等保持不变（不翻译），标签文本放入 common.json
  2. 迁移 `Footer.tsx`：
     - 如果是 Server Component：使用 `getTranslations('common')`
     - 如果需要改为 Client Component：添加 `"use client"` + `useTranslations('common')`
     - 替换所有硬编码文本（Quick Links, Contact, Subscribe 等）
  3. 填充 `common.json`：按钮文本、Footer 标签、通用 UI 元素
- **验收标准**:
  - NAV_ITEMS 在 Header 和 Footer 中正确翻译
  - TEAM_MEMBERS 的职位和描述正确翻译
  - Footer 所有文本正确翻译
  - TypeScript 类型检查通过

### Task 5: 首页 Section 组件迁移

- **类型**: 前端
- **文件范围**:
  - `src/components/home/HeroSection.tsx`
  - `src/components/home/MissionSection.tsx`
  - `src/components/home/ProgramsShowcase.tsx`
  - `src/components/home/FeaturedSection.tsx`
  - `src/components/home/StudentHighlights.tsx`
  - `src/components/home/ContactSection.tsx`
  - `src/components/home/ImpactStats.tsx`
  - `src/components/home/CinematicDivider.tsx`
  - `src/app/page.tsx`
  - `messages/en/home.json` (填充)
  - `messages/zh/home.json` (填充)
- **依赖**: Task 1, Task 2
- **实施步骤**:
  1. 在每个 "use client" 组件顶部添加 `const t = useTranslations('home');`
  2. 替换所有硬编码英文文本为 `t('hero.title')` 等翻译键
  3. **HeroSection 特殊处理**：
     - `QUOTE_LINES` 改为翻译键数组：`[t('hero.quote1'), t('hero.quote2'), ...]`
     - GSAP 动画不受影响（动画作用于 DOM 元素，不关心文本内容）
  4. **ImpactStats**：数字保持不变，标签文本翻译
  5. **ProgramsShowcase**：卡片标题、描述翻译
  6. 填充 `home.json` 英文和中文内容
  7. 验证所有 Framer Motion / GSAP 动画在中文下正常工作
- **验收标准**:
  - 首页所有文本正确翻译
  - GSAP 动画（HeroSection quote reveal）在中文下正常
  - Framer Motion 动画不受影响
  - 无残留硬编码英文

### Task 6: About Us 页面迁移

- **类型**: 前端
- **文件范围**:
  - `src/app/about-us/page.tsx`
  - `src/app/about-us/sections/*.tsx` (22 files)
  - `messages/en/about.json` (填充)
  - `messages/zh/about.json` (填充)
- **依赖**: Task 1, Task 2, Task 4 (TEAM_MEMBERS)
- **实施步骤**:
  1. 迁移 `about-us/page.tsx` 的 metadata 到 `generateMetadata()`
  2. 逐个迁移 22 个 section 组件：
     - HeroSection, MissionGrid, Approach, PillarsSection, DecabFramework
     - LearningPathway, HowWeTeach, HowWeTeachEthics, EthicsSection
     - OurPrograms, ProgramsBento, Outcomes, StudentOutcomes
     - StudentHighlights, StudentHighlight, Highlights
     - CommunitySpotlight, TeamSection, TeamGrid
     - NewsletterSection, CTASection, ConnectCTA
  3. 每个 section 的 `as const` 数组内容提取到 `about.json`
  4. `TeamSection`/`TeamGrid` 使用 Task 4 中已翻译的 TEAM_MEMBERS
  5. 填充 `about.json` 英中文内容
- **验收标准**:
  - About Us 页面所有 22 个 section 正确翻译
  - 团队成员信息正确显示
  - 所有动画正常

### Task 7: Programs 页面迁移

- **类型**: 前端
- **文件范围**:
  - `src/app/programs/page.tsx`
  - `src/app/programs/ai-entrepreneurship-camp/page.tsx`
  - `src/app/programs/ev-challenge/page.tsx`
  - `src/app/programs/engineering-projects/page.tsx`
  - `src/app/programs/ai-pioneers-interview/page.tsx`
  - `src/app/programs/summer-winter-camps/page.tsx`
  - `src/app/programs/ithaca-night/page.tsx`
  - `src/app/programs/elite-interview/page.tsx`
  - `src/components/programs/PlaceholderProgram.tsx`
  - `src/components/programs/ev-challenge/WorkshopToRolesTransition.tsx`
  - `src/components/programs/ev-challenge/EVModel3D.tsx`
  - `messages/en/programs.json` (填充)
  - `messages/zh/programs.json` (填充)
- **依赖**: Task 1, Task 2
- **实施步骤**:
  1. 迁移 Programs 索引页（6 个程序卡片）
  2. 迁移 AI Entrepreneurship Camp 详情页（最复杂，含 FAQ）
  3. 迁移 EV Challenge 页（含 3D 模型组件中的文本）
  4. 迁移 Elite Interview 页
  5. 迁移 5 个 Placeholder 程序页（共享 PlaceholderProgram 组件）
  6. 迁移 WorkshopToRolesTransition 组件（多个 as const 数组）
  7. EVModel3D.tsx：仅翻译 UI 标签，3D 模型数据保持不变
  8. 填充 `programs.json`
- **验收标准**:
  - 所有程序页面正确翻译
  - FAQ 手风琴正确翻译
  - 3D 模型组件标签翻译
  - PlaceholderProgram "Coming Soon" 正确翻译

### Task 8: Contact Us + 表单迁移

- **类型**: 前端
- **文件范围**:
  - `src/app/contact-us/page.tsx`
  - `src/components/contact/ContactForm.tsx`
  - `src/components/shared/NewsletterForm.tsx`
  - `messages/en/contact.json` (填充)
  - `messages/zh/contact.json` (填充)
- **依赖**: Task 1, Task 2
- **实施步骤**:
  1. 迁移 `contact-us/page.tsx`：标题、描述、联系方式标签
  2. 迁移 `ContactForm.tsx`：
     - 表单字段标签翻译
     - 占位符文本翻译
     - Zod 验证错误消息：在组件中使用 `t('form.errors.emailRequired')` 映射
     - 提交成功/失败消息翻译
  3. 迁移 `NewsletterForm.tsx`：
     - 输入框占位符
     - 按钮文本
     - 成功/错误状态消息
  4. 填充 `contact.json`
- **验收标准**:
  - 联系页面所有文本正确翻译
  - 表单验证错误消息正确翻译
  - 表单提交后的反馈消息正确翻译
  - Newsletter 表单（出现在 Footer 和 About Us 中）正确翻译

### Task 9: Admin 面板迁移

- **类型**: 前端
- **文件范围**:
  - `src/app/admin/layout.tsx`
  - `src/app/admin/page.tsx`
  - `src/app/admin/login/page.tsx`
  - `src/app/admin/subscribers/page.tsx`
  - `src/app/admin/emails/page.tsx`
  - `src/app/admin/popups/page.tsx`
  - `messages/en/admin.json` (填充)
  - `messages/zh/admin.json` (填充)
- **依赖**: Task 1, Task 2
- **实施步骤**:
  1. 迁移 `admin/layout.tsx`：侧边栏导航标签、登出按钮
  2. 迁移 `admin/page.tsx`：Dashboard 卡片标题、描述
  3. 迁移 `admin/login/page.tsx`：登录表单标签
  4. 迁移 `admin/subscribers/page.tsx`：表头、按钮、对话框
  5. 迁移 `admin/emails/page.tsx`：表单标签、状态文本
  6. 迁移 `admin/popups/page.tsx`：表单标签、日期选择器标签
  7. 填充 `admin.json`
- **验收标准**:
  - Admin 面板所有页面正确翻译
  - 侧边栏导航正确翻译
  - 登录表单正确翻译
  - CRUD 操作的反馈消息正确翻译

### Task 10: SEO Metadata + 最终验证

- **类型**: 全栈
- **文件范围**:
  - `messages/en/metadata.json` (填充)
  - `messages/zh/metadata.json` (填充)
  - 各 `page.tsx` 文件 (metadata 部分，与 T6/T7/T8 串行)
- **依赖**: Task 5, 6, 7, 8, 9 (所有页面迁移完成后)
- **实施步骤**:
  1. 将各页面的静态 `metadata` 改为 `generateMetadata()` 函数
  2. 使用 `getTranslations('metadata')` 获取翻译后的 title/description/OG
  3. 填充 `metadata.json`
  4. **最终验证**：
     - `grep -r` 扫描所有 `.tsx` 文件中的残留硬编码英文文本
     - 逐页对比中英文版本，确保无遗漏
     - 验证所有动画在中文下正常工作
     - 验证 `<html lang>` 属性正确
     - 验证 Cookie 持久化
     - 验证浏览器语言自动检测
  5. 运行 `npm run build` 确保构建成功
  6. 运行 `npm run lint` 确保无 lint 错误
- **验收标准**:
  - 所有页面 metadata 随语言切换更新
  - OG tags 正确翻译
  - 无残留硬编码英文文本（grep 验证通过）
  - `npm run build` 成功
  - 所有成功判据 [OK-1] 到 [OK-9] 通过

## 文件冲突检查

All tasks have isolated file scopes:

| Task | 独占文件 | 潜在共享 | 解决方式 |
|------|---------|---------|---------|
| T1 | next.config.ts, src/i18n/*, src/middleware.ts | -- | -- |
| T2 | src/app/layout.tsx | -- | -- |
| T3 | Header.tsx, LanguageSwitcher.tsx (NEW), nav.json | -- | -- |
| T4 | src/types/index.ts, Footer.tsx, common.json | -- | -- |
| T5 | src/components/home/*.tsx, home.json | -- | -- |
| T6 | src/app/about-us/**/*.tsx, about.json | -- | -- |
| T7 | src/app/programs/**/*.tsx, programs.json | -- | -- |
| T8 | contact-us/*, ContactForm, NewsletterForm, contact.json | -- | -- |
| T9 | src/app/admin/**/*.tsx, admin.json | -- | -- |
| T10 | metadata.json, page.tsx metadata parts | page.tsx | T10 depends on T6/T7/T8 |

## 并行分组

```
Layer 0 (基础): Task 1 (i18n 基础设施)
    |
Layer 1 (布局): Task 2 (Root Layout + Provider)
    |
Layer 2 (并行 x 4):
  +-- Task 3 (语言切换器 + Header)
  +-- Task 4 (Types/常量 + Footer)
  +-- Task 5 (首页 Sections)
  +-- Task 8 (Contact + 表单)
    |
Layer 3 (并行 x 3):
  +-- Task 6 (About Us) -- 依赖 T4 的 TEAM_MEMBERS
  +-- Task 7 (Programs)
  +-- Task 9 (Admin)
    |
Layer 4 (收尾): Task 10 (Metadata + 验证)
```

**Builder 数量建议**: Layer 2 最多 4 个并行 Builder，Layer 3 最多 3 个。

## 风险缓解

| 风险 | 缓解措施 |
|------|---------|
| next-intl 与 Next.js 16 不兼容 | T1 完成后立即验证基础功能，失败则回退到手动 i18n 方案 |
| GSAP 动画布局错位 | T5 中逐个验证 HeroSection 动画，必要时调整文本容器宽度 |
| 翻译遗漏 | T10 用 grep 全量扫描残留硬编码 |
| as const 类型退化 | 可接受；需要类型安全的地方使用 union type 替代 |
| 中文字体加载慢 | Noto Sans SC 只加载必要 weight，配合 font-display: swap |
