import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'BearPassword',
  description: '简洁、安全、专业的密码管理浏览器扩展',
  version: '26.6.16',
  icons: {
    16: 'public/icons/icon-16.png',
    32: 'public/icons/icon-32.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png'
  },
  action: {
    default_title: 'BearPassword',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'public/icons/icon-16.png',
      32: 'public/icons/icon-32.png',
      48: 'public/icons/icon-48.png',
      128: 'public/icons/icon-128.png'
    }
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  permissions: ['storage', 'activeTab', 'tabs', 'scripting', 'contextMenus'],
  host_permissions: ['http://127.0.0.1:6892/*', '<all_urls>'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: true
    }
  ],
  web_accessible_resources: [
    {
      resources: ['public/icons/*'],
      matches: ['<all_urls>']
    }
  ]
})
