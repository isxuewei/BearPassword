import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const screenshotsDir = path.join(rootDir, 'assets', 'screenshots')
const manifestPath = path.join(screenshotsDir, 'manifest.json')

/** 命名规则：序号 + 名称，如 1首页.png、12自动填充.webp */
const SCREENSHOT_FILENAME_RE = /^(\d+)(.+)\.(png|jpe?g|webp)$/i

function sortByOrder(a, b) {
  return Number(a.match(/^(\d+)/)[1]) - Number(b.match(/^(\d+)/)[1])
}

const entries = await readdir(screenshotsDir, { withFileTypes: true })
const files = entries
  .filter((entry) => entry.isFile() && entry.name !== 'manifest.json')
  .map((entry) => entry.name)
  .filter((name) => SCREENSHOT_FILENAME_RE.test(name))
  .sort(sortByOrder)

await writeFile(manifestPath, `${JSON.stringify({ files }, null, 2)}\n`, 'utf8')
console.log(`已生成 screenshots manifest（${files.length} 张）`)
