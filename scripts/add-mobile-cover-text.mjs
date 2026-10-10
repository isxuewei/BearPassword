import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = process.cwd();
const coverDir = path.join(root, "bear-password-index/assets/covers");

const covers = [
  {
    input: "/Users/xuew/Desktop/已生成图像 1.png",
    output: path.join(coverDir, "bear-password-mobile-cover-16x9.png"),
    width: 1672,
    height: 941,
    layout: "wide",
  },
  {
    input: "/Users/xuew/Desktop/已生成图像 2.png",
    output: path.join(coverDir, "bear-password-mobile-cover-4x3.png"),
    width: 1448,
    height: 1086,
    layout: "classic",
  },
];

function textBlock({ x, y, width, height, text, fill, textFill = "#ffffff", fontSize }) {
  return `
    <g filter="url(#hard-shadow)">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.round(height * 0.18)}" fill="${fill}"/>
      <text
        x="${x + width / 2}"
        y="${y + height * 0.68}"
        text-anchor="middle"
        class="cover-word"
        style="font-size:${fontSize}px; fill:${textFill};"
      >${text}</text>
    </g>`;
}

function overlaySvg({ width, height, layout }) {
  const isWide = layout === "wide";
  const blocks = isWide
    ? [
        { x: 92, y: 138, width: 410, height: 170, text: "安全", fill: "url(#purple)", fontSize: 116 },
        { x: 92, y: 338, width: 410, height: 170, text: "开源", fill: "url(#teal)", fontSize: 116 },
        { x: 92, y: 538, width: 410, height: 170, text: "免费", fill: "url(#gold)", textFill: "#1c1504", fontSize: 116 },
      ]
    : [
        { x: 72, y: 150, width: 360, height: 158, text: "安全", fill: "url(#purple)", fontSize: 104 },
        { x: 72, y: 338, width: 360, height: 158, text: "开源", fill: "url(#teal)", fontSize: 104 },
        { x: 72, y: 526, width: 360, height: 158, text: "免费", fill: "url(#gold)", textFill: "#1c1504", fontSize: 104 },
      ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .cover-word {
        font-family: "PingFang SC", "Heiti SC", "Microsoft YaHei", Arial, sans-serif;
        font-weight: 950;
        letter-spacing: 0;
      }
    </style>
    <linearGradient id="left-veil" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="38%" stop-color="#ffffff" stop-opacity="0.72"/>
      <stop offset="76%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="purple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="teal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059e93"/>
      <stop offset="100%" stop-color="#31d6a4"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe070"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="hard-shadow" x="-20%" y="-35%" width="150%" height="190%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#332970" flood-opacity="0.28"/>
      <feDropShadow dx="0" dy="4" stdDeviation="0" flood-color="#ffffff" flood-opacity="0.72"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#left-veil)"/>
  ${blocks.map(textBlock).join("")}
</svg>`;
}

await fs.mkdir(coverDir, { recursive: true });

for (const cover of covers) {
  const overlay = Buffer.from(overlaySvg(cover));
  await sharp(cover.input)
    .composite([{ input: overlay, left: 0, top: 0 }])
    .png()
    .toFile(cover.output);
  console.log(`${cover.width}x${cover.height}: ${cover.output}`);
}
