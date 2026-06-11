import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const pkg = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
const outDir = path.join(rootDir, 'release')
const zipName = `bear-password-extension-v${pkg.version}.zip`
const zipPath = path.join(outDir, zipName)

try {
  await stat(path.join(distDir, 'manifest.json'))
} catch {
  throw new Error('dist/manifest.json 不存在，请先执行 npm run build')
}

await mkdir(outDir, { recursive: true })

execSync(`cd "${distDir}" && zip -r -q "${zipPath}" . -x "*.DS_Store"`, {
  stdio: 'inherit'
})

console.log(`已生成: release/${zipName}`)
