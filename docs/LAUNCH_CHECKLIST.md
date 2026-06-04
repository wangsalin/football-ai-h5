# 上线检查清单

## 必须完成

- [x] Docker/PostgreSQL 可用。
- [x] `pnpm prisma:migrate` 通过。
- [x] `pnpm prisma:seed` 通过。
- [x] 登录、用户、验证码、Session 切到 Prisma。
- [x] 收藏比赛、开赛提醒接 Prisma mutation。
- [x] 管理后台只读列表切到 Prisma。
- [x] 赛事创建/编辑接 Prisma mutation。
- [x] 赛事创建/编辑写入 `audit_logs`。
- [x] 预测创建/编辑接 Prisma mutation。
- [x] 预测创建/编辑写入 `audit_logs`。
- [x] 复盘创建/编辑接 Prisma mutation。
- [x] 复盘创建/编辑写入 `audit_logs`。
- [x] 预测发布/下架接 Prisma mutation。
- [x] 预测发布/下架写入 `audit_logs`。
- [x] 复盘发布/下架接 Prisma mutation。
- [x] 复盘发布/下架写入 `audit_logs`。
- [x] 广告素材审核流程跑通。
- [x] 广告审核写入 `audit_logs`。
- [x] 其他后台写操作接 Prisma mutation。
- [x] 其他后台写操作写入 `audit_logs`。
- [x] 广告事件写入 `ad_events`。
- [x] 线索表单写入 `lead_forms`。
- [x] 生产环境关闭 `MOCK_SMS`。
- [x] 生产环境确认 `JWT_SECRET` 已替换。
- [ ] 生产环境配置 `REDIS_URL`，验证码、登录、广告事件和线索提交限流可用。
- [ ] 生产环境配置 `CRON_SECRET`，并让计划任务调用自动同步、自动预测和自动复盘接口。
- [ ] 生产环境按 `docs/DEPLOYMENT.md` 配置 systemd、Nginx、HTTPS 和 cron。
- [x] Cookie 开启 `Secure`。
- [ ] HTTPS 可用。
- [x] 管理员账号使用账号密码登录，并与用户端手机号验证码登录分离。
- [x] 免责声明关键页面可见。
- [x] 敏感词检测覆盖预测、复盘、广告文案。

## 验证命令

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm prisma validate
pnpm prisma:migrate
pnpm prisma:seed
```

## 合规检查

- [x] 不出现“必中、稳赚、包红、回本、带单、跟单、倍投、回血”等承诺性文案。
- [x] 不提供彩票购买入口。
- [x] 不接入博彩平台。
- [x] 广告均显示“广告”标识。
- [x] 比赛详情、复盘、分享海报显示免责声明。

## 生产建议

- Web：Next.js。
- DB：托管 PostgreSQL。
- Redis：用于验证码限流、广告曝光去重、提醒队列。
- 存储：对象存储，用于广告图片和海报。
- 日志：平台日志 + 错误监控。
