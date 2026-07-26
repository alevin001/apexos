#Requires -Version 5.1
<#
.SYNOPSIS
  Start or stop Apex OS locally (MCP HTTP + OpenAI tunnel).

.DESCRIPTION
  Detects whether Apex OS is running. If it is, offers to stop it.
  If it is not, offers to start the MCP runtime and the tunnel client.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RuntimeDir = Join-Path $Root "runtime"
$TunnelExe = Join-Path $RuntimeDir "mcp tunnel\tunnel-client.exe"
$StateDir = Join-Path $Root ".apexos"
$PidFile = Join-Path $StateDir "pids.json"
$LogDir = Join-Path $StateDir "logs"

$McpPort = 3021
$RuntimePort = 3020
$TunnelHealthPort = 8080
$TunnelProfile = "apexos"

function Write-Header {
  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host "           ApexOS Launcher" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host ""
}

function Write-Info([string]$Message) { Write-Host "  $Message" -ForegroundColor Gray }
function Write-Ok([string]$Message) { Write-Host "  $Message" -ForegroundColor Green }
function Write-WarnLine([string]$Message) { Write-Host "  $Message" -ForegroundColor Yellow }
function Write-Err([string]$Message) { Write-Host "  $Message" -ForegroundColor Red }

function Import-DotEnvLocal {
  $envPath = Join-Path $Root ".env.local"
  if (-not (Test-Path -LiteralPath $envPath)) {
    return
  }

  Get-Content -LiteralPath $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }

    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    # Do not overwrite keys already set in the user/machine environment.
    $existing = [Environment]::GetEnvironmentVariable($name, "Process")
    if ([string]::IsNullOrEmpty($existing)) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

function Test-HttpOk([string]$Url, [int]$TimeoutSec = 1) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
  } catch {
    return $false
  }
}

function Get-ListenerPids([int]$Port) {
  $pids = New-Object System.Collections.Generic.List[int]
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($null -eq $conns) { return [int[]]@() }
    foreach ($conn in @($conns)) {
      if ($conn.OwningProcess -gt 0 -and -not $pids.Contains([int]$conn.OwningProcess)) {
        $pids.Add([int]$conn.OwningProcess)
      }
    }
  } catch {
    # best-effort
  }
  return [int[]]$pids.ToArray()
}

function Get-ApexStatus {
  $mcpUp = Test-HttpOk "http://127.0.0.1:$McpPort/health"
  $runtimeUp = Test-HttpOk "http://127.0.0.1:$RuntimePort/health"
  $tunnelUp = Test-HttpOk "http://127.0.0.1:$TunnelHealthPort/healthz"
  if (-not $tunnelUp) {
    $tunnelUp = Test-HttpOk "http://127.0.0.1:$TunnelHealthPort/readyz"
  }

  # Health endpoints are the source of truth for "is Apex OS running?"
  $anyUp = $mcpUp -or $tunnelUp

  [pscustomobject]@{
    McpUp        = $mcpUp
    RuntimeUp    = $runtimeUp
    TunnelUp     = $tunnelUp
    AnyUp        = $anyUp
    McpPids      = Get-ListenerPids $McpPort
    RuntimePids  = Get-ListenerPids $RuntimePort
    TunnelPids   = @(Get-Process -Name "tunnel-client" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
  }
}

function Show-Status($Status) {
  Write-Host "Current status:" -ForegroundColor White
  if ($Status.McpUp) { Write-Ok "MCP runtime  : running  (http://127.0.0.1:$McpPort)" }
  else { Write-WarnLine "MCP runtime  : not running" }

  if ($Status.TunnelUp) { Write-Ok "OpenAI tunnel: running  (http://127.0.0.1:$TunnelHealthPort)" }
  else { Write-WarnLine "OpenAI tunnel: not running" }

  if ($Status.RuntimeUp) {
    Write-Ok "Runtime HTTP : running  (http://127.0.0.1:$RuntimePort)"
  }
  Write-Host ""
}

function Save-Pids([hashtable]$Pids) {
  if (-not (Test-Path -LiteralPath $StateDir)) {
    New-Item -ItemType Directory -Path $StateDir -Force | Out-Null
  }
  $Pids | ConvertTo-Json | Set-Content -LiteralPath $PidFile -Encoding UTF8
}

function Read-SavedPids {
  if (-not (Test-Path -LiteralPath $PidFile)) { return $null }
  try {
    return Get-Content -LiteralPath $PidFile -Raw | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Wait-ForHttp([string]$Url, [string]$Label, [int]$TimeoutSec = 45) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-HttpOk $Url) {
      Write-Ok "$Label is ready."
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  Write-Err "$Label did not become ready within ${TimeoutSec}s."
  Write-Info "Check the dedicated console window for errors."
  return $false
}

function Stop-PidSafe([int]$ProcessId, [string]$Label) {
  if ($ProcessId -le 0) { return }
  try {
    $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if (-not $proc) { return }
    Write-Info "Stopping $Label (PID $ProcessId)..."
    # /T kills the console window and its child node/npm processes.
    & taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
  } catch {
    try {
      Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    } catch {
      # best-effort
    }
  }
}

function Stop-ApexOs {
  Write-Host "Stopping Apex OS..." -ForegroundColor White
  Write-Host ""

  $saved = Read-SavedPids
  if ($saved) {
    if ($saved.TunnelPid) { Stop-PidSafe ([int]$saved.TunnelPid) "tunnel" }
    if ($saved.McpPid) { Stop-PidSafe ([int]$saved.McpPid) "MCP runtime" }
    if ($saved.RuntimePid) { Stop-PidSafe ([int]$saved.RuntimePid) "Runtime HTTP" }
  }

  foreach ($processId in (Get-ListenerPids $McpPort)) {
    Stop-PidSafe $processId "MCP listener on $McpPort"
  }
  foreach ($processId in (Get-ListenerPids $RuntimePort)) {
    # Only stop runtime HTTP if we started it earlier via this launcher.
    if ($saved -and $saved.RuntimePid) {
      Stop-PidSafe $processId "Runtime HTTP listener on $RuntimePort"
    }
  }

  Get-Process -Name "tunnel-client" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-PidSafe $_.Id "tunnel-client"
  }

  Start-Sleep -Seconds 1

  if (Test-Path -LiteralPath $PidFile) {
    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
  }

  $after = Get-ApexStatus
  if (-not $after.AnyUp) {
    Write-Ok "Apex OS stopped."
  } else {
    Write-WarnLine "Some components may still be running:"
    Show-Status $after
  }
}

function Start-ApexOs {
  Write-Host "Starting Apex OS..." -ForegroundColor White
  Write-Host ""

  if (-not (Test-Path -LiteralPath $TunnelExe)) {
    Write-Err "Tunnel client not found:"
    Write-Info $TunnelExe
    return
  }

  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeDir "package.json"))) {
    Write-Err "Runtime folder not found: $RuntimeDir"
    return
  }

  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeDir "node_modules"))) {
    Write-WarnLine "runtime/node_modules is missing. Run: cd runtime && npm install"
  }

  Import-DotEnvLocal

  if ([string]::IsNullOrWhiteSpace($env:CONTROL_PLANE_API_KEY)) {
    Write-WarnLine "CONTROL_PLANE_API_KEY is not set."
    Write-Info "Add it to .env.local or your Windows user environment, then try again."
    Write-Info "The tunnel client will fail without it."
    Write-Host ""
  }

  if (-not (Test-Path -LiteralPath $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
  }
  if (-not (Test-Path -LiteralPath $StateDir)) {
    New-Item -ItemType Directory -Path $StateDir -Force | Out-Null
  }

  $nodeOptions = $env:NODE_OPTIONS
  if ([string]::IsNullOrWhiteSpace($nodeOptions) -or $nodeOptions -notmatch "use-system-ca") {
    $env:NODE_OPTIONS = ((($nodeOptions, "--use-system-ca") | Where-Object { $_ }) -join " ").Trim()
  }

  $startRuntimeHttp = ($env:APEXOS_MCP_RUNTIME_MODE -eq "http")
  $runtimePid = $null

  if ($startRuntimeHttp) {
    Write-Info "APEXOS_MCP_RUNTIME_MODE=http - starting Runtime HTTP on port $RuntimePort..."
    $runtimeCmd = 'title ApexOS Runtime HTTP & npm start'
    $runtimeProc = Start-Process -FilePath "cmd.exe" `
      -ArgumentList @("/k", $runtimeCmd) `
      -WorkingDirectory $RuntimeDir `
      -PassThru
    $runtimePid = $runtimeProc.Id
    if (-not (Wait-ForHttp "http://127.0.0.1:$RuntimePort/health" "Runtime HTTP")) {
      return
    }
  }

  Write-Info "Starting MCP runtime on port $McpPort..."
  $mcpCmd = 'title ApexOS MCP & npm run mcp:http'
  $mcpProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList @("/k", $mcpCmd) `
    -WorkingDirectory $RuntimeDir `
    -PassThru

  if (-not (Wait-ForHttp "http://127.0.0.1:$McpPort/health" "MCP runtime")) {
    return
  }

  Write-Info "Starting OpenAI tunnel (profile: $TunnelProfile)..."
  $tunnelCmd = 'title ApexOS Tunnel & "' + $TunnelExe + '" run --profile ' + $TunnelProfile
  $tunnelProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList @("/k", $tunnelCmd) `
    -WorkingDirectory (Split-Path -Parent $TunnelExe) `
    -PassThru

  $null = Wait-ForHttp "http://127.0.0.1:$TunnelHealthPort/healthz" "OpenAI tunnel" 60

  Save-Pids @{
    McpPid     = $mcpProc.Id
    TunnelPid  = $tunnelProc.Id
    RuntimePid = $runtimePid
    StartedAt  = (Get-Date).ToString("o")
  }

  Write-Host ""
  Write-Ok "Apex OS is up."
  Write-Info "MCP endpoint : http://127.0.0.1:$McpPort/mcp"
  Write-Info "Tunnel admin : http://127.0.0.1:$TunnelHealthPort/ui"
  Write-Info "Two console windows stay open for logs (MCP + Tunnel)."
  Write-Info "Run this launcher again to stop everything cleanly."
}

# --- main ---
Write-Header
Import-DotEnvLocal

if ($env:APEXOS_MCP_PORT -match '^\d+$') { $McpPort = [int]$env:APEXOS_MCP_PORT }
if ($env:APEXOS_RUNTIME_PORT -match '^\d+$') { $RuntimePort = [int]$env:APEXOS_RUNTIME_PORT }

$status = Get-ApexStatus
Show-Status $status

if ($status.AnyUp) {
  $answer = Read-Host "Apex OS looks like it is running. Stop it now? [Y/n]"
  if ($answer -match '^(n|no)$') {
    Write-Info "Left running."
    exit 0
  }
  Stop-ApexOs
} else {
  $answer = Read-Host "Apex OS is not running. Start it now? [Y/n]"
  if ($answer -match '^(n|no)$') {
    Write-Info "Nothing started."
    exit 0
  }
  Start-ApexOs
}

Write-Host ""
