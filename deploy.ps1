# deploy.ps1 - 一键构建并部署 kids-learning 到 GitHub Pages
# 用法: cd kids-learning && powershell -File deploy.ps1
#
# ⚠️ 注意事项（防止再次白屏）:
# 1. GitHub Pages 忽略 _ 开头的文件 → 脚本自动重命名为 x- 前缀
# 2. 必须在 dist 目录添加 .nojekyll 文件
# 3. 构建后必须替换所有 HTML/JS/CSS 中的旧文件名引用
# 4. deploy.ps1 必须在项目根目录运行
# 5. 确保 SSH key 可用 (git@github.com:ospf2009/kids-learning.git)
# 6. 推送到 gh-pages 分支时用 master:gh-pages 格式
# 7. CDN 有 ~1-2 分钟缓存，刚推送完看不到最新版是正常的
# 8. \`Set-Content -NoNewline\` 默认 ANSI 编码会损坏中文和 emoji → 改用 UTF8 WriteAllText
# 9. emoji 在 GitHub Pages 部分 CDN 节点编码兼容性差 → 已全部替换为稳定 Unicode/文字符号
#
# ❌ 以前的错误：
# - 只在 index.html 里改路径，没改 JS/CSS 里的内部引用 → 动态 import 404 → 白屏
# - 只手动改了主 JS，没改其他 chunk 里的引用 → 运行时报错 → 白屏
# - 之前 deploy.ps1 的替换逻辑有 bug（文件名变量名冲突）
#
# ✅ 正确方案：
# - 构建后自动重命名所有 _ 开头文件 + 替换全目录引用
# - 一次 push 搞定所有

$ErrorActionPreference = "Stop"
$P = $PSScriptRoot
$D = Join-Path $P "dist"
$A = Join-Path $D "assets"
$R = "git@github.com:ospf2009/kids-learning.git"

Write-Host "=== Build ==="
Set-Location $P
npm run build

Write-Host "=== Fix _prefix ==="
# 查找 assets 中 _ 开头的文件
$ufiles = Get-ChildItem $A | Where-Object { $_.Name.StartsWith('_') }
foreach ($fi in $ufiles) {
  $f = $fi.Name
  $nn = $f -replace '^_', 'x-'
  Write-Host "  $f -> $nn"
  Rename-Item $fi.FullName (Join-Path $A $nn)
  # 替换所有 HTML/JS/CSS 中的引用（转义正则特殊字符）
  $pattern = [regex]::Escape($f)
  # ⚠️ 必须用 UTF-8 读取，否则 Get-Content 默认用 ANSI(GBK) 读取会损坏中文！
  Get-ChildItem $D -Recurse -Include '*.html','*.js','*.css' | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.UTF8Encoding]::new($false))
    $content = $content -replace $pattern, $nn
    # 使用 UTF8 without BOM 写入，避免乱码
    [System.IO.File]::WriteAllText($_.FullName, $content, [System.Text.UTF8Encoding]::new($false))
  }
}

[System.IO.File]::WriteAllText((Join-Path $D '.nojekyll'), '', [System.Text.UTF8Encoding]::new($false))

Write-Host "=== Fix crossorigin ==="
# 移除 index.html 中的 crossorigin 属性（兼容微信等老浏览器）
$htmlPath = Join-Path $D 'index.html'
$htmlContent = [System.IO.File]::ReadAllText($htmlPath, [System.Text.UTF8Encoding]::new($false))
$htmlContent = $htmlContent -replace ' crossorigin=""| crossorigin', ''
[System.IO.File]::WriteAllText($htmlPath, $htmlContent, [System.Text.UTF8Encoding]::new($false))

Write-Host "=== Push ==="
Remove-Item -Recurse -Force (Join-Path $D ".git") -EA 0
Set-Location $D
git init -q
git add -A
git commit -q -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git remote add origin $R 2>$null
if ($LASTEXITCODE -ne 0) { git remote set-url origin $R }
git push -f origin master:gh-pages 2>&1

Remove-Item -Recurse -Force (Join-Path $D ".git") -EA 0
Set-Location $P

Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "https://ospf2009.github.io/kids-learning/" -ForegroundColor Cyan
Write-Host "Wait 1-2 min for CDN cache" -ForegroundColor Yellow
