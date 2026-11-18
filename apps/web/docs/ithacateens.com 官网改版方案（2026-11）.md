# ithacateens.com 官网改版方案（2026-11）

Nov 2, 2026 · @Jadyn

## 一、改版依据与现状诊断

本方案依据 10-11、10-20、10-26、11-02 四次会议决议、三折页产品手册 v5 终稿（12 项产品）与 Figma《Ithaca 产品讨论板 · G7 到大学全线》，对照 ithacateens.com 现状产出。核心结论：官网信息架构仍停留在"三旗舰 + 夏冬令营"时期，需对齐现行"学术入口 → 四旗舰 → 研究出口"产品体系。

**2026-11-04 修订**：按 11-04 版三折页同步四处口径——① Project Studio 与工程启蒙课移入项目板块，Ithaca Dialogue 归研究板块（与 10-26 决议一致）；② 成长旅程学术段新增"大学 / 研究生 · 院校选择与专业规划，申请素材、面试准备"一行；③ 学业辅导科目增英文；④ 咨询 CTA 增"项目选择"。注：手册内页第三栏仍将 Project Studio 排在研究栏下（疑为排版空间所致），旅程页与 10-26 决议均归项目板块，网站按项目板块执行，手册排版待核。

**现状主要差距（按严重程度排序）：**

| #   | 差距                                                                                                                                                                          | 依据                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `/programs` 为旧版残留页：仍列 Engineering Projects、Summer & Winter Camps、Ithaca Night、"AI Entrepreneurship Camp（13 周旧文案）"，与首页项目卡不一致；无 AI Investment Lab | 10-11 决议：将 Summer & Winter Camps 改为 AI Investment Lab |
| 2   | AI 投资实验室（第四旗舰）全站缺失，产品已于 10-26 定稿（101/102 两期制）                                                                                                      | 10-20 四旗舰定调；10-26 产品结构                            |
| 3   | Academics 四轨为 AP / OSSD / STEM / Tutoring，缺 SAT·ACT 标化与大学课业辅导两条线；STEM 独立成轨与三折页口径不符                                                              | 三折页 v5：学术板块 = AP/OSSD/IB/大学课业 + SAT/ACT         |
| 4   | 无"研究"板块页面：Research Lab、Project Studio 站内无落点，三大板块（学术/项目/研究）架构未呈现                                                                               | 10-20 三大板块；10-26 三折页模块划分                        |
| 5   | 无新闻/动态板块                                                                                                                                                               | 10-11 决议：添加"新闻"板块                                  |
| 6   | Results 页仅 2 条成果，缺往届去向汇总与首批 5 个学员故事                                                                                                                      | 10-20：success story 首批 5 案例；11-02 录取成果展示口径    |
| 7   | Admissions 咨询表单"Programs of interest"仍为旧项目清单；五步流程细节文案缺失（页面自注 being written up）                                                                    | 现状核查                                                    |
| 8   | 机构介绍偏空、拼接感强，待重写                                                                                                                                                | 11-02 决议                                                  |
| 9   | 中文版 `/zh` 未完成，而目标客群为华人中高净值家庭                                                                                                                             | 10-01 改版记录；10-20 客群定调                              |
| 10  | 品牌口径未统一：Ithaca Dialogue（三折页）vs Ithaca Dialogues（官网）；公司注册 Ithaca Education Inc.（11-02）后页脚法律主体待定                                               | 11-02：下一批宣传材料前统一品牌口径                         |

**保留不动的现状资产**：Cavafy 引文 Hero（与三折页品牌定稿一致）、Our Approach 三支柱、Results 页的 consent 声明与"成果回链项目页"模式、全站"价格 by enquiry"策略。

## 二、导航布局（全站信息架构）

导航从"学校式"七项（Home/About/Academics/Programs/Student Life/Admissions/Contact）调整为"产品体系式"：三大板块各占一个一级入口，成果与动态各占一个，Student Life 退出主导航（内容并入 News & Events）。Logo 居中承担 Home，维持现有布局。

**主导航（7 项 + 1 CTA 按钮）：**

| 位置     | 菜单项                | 落点              | 对应板块                     |
| -------- | --------------------- | ----------------- | ---------------------------- |
| 左 1     | Academics 学术辅导    | /academics        | 01 学术（入口）              |
| 左 2     | Programs 旗舰项目     | /programs         | 02 项目（四旗舰 + 工程启蒙） |
| 左 3     | Research 研究与孵化   | /research（新增） | 03 研究（出口）              |
| 中       | Logo                  | /                 | —                            |
| 右 1     | Results 成果          | /success-stories  | 可信度                       |
| 右 2     | News 动态             | /news（新增）     | 内容沉淀                     |
| 右 3     | About 关于            | /about-us         | 品牌                         |
| CTA 按钮 | Admissions · 预约咨询 | /admissions       | 转化                         |

**下拉子菜单（桌面悬停 / 移动端展开）：**

- Academics → AP 课程 · OSSD 校内提分 · SAT / ACT 标化（新）· 大学课业辅导（新）· 一对一辅导
- Programs → EV 车队 · AI 创业探索营 · AI 投资实验室（新）· 工程启蒙课（新）· Project Studio（新，自研究板块移入）
- Research → Ithaca Dialogue 菁英访谈（主落点移入）· Research Lab · 真实产品共创（QuizR）

**页脚**：Quick Links 增 Research 与 News；邮箱统一为 info@ithacateens.com（joshua.wang@ithacafo.com 并列可选）；WeChat 保留 Joshua 个人号二维码；© 行法律主体（Ithaca Education Inc.）待品牌口径确认后再上。

**课程与项目之间的关联逻辑**（页面间交叉链接规则，三大板块靠它串成一条航线而非三个孤岛）：

1. **旅程主线**：首页与 /programs 顶部呈现"01 学术 → 02 项目 → 03 研究"旅程条（文案取三折页尾部索引）。学术段含 11-04 版新增一行"大学 / 研究生 · 院校选择与专业规划，申请素材、面试准备"——仅作旅程叙述，不设服务页（11-02：边界/交付/定价明确前不展开宣传）。收尾句照手册："下一程 · 大学申请｜研究生准备｜求职之路"。
2. **学术 → 项目（向上推荐）**：每个学术轨页底部设"课堂之外"区块——AP CS / 统计 → AI 创业营、AI 投资实验室；AP 物理 / 微积分 → EV 车队；AP 经济 → AI 投资实验室；OSSD / 大学课业 → Project Studio。
3. **项目 → 学术（向下承接）**：每个项目页设"学术衔接"行，列出该项目涉及学科并回链 Academics 对应轨（如 EV → 物理、微积分；投资实验室 → 统计、经济）。
4. **项目 → 研究（向出口推进）**：EV / 创业营 / 投资实验室页底部"下一步"指向 Project Studio（同板块作品孵化）或 Research Lab（研究训练）；创业营页用 Clossette 案例示范"营 → 真实公司 → Project Studio"路径。
5. **Dialogue 归属（11-04 版定稿）**：Ithaca Dialogue 归研究板块（与 10-26 决议一致）——主落点 /research，Programs 页保留旗舰交叉卡（四旗舰口径不变）；现有 URL /programs/ithaca-dialogues 继续使用或 301，Results 回链不受影响。
6. **成果回链**：Results 与 News 的每条条目回链对应项目页（沿用现有模式）；项目页反向嵌入 1–2 条相关成果卡。

&#91;embedded content: 全站信息架构 · 主导航 8 项与三大板块归属\]

## 三、需修改页面（7 页）

文案一律取自三折页 v5 与[中英产品文案库](https://claude.ai/artifact/VLGbJMvhDMUYBvJ396CVg4)，不重新创作，保证官网、手册、渠道资料口径一致。

### 3.1 首页 `/`

| 区块                 | 修改                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero（Cavafy 引文）  | 保留不动                                                                                                                                                  |
| Our Approach 三支柱  | 保留不动                                                                                                                                                  |
| 新增：成长旅程条     | 置于 Our Programs 之前。三段式：01 学术 ACADEMIC → 02 项目 PROJECTS → 03 研究 RESEARCH，各配一句三折页索引文案，分别链向 /academics、/programs、/research |
| Our Programs 四卡    | 换为四旗舰：EV Team · AI Entrepreneurship Bootcamp · Ithaca Dialogue · **AI Investment Lab**（替换现"Other Programs"卡）。每卡一句三折页定位语 + 档期     |
| 新增：Academics 区块 | 四卡：AP / OSSD / SAT·ACT / 大学课业辅导，导语"按学生风格匹配老师 · 入学诊断 · 阶段测验"，整块链 /academics（10-01 本地已做，随本次一并上线）             |
| 数据区块             | 标题改 Building programs that **matter**（语法）；Programs 数与新产品体系核对后更新                                                                       |
| Featured（Moridi）   | 改为可轮换 Featured 栏目，内容由 /news 最新条目驱动                                                                                                       |
| Student Highlights   | 精简保留，底部 CTA 改"更多动态 → /news"                                                                                                                   |
| 新增：Results 条带   | 一行：AIEC 2026 全场大奖 · 普林斯顿金融工程 · 往届去向院校名单，链 /success-stories                                                                       |
| Get In Touch         | 邮箱统一 info@ithacateens.com；文案加"免费 20–30 分钟升学与成长路径规划、项目选择咨询"（三折页 11-04 版 CTA）                                             |

### 3.2 `/programs` 全页重建（P0，最高优先）

当前为旧版残留，与首页导航、卡片均不一致。重建结构：

1. 导语：三大板块一句话 + 旅程条（同首页组件）
2. **项目板块卡**（02 · 项目 PROJECTS，文案直接取三折页）：
   - EV 车队 · 高中 · 每年 9–12 月 & 1–5 月：从设计、制造到赛道收官的完整电动赛车工程，覆盖机械结构、电气系统与车队运营分工，积累募资实战与升学文书素材；目标赛事滑铁卢 EV Challenge
   - AI 创业探索营 · 高中 · 9–12 月｜1–5 月：从真实问题到产品原型，AI 工具链 + 商业验证 + 公开路演；历届成果 Clossette 获 AIEC 2026 全场大奖，部分成员注册真实公司进入 Project Studio
   - AI 投资实验室 · 高中｜大学 · 9–12 月｜1–3 月｜4–6 月（新卡，链新页 4.1）
   - 工程启蒙课 · 初中｜高中 · 按需成班（新卡，链新页 4.4；列表末位，对应 10-20"低年级机会型承接"）
   - Project Studio · 中学 G11–12｜大学（11-04 版定稿归项目板块，链新页 4.7）
3. 研究出口区块：Ithaca Dialogue 菁英访谈（四旗舰之一，主落点在研究板块）与 Research Lab 两卡 → /research
4. 底部注："学术项目无固定开班日期，按需成班；科目与安排请详询" + 咨询 CTA

**删除**：Summer & Winter Camps（10-11 决议）、Engineering Projects（并入工程启蒙课）、Ithaca Night（事件内容迁 /news）、13 周旧版 AI Camp 文案。

### 3.3 `/academics`

- 四轨改五项：AP · OSSD · **SAT / ACT（新）** · **大学课业辅导（新）** · Tutoring；取消 STEM 独立轨（科目清单并入 AP/Tutoring 页，工程类内容归 Programs）
- 导语补三折页卖点：1 对 1 与小班并行、按学生风格匹配老师、入学诊断定位薄弱环节、自研讲义与阶段测验、覆盖数学/物理/计算机/统计/英文/经济（11-04 版增英文）
- 页脚加商标声明：AP®、SAT® 与 Bluebook™ 为 College Board 商标，ACT® 为 ACT, Inc. 商标；上述机构未参与本机构课程与服务（三折页全文）

### 3.4 `/admissions`

- 表单 Programs of interest 更新为现行产品：EV Team · AI Entrepreneurship Bootcamp · Ithaca Dialogue · AI Investment Lab · Engineering Foundations · Academic Tutoring（AP/OSSD/SAT）· University Support · Project Studio · Research Lab（删 Engineering Projects、Summer & Winter Camps、Ithaca Night）
- Open for registration 增 AI Investment Lab 101 卡：8 周 · 16 课时 · 随时可加入 · Tuition by enquiry
- 顶部 Grades "8–12" 改 "7–12 & University"
- 五步流程补文案（现页自注待写）：① Inquire（表单 / 微信 / info@ 邮箱）② Consultation（免费 20–30 分钟升学与成长路径规划、项目选择咨询）③ Placement & trial（入学诊断 + 按学生风格匹配老师的付费试课）④ Registration ⑤ Onboarding

### 3.5 `/success-stories`（Results）

- 新增"往届去向"区块（三折页清单）：多伦多大学（工程、CS、Rotman、经济）· 滑铁卢大学（数学/金融分析与风险管理）· 普林斯顿大学金融工程 · 罗德岛设计学院 · Western Ivey · 约克 Schulich · UBC Sauder 等。执行 11-02 口径：**获录取未入读标注为"录取成果"，与"最终去向"分列；奖学金核实后展示；优先加美高认知度院校；单页保持简洁**
- 扩充首批 5 个学员故事（10-20 决议，Sarah 等；名单线索见 client-families；每条发布前取得学员与家庭授权——现页 consent 声明保留并沿用）
- 访谈视频区随剪辑进度更新：西人嘉宾（Chris 等）优先，严寒场次发布前经本人审核

### 3.6 `/about-us`

- 机构介绍整段重写（11-02：现版偏空、拼接感强；初稿 Joshua 起草、双方推敲后替换）。过渡期先换入三折页 About 文案："伊萨卡家族学院致力于整合北美主流政治、商业及学术领域的各类菁英……采取项目制学习模式，以学生为中心……针对 OSSD/AP/IB 进行学术辅导，也帮助学生备考 SAT/ACT 等标化考试"
- 新增"项目制学习质量标准"小节（11-02 决议）：项目前——背景研究、分工、访谈提纲、个人目标；项目后——成果展示、反思、导师评价；以学生投入与学习成果衡量
- 教育理念边界一句：不作长期人生规划承诺，以适应变化、真实成果与长期口碑为核心

### 3.7 `/student-life`

- 退出主导航；活动类内容（参访、workshop、讲座照片）迁入 /news 作为 Events 分类；原 URL 301 跳转 /news

## 四、需新增页面（7 页）

### 4.1 `/programs/ai-investment-lab` — AI 投资实验室（P0）

10-11 决议直接落点，10-26 产品定稿。页面结构：

1. **Hero**：AI 投资实验室 · AI INVESTMENT LAB · 高中｜大学 · 每年 9–12 月｜1–3 月｜4–6 月；定位语（三折页）：真实账户 + 金融学习 + AI 协作——选股分析、简单建模、风险管理与投资日志，面向商科与金融方向的背景与面试素材积累（11-04 版原文；"面试"疑为"文书"笔误，印前与 Joshua 核对后两处统一）
2. **两期结构**（只主推 101，102 以"进阶课程"一行带过，不展开）：
   - Lab 101 · 8 周 · 16 课时：投资理论 · AI 工具使用 · 数据建模基础 · 模拟投资操作
   - Lab 102 · 进阶 · 6 周：在 101 基础上转向真实小额投资实操（仅标注存在）
3. **随时可加入**：短周期设计，无需等学期开头（10-26 招生策略）
4. **学生将带走什么**：投资日志与复盘报告、一段可写入文书的真实投资经历、AI 协作建模方法
5. **合规声明**（三折页全文，页面显著位置）：文中获奖与去向等成果信息为往届学员事实记录，不构成对结果的承诺。伊萨卡仅提供教学与训练，**不代客理财、不承诺收益、不提供个股买卖建议**；学员使用自有证券账户与自有资金，伊萨卡仅提供开户流程协助
6. Tuition by enquiry + 咨询 CTA；"学术衔接"行 → AP 统计 / 经济；"下一步" → Project Studio

### 4.2 `/research` — Research 板块页（新一级导航）

1. 导语（三折页索引）：03 研究 RESEARCH · 把积累变成可验证的成果 · Portfolio
2. **Ithaca Dialogue 卡（主落点，11-04 版定稿归研究板块）**：初中｜高中 · 名额制。学生主导完成选题调研、提纲设计与正式对谈，AI 辅助完成访谈研究报告与传播内容；在真实对话中建立行业认知与人脉，训练公开表达，沉淀值得写入申请文书的独特经历。访谈视频成果链 /news 与 /success-stories
3. **Research Lab 卡**：导师制研究训练 · 中学｜大学。中学段完整经历文献综述、研究设计、数据分析与学术写作，产出研究论文；大学段对接教授与博士后导师进入真实课题，衔接研究生申请准备。**声明：伊萨卡不承诺论文发表；研究项目达到相应水准可协助投稿**
4. **真实产品共创区块**（三折页 CO-CREATION，置页尾）：在伊萨卡，学生是项目的主理人，可加入真实运营的产品与内容团队。QuizR 自适应测评平台 · 自研产品团队 · G10–大学，按方向参与：软件开发 · 产品运营 · 数据训练与分析，积累简历与文书所需的真实产品履历
5. Project Studio 移至项目板块（见 3.2 与 4.7）；本页以"下一步"行回链
6. 二期可拆 `/research/ithaca-dialogue`、`/research/research-lab` 详情页；首期单页承载

### 4.3 `/news` — News & Events（P1）

10-11 决议"新闻板块"。作为媒体矩阵的站内沉淀端（11-02 内容日历：访谈、走进 TMU、研究课题、学生项目、录取成果均拆分复用，官网承接图文版）。结构：

- 置顶 Featured（驱动首页 Featured 栏目）
- 时间倒序列表，四类标签：**Event**（走进 TMU 11-07、滑铁卢 Sedra 参访、Honda 产线参访——Student Highlights 素材迁入）· **Interview**（每位嘉宾一条，与视频号同步发布）· **Program**（Pitch Day、EV 赛季节点、Innovation Day）· **Award**（AIEC 2026 等，与 Results 互链）
- 每条：标题 + 日期 + 1–2 段 + 图/视频嵌入 + 回链项目页

### 4.4 `/programs/engineering-foundations` — 工程启蒙课

替换现 `/programs/engineering-projects`。内容（三折页全文）：

- ENGR 101 Machines & Structures：机械加工与结构力学
- ENGR 201 Rocketry & Aerodynamics：空气动力学与飞行设计
- ENGR 301 Autonomous Systems：电路、机器视觉与自主无人车
- ENGR 302 Aerial Robotics：无人机——飞行控制与航空机器人
- ENGR 303 Engineering Capstone：STEM Racing 全球赛事（原 F1 in Schools）
- 初中｜高中 · **按需成班、无固定开班日期**；定位行：EV 车队直通预备
- 呈现克制：不进首页、不进 Programs 主推位（10-20：低年级暂不主动铺开，机会型承接）

### 4.5 `/academics/sat-act` — SAT / ACT 标化备考

三折页文案：系统化 SAT/ACT 课程，基础与进阶分层教学，涵盖最新 Bluebook™ 数字化全真模考；阶段诊断定位与错题归因分析，针对性高效备考，并按申请时间线规划考试节奏。页脚带 College Board / ACT 商标声明。

### 4.6 `/academics/university-support` — 大学课业辅导

三折页文案：AP 教学体系的大学段延伸——数学、统计、计算机方向课业辅导（多伦多大学、滑铁卢大学为主），自研材料教学，聚焦方法与概念理解；支持期中期末冲刺与全学期长期跟进。"下一步"行 → Project Studio（大学段）、Research Lab（大学段）。

### 4.7 `/programs/project-studio` — Project Studio

11-04 版定稿将 Project Studio 归项目板块（与 10-26 决议一致）。文案（三折页最新版）：个人项目孵化 · 中学 G11–12｜大学。中学段：真实项目孵化，经历真实创业环境，产出 AIF 素材；大学段：作品集与真实项目出口，导师辅导 + 资源对接。时长不上页（新版文案已去 12–16 周标注）。"上一步"行 → AI 创业探索营（Clossette 路径）；"学术衔接"行 → OSSD / AP；大学段与 /academics/university-support 互链。

**明确不上官网的内容**：申请与教育规划服务——仅以成长旅程学术段一行与"下一程 · 大学申请｜研究生准备｜求职之路"收尾句呈现（11-04 版手册口径），不设独立页面、不公布交付与定价（11-02：边界/交付/定价明确前不展开宣传）；求职/实习类服务不设任何页面（"求职之路"仅为旅程叙述）；任何具体价格（维持 by enquiry）；G7–8 体验营/数学强基小组（待 2027 Q1 拍板后再上）。

## 五、全站横切事项

| 事项         | 规则                                                                                                                         | 状态                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 合规声明 ×3  | ① College Board / ACT 商标声明：Academics 各页页脚 ② 投资合规声明：Investment Lab 页及任何提及处 ③ "不承诺发表"：Research 页 | 文案已在三折页定稿，照搬   |
| 成果展示口径 | 录取成果与最终去向分列标注；奖学金核实后展示；优先加美高认知度院校                                                           | 11-02 决议，Results 页执行 |
| 品牌命名     | Ithaca Dialogue 单复数全站统一（三折页用单数，官网现用 Dialogues）；品牌名、英文名、一句话定位随"下一批宣传材料"统一         | 待 Joshua 拍板             |
| 法律主体     | 页脚 © 是否标注 Ithaca Education Inc.                                                                                        | 待品牌口径确认，先不动     |
| 联系方式     | 邮箱 info@ithacateens.com（joshua.wang@ithacafo.com 并列）；微信 Joshua 个人号；电话维持                                     | 10-24 定稿，全站统一替换   |
| 中文版 `/zh` | 与英文页同步改版；目标客群为华人家庭，中文版与英文版同权重交付                                                               | 现中文版未完成             |
| 价格         | 全站不公开价格，Tuition by enquiry；报价在咨询中给出                                                                         | 维持现状                   |

## 六、实施优先级与分期

| 期                                  | 内容                                                                                                                                              | 依赖                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **P0**（本次迭代，落实 10-11 决议） | `/programs` 重建 · AI Investment Lab 新页 · 首页 Programs 区块换四旗舰 + 旅程条 + Academics 区块上线 · Admissions 表单与开班卡更新 · 全站邮箱统一 | 无外部依赖，文案齐备，可直接开工                            |
| **P1**                              | `/news` 新页（首批内容：走进 TMU、AIEC、已剪访谈）· Results 扩充往届去向区块 · `/academics` 两条新轨（SAT·ACT、大学课业）· Dialogue 命名统一      | 学员故事需家庭授权；访谈视频随剪辑进度                      |
| **P2**                              | `/research` 板块页 + 主导航调整 · 工程启蒙课、Project Studio 页 · About 重写替换 · 中文版 `/zh` 全量同步                                          | About 等 Joshua 初稿；导航调整与 /research 同步上线避免空链 |
| **暂缓**                            | 页脚法律主体标注 · G7–8 入口产品 · 申请规划服务                                                                                                   | 分别待品牌口径、2027 Q1 拍板、服务边界定义                  |

**风险提示（内部）**

- 导航从 7 项学校式改为板块式动静较大，若 Joshua 倾向渐进，可先保留现导航、仅做 P0 页面级修改，/research 与 /news 先挂 Programs 下与页脚，二期再升一级导航。
- 首批学员故事与去向清单发布依赖授权与核实（奖学金、录取 vs 入读），上线节奏以授权完成为准，不等全量、够 2–3 条即先上。
- 三折页与官网共用文案后，任何产品口径变更需同时改两处，建议以中英文案库 artifact 为唯一事实源。

**Sources**

- 会议纪要：26-10-11 / 26-10-20 / 26-10-26 / 26-11-02（本地 Meetings 文件夹）
- [三折页产品手册（Canva · 11-04 附件 PDF 为最新口径）](https://www.canva.com/design/DAHZKkSYMAg/ot0F3teiSZZuuvqtRU8qgw/edit) · [Figma 产品讨论板 G7–大学](https://www.figma.com/board/HfNeDJ7Q4mA9OuXSREv7Tw)
- 官网现状核查（2026-11-02）：[首页](https://ithacateens.com/) · [/programs](https://ithacateens.com/programs) · [/academics](https://ithacateens.com/academics) · [/admissions](https://ithacateens.com/admissions) · [/success-stories](https://ithacateens.com/success-stories)
- [中英产品文案库](https://claude.ai/artifact/VLGbJMvhDMUYBvJ396CVg4)
