import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const releaseDir = path.join(rootDir, 'release')
const pkg = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
const zipName = `bear-password-index-v${pkg.version}.zip`
const zipPath = path.join(releaseDir, zipName)

const deployFiles = ['index.html', 'styles.css', 'main.js']
const deployDirs = ['assets']

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })

for (const file of deployFiles) {
  await cp(path.join(rootDir, file), path.join(distDir, file))
}

for (const dir of deployDirs) {
  await cp(path.join(rootDir, dir), path.join(distDir, dir), { recursive: true })
}

await mkdir(releaseDir, { recursive: true })
execSync(`cd "${distDir}" && zip -r -q "${zipPath}" . -x "*.DS_Store"`, {
  stdio: 'inherit',
})

const { size } = await stat(zipPath)
const sizeMb = (size / 1024 / 1024).toFixed(2)

console.log(`已生成 dist/ 目录`)
console.log(`已生成 release/${zipName} (${sizeMb} MB)`)
