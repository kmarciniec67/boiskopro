#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Ustawia znane haslo dev dla uzytkownika postgres (localhost).
#>

$ErrorActionPreference = "Stop"
$pgHba = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$devPassword = "boiskopro123"

if (-not (Test-Path $pgHba)) {
    Write-Error "Nie znaleziono pg_hba.conf. Dostosuj sciezke wersji PostgreSQL."
}

$content = Get-Content $pgHba -Raw
$backup = "$pgHba.bak-boiskopro"
if (-not (Test-Path $backup)) {
    Copy-Item $pgHba $backup
}

$trustContent = $content -replace '127\.0\.0\.1/32\s+scram-sha-256', '127.0.0.1/32            trust'
Set-Content -Path $pgHba -Value $trustContent -NoNewline

& "$pgBin\pg_ctl.exe" reload -D "C:\Program Files\PostgreSQL\17\data"
Start-Sleep -Seconds 2

$env:PGPASSWORD = ""
& "$pgBin\psql.exe" -U postgres -h 127.0.0.1 -d postgres -c "ALTER USER postgres WITH PASSWORD '$devPassword';"

Set-Content -Path $pgHba -Value $content -NoNewline
& "$pgBin\pg_ctl.exe" reload -D "C:\Program Files\PostgreSQL\17\data"

Write-Host "Haslo uzytkownika postgres ustawione na: $devPassword" -ForegroundColor Green
Write-Host "Wpisz je w .env jako POSTGRES_PASSWORD=$devPassword"
