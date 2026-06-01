#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Instaluje PostgreSQL i MongoDB lokalnie (bez Dockera) przez winget.
.NOTES
    Po instalacji PostgreSQL ustaw haslo uzytkownika postgres w pliku .env
#>

$ErrorActionPreference = "Stop"

Write-Host "=== BoiskoPro: instalacja baz danych ===" -ForegroundColor Cyan

function Test-PortOpen($Port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

# PostgreSQL
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "[OK] PostgreSQL juz zainstalowany" -ForegroundColor Green
} else {
    Write-Host "Instaluje PostgreSQL 17..." -ForegroundColor Yellow
    winget install --id PostgreSQL.PostgreSQL.17 -e --accept-package-agreements --accept-source-agreements
    Write-Host "PostgreSQL zainstalowany. Ustaw haslo uzytkownika 'postgres' w pliku .env" -ForegroundColor Yellow
}

# MongoDB
if (Get-Command mongod -ErrorAction SilentlyContinue) {
    Write-Host "[OK] MongoDB juz zainstalowane" -ForegroundColor Green
} else {
    Write-Host "Instaluje MongoDB Community Server..." -ForegroundColor Yellow
    winget install --id MongoDB.Server -e --accept-package-agreements --accept-source-agreements
}

# Uruchom usluge MongoDB jesli istnieje
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -ne "Running") {
    Start-Service MongoDB
    Write-Host "Uruchomiono usluge MongoDB" -ForegroundColor Green
}

# Uruchom usluge PostgreSQL jesli istnieje
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService -and $pgService.Status -ne "Running") {
    Start-Service $pgService.Name
    Write-Host "Uruchomiono usluge $($pgService.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Sprawdzam porty..." -ForegroundColor Cyan
Write-Host "  PostgreSQL (5432): $(if (Test-PortOpen 5432) { 'OK' } else { 'niedostepny - uruchom usluge recznie' })"
Write-Host "  MongoDB    (27017): $(if (Test-PortOpen 27017) { 'OK' } else { 'niedostepny - uruchom usluge recznie' })"
Write-Host ""
Write-Host "Nastepne kroki:" -ForegroundColor Cyan
Write-Host "  1. Edytuj .env i ustaw POSTGRES_PASSWORD (haslo z instalacji PostgreSQL)"
Write-Host "  2. npm run db:init"
Write-Host "  3. npm run seed"
Write-Host "  4. npm run dev"
