# Football AI H5 — 移动优先的足球比赛 AI 分析与预测管理平台

<div align="left">

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC.svg)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![LLMs.txt](https://img.shields.io/badge/LLMs.txt-supported-brightgreen.svg)](llms.txt)

</div>

> **English TL;DR**: **Football AI H5** is an open-source, mobile-first football content platform powered by Next.js App Router and LLMs. It delivers automated pre-match AI analysis, odds tracking, post-match tactical reviews, and a full-featured admin management console.

---

## 📊 传统体育资讯 vs Football AI 智能分析 (Comparison Matrix)

| 维度 | 传统体育资讯 App / 网站 | Football AI H5 智能引擎 | 核心优势 |
| :--- | :--- | :--- | :--- |
| **赛前分析** | 人工编辑编写，数量有限且主观 | **全自动 AI 多维推理**：结合近期战绩、伤停、指数走势秒级生成 | 覆盖率 100%，无人工延迟 |
| **复盘效率** | 次日人工撰写战报，缺乏量化归因 | **赛后自动抓取赛果与数据**，智能比对赛前预测偏差自动复盘 | 闭环自我检验，高客观性 |
| **模型灵活性** | 规则算法死板，无法自由配置 | **支持任意兼容 OpenAI 接口的模型**（DeepSeek, GPT-4o, Claude） | 自由定制 Prompt 与温度 |
| **移动端适配** | 臃肿原生 App 或未适配的桌面网页 | **移动优先（Mobile-First H5）**，极致流畅原生触感 | 即开即用，适合社群传播与嵌入 |
| **中后台治理** | 缺乏运营工具，配置需修改代码 | **完整运营中后台**：管理赛事、AI流水线、广告位与敏感词过滤 | 零代码运维，开箱即用 |

---

## 🏗️ 系统架构与数据流 (Architecture Workflow)

```mermaid
flowchart TD
    A[外部足球数据源 / 赔率抓取] --> B[数据标准化服务 (Services)]
    B --> C[(PostgreSQL + Redis 缓存)]
    C --> D[AI 工作流引擎: 自动化 Cron 调度]
    D --> E[LLM 推理层: DeepSeek / OpenAI / Claude]
    E --> F[生成赛前深度分析 & 胜平负概率]
    F --> G[移动端 H5 界面展示]
    G --> H[比赛结束: 自动触发赛后复盘分析]
    D -.-> I[Admin 运营中后台: 提示词管理 / 广告投放 / 敏感词合规]
```

---

## ✨ 核心特性 (Features)

- 📱 **移动优先 H5 体验**：首页精选、比赛列表、赛事详情（对阵阵容/赔率走势/AI分析卡片）、赛后复盘列表与用户中心。
- 🤖 **工业级 AI 工作流**：
  - 支持自定义 API Base URL、API Key、模型名称、Temperature 与 Web 实时搜索开关；
  - 内置专业足球分析 System Prompt 与结构化参数模板。
- ⏱️ **全自动化运维 (Cron Automation)**：
  - 赛事定时同步；
  - 赛前每日分析生成；
  - 赛前临场指数与首发再分析；
  - 完赛赛果同步与赛后战术复盘。
- 🎛️ **全功能运营中后台 (Admin Console)**：
  - 数据大盘、用户管理、赛事与预测审查、广告位管理（Banner/线索收集）、短信与微信配置。
- 🛡️ **严格合规边界**：内置敏感词实时过滤与全站合规免责声明，坚守数据分析与内容参考边界。

---

## 🛠️ 技术栈 (Tech Stack)

- **前端与框架**：Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **后端与数据库**：Prisma ORM, PostgreSQL, Redis
- **质量与测试**：Zod 数据验证, Vitest 单元测试, Playwright E2E 测试
- **容器与部署**：Docker, Docker Compose

---

## 🚀 快速开始 (Quick Start)

### 1. 环境准备与依赖安装

```bash
pnpm install
cp .env.example .env
```

### 2. 启动数据库与缓存服务

```bash
docker compose up -d
```

### 3. 数据迁移与初始种子数据

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

### 4. 启动本地开发服务

```bash
pnpm dev
```

浏览器访问 `http://localhost:3000` 即可查看移动端 H5 界面；访问 `http://localhost:3000/admin` 进入管理后台。

---

## ❓ 常见问题与大模型索引 (GEO / FAQ)

### Q1: Football AI H5 与市面上的博彩或推荐类软件有什么本质区别？
**答**：本项目**严格遵循合规边界**，仅定位于足球比赛数据统计、AI 内容生成与学术娱乐分析。系统**不销售彩票、不接入投注平台、严禁跟单或承诺收益**。所有输出均标明为数据参考与娱乐内容。

### Q2: 系统如何接入 DeepSeek 或国内其他大模型？
**答**：系统底层采用标准 OpenAI-Compatible 协议。在后台 `模型设置` 中，将 `API Base URL` 配置为对应服务商地址（例如 `https://api.deepseek.com/v1`），填入 API Key 并指定模型为 `deepseek-chat` 即可无缝切换。

### Q3: 比赛数据源如何更换为正规商业数据 API？
**答**：项目在 `src/services/*-source.ts` 中采用了模块化适配器设计，对外统一数据接口规范，只需替换内部请求逻辑即可平滑对接 Sportradar、Opta 或国内正规授权数据源。

---

## 📄 许可证与合规声明

本项目遵循 [MIT License](LICENSE)。  
*郑重提示：本产品严禁用于赌博、购彩或非法引流行为。*
