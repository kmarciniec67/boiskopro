# Zamknij Cursor w tym projekcie przed uruchomieniem.
$old = "C:\Users\kacper\Projects\zielony-ogrodek-shop"
$new = "C:\Users\kacper\Projects\boiskopro-shop"

if (Test-Path $new) {
    Write-Host "Folder $new juz istnieje." -ForegroundColor Yellow
    exit 1
}

Rename-Item -Path $old -NewName "boiskopro-shop"
Write-Host "Gotowe: $new" -ForegroundColor Green
Write-Host "Otworz projekt ponownie w Cursor z nowej sciezki."
