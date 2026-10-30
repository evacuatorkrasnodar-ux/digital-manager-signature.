$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'SEYVEO - Проверка облачного преподавателя' -ForegroundColor Cyan
Write-Host 'Два синтетических урока. Ученица и экзаменатор остаются локально.'
Write-Host 'Использование API может быть платным. Голос и личные данные не загружаются.'
$secure = Read-Host 'Вставь API-ключ OpenAI (символы скрыты)' -AsSecureString
if ($secure.Length -eq 0) { Write-Host 'Ключ не введён.'; exit 1 }
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  node (Join-Path $PSScriptRoot 'run.mjs') --teacher-api --count=2
  $code = $LASTEXITCODE
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
}
Write-Host ''
if ($code -ne 0) { Write-Host 'Проверь сообщение об ошибке выше.' -ForegroundColor Yellow }
else { Write-Host 'Отчёт: %LOCALAPPDATA%\SEYVEO\auto-school\last-session.html' }
Read-Host 'Нажми Enter для закрытия окна'
exit $code
