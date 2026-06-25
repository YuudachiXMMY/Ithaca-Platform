# Team Plan: cleanup-about-sections

## 概述

删除 `src/app/about-us/sections/` 下 13 个未被任何代码引用的旧版 section 文件，并同步更新项目文档。

## Codex 分析摘要

- 确认 `about-us/page.tsx` 仅 import 9 个 active sections，13 个旧文件零外部引用
- 无 barrel export (`index.ts`)、无动态 import 引用旧文件
- `StudentHighlights` 命名冲突已排除：homepage 使用 `@/components/home/StudentHighlights`
- 推荐直接物理删除，不引入 stub 或兼容层
- 验证重点：`npm run build` + grep 残留引用

## Gemini 分析摘要

Gemini CLI 认证失败（免费版停服），以下为 Claude 补充的前端分析：

- 纯文件删除操作，不影响任何已渲染的 UI/UX
- 9 个 active sections 为自包含组件，无共享状态或样式依赖于旧文件
- 无 CSS 变量、共享动画或 context 被旧文件独占
- 翻译文件可能有残留 key，不影响功能，后续单独清理

## 技术方案

直接删除 13 个旧文件 + 更新 `src/app/CLAUDE.md`。无需修改 `about-us/page.tsx` 或任何 active section。

## 子任务列表

### Task 1: 删除 13 个旧版 section 文件

- **类型**: 前端
- **文件范围**:
  - `src/app/about-us/sections/HowWeTeach.tsx` (删除)
  - `src/app/about-us/sections/EthicsSection.tsx` (删除)
  - `src/app/about-us/sections/PillarsSection.tsx` (删除)
  - `src/app/about-us/sections/HowWeTeachEthics.tsx` (删除)
  - `src/app/about-us/sections/StudentOutcomes.tsx` (删除)
  - `src/app/about-us/sections/StudentHighlights.tsx` (删除)
  - `src/app/about-us/sections/StudentHighlight.tsx` (删除)
  - `src/app/about-us/sections/CommunitySpotlight.tsx` (删除)
  - `src/app/about-us/sections/TeamSection.tsx` (删除)
  - `src/app/about-us/sections/NewsletterSection.tsx` (删除)
  - `src/app/about-us/sections/CTASection.tsx` (删除)
  - `src/app/about-us/sections/LearningPathway.tsx` (删除)
  - `src/app/about-us/sections/OurPrograms.tsx` (删除)
- **依赖**: 无
- **实施步骤**:
  1. 使用显式路径 `rm` 删除 13 个文件（不使用 glob，避免误删 active section）
  2. 验证 `src/app/about-us/sections/` 只剩 9 个 `.tsx` 文件
  3. grep 确认无残留引用（排除 `@/components/home/StudentHighlights`）
- **验收标准**:
  - 13 个文件已从文件系统删除
  - 目录下仅剩 9 个 active section 文件
  - `npm run build` 成功

### Task 2: 更新项目文档

- **类型**: 文档
- **文件范围**:
  - `src/app/CLAUDE.md` (修改)
- **依赖**: 无
- **实施步骤**:
  1. Changelog 新增：`2026-06-25 | Updated | Removed 13 inactive about-us legacy section files`
  2. "About-Us Sections" 表格标题从 `22 files` 改为 `9 files`
  3. 删除 "Additional section files exist but are not currently imported..." 段落
  4. 删除 FAQ 中 "Why are there 22 about-us section files but only 9 imported?" 条目
  5. 更新 Related Files 树中的 sections 注释从 `22 about-us section files (9 active)` 改为 `9 about-us section files`
- **验收标准**:
  - 文档中不再出现 "22" 或 "13 inactive/unused" 的描述
  - 文档准确反映清理后的 9 个 section 文件

## 文件冲突检查

✅ 无冲突 — Task 1 操作 `sections/*.tsx` 文件（删除），Task 2 操作 `src/app/CLAUDE.md`（编辑），文件范围完全隔离。

## 并行分组

- **Layer 1 (并行)**: Task 1, Task 2
  - 两个任务文件范围不重叠，可同时执行
  - Builder 数量：2

## 验证步骤（Layer 1 完成后）

```bash
# 确认只剩 9 个 section 文件
ls src/app/about-us/sections/*.tsx | wc -l  # 期望: 9

# 确认无残留引用
rg "(HowWeTeach|EthicsSection|PillarsSection|HowWeTeachEthics|StudentOutcomes|CommunitySpotlight|TeamSection|NewsletterSection|CTASection|LearningPathway|OurPrograms)" src/
# 期望: 0 结果

# 构建验证
npm run build
```
