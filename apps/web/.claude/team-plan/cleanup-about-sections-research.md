# Team Research: cleanup-about-sections

## 增强后的需求

**目标**: 删除 `src/app/about-us/sections/` 下 13 个未被任何页面或组件引用的旧版 section 文件。
**范围**: 仅限 about-us section 文件，不涉及翻译文件或其他模块。
**验收标准**: 删除后 `npm run build` 通过，about-us 页面功能和视觉不变。

## 约束集

### 硬约束

- [HC-1] `about-us/page.tsx` 仅引用 9 个 section（HeroSection, MissionGrid, Approach, DecabFramework, ProgramsBento, Outcomes, Highlights, TeamGrid, ConnectCTA）— 来源：代码扫描
- [HC-2] 13 个待删除文件在整个 `src/` 目录中无任何 import 引用（grep 全量搜索确认）— 来源：代码扫描
- [HC-3] 无 barrel export (index.ts) 间接引入这些文件 — 来源：代码扫描
- [HC-4] homepage 的 `StudentHighlights` 来自 `@/components/home/StudentHighlights`，与 about-us 下的同名文件无关 — 来源：代码扫描

### 软约束

- [SC-1] 这些文件来自 about-us 页面早期迭代，设计已被替代 — 来源：CLAUDE.md 文档记录
- [SC-2] 翻译 key 可能仍包含这些组件使用的文本，但清理翻译不在本次范围内 — 来源：分析推断

### 依赖关系

- [DEP-1] 无跨模块依赖 — 13 个文件均为叶子节点组件，不被其他模块消费

### 风险

- [RISK-1] 删除后若有人手动引用旧组件名会编译失败 — 缓解：git 历史可恢复
- [RISK-2] 翻译文件中可能残留仅被这些组件使用的 key — 缓解：不影响功能，后续单独清理

## 待删除文件清单 (13 files)

| # | File | Description |
|---|------|-------------|
| 1 | `sections/HowWeTeach.tsx` | 旧版教学方法 section |
| 2 | `sections/EthicsSection.tsx` | 旧版伦理 section |
| 3 | `sections/PillarsSection.tsx` | 旧版支柱 section |
| 4 | `sections/HowWeTeachEthics.tsx` | 旧版教学伦理合并 section |
| 5 | `sections/StudentOutcomes.tsx` | 旧版学生成果 section |
| 6 | `sections/StudentHighlights.tsx` | 旧版学生亮点 section (about-us 版) |
| 7 | `sections/StudentHighlight.tsx` | 旧版单个学生亮点 section |
| 8 | `sections/CommunitySpotlight.tsx` | 旧版社区聚焦 section |
| 9 | `sections/TeamSection.tsx` | 旧版团队 section (被 TeamGrid 替代) |
| 10 | `sections/NewsletterSection.tsx` | 旧版通讯订阅 section |
| 11 | `sections/CTASection.tsx` | 旧版 CTA section (被 ConnectCTA 替代) |
| 12 | `sections/LearningPathway.tsx` | 旧版学习路径 section |
| 13 | `sections/OurPrograms.tsx` | 旧版项目展示 section (被 ProgramsBento 替代) |

## 成功判据

- [OK-1] 13 个文件已从文件系统中删除
- [OK-2] `npm run build` 成功通过，无编译错误
- [OK-3] `about-us/page.tsx` 的 9 个 import 不受影响
- [OK-4] `src/app/CLAUDE.md` 更新，移除对 13 个 inactive section 的引用

## 开放问题（已解决）

- 无 — 所有 13 个文件经 grep 确认零外部引用，无歧义
