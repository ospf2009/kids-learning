# kids-learning 部署指南

## 系统架构

```
前端：Vue 3 + Vite + TypeScript + vue-router + Pinia   →  src/
后端：Node + Express + sql.js（纯 JS SQLite，免编译）    →  server/server.js（端口 7777）
部署：deploy.ps1（前端全流程） + upload_api.ps1（后端 FTP）
```

前端构建产物 `dist/` 通过 FTP 上传到服务器根目录；后端 `server/` 通过 FTP 上传到 `api/` 子目录。
源码与 GitHub Pages 分别通过 `deploy.ps1` 的 git 步骤同步。

## 部署脚本说明

所有脚本均**自动取自身所在目录**作为项目根，无需关心项目放在哪台机器、哪个路径。

### 1. 前端部署 `deploy.ps1`（4 步）

```powershell
powershell -File deploy.ps1
```

自动完成：
1. `npm run build` → 构建前端到 `dist/`
2. **FTP 上传** → 上传 `dist/` 全部文件到 `47.95.213.150:21`（用户 kids），前端文件落在 FTP 根目录
3. **GitHub main** → `git add && git commit && git push`，推送源码到 main 分支（需本机配置 GitHub SSH key）
4. **GitHub Pages** → 复制 `dist/` 到临时目录、加 `.nojekyll`、`force push` 到 `gh-pages` 分支

### 2. 后端部署 `upload_api.ps1`

```powershell
powershell -File upload_api.ps1
```

自动把 `server/` 目录（递归，保留目录结构）上传到 FTP 的 `api/` 子目录。

> 注意：FTP 只负责传文件。若改动了 `server/server.js`，**服务器上的 Node 进程需手动重启**（或 pm2 reload）才会生效。

## 修改前检查清单

- 加学科/年级/章节/题目 → 改 `src/data/chapters.ts`
- 加路由 → 改 `src/router/index.ts`
- 改页面布局 → 改 `src/views/**/*.vue`
- 改后端 API → 改 `server/server.js`，然后跑 `upload_api.ps1`

## 部署后验证

| 目标 | 地址 |
|------|------|
| FTP 服务器（前端） | `http://47.95.213.150:9999` |
| 后端 API | `http://47.95.213.150:7777`（健康检查 `/api/health`） |
| GitHub Pages | `https://ospf2009.github.io/kids-learning/` |

- CDN 缓存最长 10 分钟，部署后没立即生效请等一会儿刷新。
- GitHub Pages 的 Jekyll 会忽略 `_` 开头文件，部署脚本已通过加 `.nojekyll` 规避。

## 环境前提

- 本机已 `npm install`（构建用）。
- 本机已生成 GitHub SSH key 并添加到 GitHub 账号（`deploy.ps1` 的 git push 依赖它）。
- FTP 凭据写在两个 `.ps1` 脚本内（明文）。如对安全有要求，可改为从环境变量读取。

## 历史教训（别踩坑）

- 数据源是 `src/data/chapters.ts`，不是已删除的 `math.ts` / `chinese.ts` / `english.ts`（死代码）。
- GitHub Pages 白屏：Jekyll 忽略 `_` 开头文件 → 用 `.nojekyll` 规避。
- SSH 推送比 HTTPS 更稳定；本机无 SSH key 时 `git push` 会报 `Permission denied (publickey)`。
- `replace_icons.mjs` 是一次性图标迁移工具，**勿重复运行**。
