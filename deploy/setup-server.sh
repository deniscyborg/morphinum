#!/usr/bin/env bash
# Разовая настройка сервера под магазин: nginx-блок с HTTPS, папка для образа.
# Запуск на сервере под root:
#   curl -fsSL https://raw.githubusercontent.com/deniscyborg/morphinum/main/deploy/setup-server.sh -o s.sh && bash s.sh
# Повторный запуск безопасен.
set -euo pipefail

DOMAIN="morphinum.ru"
PORT="3100"
CONF="/etc/nginx/sites-available/$DOMAIN"
LIVE="/etc/letsencrypt/live/$DOMAIN"

ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }
fail() { printf '\033[31m✗\033[0m %s\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Запустите под root"
command -v nginx >/dev/null || fail "nginx не установлен"
command -v certbot >/dev/null || fail "certbot не установлен"

# 1. Порт контейнера: свободен или уже занят нашим контейнером
if ss -ltn "( sport = :$PORT )" | grep -q LISTEN; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx morphinum; then
    ok "Порт $PORT занят контейнером morphinum — это нормально"
  else
    fail "Порт $PORT занят другим процессом: $(ss -ltnp "( sport = :$PORT )" | tail -n +2)"
  fi
else
  ok "Порт $PORT свободен"
fi

# 2. Папка, куда CI загружает образ
mkdir -p /root/morphinum
ok "Папка /root/morphinum есть"

# 3. Резервная копия настроек nginx — на случай отката
BACKUP="/root/nginx-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" -C /etc nginx
ok "Резервная копия nginx: $BACKUP"

restore_nginx() {
  warn "Откатываю настройки nginx из $BACKUP"
  rm -rf /etc/nginx && tar -xzf "$BACKUP" -C /etc
  nginx -t && systemctl reload nginx
}

# 4. Блоки с явным server_name morphinum.ru в других файлах (их оставил прежний запуск certbot)
#    убираем, иначе nginx возьмёт их вместо нового. Блок по умолчанию (default_server / server_name _)
#    не трогаем: точное имя в нашем файле всё равно важнее.
for f in /etc/nginx/sites-enabled/*; do
  real="$(readlink -f "$f")"
  [ "$real" = "$CONF" ] && continue
  grep -q "$DOMAIN" "$real" || continue
  tmp="$(mktemp)"
  awk -v dom="$DOMAIN" '
    function flush() {
      if (buf ~ dom && buf !~ /default_server/ && buf !~ /server_name[ \t]+_[ \t]*;/) { dropped++ }
      else { printf "%s", buf }
      buf = ""
    }
    {
      if (depth == 0 && $0 ~ /^[ \t]*server[ \t]*\{/) { inblock = 1 }
      if (inblock) {
        buf = buf $0 "\n"
        line = $0; sub(/#.*/, "", line)
        depth += gsub(/\{/, "{", line) - gsub(/\}/, "}", line)
        if (depth == 0) { inblock = 0; flush() }
      } else { print }
    }
    END { if (buf != "") printf "%s", buf; print dropped + 0 > "/dev/stderr" }
  ' "$real" > "$tmp" 2> "$tmp.count"
  n="$(cat "$tmp.count")"; rm -f "$tmp.count"
  if [ "$n" -gt 0 ]; then
    cat "$tmp" > "$real"
    ok "Из $real убрано блоков для $DOMAIN: $n"
  fi
  rm -f "$tmp"
done

# 5. Сертификат: используем уже выпущенный; если его нет — выпускаем, не меняя конфиги nginx
if [ ! -f "$LIVE/fullchain.pem" ]; then
  certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos \
    || { restore_nginx; fail "certbot не смог выпустить сертификат — изменения откачены"; }
fi
ok "Сертификат: $LIVE"

SSL_OPTS=""
if [ -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  SSL_OPTS="    include /etc/letsencrypt/options-ssl-nginx.conf;"
fi
if [ -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  SSL_OPTS="$SSL_OPTS"$'\n'"    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
fi

# 6. Свой блок для магазина: http → https и https → контейнер.
#    Точное имя server_name важнее блока по умолчанию, поэтому остатки в default не мешают.
{
  echo "server {"
  echo "    listen 80;"
  echo "    listen [::]:80;"
  echo "    server_name $DOMAIN www.$DOMAIN;"
  echo "    return 301 https://$DOMAIN\$request_uri;"
  echo "}"
  echo ""
  echo "server {"
  echo "    listen 443 ssl;"
  echo "    listen [::]:443 ssl;"
  echo "    server_name $DOMAIN www.$DOMAIN;"
  echo ""
  echo "    ssl_certificate $LIVE/fullchain.pem;"
  echo "    ssl_certificate_key $LIVE/privkey.pem;"
  [ -n "$SSL_OPTS" ] && echo "$SSL_OPTS"
  echo ""
  echo "    client_max_body_size 1m;"
  echo ""
  echo "    location / {"
  echo "        proxy_pass http://127.0.0.1:$PORT;"
  echo "        proxy_http_version 1.1;"
  echo "        proxy_set_header Host \$host;"
  echo "        proxy_set_header X-Real-IP \$remote_addr;"
  echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
  echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
  echo "    }"
  echo ""
  echo "    add_header X-Content-Type-Options \"nosniff\" always;"
  echo "    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;"
  echo "    add_header X-Frame-Options \"DENY\" always;"
  echo "}"
} > "$CONF"
ln -sf "$CONF" "/etc/nginx/sites-enabled/$DOMAIN"
ok "Записан $CONF"

if ! nginx -t 2>/tmp/nginx-test.log; then
  cat /tmp/nginx-test.log; restore_nginx; fail "nginx -t не прошёл — изменения откачены"
fi
systemctl reload nginx
ok "nginx перезагружен"

# 7. Итог — по содержимому страницы, а не только по коду: 200 со страницей nginx — это не магазин
page="$(curl -sk --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" || true)"
code="$(curl -sk -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" || true)"
if echo "$page" | grep -q "Morphinum"; then
  ok "https://$DOMAIN — магазин работает"
elif [ "$code" = "502" ]; then
  ok "https://$DOMAIN отвечает 502 — nginx готов, ждём контейнер: запустите CI в репозитории morphinum"
elif echo "$page" | grep -q "Welcome to nginx"; then
  fail "https://$DOMAIN всё ещё отдаёт страницу nginx — пришлите вывод: grep -n -B3 -A3 morphinum /etc/nginx/sites-enabled/default"
else
  warn "https://$DOMAIN отвечает $code"
fi
