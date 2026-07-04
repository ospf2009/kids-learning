# 部署说明

## 标准部署流程（每次更新后执行）

```bash
# 1. 构建
cd C:\Users\Yoodao\.openclaw\workspace-senior-dev\kids-learning
npm run build

# 2. 推送 dist 到 gh-pages 分支
cd dist
git init
git add -A
git commit -m "deploy: $(date)"
git remote add origin git@github.com:ospf2009/kids-learning.git
git push -f origin master:gh-pages

# 注意：GitHub Pages CDN 缓存最长10分钟，推送后等1-2分钟即可刷新查看
```

## 要点
- **仓库**: `git@github.com:ospf2009/kids-learning.git` (SSH 方式，不是 HTTPS)
- **分支**: `gh-pages`
- **Pages 设置**: Deploy from branch → gh-pages 分支 → / (root)
- **每次部署前执行** `npm run build` 确保构建产物最新
- **每次从 dist 目录重新 git init + push -f**（不要在旧 git repo 上直接 push）

---

## 本次修复内容 (2026-06-16)

### 问题定位
路由引用缺失的新视图文件导致构建失败，具体缺失文件:
1. `src/views/auth/LoginView.vue` - 登录页
2. `src/views/auth/RegisterView.vue` - 注册页  
3. `src/views/practice/SubjectPractice.vue` - 科目练习列表
4. `src/views/practice/ChapterPractice.vue` - 章节练习答题
5. `src/views/wrongbook/WrongBookView.vue` - 错题本
6. `src/views/challenge/DailyChallengeView.vue` - 每日挑战
7. `src/views/profile/ProfileView.vue` - 个人中心
8. `src/stores/progress.ts` - 学习进度 store

### 额外修复
- grades.ts: 添加 `getGradeName()` 导出
- router: 旧路径 /subject/:subject 添加重定向到 /practice/:subject
- router: 登录页面支持 redirect 参数
- ProfileView: 使用正确的 authStore API (updateGrade 替代 setGrade)
- 所有新视图: 适配真实的 API 和 IndexedDB 存储

### 部署问题修复
- 仓库 origin 改为 `git@github.com:ospf2009/kids-learning.git` (SSH)
- GitHub Pages CDN 缓存需要 1-10 分钟传播，推完后耐心等待即可
