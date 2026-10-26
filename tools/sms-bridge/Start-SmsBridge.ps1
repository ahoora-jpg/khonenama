param([switch]$EnableSend)
$ErrorActionPreference = 'Stop'
$bridgeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:SMS_BRIDGE_CONFIG = Join-Path $bridgeDir 'sms-bridge.config.json'
$env:SMS_BRIDGE_JOURNAL = Join-Path $bridgeDir 'sms-bridge.journal.json'
if (-not (Test-Path -LiteralPath $env:SMS_BRIDGE_CONFIG)) { throw 'Bridge configuration file is missing.' }
if (-not $EnableSend) { throw 'Bridge is disarmed. Explicit -EnableSend is required after authorization.' }
$env:SMS_ENABLE_SEND = 'YES'
& node (Join-Path $bridgeDir 'agent.mjs')
exit $LASTEXITCODE
