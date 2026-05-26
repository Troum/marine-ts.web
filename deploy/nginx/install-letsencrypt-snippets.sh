#!/usr/bin/env bash
# Восстанавливает файлы, которые certbot --nginx ожидает в /etc/letsencrypt/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

sudo mkdir -p /etc/letsencrypt

if [[ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
  sudo cp "${SCRIPT_DIR}/options-ssl-nginx.conf" /etc/letsencrypt/options-ssl-nginx.conf
  sudo chmod 644 /etc/letsencrypt/options-ssl-nginx.conf
  echo "Installed /etc/letsencrypt/options-ssl-nginx.conf"
else
  echo "OK: /etc/letsencrypt/options-ssl-nginx.conf already exists"
fi

if [[ ! -f /etc/letsencrypt/ssl-dhparams.pem ]]; then
  echo "Generating /etc/letsencrypt/ssl-dhparams.pem (2048 bit, ~30s)..."
  sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
  sudo chmod 644 /etc/letsencrypt/ssl-dhparams.pem
  echo "Installed /etc/letsencrypt/ssl-dhparams.pem"
else
  echo "OK: /etc/letsencrypt/ssl-dhparams.pem already exists"
fi

echo "Done. Run: sudo nginx -t"
