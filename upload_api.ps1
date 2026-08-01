param(
    [string]$LocalDir = "",
    [string]$FtpHost = "47.95.213.150",
    [int]$FtpPort = 21,
    [string]$FtpUser = "kids",
    [string]$FtpPass = "2ABepXASCEHjyxNh",
    [string]$RemoteDir = "api"
)

$countSuccess = 0
$countFail = 0

if ([string]::IsNullOrEmpty($LocalDir)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    $LocalDir = Join-Path $scriptDir "server"
}

$allFiles = Get-ChildItem $LocalDir -Recurse -File
$countTotal = $allFiles.Count

$apiParts = $RemoteDir.Split("/")
$apiCur = ""
foreach ($p in $apiParts) {
    if ([string]::IsNullOrEmpty($p)) { continue }
    $apiCur += "/$p"
    try {
        $mkdirReq = [System.Net.FtpWebRequest]::Create("ftp://${FtpHost}:${FtpPort}${apiCur}")
        $mkdirReq.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $mkdirReq.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $ftpPass)
        $mkdirReq.Timeout = 5000
        $mkdirResp = $mkdirReq.GetResponse()
        $mkdirResp.Close()
    } catch { }
}
Write-Host "OK  Directory ready: $RemoteDir"

foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($LocalDir.Length).TrimStart("\").Replace("\", "/")
    $remotePath = "${RemoteDir}${relativePath}"
    try {
        $dirPath = [System.IO.Path]::GetDirectoryName($relativePath)
        if (![string]::IsNullOrEmpty($dirPath)) {
            $parts = $dirPath.Split("/")
            $cur = "/$RemoteDir"
            foreach ($p in $parts) {
                if ([string]::IsNullOrEmpty($p)) { continue }
                $cur += "/$p"
                try {
                    $mk = [System.Net.FtpWebRequest]::Create("ftp://${FtpHost}:${FtpPort}${cur}")
                    $mk.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                    $mk.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $ftpPass)
                    $mk.Timeout = 5000
                    $mr = $mk.GetResponse(); $mr.Close()
                } catch { }
            }
        }
        $upReq = [System.Net.FtpWebRequest]::Create("ftp://${FtpHost}:${FtpPort}/${remotePath}")
        $upReq.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $upReq.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $ftpPass)
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
        Write-Host "OK  $remotePath"
    }
    catch {
        $countFail++
        Write-Host "FAIL  $remotePath - $_"
    }
}

Write-Host "=== DONE ==="
Write-Host "Total: $countTotal | OK: $countSuccess | FAIL: $countFail"
