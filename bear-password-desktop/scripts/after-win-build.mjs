import { execSync } from 'node:child_process'
import {
  copyFileSync,
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
const winAssetsDir = join(root, 'build/win')

if (!existsSync(releaseDir)) {
  console.warn('[after-win-build] release 目录不存在，跳过')
  process.exit(0)
}

const readmeSource = join(winAssetsDir, '安装说明.txt')
const readmeTarget = join(releaseDir, '安装说明.txt')
if (existsSync(readmeSource)) {
  copyFileSync(readmeSource, readmeTarget)
}

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
  const nsisMatch = name.match(/^BearPassword(?: Setup)?(?:\s[\d.]+)?\.exe$/i)
  if (nsisMatch) {
    renameArtifact(name, 'BearPassword-Setup.exe')
    continue
  }

  const zipMatch = name.match(/^BearPassword-(?:[\d.]+-win|win-x64)\.zip$/i)
  if (zipMatch && name !== 'BearPassword-win-x64.zip') {
    renameArtifact(name, 'BearPassword-win-x64.zip')
  }
}

const setupExe = join(releaseDir, 'BearPassword-Setup.exe')
const distZip = join(releaseDir, 'BearPassword-Windows-安装包.zip')

if (existsSync(setupExe)) {
  const files = ['BearPassword-Setup.exe']
  if (existsSync(readmeTarget)) {
    files.push('安装说明.txt')
  }
  execSync(`cd "${releaseDir}" && rm -f "${distZip}" && zip -r "${distZip}" ${files.map((f) => `"${f}"`).join(' ')}`, {
    stdio: 'inherit'
  })
  console.log(`[after-win-build] 已生成分发包：${distZip}`)
} else {
  console.warn('[after-win-build] 未找到 BearPassword-Setup.exe，跳过 zip 分包')
}
