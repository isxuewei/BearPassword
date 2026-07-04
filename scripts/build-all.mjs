#!/usr/bin/env node
/**
 * BearPassword 全平台一键打包
 *
 * 用法:
 *   node scripts/build-all.mjs                 # Mac + Win + 浏览器扩展
 *   node scripts/build-all.mjs --mac           # 仅 Mac 桌面端
 *   node scripts/build-all.mjs --win           # 仅 Windows 桌面端
 *   node scripts/build-all.mjs --extension     # 仅浏览器扩展
 *   node scripts/build-all.mjs --web             # 仅网页端
 *   node scripts/build-all.mjs --mac --extension
 *   node scripts/build-all.mjs --skip-mac      # 跳过 Mac（非 macOS 或无需 Mac 包时）
 *
 * 产物目录:
 *   release/     全部安装包（Mac / Windows / 浏览器扩展）
 */

import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { releaseDir } from './release-dir.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const desktopDir = join(root, 'bear-password-desktop')
const extensionDir = join(root, 'bear-password-extension')
const webDir = join(root, 'bear-password-web')

const RELEASE_ARTIFACTS = [
  'BearPassword.dmg',
  'BearPassword-Setup.exe',
  'BearPassword-win-x64.zip',
  'BearPassword-Extension.zip',
  'BearPassword-Web.zip'
]

function formatDuration(ms) {
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function parseArgs() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`BearPassword 全平台一键打包

用法:
  node scripts/build-all.mjs                 Mac + Win + 浏览器扩展
  node scripts/build-all.mjs --mac           仅 Mac 桌面端
  node scripts/build-all.mjs --win           仅 Windows 桌面端
  node scripts/build-all.mjs --extension     仅浏览器扩展
  node scripts/build-all.mjs --web           仅网页端
  node scripts/build-all.mjs --skip-mac      跳过 Mac 打包

或在仓库根目录:
  npm run build:all
  npm run build:mac
  npm run build:win
  npm run build:extension
  npm run build:web
`)
    process.exit(0)
  }

  const hasTarget = args.some((arg) => ['--mac', '--win', '--extension', '--web'].includes(arg))

  let mac = !hasTarget || args.includes('--mac')
  let win = !hasTarget || args.includes('--win')
  const extension = !hasTarget || args.includes('--extension')
  const web = !hasTarget || args.includes('--web')

  if (args.includes('--skip-mac')) {
    mac = false
  }

  if (mac && process.platform !== 'darwin') {
    console.warn('[build-all] 当前非 macOS，已自动跳过 Mac 打包（可用 --mac 在非 macOS 上强制尝试）')
    mac = false
  }

  return { mac, win, extension, web }
}

function runStep(label, command, cwd) {
  console.log(`\n========== ${label} ==========\n`)
  const startedAt = Date.now()
  execSync(command, { cwd, stdio: 'inherit', env: process.env })
  console.log(`\n[build-all] ✓ ${label} 完成 (${formatDuration(Date.now() - startedAt)})\n`)
}

function printFile(filePath) {
  const stat = statSync(filePath)
  const sizeMb = (stat.size / 1024 / 1024).toFixed(2)
  const relative = filePath.startsWith(`${root}/`) ? filePath.slice(root.length + 1) : filePath
  console.log(`  • ${relative} (${sizeMb} MB)`)
}

function isArmMac() {
  return process.platform === 'darwin' && process.arch === 'arm64'
}

function printSummary({ mac, win, extension, web }) {
  console.log('\n========== 产物清单 ==========\n')
  console.log(`产物目录: ${releaseDir}`)

  if (!existsSync(releaseDir)) {
    console.log('（release 目录不存在）')
    return
  }

  let found = false
  for (const name of RELEASE_ARTIFACTS) {
    const shouldShow =
      (name === 'BearPassword.dmg' && mac) ||
      (name === 'BearPassword-Setup.exe' && win && !isArmMac()) ||
      (name === 'BearPassword-win-x64.zip' && win && isArmMac()) ||
      (name === 'BearPassword-Extension.zip' && extension) ||
      (name === 'BearPassword-Web.zip' && web)

    if (!shouldShow) continue

    const filePath = join(releaseDir, name)
    if (existsSync(filePath)) {
      printFile(filePath)
      found = true
    }
  }

  if (!found) {
    console.log('（未找到本次打包产物）')
  }
}

function main() {
  const options = parseArgs()
  const selected = [
    options.mac && 'Mac',
    options.win && 'Win',
    options.extension && 'Extension',
    options.web && 'Web'
  ].filter(Boolean)

  if (selected.length === 0) {
    console.error('[build-all] 未选择任何打包目标，请使用 --mac / --win / --extension')
    process.exit(1)
  }

  const totalStartedAt = Date.now()
  console.log('[build-all] BearPassword 全平台打包开始')
  console.log(`[build-all] 目标: ${selected.join(' + ')}`)

  if (options.mac || options.win) {
    runStep('生成桌面端图标', 'npm run generate:icons', desktopDir)
  }

  if (options.mac) {
    runStep('Mac 桌面端', 'npm run build:mac', desktopDir)
  }

  if (options.win) {
    if (isArmMac()) {
      console.warn('[build-all] Apple Silicon 无法本地生成 NSIS 安装包，将输出 Windows 便携 zip')
      runStep('Windows 桌面端 (zip)', 'npm run build:win:zip', desktopDir)
    } else {
      runStep('Windows 桌面端', 'npm run build:win', desktopDir)
    }
  }

  if (options.extension) {
    runStep('浏览器扩展', 'npm run package', extensionDir)
  }

  if (options.web) {
    runStep('网页端', 'npm run package', webDir)
  }

  printSummary(options)
  console.log(`\n[build-all] 全部完成，总耗时 ${formatDuration(Date.now() - totalStartedAt)}`)
}

try {
  main()
} catch (error) {
  console.error('\n[build-all] 打包失败')
  if (error instanceof Error) {
    console.error(error.message)
  }
  process.exit(1)
}
