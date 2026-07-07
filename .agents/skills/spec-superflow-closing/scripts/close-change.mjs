#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function fail(message) {
  console.error(message)
  process.exit(1)
}

function assertFileExists(filePath, label) {
  if (!existsSync(filePath)) {
    fail(`${label} 不存在: ${filePath}`)
  }
}

function quoteForPowerShell(value) {
  return `'${value.replace(/'/g, "''")}'`
}

function runSsf(args, changeDir) {
  console.log(`==> ssf ${args.join(' ')} "${changeDir}"`)

  let result

  if (process.platform === 'win32') {
    // Windows 下显式走 PowerShell，可兼容 pnpm 生成的 ssf.ps1 包装器。
    const commandLine = ['ssf', ...args, quoteForPowerShell(changeDir)].join(' ')
    result = spawnSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', commandLine],
      {
        stdio: 'inherit',
      },
    )
  } else {
    result = spawnSync('ssf', [...args, changeDir], {
      stdio: 'inherit',
    })
  }

  if (result.error) {
    fail(`执行 ssf ${args.join(' ')} 失败: ${result.error.message}`)
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }
}

const changeDir = process.argv[2]

if (!changeDir) {
  fail('用法: node close-change.mjs <absolute-change-dir>')
}

let resolvedChangeDir = ''

try {
  resolvedChangeDir = realpathSync(changeDir)
} catch (error) {
  fail(`change 目录不存在或无法解析: ${changeDir}`)
}
const tasksPath = path.join(resolvedChangeDir, 'tasks.md')
const statePath = path.join(resolvedChangeDir, '.spec-superflow.yaml')

assertFileExists(tasksPath, 'tasks.md')
assertFileExists(statePath, '.spec-superflow.yaml')

const tasksContent = readFileSync(tasksPath, 'utf8')

// closing 前不允许继续保留未完成任务，否则 state guard 和审计信息会失真。
if (/^\- \[ \] /m.test(tasksContent)) {
  fail('tasks.md 中仍存在未完成项。请先全部改成 - [x]，再执行 closing 收口。')
}

const stateContent = readFileSync(statePath, 'utf8')
const requiredStatePatterns = [
  { pattern: /^test_result:\s+pass\s*$/m, label: 'test_result=pass' },
  { pattern: /^dp_4_result:\s+(?!null\s*$).+/m, label: 'dp_4_result' },
  { pattern: /^dp_6_result:\s+(?!null\s*$).+/m, label: 'dp_6_result' },
  { pattern: /^dp_7_result:\s+(?!null\s*$).+/m, label: 'dp_7_result' },
]

// 这些字段是 closing 阶段最容易漏掉的关键痕迹，提前拦住比事后补 audit 更稳。
for (const entry of requiredStatePatterns) {
  if (!entry.pattern.test(stateContent)) {
    fail(`.spec-superflow.yaml 缺少 closing 必需字段: ${entry.label}`)
  }
}

runSsf(['state', 'rebuild'], resolvedChangeDir)
runSsf(['state', 'check'], resolvedChangeDir)
runSsf(['audit'], resolvedChangeDir)

console.log('Closing SOP 已完成：tasks/state/audit 已同步。')
