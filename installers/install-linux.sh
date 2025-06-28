#!/bin/bash

echo "📦 Installing Taptap CLI for Linux..."

VERSION="v2.6.0"
URL="https://github.com/anuragco/Taptap-lightning-fast-command-line-tool-for-Deployment/releases/download/$VERSION/taptap-cli-linux"
TARGET="/usr/local/bin/taptap"

curl -L $URL -o taptap
chmod +x taptap
sudo mv taptap $TARGET

echo "✅ Taptap installed successfully!"
echo "➡️ Run 'taptap --version' from your terminal."
