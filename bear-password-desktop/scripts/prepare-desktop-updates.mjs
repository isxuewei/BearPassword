import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const releaseDir = join(root, 'release')

const platform = process.argv[2]
if (platform !== 'mac' && platform !== 'win') {
  console.error('[prepare-desktop-updates] 用法: node scripts/prepare-desktop-updates.mjs <mac|win>')
  process.exit(1)
}

const targetDir = join(releaseDir, 'desktop-updates', platform)
mkdirSync(targetDir, { recursive: true })

function copyIfExists(name) {
  const from = join(releaseDir, name)
  if (!existsSync(from)) return false
  copyFileSync(from, join(targetDir, name))
  return true
}

const copied = []

if (platform === 'mac') {
  for (const name of readdirSync(releaseDir)) {
    if (
      name === 'latest-mac.yml' ||
      name === 'BearPassword.zip' ||
      name === 'BearPassword.zip.blockmap'
    ) {
      copyIfExists(name)
      copied.push(name)
    }
  }
} else {
  for (const name of readdirSync(releaseDir)) {
    if (
      name === 'latest.yml' ||
      name === 'BearPassword-Setup.exe' ||
      name === 'BearPassword-Setup.exe.blockmap'
    ) {
      copyIfExists(name)
      copied.push(name)
    }
  }
}

if (!copied.length) {
  console.warn(`[prepare-desktop-updates] 未找到 ${platform} 自动更新产物，请先执行 electron-builder 打包`)
  process.exit(0)
}

console.log(`[prepare-desktop-updates] 已整理到 release/desktop-updates/${platform}/`)
for (const name of copied) {
  console.log(`  - ${name}`)
}
