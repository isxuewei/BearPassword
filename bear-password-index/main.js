const API_BASE = 'https://bear-password.xuewei.fun/api'

const downloads = {
  mac: { url: null, version: null },
  win: { url: null, version: null },
  extension: { url: null, version: null },
}

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('win')) return 'win'
  return 'mac'
}

async function fetchLatestVersion(system) {
  const res = await fetch(`${API_BASE}/version/latest?system=${encodeURIComponent(system)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json?.data ?? null
}

function setText(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

function openDownload(platform) {
  const info = downloads[platform]
  if (!info?.url) return false
  window.open(info.url, '_blank', 'noopener,noreferrer')
  return true
}

function bindDownloadLink(id, platform) {
  const el = document.getElementById(id)
  if (!el) return
  el.addEventListener('click', (e) => {
    if (!downloads[platform]?.url) return
    e.preventDefault()
    openDownload(platform)
  })
}

function bindExtensionDownload() {
  const triggerDownload = () => {
    if (!openDownload('extension')) return
    document.getElementById('extension-install')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  document.getElementById('cta-download-extension')?.addEventListener('click', (e) => {
    if (!downloads.extension?.url) return
    e.preventDefault()
    triggerDownload()
  })

  document.getElementById('download-extension')?.addEventListener('click', (e) => {
    if (!downloads.extension?.url) {
      e.preventDefault()
      document.getElementById('extension-install')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    e.preventDefault()
    triggerDownload()
  })
}

async function loadVersions() {
  const fallback = { version: '26.6.12', url: null }

  try {
    const [macData, winData, extensionData] = await Promise.all([
      fetchLatestVersion('MacOS').catch(() => null),
      fetchLatestVersion('Windows').catch(() => null),
      fetchLatestVersion('Extension').catch(() => null),
    ])

    if (macData?.versionCode) {
      downloads.mac.version = macData.versionCode
      downloads.mac.url = macData.downloadUrl
    } else {
      downloads.mac.version = fallback.version
    }

    if (winData?.versionCode) {
      downloads.win.version = winData.versionCode
      downloads.win.url = winData.downloadUrl
    } else {
      downloads.win.version = fallback.version
    }

    if (extensionData?.versionCode) {
      downloads.extension.version = extensionData.versionCode
      downloads.extension.url = extensionData.downloadUrl
    } else {
      downloads.extension.version = fallback.version
    }
  } catch {
    downloads.mac.version = fallback.version
    downloads.win.version = fallback.version
    downloads.extension.version = fallback.version
  }

  setText('version-mac', `v${downloads.mac.version}`)
  setText('version-win', `v${downloads.win.version}`)
  setText('cta-version-mac', `Apple Silicon · v${downloads.mac.version}`)
  setText('cta-version-win', `x64 · v${downloads.win.version}`)
  setText('cta-version-extension', `Manifest V3 · v${downloads.extension.version}`)

  const platform = detectPlatform()
  const primary = downloads[platform]
  const heroBtn = document.getElementById('hero-download')
  const heroLabel = document.getElementById('hero-download-label')

  if (heroBtn && heroLabel) {
    const label = platform === 'mac' ? '下载 macOS 版' : '下载 Windows 版'
    heroLabel.textContent = label
    if (primary?.url) {
      heroBtn.href = primary.url
      heroBtn.target = '_blank'
      heroBtn.rel = 'noopener noreferrer'
    }
  }

  if (downloads.mac.url) {
    const macBtn = document.getElementById('download-mac')
    if (macBtn) {
      macBtn.href = downloads.mac.url
      macBtn.target = '_blank'
      macBtn.rel = 'noopener noreferrer'
    }
    const ctaMac = document.getElementById('cta-download-mac')
    if (ctaMac) ctaMac.href = downloads.mac.url
  }

  if (downloads.win.url) {
    const winBtn = document.getElementById('download-win')
    if (winBtn) {
      winBtn.href = downloads.win.url
      winBtn.target = '_blank'
      winBtn.rel = 'noopener noreferrer'
    }
    const ctaWin = document.getElementById('cta-download-win')
    if (ctaWin) ctaWin.href = downloads.win.url
  }

  if (downloads.extension.url) {
    const ctaExt = document.getElementById('cta-download-extension')
    if (ctaExt) ctaExt.href = downloads.extension.url
    const productExt = document.getElementById('download-extension')
    if (productExt) productExt.href = downloads.extension.url
  }
}

function initNav() {
  const header = document.querySelector('.site-header')
  const toggle = document.querySelector('.nav__toggle')
  const menu = document.querySelector('.nav__menu')

  window.addEventListener('scroll', () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 20)
  }, { passive: true })

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true'
    toggle.setAttribute('aria-expanded', String(!open))
    menu?.classList.toggle('is-open', !open)
  })

  menu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      toggle?.setAttribute('aria-expanded', 'false')
      menu?.classList.remove('is-open')
    })
  })
}

function observeRevealElements(elements) {
  if (!elements.length) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    elements.forEach((el) => el.classList.add('is-visible'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
  )

  elements.forEach((el) => observer.observe(el))
}

function registerReveal(selector, options = {}) {
  const { variant = '', stagger = 0, baseDelay = 0 } = options
  const nodes = document.querySelectorAll(selector)
  const elements = []

  nodes.forEach((el, index) => {
    el.classList.add('reveal')
    if (variant) {
      variant.split(' ').forEach((name) => el.classList.add(name))
    }
    const delay = baseDelay + index * stagger
    if (delay > 0) {
      el.style.setProperty('--reveal-delay', `${delay}ms`)
    }
    elements.push(el)
  })

  return elements
}

function initHeroEntrance() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const sequence = [
    { selector: '.hero__eyebrow', delay: 80 },
    { selector: '.hero__title', delay: 160 },
    { selector: '.hero__desc', delay: 260 },
    { selector: '.hero__actions', delay: 360 },
    { selector: '.hero__meta', delay: 460 },
    { selector: '.hero__preview', delay: 320, float: true },
  ]

  for (const item of sequence) {
    const el = document.querySelector(item.selector)
    if (!el) continue
    el.classList.add('hero-entrance')
    if (item.float) el.classList.add('hero-entrance--float')
    el.style.setProperty('--hero-delay', `${item.delay}ms`)
  }
}

function initReveal() {
  const elements = [
    ...registerReveal('.section__header'),
    ...registerReveal('.feature-card', { variant: 'reveal--scale', stagger: 90 }),
    ...registerReveal('.product-card', { variant: 'reveal--scale', stagger: 120 }),
    ...registerReveal('.security__content', { variant: 'reveal--left' }),
    ...registerReveal('.security__visual', { variant: 'reveal--right', baseDelay: 120 }),
    ...registerReveal('.security__steps li', { stagger: 100, baseDelay: 180 }),
    ...registerReveal('.download-cta__content'),
    ...registerReveal('.download-card', { variant: 'reveal--scale', stagger: 100 }),
    ...registerReveal('.extension-install', { baseDelay: 80 }),
    ...registerReveal('.download-cta__hint', { baseDelay: 160 }),
    ...registerReveal('.site-footer__brand'),
    ...registerReveal('.site-footer__links', { baseDelay: 80 }),
    ...registerReveal('.site-footer__copy', { baseDelay: 160 }),
  ]

  observeRevealElements(elements)
}

function initHeroCarousel() {
  const carousel = document.querySelector('.hero-carousel')
  if (!carousel) return

  const slides = [...carousel.querySelectorAll('.hero-carousel__slide')]
  const dots = [...carousel.querySelectorAll('.hero-carousel__dot')]
  let index = 0
  let timer = null

  function goTo(nextIndex) {
    index = (nextIndex + slides.length) % slides.length
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index))
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index)
      dot.setAttribute('aria-selected', String(i === index))
    })
  }

  function next() {
    goTo(index + 1)
  }

  function startAutoplay() {
    clearInterval(timer)
    timer = setInterval(next, 2000)
  }

  function resetAutoplay() {
    startAutoplay()
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i)
      resetAutoplay()
    })
  })

  carousel.addEventListener('mouseenter', () => clearInterval(timer))
  carousel.addEventListener('mouseleave', startAutoplay)

  startAutoplay()
}

document.addEventListener('DOMContentLoaded', () => {
  initNav()
  initHeroEntrance()
  initReveal()
  initHeroCarousel()
  bindDownloadLink('cta-download-mac', 'mac')
  bindDownloadLink('cta-download-win', 'win')
  bindExtensionDownload()
  void loadVersions()
})
