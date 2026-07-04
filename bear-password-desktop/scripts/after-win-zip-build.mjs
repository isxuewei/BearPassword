import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { releaseDir } from '../../scripts/release-dir.mjs'

const zipPath = join(releaseDir, 'BearPassword-win-x64.zip')

const extraArtifacts = [
  'BearPassword-Setup.exe',
  'BearPassword-Setup.exe.blockmap',
  'latest.yml',
  '安装说明.txt',
  'win-unpacked',
  'builder-debug.yml',
  'builder-effective-config.yaml'
]

if (!existsSync(releaseDir)) {
  console.warn('[after-win-zip-build] release 目录不存在，跳过')
  process.exit(0)
}

for (const name of readdirSync(releaseDir)) {
  const zipMatch = name.match(/^BearPassword-win-x64\.[\d.]+\.zip$/i)
  if (zipMatch) {
    const from = join(releaseDir, name)
    if (existsSync(zipPath)) {
      rmSync(zipPath, { force: true })
    }
    renameSync(from, zipPath)
  }
}

for (const name of extraArtifacts) {
  rmSync(join(releaseDir, name), { recursive: true, force: true })
}

if (existsSync(zipPath)) {
  console.log(`[after-win-zip-build] Windows 便携包：${zipPath}`)
} else {
  console.warn('[after-win-zip-build] 未生成 BearPassword-win-x64.zip')
}
