#!/bin/bash
set -e

cd "$(dirname "$0")"

echo ""
echo "========================================"
echo "  BearPassword 安装助手"
echo "========================================"
echo ""

resolve_app_path() {
  if [ -d "./BearPassword.app" ]; then
    echo "./BearPassword.app"
    return
  fi
  if [ -d "./mac-arm64/BearPassword.app" ]; then
    echo "./mac-arm64/BearPassword.app"
    return
  fi
  if [ -d "/Applications/BearPassword.app" ]; then
    echo "/Applications/BearPassword.app"
    return
  fi
  return 1
}

APP_PATH="$(resolve_app_path)" || {
  osascript <<'EOF'
display dialog "未找到 BearPassword.app\n\n请先将 BearPassword.app 放到与本脚本相同的文件夹，或拖到「应用程序」后再运行。" buttons {"好"} default button 1 with title "BearPassword 安装助手"
EOF
  exit 1
}

echo "找到应用：$APP_PATH"
echo "正在解除 macOS 下载隔离标记..."

xattr -cr "$APP_PATH"

if command -v codesign >/dev/null 2>&1; then
  codesign --force --deep --sign - "$APP_PATH" >/dev/null 2>&1 || true
fi

TARGET="/Applications/BearPassword.app"

if [ "$APP_PATH" != "$TARGET" ]; then
  echo "正在安装到「应用程序」..."
  rm -rf "$TARGET"
  cp -R "$APP_PATH" "$TARGET"
  xattr -cr "$TARGET"
  if command -v codesign >/dev/null 2>&1; then
    codesign --force --deep --sign - "$TARGET" >/dev/null 2>&1 || true
  fi
  APP_PATH="$TARGET"
fi

echo "安装完成，正在启动..."
open "$APP_PATH"

osascript <<'EOF'
display dialog "BearPassword 已安装并启动。" buttons {"好"} default button 1 with title "BearPassword 安装助手"
EOF
