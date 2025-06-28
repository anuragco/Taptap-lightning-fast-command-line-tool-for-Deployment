#!/bin/bash
set -e

APP_NAME="taptap-cli"
VERSION="2.4.0"
BUILD_DIR="build"
DIST_DIR="dist"
INSTALLER_ID="com.anuragco.${APP_NAME}"
PAYLOAD_DIR="${BUILD_DIR}/payload"

# Cleanup
rm -rf "$BUILD_DIR"
mkdir -p "$PAYLOAD_DIR/usr/local/bin"

# Copy binary
cp "$DIST_DIR/$APP_NAME" "$PAYLOAD_DIR/usr/local/bin/$APP_NAME"
chmod +x "$PAYLOAD_DIR/usr/local/bin/$APP_NAME"

# Build .pkg
pkgbuild \
  --root "$PAYLOAD_DIR" \
  --identifier "$INSTALLER_ID" \
  --version "$VERSION" \
  --install-location "/" \
  "${BUILD_DIR}/${APP_NAME}-macos.pkg"

echo "✅ macOS installer created: ${BUILD_DIR}/${APP_NAME}-macos.pkg"
