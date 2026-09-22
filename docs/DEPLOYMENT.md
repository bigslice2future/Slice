# 首次部署：Vercel

此配置仅准备部署，不表示项目已经上线。当前没有数据库或环境变量依赖。

1. 在 GitHub 审阅并合并初始化 PR。
2. 登录 https://vercel.com/new ，连接 GitHub 并导入 `bigslice2future/Slice`。
3. Root Directory 保持仓库根目录，Framework Preset 选择 Other。仓库配置指定 Output Directory 为 `dist`，Build Command 为空（无需构建）。
4. 点击 Deploy，记录生成的访问地址。生产分支使用 `main`。
5. 在电脑与手机验收：首页、分类、引力滑块、作品打开/关闭、分享链接、收藏、发布本机作品、刷新后的本机保存、示例 HTML 上传、文档导入。
6. 在另一浏览器打开链接验证访问；本机发布的作品不会出现在另一浏览器，这是此阶段的已知限制。

后续 PR 可使用 Vercel 预览部署进行验收。若新版本异常，在 Vercel 部署记录中选择此前成功版本回滚，并在 GitHub 修复对应变更。

上线真实账号前：接入 Supabase Auth、作品与收藏数据、按用户限制写入的 RLS 策略，并验证用户之间不能修改对方的数据。上传 HTML 继续独立沙箱运行，不可与登录主站共享权限；服务端密钥不得放入 `dist/` 或 GitHub。

官方参考：https://vercel.com/docs/project-configuration 、https://vercel.com/docs/builds/configure-a-build
