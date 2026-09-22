# Slice · Interactive Content Platform

可运行的纯前端原型，无需安装依赖。直接打开 `dist/index.html`，或在本目录运行 `python3 -m http.server 4173 --directory dist` 后访问 http://localhost:4173。

包含六种分类、可筛选 Feed、Featured 引力实验、Trending、六种 Interactive Slice、沉浸式 Open、Like、Share 深链接、Remix 调色及节奏调整。桌面双列卡片与侧栏，移动端单列 Feed。

演示范围：作品、作者、热度均为演示数据；点赞、选择、改编为当前页面内状态，无账号或服务器保存。轨道为视觉交互模型，不是精确物理模拟。分享在浏览器允许时复制链接，离线文件链接不能用于公开分享。字体无法联网时自动使用系统字体。

新增发布入口：填写作品信息、选择互动模板、实时预览、保存本机草稿、发布到本机首页。作品通过 localStorage 保存在当前浏览器，暂未接入跨用户发布或自定义代码上传。

上传与轻创作：发布窗口支持图片 + 点击揭晓、单个自包含 HTML 文件（隔离运行、禁止联网）、模板创作。图片最大 2 MB，HTML 最大 300 KB。支持拖放、文件选择、草稿、即时预览；文件仅在浏览器内读取保存。dist/sample-interactive.html 可作为上传样例。

完整作品交付与 Library：城市税率切片示例、网页/下载/桌面 App/外部平台四种交付方式、发布表单中的真实 HTTPS 链接配置、收藏/移除/过滤的本机 Library。示例游戏没有实际安装包，桌面 App 尚未接入，收藏不代表安装或购买，账号与跨设备同步待接入。

生活帖子：新增散步心情选择、晚饭步骤清单两篇虚构日常分享，归入 Fun & Social，支持全文、点赞、收藏。散步配图为 Maxim Tolchinskiy / Unsplash，来源 https://unsplash.com/pt-br/fotografias/m7pisy5t6Ak 。

文档转 Slice：描述生成支持 .docx、UTF-8 TXT/Markdown、文字版 PDF。8 MB 上限；PDF 前 60 页；提取文本最多 60,000 字符。文件在浏览器内解析，生成可提问并引用原文的本地检索 Slice，不是 AI 推理。扫描 PDF 需先 OCR，旧版 .doc 需另存为 .docx。首页提供 Luma One 虚构产品说明书示例。
