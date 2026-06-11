import { execSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  readdirSync,
  renameSync,
  rmSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const releaseDir = join(root, 'release')
const macAssetsDir = join(root, 'build/mac')

const helpers = ['安装说明.txt', '安装 BearPassword.command']

if (!existsSync(releaseDir)) {
  console.warn('[after-mac-build] release 目录不存在，跳过')
  process.exit(0)
}

for (const name of helpers) {
  const source = join(macAssetsDir, name)
  const target = join(releaseDir, name)
  copyFileSync(source, target)
  if (name.endsWith('.command')) {
    chmodSync(target, 0o755)
  }
}

const appBundle = join(releaseDir, 'mac-arm64/BearPassword.app')
if (existsSync(appBundle)) {
  const targetApp = join(releaseDir, 'BearPassword.app')
  cpSync(appBundle, targetApp, { recursive: true })
}

/** 兼容旧命名，将带版本号的产物统一为无版本文件名 */
function renameArtifact(oldName, newName) {
  const from = join(releaseDir, oldName)
  const to = join(releaseDir, newName)
  if (!existsSync(from) || from === to) return
  if (existsSync(to)) {
    rmSync(to, { force: true })
  }
  renameSync(from, to)
}

for (const name of readdirSync(releaseDir)) {
  const match = name.match(/^BearPassword-.+\.(dmg|zip)(\.blockmap)?$/)
  if (!match) continue
  renameArtifact(name, `BearPassword.${match[1]}${match[2] ?? ''}`)
}

const distZip = join(releaseDir, 'BearPassword-mac-安装包.zip')
execSync(
  `cd "${releaseDir}" && rm -f "${distZip}" && zip -r "${distZip}" "BearPassword.app" "安装说明.txt" "安装 BearPassword.command"`,
  { stdio: 'inherit' }
)

console.log(`[after-mac-build] 已生成分发包：${distZip}`)
