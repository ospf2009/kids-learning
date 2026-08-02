import https from 'https';

// 用 ftp 模块检查远程文件内容
const { execSync } = await import('node:child_process');

function ftpDownloadToList() {
  const cmd = `powershell -NoProfile -Command "$req=[System.Net.FtpWebRequest]::Create('ftp://47.95.213.150:21/api/server.js'); $req.Method=[System.Net.WebRequestMethods+Ftp]::DownloadFile; $req.Credentials=New-Object System.Net.NetworkCredential('kids','2ABepXASCEHjyxNh'); try { $r=$req.GetResponse(); $s=$r.GetResponseStream(); $sr=New-Object System.IO.StreamReader($s); $txt=$sr.ReadToEnd(); $sr.Close(); $r.Close(); $txt } catch { 'DOWNLOAD_FAIL:'+$_.Exception.Message }"`;
  const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return out;
}

const txt = ftpDownloadToList();
if (txt.startsWith('DOWNLOAD_FAIL')) {
  console.log(txt);
} else {
  const lines = txt.split(/\r?\n/);
  const hit = lines.filter(l => l.includes('quiz-cache')).length;
  console.log('远程文件行数:', lines.length);
  console.log('包含 quiz-cache 的行数:', hit);
}
