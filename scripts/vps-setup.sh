#!/bin/bash
# ============================================================
# Zaitun VPS Deployment Script
# Run this on your VPS (Ubuntu/Debian) as root or with sudo
# ============================================================
set -e

DOMAIN="zaitun.pyhood.com"
APP_DIR="/var/www/zaitun"
APP_USER="zaitun"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     Zaitun - VPS Deployment Setup           ║"
echo "║     Domain: $DOMAIN"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ---- Step 1: System Update ----
echo "[1/7] System update..."
apt-get update -qq && apt-get upgrade -y -qq

# ---- Step 2: Install Node.js 22 ----
echo "[2/7] Installing Node.js 22..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "  Node.js: $(node -v)"

# ---- Step 3: Install PM2 globally ----
echo "[3/7] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null || true

# ---- Step 4: Install Nginx ----
echo "[4/7] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# ---- Step 5: Setup App Directory ----
echo "[5/7] Setting up app directory..."
id -u "$APP_USER" &>/dev/null || useradd -r -s /bin/false "$APP_USER"
mkdir -p "$APP_DIR/db"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ---- Step 6: SSL with Certbot ----
echo "[6/7] Setting up SSL..."
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || \
  echo "  SSL pending - run 'certbot --nginx -d $DOMAIN' after DNS is pointed"

# ---- Step 7: Nginx Config ----
echo "[7/7] Configuring Nginx..."
cat > "/etc/nginx/sites-available/$DOMAIN" << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Static files - long cache
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Block sensitive paths
    location ~ /\.(env|git|prisma) {
        deny all;
        return 404;
    }
}
NGINXEOF

ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✅ VPS Setup Complete!"
echo ""
echo "═══════════════════════════════════════"
echo "  NEXT STEPS:"
echo "═══════════════════════════════════════"
echo ""
echo "  1. Upload the zip to VPS:"
echo "     scp zaitun-deploy.zip root@YOUR_VPS_IP:/tmp/"
echo ""
echo "  2. Extract and start:"
echo "     cd /var/www/zaitun"
echo "     unzip /tmp/zaitun-deploy.zip"
echo "     mv zaitun-deploy/* . && rm -rf zaitun-deploy"
echo "     echo 'ADMIN_EMAIL=your@email.com' >> .env"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save"
echo ""
echo "  3. Point DNS:"
echo "     A record: $DOMAIN → YOUR_VPS_IP"
echo ""
echo "  4. After DNS propagation, get SSL:"
echo "     certbot --nginx -d $DOMAIN"
echo ""