#!/bin/bash
set -e
BASE="/home/z/my-project"
DEPLOY="$BASE/download/zaitun-deploy"
ZIP="$BASE/download/zaitun-deploy.zip"

rm -rf "$DEPLOY" && mkdir -p "$DEPLOY"

# 1. Standalone build
cp -ra "$BASE/.next/standalone/." "$DEPLOY/"

# 2. Static files
mkdir -p "$DEPLOY/.next/static"
cp -ra "$BASE/.next/static/." "$DEPLOY/.next/static/"

# 3. Public assets
cp -ra "$BASE/public" "$DEPLOY/public"

# 4. Database
mkdir -p "$DEPLOY/db"
cp "$BASE/db/custom.db" "$DEPLOY/db/custom.db"

# 5. Env file
cp "$BASE/.env" "$DEPLOY/.env" 2>/dev/null || echo "DATABASE_URL=file:./db/custom.db" > "$DEPLOY/.env"

# 6. Ecosystem config for PM2
cat > "$DEPLOY/ecosystem.config.js" << 'PM2EOF'
module.exports = {
  apps: [{
    name: "zaitun",
    script: "server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "0.0.0.0"
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: "512M",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
}
PM2EOF

# 7. Remove junk files
rm -rf "$DEPLOY/download" 2>/dev/null
find "$DEPLOY" -name "*.log" -delete 2>/dev/null

# 8. Zip
cd "$BASE/download"
rm -f "$ZIP"
zip -r -q "zaitun-deploy.zip" zaitun-deploy/ \
  -x "zaitun-deploy/node_modules/.cache/*" \
  -x "zaitun-deploy/.prisma/cache/*"

SIZE=$(du -sh "$ZIP" | cut -f1)
echo "=== Deployment Package Ready ==="
echo "File: $ZIP"
echo "Size: $SIZE"
echo "Files: $(find "$DEPLOY" -type f | wc -l)"