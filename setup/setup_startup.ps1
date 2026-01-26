<#
  setup_startup.ps1
  - Creates Windows Firewall rules for HA-ERP ports
  - Registers a Scheduled Task to run start-ha-erp.bat at user logon

  Run this script as Administrator.
#>

$ErrorActionPreference = 'Stop'

$batPath = 'D:\textile-erp-solution\start-ha-erp.bat'

Write-Host "Configuring Windows Firewall rules..."

$rules = @(
  @{ Name = 'HA-ERP Backend 8000'; Port = 8000 },
  @{ Name = 'HA-ERP Frontend 80'; Port = 80 },
  @{ Name = 'HA-ERP Frontend 5173'; Port = 5173 }
)

foreach ($r in $rules) {
  try {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
      New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $r.Port | Out-Null
      Write-Host "Added firewall rule: $($r.Name) (port $($r.Port))"
    } else {
      Write-Host "Firewall rule exists: $($r.Name)"
    }
  } catch {
    Write-Host "Failed to ensure firewall rule $($r.Name): $_" -ForegroundColor Yellow
  }
}

Write-Host "Registering scheduled task to run start-ha-erp.bat at user logon..."

$taskName = 'HA-ERP AutoStart'

try {
  # Create or replace the task using schtasks for compatibility
  $cmd = "schtasks /Create /SC ONLOGON /RL HIGHEST /TN `"$taskName`" /TR `"$batPath`" /F"
  cmd /c $cmd | Out-Null
  Write-Host "Scheduled task '$taskName' created (runs at user logon)."
} catch {
  Write-Host "Failed to create scheduled task: $_" -ForegroundColor Yellow
}

Write-Host "Setup complete. Ensure you run this script as Administrator." -ForegroundColor Green
