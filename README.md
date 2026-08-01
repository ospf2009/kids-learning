# 学习乐园 🌟

儿童学习乐园 — 前端学习平台，支持一年级/二年级语文、数学、英语。

## 技术栈

- 前端：Vue 3 + Vite + TypeScript + vue-router + Pinia
- 后端：Node + Express + sql.js（纯 JS SQLite，免编译，端口 7777）
- 部署：PowerShell 脚本（FTP 上传 + GitHub 同步）

## 本地开发

```bash
npm install
npm run dev
```

## 部署

项目根目录提供两个部署脚本，**脚本会自动以自身所在目录为项目根**，无需关心具体路径。

### 前端部署（构建 + 上传 + 同步 GitHub）

```powershell
powershell -File deploy.ps1
```

该命令会自动完成：
1. `npm run build` 构建前端到 `dist/`
2. 通过 FTP 上传 `dist/` 到服务器（`47.95.213.150`，前端访问地址 `http://47.95.213.150:9999`）
3. `git push` 源码到 GitHub `main` 分支
4. `force push` `dist/` 到 `gh-pages` 分支（GitHub Pages）

### 后端部署（仅上传 API）

```powershell
powershell -File upload_api.ps1
```

把 `server/` 目录上传到服务器 `api/` 子目录。改了 `server/server.js` 后需手动重启服务器上的 Node 进程。

### 部署前准备

- 本机已 `npm install`
- 本机已配置 GitHub SSH key（否则 git push 会失败）
- 详细流程见 `DEPLOY.md`

## 线上地址

- 前端（FTP）：`http://47.95.213.150:9999`
- 后端 API：`http://47.95.213.150:7777`（健康检查 `/api/health`）
- GitHub Pages：`https://ospf2009.github.io/kids-learning/`

> CDN 缓存最长 10 分钟，部署后未立即生效请稍候刷新。
