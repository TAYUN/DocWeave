param(
  [Parameter(Mandatory = $true)]
  [string]$ChangeDir
)

$ErrorActionPreference = 'Stop'

function Assert-FileExists {
  param(
    [string]$Path,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "$Label 不存在: $Path"
  }
}

$resolvedChangeDir = (Resolve-Path -LiteralPath $ChangeDir).Path
$tasksPath = Join-Path $resolvedChangeDir 'tasks.md'
$statePath = Join-Path $resolvedChangeDir '.spec-superflow.yaml'

Assert-FileExists -Path $tasksPath -Label 'tasks.md'
Assert-FileExists -Path $statePath -Label '.spec-superflow.yaml'

$tasksContent = Get-Content -Raw -LiteralPath $tasksPath

# closing 前不允许继续保留未完成任务，否则 state guard 和审计信息会失真。
if ($tasksContent -match '(?m)^\- \[ \] ') {
  throw "tasks.md 中仍存在未完成项。请先全部改成 - [x]，再执行 closing 收口。"
}

$stateContent = Get-Content -Raw -LiteralPath $statePath

# 这些字段是 closing 阶段最容易漏掉的关键痕迹，提前拦住比事后补 audit 更稳。
$requiredStatePatterns = @(
  @{ Pattern = '(?m)^test_result:\s+pass\s*$'; Label = 'test_result=pass' }
  @{ Pattern = '(?m)^dp_4_result:\s+(?!null\s*$).+'; Label = 'dp_4_result' }
  @{ Pattern = '(?m)^dp_6_result:\s+(?!null\s*$).+'; Label = 'dp_6_result' }
  @{ Pattern = '(?m)^dp_7_result:\s+(?!null\s*$).+'; Label = 'dp_7_result' }
)

foreach ($entry in $requiredStatePatterns) {
  if ($stateContent -notmatch $entry.Pattern) {
    throw ".spec-superflow.yaml 缺少 closing 必需字段: $($entry.Label)"
  }
}

Write-Host "==> ssf state rebuild `"$resolvedChangeDir`""
ssf state rebuild "$resolvedChangeDir"

Write-Host "==> ssf state check `"$resolvedChangeDir`""
ssf state check "$resolvedChangeDir"

Write-Host "==> ssf audit `"$resolvedChangeDir`""
ssf audit "$resolvedChangeDir"

Write-Host "Closing SOP 已完成：tasks/state/audit 已同步。"
