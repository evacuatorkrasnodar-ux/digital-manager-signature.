# Opt-in only. Register an ordinary per-user Windows task for SEYVEO Auto School.
# Nothing runs unless the user explicitly executes this script and answers YES.
$ErrorActionPreference = 'Stop'
$taskName = 'SEYVEO Auto School'
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $folder '..\..')).Path
$runner = Join-Path $folder 'run.mjs'
$node = (Get-Command node -ErrorAction Stop).Source
Write-Host "SEYVEO AI School will run automatically every day at 02:30 (Windows local time)."
Write-Host "It uses CPU and local Ollama. It NEVER publishes updates or transfers personal data."
Write-Host "To stop it: Windows Task Scheduler -> $taskName -> Disable."
$answer = Read-Host 'Register the daily task? Type YES'
if ($answer -cne 'YES') {
  Write-Host 'Cancelled. No task was created.'
  exit 0
}
$arguments = '"' + $runner + '" --count=2'
$action = New-ScheduledTaskAction -Execute $node -Argument $arguments -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Daily -At '02:30'
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 6) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Locally prepares synthetic training lessons; no AI updates deployed' -Force | Out-Null
Write-Host "Registered: $taskName. PC must be on and Ollama available at 02:30."
