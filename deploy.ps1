$ErrorActionPreference = "Continue"

$projectDir = "C:\Users\Yoodao\.openclaw\workspace-senior-dev\kids-learning"
$ftpHost = "47.95.213.150"
$ftpPort = 21
$ftpUser = "kids"
$ftpPass = "2ABepXASCEHjyxNh"

Write-Host "=== Deploy kids-learning ==="

# Step 1: Build
Write-Host "[1/3] Building frontend..."
Set-Location $projectDir
npm run build 2>&1 | ForEach-Object { Write-Host "  $_" }
if ($LASTEXITCODE -ne 0) {
    Write-Host "  BUILD FAILED - Abort" -ForegroundColor Red
    exit 1
}
Write-Host "  DONE" -ForegroundColor Green

# Step 2: FTP upload
Write-Host "[2/3] Uploading dist to server..."
$distFiles = Get-ChildItem "$projectDir\dist" -Recurse -File
$countOk = 0; $countFail = 0; $countTotal = $distFiles.Count

foreach ($file in $distFiles) {
    $relativePath = $file.FullName.Substring("$projectDir\dist".Length).TrimStart('\').Replace('\', '/')
    try {
        # Create parent dirs
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

# Step 3: Git commit + push
Write-Host "[3/3] Committing and pushing to GitHub..."
Set-Location $projectDir
git add -A 2>&1 | ForEach-Object { Write-Host "  $_" }

$today = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "deploy: $today" 2>&1 | ForEach-Object { Write-Host "  $_" }
$commitCode = $LASTEXITCODE

git push 2>&1 | ForEach-Object { Write-Host "  $_" }
$pushCode = $LASTEXITCODE

$hasChanges = (git status --porcelain).Length -gt 0
if ($commitCode -eq 0 -or !$hasChanges) {
    Write-Host "  GitHub sync DONE" -ForegroundColor Green
} else {
    Write-Host "  GitHub sync may have issues, check output above" -ForegroundColor Yellow
}

Write-Host "=== Deploy complete! ==="
Write-Host "API:  http://47.95.213.150:7777"
Write-Host "Web:  http://47.95.213.150:9999"
