import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = process.cwd();
const coverDir = path.join(root, "bear-password-index/assets/covers");

const assetPath = (relativePath) => path.join(root, relativePath);

async function dataUri(filePath, mime) {
  const buffer = await fs.readFile(filePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function screenshotCard({ id, x, y, width, height, image, rotate = 0, radius = 34, opacity = 1 }) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  return `
    <g transform="rotate(${rotate} ${cx} ${cy})" opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="rgba(255,255,255,0.68)" filter="url(#shadow-strong)"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
      <clipPath id="clip-${id}">
        <rect x="${x + 4}" y="${y + 4}" width="${width - 8}" height="${height - 8}" rx="${radius - 4}"/>
      </clipPath>
      <image href="${image}" x="${x + 4}" y="${y + 4}" width="${width - 8}" height="${height - 8}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${id})"/>
    </g>`;
}

function badge({ x, y, text, accent = "#2ec4b6", width }) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="54" rx="27" fill="rgba(255,255,255,0.78)" stroke="rgba(103,110,229,0.16)" stroke-width="1.4" filter="url(#shadow-soft)"/>
      <circle cx="${x + 28}" cy="${y + 27}" r="8" fill="${accent}"/>
      <circle cx="${x + 28}" cy="${y + 27}" r="16" fill="${accent}" opacity="0.12"/>
      <text x="${x + 52}" y="${y + 35}" class="badge-text">${escapeXml(text)}</text>
    </g>`;
}

function impactTag({ x, y, text, width, fill, color = "#fff" }) {
  return `
    <g filter="url(#shadow-punch)">
      <rect x="${x}" y="${y}" width="${width}" height="82" rx="22" fill="${fill}"/>
      <text x="${x + width / 2}" y="${y + 56}" text-anchor="middle" class="impact" fill="${color}">${escapeXml(text)}</text>
    </g>`;
}

function svgTemplate(variant, assets) {
  const isWide = variant.key === "wide";
  const titleFont = isWide ? 112 : 98;
  const titleX = isWide ? 112 : 88;
  const titleY = isWide ? 414 : 382;
  const titleGap = isWide ? 116 : 104;
  const brandX = isWide ? 112 : 88;
  const brandY = isWide ? 96 : 88;
  const brandW = isWide ? 405 : 374;
  const brandH = isWide ? 86 : 78;
  const iconSize = isWide ? 60 : 54;
  const subtitleY = titleY + titleGap + (isWide ? 90 : 78);

  const mockups = isWide
    ? `
      ${screenshotCard({
        id: "autofill-wide",
        x: 1015,
        y: 265,
        width: 560,
        height: 380,
        image: assets.autofill,
        rotate: 3,
        radius: 30,
        opacity: 0.92,
      })}
      ${screenshotCard({
        id: "vault-wide",
        x: 1040,
        y: 505,
        width: 800,
        height: 520,
        image: assets.vault,
        rotate: -1.2,
      })}
      <g filter="url(#shadow-strong)">
        <rect x="935" y="885" width="126" height="126" rx="34" fill="url(#purple-card)"/>
        <text x="998" y="960" text-anchor="middle" class="dots">•••</text>
      </g>`
    : `
      ${screenshotCard({
        id: "dashboard-classic",
        x: 840,
        y: 702,
        width: 650,
        height: 430,
        image: assets.dashboard,
        rotate: -1.4,
        radius: 32,
        opacity: 0.90,
      })}
      <g filter="url(#shadow-strong)">
        <rect x="738" y="1008" width="112" height="112" rx="30" fill="url(#purple-card)"/>
        <text x="794" y="1075" text-anchor="middle" class="dots classic-dots">•••</text>
      </g>`;

  const badges = isWide
    ? `
      ${badge({ x: 112, y: 812, text: "本地加密", width: 188 })}
      ${badge({ x: 318, y: 812, text: "TOTP", width: 150, accent: "#676ee5" })}
      ${badge({ x: 486, y: 812, text: "私有化部署", width: 232, accent: "#f2b84b" })}`
    : `
      ${badge({ x: 88, y: 748, text: "本地加密", width: 178 })}
      ${badge({ x: 284, y: 748, text: "TOTP", width: 144, accent: "#676ee5" })}
      ${badge({ x: 446, y: 748, text: "私有化部署", width: 224, accent: "#f2b84b" })}`;

  const impactTags = isWide
    ? `
      ${impactTag({ x: 112, y: 230, text: "安全", width: 160, fill: "url(#tag-purple)" })}
      ${impactTag({ x: 292, y: 230, text: "开源", width: 160, fill: "url(#tag-teal)" })}
      ${impactTag({ x: 472, y: 230, text: "免费", width: 160, fill: "url(#tag-gold)", color: "#241a05" })}`
    : `
      ${impactTag({ x: 88, y: 212, text: "安全", width: 144, fill: "url(#tag-purple)" })}
      ${impactTag({ x: 248, y: 212, text: "开源", width: 144, fill: "url(#tag-teal)" })}
      ${impactTag({ x: 408, y: 212, text: "免费", width: 144, fill: "url(#tag-gold)", color: "#241a05" })}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${variant.width}" height="${variant.height}" viewBox="0 0 ${variant.width} ${variant.height}">
  <defs>
    <style>
      @font-face {
        font-family: BearCoverCN;
        src: url("${assets.font}");
      }
      .title {
        font-family: BearCoverCN, PingFang SC, Microsoft YaHei, sans-serif;
        font-size: ${titleFont}px;
        font-weight: 900;
        fill: #17142a;
        letter-spacing: 0;
      }
      .impact {
        font-family: Inter, SF Pro Display, Arial, sans-serif;
        font-size: ${isWide ? 48 : 42}px;
        font-weight: 950;
        letter-spacing: 0;
      }
      .brand-name {
        font-family: Inter, SF Pro Display, Arial, sans-serif;
        font-size: ${isWide ? 30 : 27}px;
        font-weight: 850;
        fill: #17142a;
        letter-spacing: 0;
      }
      .brand-sub {
        font-family: Inter, SF Pro Display, Arial, sans-serif;
        font-size: ${isWide ? 18 : 16}px;
        font-weight: 700;
        fill: #6c6681;
        letter-spacing: 1.4px;
      }
      .subtitle {
        font-family: BearCoverCN, PingFang SC, Microsoft YaHei, sans-serif;
        font-size: ${isWide ? 34 : 29}px;
        fill: #4f4a65;
        letter-spacing: 0;
      }
      .badge-text {
        font-family: Inter, PingFang SC, Microsoft YaHei, Arial, sans-serif;
        font-size: ${isWide ? 23 : 20}px;
        font-weight: 800;
        fill: #514a70;
        letter-spacing: 0;
      }
      .dots {
        font-family: Inter, Arial, sans-serif;
        font-size: 52px;
        font-weight: 900;
        fill: #fff;
      }
      .classic-dots {
        font-size: 46px;
      }
    </style>
    <linearGradient id="fade-wide" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.94"/>
      <stop offset="36%" stop-color="#fff" stop-opacity="0.76"/>
      <stop offset="74%" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fade-classic" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.94"/>
      <stop offset="46%" stop-color="#fff" stop-opacity="0.78"/>
      <stop offset="84%" stop-color="#fff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="lower-glow" cx="18%" cy="82%" r="45%">
      <stop offset="0%" stop-color="#676ee5" stop-opacity="0.18"/>
      <stop offset="70%" stop-color="#676ee5" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="purple-card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#676ee5"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <linearGradient id="tag-purple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4d56e8"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="tag-teal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08a99a"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="tag-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd76a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="shadow-soft" x="-30%" y="-40%" width="160%" height="190%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#5248a4" flood-opacity="0.12"/>
    </filter>
    <filter id="shadow-strong" x="-24%" y="-24%" width="160%" height="160%">
      <feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#4c4396" flood-opacity="0.22"/>
    </filter>
    <filter id="shadow-punch" x="-25%" y="-45%" width="160%" height="210%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#4c4396" flood-opacity="0.24"/>
      <feDropShadow dx="0" dy="4" stdDeviation="0" flood-color="#ffffff" flood-opacity="0.7"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="#f7f4ff"/>
  <image href="${assets.bg}" x="0" y="0" width="${variant.width}" height="${variant.height}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="100%" height="100%" fill="url(#${isWide ? "fade-wide" : "fade-classic"})"/>
  <rect width="100%" height="100%" fill="url(#lower-glow)"/>

  <g>
    <rect x="${brandX}" y="${brandY}" width="${brandW}" height="${brandH}" rx="28" fill="rgba(255,255,255,0.72)" stroke="rgba(103,110,229,0.18)" stroke-width="1.4" filter="url(#shadow-soft)"/>
    <image href="${assets.icon}" x="${brandX + 14}" y="${brandY + 13}" width="${iconSize}" height="${iconSize}"/>
    <text x="${brandX + iconSize + 34}" y="${brandY + 38}" class="brand-name">BearPassword</text>
    <text x="${brandX + iconSize + 34}" y="${brandY + 64}" class="brand-sub">MIT Open Source</text>
  </g>

  ${impactTags}

  <g filter="url(#shadow-soft)">
    <text x="${titleX}" y="${titleY}" class="title">开源免费的</text>
    <text x="${titleX}" y="${titleY + titleGap}" class="title">密码管理器</text>
  </g>

  <text x="${titleX}" y="${subtitleY}" class="subtitle">
    <tspan x="${titleX}" dy="0">桌面保险库 + 浏览器自动填充，账号、密码与</tspan>
    <tspan x="${titleX}" dy="${isWide ? 52 : 46}">两步验证码统一安全管理。</tspan>
  </text>

  ${badges}
  ${mockups}

  <rect x="0" y="${variant.height - 2}" width="${variant.width}" height="2" fill="rgba(103,110,229,0.22)"/>
</svg>`;
}

await fs.mkdir(coverDir, { recursive: true });

const baseAssets = {
  font: await dataUri(assetPath("bear-password-web/src/assets/fonts/TsangerJinKai05-W04.ttf"), "font/ttf"),
  icon: await dataUri(assetPath("bear-password-desktop/resources/icon.png"), "image/png"),
  dashboard: await dataUri(assetPath("bear-password-index/assets/screenshots/4首页.png"), "image/png"),
  vault: await dataUri(assetPath("bear-password-index/assets/screenshots/5密码库.png"), "image/png"),
  autofill: await dataUri(assetPath("bear-password-index/assets/screenshots/16自动填充.png"), "image/png"),
};

const variants = [
  {
    key: "wide",
    width: 1920,
    height: 1080,
    bgPath: assetPath("bear-password-index/assets/covers/bear-password-cover-bg-16x9.png"),
    output: path.join(coverDir, "bear-password-video-cover-16x9.png"),
  },
  {
    key: "classic",
    width: 1600,
    height: 1200,
    bgPath: assetPath("bear-password-index/assets/covers/bear-password-cover-bg-4x3.png"),
    output: path.join(coverDir, "bear-password-video-cover-4x3.png"),
  },
];

for (const variant of variants) {
  const svg = svgTemplate(variant, {
    ...baseAssets,
    bg: await dataUri(variant.bgPath, "image/png"),
  });
  await sharp(Buffer.from(svg)).png().toFile(variant.output);
  console.log(`${variant.width}x${variant.height}: ${variant.output}`);
}
