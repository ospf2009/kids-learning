<#
.SYNOPSIS
  一键部署后端 API：FTP 上传 server/ 到服务器 api/ 目录，并自动 SSH 重启 node 进程。
.DESCRIPTION
  解决之前「文件传上去了但宝塔没重启导致接口 404」的问题。
  执行：  powershell -ExecutionPolicy Bypass -File deploy_api.ps1 -SshUser root -SshPass "你的密码"
#>
param(
    [string]$LocalDir = "",
    [string]$FtpHost = "47.95.213.150",
    [int]$FtpPort = 21,
    [string]$FtpUser = "kids",
    [string]$FtpPass = "2ABepXASCEHjyxNh",
    [string]$RemoteDir = "api",
    [string]$SshUser = "root",
    [string]$SshPass = "",
    [string]$SshHost = "47.95.213.150",
    [int]$SshPort = 22,
    [string]$Pm2Name = "kids-learning-api",
    [string]$ServerJsPath = "/www/wwwroot/kids-learning/api/server.js"
)

$countSuccess = 0
$countFail = 0

if ([string]::IsNullOrEmpty($LocalDir)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    $LocalDir = Join-Path $scriptDir "server"
}

if ($RemoteDir -notmatch "/$") {
    $RemoteDir = $RemoteDir + "/"
}

$allFiles = Get-ChildItem $LocalDir -Recurse -File
$countTotal = $allFiles.Count

Write-Host "LocalDir : $LocalDir"
Write-Host "RemoteDir: $RemoteDir"

# ===== 1. 创建远端目录 =====
$apiParts = $RemoteDir.TrimEnd('/').Split("/")
$apiCur = ""
foreach ($p in $apiParts) {
    if ([string]::IsNullOrEmpty($p)) { continue }
    $apiCur = $apiCur + "/" + $p
    try {
        $mkdirReq = [System.Net.FtpWebRequest]::Create("ftp://${FtpHost}:${FtpPort}${apiCur}")
        $mkdirReq.Method = "MKD"
        $mkdirReq.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
        $mkdirReq.Timeout = 5000
        $mkdirResp = $mkdirReq.GetResponse()
        $mkdirResp.Close()
    } catch { }
}
Write-Host ("OK  Directory ready: " + $RemoteDir)

# ===== 2. 容错清理旧 bug 生成的怪文件 =====
foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($LocalDir.Length).TrimStart("\").Replace("\", "/")
    $fileNameOnly = Split-Path $relativePath -Leaf
    $strayRemotePath = $RemoteDir + $fileNameOnly
    try {
        $delReq = [System.Net.FtpWebRequest]::Create("ftp://${FtpHost}:${FtpPort}/${strayRemotePath}")
        $delReq.Method = "DELE"
        $delReq.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
        $delReq.Timeout = 5000
        $dresp = $delReq.GetResponse()
        $dresp.Close()
        Write-Host ("CLEAN  removed stray " + $strayRemotePath)
    } catch { }
}

# ===== 3. 上传文件 =====
foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($LocalDir.Length).TrimStart("\").Replace("\", "/")
    $remotePath = $RemoteDir + $relativePath

    try {
        $dirPath = [System.IO.Path]::GetDirectoryName($relativePath)
        if (![string]::IsNullOrEmpty($dirPath)) {
            $parts = $dirPath.Split("/")
            $cur = "/" + $RemoteDir.TrimEnd('/')
            foreach ($p in $parts) {
                if ([string]::IsNullOrEmpty($p)) { continue }
                $cur = $cur + "/" + $p
                try {
                    $mk = [System.Net.FtpWebRequest]::Create("ftp://${FtpHost}:${FtpPort}${cur}")
                    $mk.Method = "MKD"
                    $mk.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
                    $mk.Timeout = 5000
                    $mr = $mk.GetResponse()
                    $mr.Close()
                } catch { }
            }
        }

        $upReq = [System.Net.FtpWebRequest]::Create("ftp://${FtpHost}:${FtpPort}/${remotePath}")
        $upReq.Method = "STOR"
        $upReq.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
        $upReq.UseBinary = $true
        $upReq.Timeout = 30000
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $upReq.ContentLength = $bytes.Length
        $stream = $upReq.GetRequestStream()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
        $upResp = $upReq.GetResponse()
        $upResp.Close()
        $countSuccess++
        Write-Host ("OK  " + $remotePath)
    }
    catch {
        $countFail++
        Write-Host ("FAIL  " + $remotePath + " - " + $_)
    }
}

Write-Host "=== UPLOAD DONE ==="
Write-Host ("Total: " + $countTotal + " | OK: " + $countSuccess + " | FAIL: " + $countFail)

# ===== 4. 自动 SSH 重启 node 进程 =====
if ([string]::IsNullOrEmpty($SshPass)) {
    Write-Host "WARN: 未提供 -SshPass，跳过自动重启。请手动在宝塔重启 node 项目。"
    exit 0
}

Write-Host ">>> 正在 SSH 重启 node 进程..."

$restartCmd = "pm2 restart $Pm2Name || (pkill -9 -f '$ServerJsPath'; pm2 start $ServerJsPath --name $Pm2Name)"
$sshArgs = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $SshPort ${SshUser}@${SshHost} $restartCmd"

# 用 sshpass 风格：Windows 原生 ssh 不支持密码参数，需用 plink 或 Expect。
# 优先尝试 plink（PuTTY 自带），否则提示手动。
$plink = Get-Command plink -ErrorAction SilentlyContinue
if ($plink) {
    $env:PLINK_PASSWORD = $SshPass
    & plink -batch -pw $SshPass -P $SshPort ${SshUser}@${SshHost} $restartCmd
} else {
    # 退而求其次：调用 Windows OpenSSH，借助 ssh -o 需要密钥；若无密钥则提示
    Write-Host "WARN: 未检测到 plink。请安装 PuTTY 或配置 SSH 密钥后重试，或手动重启："
    Write-Host ("  pm2 restart " + $Pm2Name)
}
