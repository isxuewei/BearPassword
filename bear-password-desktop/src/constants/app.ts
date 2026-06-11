import packageJson from '../../package.json'

/** 应用展示版本号（与 package.json displayVersion 保持一致） */
export const APP_VERSION =
  (packageJson as { displayVersion?: string }).displayVersion ?? packageJson.version

/** 作者 GitHub 主页 */
export const AUTHOR_GITHUB_URL = 'https://github.com/isxuewei'
export const AUTHOR_NAME = '薛伟同学'
