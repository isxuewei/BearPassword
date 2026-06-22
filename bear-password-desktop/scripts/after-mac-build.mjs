import { execSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { releaseDir } from '../../scripts/release-dir.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const macAssetsDir = join(root, 'build/mac')
const dmgMountPoint = join(releaseDir, '.dmg-mount')
const dmgStagingDir = join(releaseDir, '.dmg-staging')
const dmgVolumeName = 'BearPassword'
const dmgPath = join(releaseDir, 'BearPassword.dmg')

const helpers = ['安装说明.txt']

const extraArtifacts = [
  'BearPassword.zip',
  'BearPassword.zip.blockmap',
  'BearPassword.dmg.blockmap',
  'BearPassword-mac-安装包.zip',
  'latest-mac.yml',
  '安装说明.txt',
  'BearPassword.app',
  'mac-arm64',
  'builder-debug.yml',
  'builder-effective-config.yaml'
]

if (!existsSync(releaseDir)) {
  console.warn('[after-mac-build] release 目录不存在，跳过')
  process.exit(0)
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
  const match = name.match(/^BearPassword-.+\.dmg$/)
  if (!match) continue
  renameArtifact(name, 'BearPassword.dmg')
}

function injectMacHelpersIntoDmg() {
  if (!existsSync(dmgPath)) {
    console.warn(`[after-mac-build] 未找到 DMG，跳过写入安装说明：${dmgPath}`)
    return
  }

  const tempDmg = join(releaseDir, 'BearPassword-inject.dmg')

  rmSync(dmgStagingDir, { recursive: true, force: true })
  rmSync(dmgMountPoint, { recursive: true, force: true })
  rmSync(tempDmg, { force: true })
  mkdirSync(dmgStagingDir, { recursive: true })
  mkdirSync(dmgMountPoint, { recursive: true })

  try {
    execSync(
      `hdiutil attach "${dmgPath}" -nobrowse -noverify -noautoopen -mountpoint "${dmgMountPoint}"`,
      { stdio: 'inherit' }
    )
    execSync(`cp -a "${dmgMountPoint}/." "${dmgStagingDir}/"`, { stdio: 'inherit' })
    execSync(`hdiutil detach "${dmgMountPoint}"`, { stdio: 'inherit' })

    for (const name of helpers) {
      const source = join(macAssetsDir, name)
      const target = join(dmgStagingDir, name)
      copyFileSync(source, target)
    }

    rmSync(join(dmgStagingDir, '.fseventsd'), { recursive: true, force: true })

    execSync(
      `hdiutil create -volname "${dmgVolumeName}" -srcfolder "${dmgStagingDir}" -ov -format UDZO -o "${tempDmg}"`,
      { stdio: 'inherit' }
    )

    rmSync(dmgPath, { force: true })
    renameSync(tempDmg, dmgPath)

    console.log(`[after-mac-build] 已重建 DMG 并写入：${helpers.join('、')}`)
  } catch (error) {
    console.error('[after-mac-build] 向 DMG 写入安装说明失败', error)
    process.exitCode = 1
  } finally {
    rmSync(dmgStagingDir, { recursive: true, force: true })
    rmSync(dmgMountPoint, { recursive: true, force: true })
    rmSync(tempDmg, { force: true })
  }
}

if (process.platform === 'darwin') {
  injectMacHelpersIntoDmg()
} else {
  console.warn('[after-mac-build] 非 macOS 环境，跳过向 DMG 写入安装说明')
}

for (const name of extraArtifacts) {
  rmSync(join(releaseDir, name), { recursive: true, force: true })
}

if (existsSync(dmgPath)) {
  console.log(`[after-mac-build] Mac 产物：${dmgPath}`)
} else {
  console.warn('[after-mac-build] 未生成 BearPassword.dmg')
}
