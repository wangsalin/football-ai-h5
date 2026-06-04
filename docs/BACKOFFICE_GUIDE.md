# 后台操作说明

## 登录账号

管理后台入口 `/admin` 使用账号密码登录；广告主后台仍使用手机号验证码登录，开发环境验证码统一为 `123456`。

| 角色 | 登录方式 | 可访问 |
|---|---|---|
| 分析师 | analyst / analyst123456 | 赛事、预测、复盘 |
| 管理员 | admin / admin123456 | 管理后台全部基础页 |
| 超级管理员 | superadmin / superadmin123456 | 预留系统配置 |
| 广告主 | 13800000002 / 123456 | 广告主后台 |

## 管理后台

入口：`/admin`

当前页面：

- `/admin`：运营概览，查看比赛、待审核预测、用户和广告数据。
- `/admin/users`：用户列表、角色、状态、最近登录、角色调整、启用/禁用。
- `/admin/matches`：赛事列表、联赛、时间、状态、来源。
- `/admin/predictions`：预测列表、状态流、AI 生成草稿并保存为预测草稿。
- `/admin/reviews`：复盘创建/编辑、复盘列表、赛果、命中/偏差、错因、发布/下架。
- `/admin/ads`：广告计划/素材创建编辑、素材审核底线、审核通过/拒绝。
- `/admin/settings`：模型、Prompt、赛事数据源和同步策略。

当前管理后台只读数据优先读取 Prisma：概览统计、用户列表、赛事列表、预测列表、复盘列表和广告计划均来自数据库，异常时回退 mock。用户角色/状态、赛事创建/编辑/批量导入、预测创建/编辑/发布/下架、复盘创建/编辑/发布/下架、广告计划/素材创建编辑、广告审核、模型/Prompt 设置、赛事数据源设置都会写入 Prisma 和 `AuditLog`。

## AI 草稿

路径：`/admin/predictions`

操作：

1. 使用分析师或管理员账号登录。
2. 进入预测管理。
3. 点击 `AI 生成草稿`。
4. 系统调用 `/api/admin/predictions/generate-draft`。
5. 返回结构化草稿，状态为 `DRAFT`。

规则：

- 生成草稿后可人工保存为预测草稿。
- 不自动发布。
- 输出必须通过 zod schema。
- 命中敏感词时返回 `SENSITIVE_WORD_DETECTED`。
- 默认使用 `MOCK_LLM=true`。
- 模型、provider、API 地址、API Key、temperature、是否启用 OpenAI web_search、system prompt、user prompt 模板在 `/admin/settings` 中维护。

## 赛事数据源

路径：`/admin/settings`

- 模型设置：默认 mock，可切换 OpenAI。OpenAI 需要填写 API 地址、API Key 和模型名；启用联网检索时会在 Responses API 中挂载 `web_search` 工具。
- 赛事数据源：支持手动录入/批量导入、外部赛事 API、OpenAI 联网检索三种配置。生产数据建议优先使用稳定赛事 API，OpenAI 联网检索用于补充校验或低频导入。

- 默认支持手动录入和 JSON 批量导入。
- 可配置外部 API 地址、同步开关和同步计划。
- 实际自动同步需要生产部署环境的计划任务配合；本地管理端已保存配置，并提供批量导入和“立即同步赛事”入口。
- 生产定时任务可调用：
  - `POST /api/admin/jobs/sync-matches`
  - `POST /api/admin/jobs/auto-predictions`
  - `POST /api/admin/jobs/prematch-reanalysis`
  - `POST /api/admin/jobs/auto-reviews`
- 服务器 cron 调用时需要携带 `Authorization: Bearer <CRON_SECRET>` 或 `x-cron-secret: <CRON_SECRET>`。

## 广告主后台

入口：`/advertiser`

广告主可查看：

- 总曝光。
- 总点击。
- 点击率。
- 线索数。
- 广告计划。
- 素材状态。
- 线索列表。

当前广告主后台优先读取 Prisma：广告计划来自 `AdCampaign`，曝光/点击来自 `AdEvent` 聚合，线索来自 `LeadForm`。

## 当前 mock 限制

当前后台主要写操作已接入 Prisma 和 `AuditLog`。后续剩余项主要是部署层强认证策略、HTTPS、以及更细的业务边界测试。
