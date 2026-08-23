# Forge Swarm Autonomous Pulse Automation Script
# Reads PIPELINE_API_KEY from .env and triggers POST /api/cron/swarm

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$envPath = Join-Path $projectRoot ".env"
$logDir = Join-Path $projectRoot "logs"
$logPath = Join-Path $logDir "swarm-pulse.log"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

# 1. Parse PIPELINE_API_KEY without logging or echoing the value
$apiKey = $null
if (Test-Path $envPath) {
    foreach ($line in (Get-Content $envPath)) {
        $trimmed = $line.Trim()
        if ($trimmed.StartsWith("PIPELINE_API_KEY=")) {
            $apiKey = $trimmed.Substring("PIPELINE_API_KEY=".Length).Trim('"', "'")
            break
        }
    }
}

if (-not $apiKey) {
    $msg = "[$timestamp] ERROR: PIPELINE_API_KEY not found in .env"
    Add-Content -Path $logPath -Value $msg
    exit 1
}

# 2. Trigger Swarm Cron Endpoint via POST
try {
    $headers = @{
        "x-api-key" = $apiKey
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cron/swarm" -Method Post -Headers $headers -TimeoutSec 60
    $jobsCount = if ($response.jobsProcessed -ne $null) { $response.jobsProcessed } else { 0 }
    $logMsg = "[$timestamp] SUCCESS: HTTP 200 (Jobs processed: $jobsCount)"
    Add-Content -Path $logPath -Value $logMsg
}
catch {
    $statusCode = "UNKNOWN"
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $statusCode = [int]$_.Exception.Response.StatusCode
    }
    $logMsg = "[$timestamp] FAILURE: HTTP $statusCode"
    Add-Content -Path $logPath -Value $logMsg
}
