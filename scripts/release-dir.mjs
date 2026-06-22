import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export { repoRoot }
export const releaseDir = join(repoRoot, 'release')
