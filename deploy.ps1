$ErrorActionPreference = "Continue"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ftpHost = "47.95.213.150"
$ftpPort = 21
$ftpUser = "kids"
$ftpPass = "2ABepXASCEHjyxNh"
$githubRemote = "git@github.com:ospf2009/kids-learning.git"
$today = Get-Date -Format "yyyy-MM-dd HH:mm"

Write-Host "=== Deploy kids-learning ==="

# Step 1: Build
Write-Host "[1/4] Building frontend..."
Set-Location $projectDir
npm run build 2>&1 | ForEach-Object { Write-Host "  $_" }
if ($LASTEXITCODE -ne 0) {
    Write-Host "  BUILD FAILED - Abort" -ForegroundColor Red
    exit 1
}
Write-Host "  DONE" -ForegroundColor Green

# Step 2: FTP upload (前端 dist → FTP 根目录)
Write-Host "[2/4] Uploading dist to server (FTP)..."
$distFiles = Get-ChildItem "$projectDir\dist" -Recurse -File
$countOk = 0; $countFail = 0; $countTotal = $distFiles.Count

foreach ($file in $distFiles) {
    $relativePath = $file.FullName.Substring("$projectDir\dist".Length).TrimStart('\').Replace('\', '/')
    try {
        $dirPath = [System.IO.Path]::GetDirectoryName($relativePath)
        if (![string]::IsNullOrEmpty($dirPath)) {
            $parts = $dirPath.Split('/')
            $cur = ""
            foreach ($p in $parts) {
                $cur += "/$p"
                try {
                    $mk = [System.Net.FtpWebRequest]::Create("ftp://${ftpHost}:${ftpPort}${cur}")
                    $mk.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                    $mk.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                    $mk.Timeout = 5000
                    $mr = $mk.GetResponse(); $mr.Close()
                } catch { }
            }
        }

        $url = "ftp://${ftpHost}:${ftpPort}/${relativePath}"
        $req = [System.Net.FtpWebRequest]::Create($url)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UseBinary = $true; $req.Timeout = 30000
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $req.ContentLength = $bytes.Length
        $s = $req.GetRequestStream(); $s.Write($bytes,0,$bytes.Length); $s.Close()
        $r = $req.GetResponse(); $r.Close()
        $countOk++
    } catch {
        $countFail++
        Write-Host "  FAIL $relativePath - $_"
    }
}

Write-Host "  Uploaded: $countOk/$countTotal OK, $countFail FAIL" -ForegroundColor Green

# Step 3: Git commit + push (main 分支 - 代码)
Write-Host "[3/4] Committing and pushing to GitHub (main)..."
Set-Location $projectDir
git add -A 2>&1 | ForEach-Object { Write-Host "  $_" }

git commit -m "deploy: $today" 2>&1 | ForEach-Object { Write-Host "  $_" }
$commitCode = $LASTEXITCODE

git push origin main 2>&1 | ForEach-Object { Write-Host "  $_" }
$pushCode = $LASTEXITCODE

$hasChanges = (git status --porcelain).Length -gt 0
if ($commitCode -eq 0 -or !$hasChanges) {
    Write-Host "  main branch sync DONE" -ForegroundColor Green
} else {
    Write-Host "  main branch sync may have issues, check output above" -ForegroundColor Yellow
}

# Step 4: Push dist to gh-pages (GitHub Pages 部署)
Write-Host "[4/4] Pushing dist to gh-pages (GitHub Pages)..."
$tempDir = "$env:TEMP\kids-deploy-gh-pages"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# 复制构建产物
Copy-Item "$projectDir\dist\*" -Destination $tempDir -Recurse -Force

# .nojekyll 防止 Jekyll 忽略 _ 前缀文件
"" | Out-File "$tempDir\.nojekyll" -Encoding ASCII

Set-Location $tempDir
git init -q
git remote add origin $githubRemote
git checkout -b gh-pages 2>&1 | Out-Null
git add -A 2>&1 | Out-Null
git commit -m "deploy gh-pages: $today" 2>&1 | Out-Null
git push -f origin gh-pages 2>&1 | ForEach-Object { Write-Host "  $_" }
if ($LASTEXITCODE -eq 0) {
    Write-Host "  gh-pages sync DONE" -ForegroundColor Green
} else {
    Write-Host "  gh-pages sync may have issues, check output above" -ForegroundColor Yellow
}

# 清理临时目录
Set-Location $projectDir
Remove-Item -Recurse -Force $tempDir

Write-Host "=== Deploy complete! ==="
Write-Host "API:  http://47.95.213.150:7777"
Write-Host "Web:  http://47.95.213.150:9999"
Write-Host "GitHub Pages: https://ospf2009.github.io/kids-learning/"
