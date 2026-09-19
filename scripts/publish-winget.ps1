# Pasteport Winget Automation Script
# Usage: powershell -ExecutionPolicy Bypass -File scripts/publish-winget.ps1

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $repoRoot "desktop\dist"
$manifestPath = Join-Path $repoRoot "winget\manifests\z\zainImran\Pasteport\1.0.0\zainImran.Pasteport.installer.yaml"

Write-Host "Searching for built installer in: $distDir" -ForegroundColor Cyan

$exeFile = Get-ChildItem -Path $distDir -Filter "*Setup*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $exeFile) {
    $exeFile = Get-ChildItem -Path $distDir -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
}

if (-not $exeFile) {
    Write-Host "No .exe found in $distDir. Please run 'npm run build:win' in the desktop directory first." -ForegroundColor Red
    exit 1
}

Write-Host "Found installer: $($exeFile.FullName)" -ForegroundColor Green

Write-Host "Calculating SHA-256 Checksum..." -ForegroundColor Cyan
$hash = (Get-FileHash -Path $exeFile.FullName -Algorithm SHA256).Hash
Write-Host "SHA-256: $hash" -ForegroundColor Yellow

if (Test-Path $manifestPath) {
    $content = Get-Content -Path $manifestPath -Raw
    $updated = $content -replace "InstallerSha256:\s*.*", "InstallerSha256: $hash"
    Set-Content -Path $manifestPath -Value $updated
    Write-Host "Updated $manifestPath with live SHA-256." -ForegroundColor Green
} else {
    Write-Host "Manifest not found at: $manifestPath" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Testing and Submitting to Winget:" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "1. Test local manifest installation on this machine:"
Write-Host "   winget install --manifest winget\manifests\z\zainImran\Pasteport\1.0.0\zainImran.Pasteport.yaml" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Publish official GitHub Release:"
Write-Host "   Upload '$($exeFile.Name)' to:"
Write-Host "   https://github.com/zainImran864/online_clipboard/releases/new (Tag: v1.0.0)"
Write-Host ""
Write-Host "3. Submit to Microsoft official winget-pkgs catalog:"
Write-Host "   wingetcreate submit https://github.com/zainImran864/online_clipboard/releases/download/v1.0.0/$($exeFile.Name)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
