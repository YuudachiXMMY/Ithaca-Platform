# Team Research: i18n-bilingual

## 增强后的需求

**目标**：为 Ithaca Family Academy Next.js 16 网站实现中英双语支持。

**技术约束**：
- 使用 `next-intl` 库
- 同 URL 路由（无 `/en/`、`/zh/` 前缀），通过 Cookie 存储语言偏好
- 自动检测浏览器 `Accept-Language`，中文浏览器自动展示中文
- 全站双语（公开页面 + Admin 后台）

**范围边界**：
- 所有面向用户的静态文本需要翻译（~443 个文本实例，~49 个文件）
- 数据库内容（Popup、EmailCampaign）暂不翻译
- API 错误消息需翻译
- SEO metadata 需翻译

**验收标准**：
- 用户可通过语言切换器切换中/英文
- 中文浏览器首次访问自动展示中文
- 切换语言后刷新页面仍保持选定语言
- 所有页面无遗漏英文硬编码

## 约束集

### 硬约束

- [HC-1] **Next.js 16 App Router** — 项目使用 Next.js 16 (`next@16.2.4`)，App Router 模式，`output: "standalone"`。i18n 方案必须兼容。— 来源：代码库
- [HC-2] **无 locale 路由前缀** — 用户选择同 URL 方案，`next-intl` 需配置 `localePrefix: 'never'`。— 来源：用户
- [HC-3] **现有 middleware 必须保留** — `src/middleware.ts` 已有 JWT 认证逻辑守护 `/admin/*`。`next-intl` 的 middleware 必须与之合并，不能替换。— 来源：代码库
- [HC-4] **Server + Client 组件混合** — 项目大量使用 `"use client"` 组件（动画、表单），也有 Server 组件（page.tsx）。i18n 必须在两种上下文中均可用。— 来源：代码库
- [HC-5] **中文字体支持** — 当前仅加载 `Outfit` (latin)，中文需要额外字体（如 Noto Sans SC 或系统字体回退）。— 来源：代码库 `layout.tsx:9`
- [HC-6] **常量数组重构** — `NAV_ITEMS`、`TEAM_MEMBERS`、`QUOTE_LINES`、`PILLARS` 等 `as const` 数组中的文本需改为翻译键。— 来源：代码库
- [HC-7] **全站覆盖** — 用户选择全站双语，包括 Admin 面板（6 个页面，~54 个文本实例）。— 来源：用户

### 软约束

- [SC-1] **翻译文件组织** — 建议按页面/模块拆分翻译 JSON（如 `messages/en/home.json`、`messages/zh/admin.json`），避免单文件过大。— 来源：最佳实践
- [SC-2] **渐进式迁移** — 可分阶段迁移：先基础设施 → 布局/导航 → 各页面。不必一次全部完成。— 来源：最佳实践
- [SC-3] **翻译键命名** — 使用 `namespace.section.key` 格式（如 `home.hero.viewPrograms`），保持层级清晰。— 来源：最佳实践
- [SC-4] **`useTranslations` 命名空间** — 在组件中使用 `useTranslations('home.hero')` 获取局部翻译，避免全局加载。— 来源：next-intl 文档

### 依赖关系

- [DEP-1] `next-intl` → `middleware.ts`：i18n middleware 必须先于 auth middleware 执行（合并到同一个 middleware 函数中）
- [DEP-2] 翻译文件 → 所有组件：组件从 `useTranslations()` / `getTranslations()` 获取文本，依赖翻译文件先创建
- [DEP-3] 字体配置 → `layout.tsx`：中文字体需在根布局中配置
- [DEP-4] `src/types/index.ts` → 导航/团队组件：`NAV_ITEMS` 等常量的翻译方式影响所有引用它的组件

### 风险

- [RISK-1] **next-intl 与 Next.js 16 兼容性** — Next.js 16 可能有 breaking changes，需验证 `next-intl` 最新版是否兼容。— 缓解：安装后立即测试基础功能
- [RISK-2] **文本提取量大** — ~443 个文本实例分布在 ~49 个文件中，手动提取易遗漏。— 缓解：分模块系统性提取，完成后用 grep 检查残留硬编码
- [RISK-3] **GSAP 动画中的文本** — `HeroSection` 等组件中的文本与 GSAP ScrollTrigger 动画紧密耦合，替换为动态文本可能影响布局计算。— 缓解：翻译后逐个验证动画效果
- [RISK-4] **`as const` 类型安全** — `QUOTE_LINES` 等使用 `as const` 的数组，改为翻译键后会失去字面量类型。— 缓解：可接受的类型退化，改为 `string[]`

## 文本分布统计

| 区域 | 文件数 | 文本实例数 | 优先级 |
|------|--------|-----------|--------|
| `src/components/` (首页、布局、共享) | 15 | ~110 | P0 |
| `src/app/about-us/sections/` | 19 | ~106 | P1 |
| `src/app/programs/` | 7 | ~138 | P1 |
| `src/app/admin/` | 6 | ~54 | P2 |
| `src/types/index.ts` (常量) | 1 | ~30 | P0 |
| `src/app/layout.tsx` (metadata) | 1 | ~5 | P0 |
| **合计** | **~49** | **~443** | — |

## 成功判据

- [OK-1] 页面右上角（或 Header 中）有语言切换按钮，点击可切换中/英文
- [OK-2] 中文浏览器首次访问网站时自动展示中文版本
- [OK-3] 语言偏好持久化到 Cookie，刷新/跳转后保持
- [OK-4] 所有公开页面（首页、关于、项目、联系）中英文内容完整
- [OK-5] Admin 后台页面中英文内容完整
- [OK-6] 页面 `<html lang>` 属性随语言切换更新
- [OK-7] Metadata（title、description、OG tags）随语言切换更新
- [OK-8] 无残留硬编码英文文本（通过 grep 验证）
- [OK-9] GSAP/Framer Motion 动画在中文版本下正常工作

## 开放问题（已解决）

- Q1: URL 路由策略？ → A: 同 URL，无前缀 → 约束：[HC-2]
- Q2: 默认语言？ → A: 自动检测浏览器语言 → 约束：[HC-2] localeDetection
- Q3: 双语范围？ → A: 全站（含 Admin）→ 约束：[HC-7]
- Q4: 技术方案？ → A: next-intl → 约束：[HC-1, HC-4]

## 建议实施阶段

1. **Phase 0**: 安装 `next-intl`，配置 middleware + provider，验证 Next.js 16 兼容性
2. **Phase 1**: 创建翻译文件骨架，迁移 layout/Header/Footer/导航常量
3. **Phase 2**: 迁移首页 8 个 section 组件
4. **Phase 3**: 迁移 about-us（19 个 section 文件）
5. **Phase 4**: 迁移 programs（7 个页面）+ contact-us
6. **Phase 5**: 迁移 admin（6 个页面）
7. **Phase 6**: 添加语言切换器 UI、浏览器语言检测、最终验证
