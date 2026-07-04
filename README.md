# 学习乐园 🌟

儿童学习乐园 — 前端学习平台，支持一年级/二年级语文、数学、英语。

## 部署

每次改完功能，在项目根目录运行：

```bash
powershell -File deploy.ps1
```

这条命令会自动：
1. `npm run build` 构建
2. `git init + push -f` 推送到 gh-pages 分支
3. 清理临时 git 文件

**部署信息：**
- 仓库：`git@github.com:ospf2009/kids-learning.git` (SSH)
- 分支：`gh-pages`
- Pages 设置：Deploy from branch → gh-pages → / (root)
- 线上地址：https://ospf2009.github.io/kids-learning/
- CDN 缓存：最长 10 分钟，通常 1-2 分钟生效
- 推送后如果看到旧版本，等 2 分钟刷新浏览器即可
