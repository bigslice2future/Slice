# Slice · 思来

Web-first 互动内容平台。当前版本为可运行的前端原型；发现、试玩、发布和 Library 已有本机演示，账号和云端保存尚未接入。

## 本地运行

需要 Python 3，在仓库根目录运行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 http://localhost:4173 。无需安装前端依赖或执行构建。

## 目录

- `dist/`：当前可直接运行的 HTML、CSS、JavaScript 与静态资源，也是当前前端源码。
- `dist/vendor/`：文档解析库及原有许可证。
- `vercel.json`：静态部署配置。
- `docs/TIMELINE.md`：按阶段记录去哪里、做什么、如何验收。
- `docs/DEPLOYMENT.md`：Vercel 首次部署和回滚步骤。
- `docs/PROTOTYPE.md`：原型功能与限制。

## 当前边界

作品与热度包含演示数据；发布、收藏等数据仅保存在当前浏览器或页面中，不会同步到其他用户。文档问答是本地文本检索，不是 AI 服务。当前无后端、真实账号、多人联机或移动/桌面 App。

后续按 Web → Mobile → Desktop 推进；先跑通真实的发布、试玩、分享与收藏闭环。保留现有原型，按功能逐步接入云端。
