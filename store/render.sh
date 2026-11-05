#!/usr/bin/env bash
# Renders the Chrome Web Store images from assets.html with headless Edge (or Chrome).
# Usage, from the repo root: bash store/render.sh
set -euo pipefail
cd "$(dirname "$0")"

BROWSER="${BROWSER:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
PAGE="file:///$(pwd -W 2>/dev/null || pwd)/assets.html"
mkdir -p out

shot() { # name width height
  "$BROWSER" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=1 --virtual-time-budget=6000 \
    --window-size="$2,$3" --screenshot="$(pwd -W 2>/dev/null || pwd)/out/$1.png" "$PAGE#$1" 2>/dev/null
}

shot shot1 1280 800
shot shot2 1280 800
shot shot3 1280 800
shot shot4 1280 800
shot tile 440 280
shot marquee 1400 560
ls -la out
