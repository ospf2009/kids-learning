# kids-learning 部署指南

## 系统架构（2026-07-08 更新）

```
src/views/practice/          ← 核心练习页面
  SubjectPractice.vue        ← 选择科目→显示章节列表（读 chapters.ts）
  ChapterPractice.vue        ← 进入章节→做题（读 chapters.ts + questionGenerator.ts）

src/data/
  chapters.ts               ← 唯一数据源！所有学科的题目都在这里
  grades.ts                 ← 年级列表
  rewards.ts                ← 奖励系统数据

src/utils/
  api.ts                    ← 与后端 API 通信（端口 7777）
  questionGenerator.ts      ← 动态生成数学题（自动出计算题）
  db.ts                     ← 工具函数
  sound.ts                  ← 音效

src/router/index.ts         ← 路由定义（Hash 模式）
  /practice/:subject        ← 选择科目
  /practice/:subject/:chapterId ← 做题
  /login /register          ← 登录注册
  /rewards                  ← 奖励
  /games                    ← 游戏
```

## 部署步骤（标准化流程，严格执行）

### 修改前的检查清单

1. 确认要修改哪个文件
   - **加学科/年级/章节/题目** → 只改 `src/data/chapters.ts`
   - **加路由** → 改 `src/router/index.ts`
   - **改页面布局** → 改 `src/views/practice/*.vue`
2. ✅ 确认没改 `math.ts` / `chinese.ts` / `english.ts`（这些已删除，是死代码）
3. ✅ 确认没改 `views/math/` / `views/chinese/` / `views/english/`（已删除，是死代码）

### 部署执行

```powershell
# 一键部署（构建 → FTP上传 → GitHub main → GitHub Pages）
powershell -File deploy.ps1
```

### deploy.ps1 自动完成的操作（4 步）

1. **`npm run build`** → 构建前端到 `dist/`
2. **FTP 上传** → 上传 `dist/` 全部文件到 `47.95.213.150:21`（用户 kids）
3. **GitHub main** → `git add && git commit && git push`，推送源代码到 main 分支
4. **GitHub Pages** → 从 `dist/` 复制到临时目录，加 `.nojekyll`，force push 到 `gh-pages` 分支

### 注意点

- 如果本次只改了前端数据/代码，跑 `deploy.ps1` 就够了
- 如果同时也改了后端 API 代码，需额外跑 `upload_api.ps1` 上传 `server/` 目录到 FTP 的 api 子目录
- CDN 缓存最长 10 分钟，部署后没立即生效请等一会儿刷新

### 部署后验证

| 目标 | 地址 |
|------|------|
| FTP 服务器 | `http://47.95.213.150:9999` |
| GitHub Pages | `https://ospf2009.github.io/kids-learning/` |
| 后端 API | `http://47.95.213.150:7777` |

---

---

## 重要历史教训（别踩坑）

### 数据源问题
- ✅ 数据源是 `chapters.ts`，不是 `math.ts`！
- ✅ `chapters.ts` 用 `Chapter[]` 结构（含 `id/title/icon/description/questions`）
- ❌ 之前错误地在 `math.ts` 里加了二年级数据——那是旧游戏模式的死代码，前端根本不读
- ❌ 之前不知道 `chapters.ts` 才是数据源，白费了一轮功夫

### 部署历史问题
- ❌ GitHub Pages 白屏：Vite 生成的 `_` 开头的文件被 Jekyll 忽略
- ✅ 修复：`deploy.ps1` 自动加 `.nojekyll` + 重命名 `_*` → `x-*`
- ❌ UTF-8 编码问题：`Set-Content -NoNewline` 在 Windows PowerShell 下用 ANSI 编码
- ✅ 修复：改用 `[System.IO.File]::WriteAllText` + UTF8 without BOM
- ✅ SSH 推送比 HTTPS 更稳定
