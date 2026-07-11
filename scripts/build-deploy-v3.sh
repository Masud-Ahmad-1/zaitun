#!/bin/bash
set -e
BASE="/home/z/my-project"
DEPLOY="$BASE/download/zaitun-cpanel-v3"
ZIP="$BASE/download/zaitun-cpanel-v3.zip"
rm -rf "$DEPLOY" && mkdir -p "$DEPLOY"
cp -ra "$BASE/.next/standalone/." "$DEPLOY/"
cp -ra "$BASE/.next/static" "$DEPLOY/.next/static"
cp -ra "$BASE/public" "$DEPLOY/public"
mkdir -p "$DEPLOY/db"
cp "$BASE/db/custom.db" "$DEPLOY/db/custom.db"
cp "$BASE/.env" "$DEPLOY/.env" 2>/dev/null || true
cd "$BASE/download" && rm -f "$ZIP" && zip -r -q "zaitun-cpanel-v3.zip" zaitun-cpanel-v3/
SIZE=$(du -sh "$ZIP" | cut -f1)
echo "=== Done: $ZIP ($SIZE) ==="
find "$DEPLOY/.next/server/app" -name "route.js" | sort