# install-windows.ps1

Write-Host "📦 Installing Taptap CLI for Windows..."

$version = "v2.6.0"
$url = "https://github.com/anuragco/Taptap-lightning-fast-command-line-tool-for-Deployment/releases/download/$version/taptap-cli-win.exe"
$path = "$env:USERPROFILE\AppData\Local\Taptap"
$exePath = "$path\taptap.exe"

New-Item -ItemType Directory -Force -Path $path | Out-Null
Invoke-WebRequest -Uri $url -OutFile $exePath

# Add to PATH
[Environment]::SetEnvironmentVariable("Path", $Env:Path + ";$path", [System.EnvironmentVariableTarget]::User)

Write-Host "`n✅ Taptap installed successfully!"
Write-Host "➡️ Run 'taptap --version' in a new terminal window."
