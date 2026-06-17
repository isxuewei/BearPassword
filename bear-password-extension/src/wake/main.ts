import { t } from '@/locales'
import { getSystemLocale } from '@/shared/locale/locale'
import { triggerDesktopProtocolUrl } from '@/shared/utils/desktopProtocol'
import './wake.css'

const locale = getSystemLocale()

function setText(id: string, text: string): void {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

function renderSteps(): void {
  const list = document.getElementById('wake-steps')
  if (!list) return

  const steps = [
    t('wake.step1', locale),
    t('wake.step2', locale),
    t('wake.step3', locale)
  ]

  list.innerHTML = steps.map((step) => `<li>${step}</li>`).join('')
}

function render(): void {
  const logo = document.getElementById('wake-logo') as HTMLImageElement | null
  if (logo) logo.src = chrome.runtime.getURL('public/icons/logo.svg')

  document.title = t('wake.pageTitle', locale)
  setText('wake-title', t('wake.title', locale))
  setText('wake-lead', t('wake.lead', locale))
  renderSteps()
  setText('wake-retry', t('wake.retry', locale))
  setText('wake-note', t('wake.note', locale))
}

function tryWake(): void {
  triggerDesktopProtocolUrl()
}

document.getElementById('wake-retry')?.addEventListener('click', tryWake)

render()
window.setTimeout(tryWake, 300)
