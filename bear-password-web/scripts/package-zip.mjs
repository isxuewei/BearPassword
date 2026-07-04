import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { releaseDir } from '../../scripts/release-dir.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const zipName = 'BearPassword-Web.zip'
const zipPath = path.join(releaseDir, zipName)

try {
  await stat(path.join(distDir, 'index.html'))
} catch {
  throw new Error('dist/index.html 不存在，请先执行 npm run build')
}

await mkdir(releaseDir, { recursive: true })

execSync(`cd "${distDir}" && zip -r -q "${zipPath}" . -x "*.DS_Store"`, {
  stdio: 'inherit'
})

console.log(`已生成: release/${zipName}`)
