#!/usr/bin/env bash
# Разовая настройка сервера под магазин: nginx-блок, HTTPS, папка для образа.
# Запуск на сервере под root:
#   curl -fsSL https://raw.githubusercontent.com/deniscyborg/morphinum/main/deploy/setup-server.sh | bash
# Повторный запуск безопасен: каждый шаг проверяет, сделан ли он уже.
set -euo pipefail

DOMAIN="morphinum.ru"
PORT="3100"
CONF="/etc/nginx/sites-available/$DOMAIN"

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

restore() {
  warn "Откатываю настройки nginx из $BACKUP"
  rm -rf /etc/nginx && tar -xzf "$BACKUP" -C /etc
  nginx -t && systemctl reload nginx
}

# 4. Блоки с явным server_name morphinum.ru в других файлах (их оставил прежний запуск certbot)
#    убираем, иначе nginx возьмёт их вместо нового. Блок по умолчанию (default_server / server_name _)
#    не трогаем — только предупреждаем.
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
  grep -q "$DOMAIN" "$real" && warn "В $real ещё упоминается $DOMAIN (в блоке по умолчанию) — оставлено как есть"
done

# 5. Свой блок для магазина
if [ ! -f "$CONF" ] || ! grep -q "proxy_pass http://127.0.0.1:$PORT" "$CONF"; then
  cat > "$CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "DENY" always;
}
EOF
  ok "Записан $CONF"
else
  ok "$CONF уже настроен"
fi
ln -sf "$CONF" "/etc/nginx/sites-enabled/$DOMAIN"

if ! nginx -t 2>/tmp/nginx-test.log; then
  cat /tmp/nginx-test.log; restore; fail "nginx -t не прошёл — изменения откачены"
fi
systemctl reload nginx
ok "nginx перезагружен"

# 6. HTTPS: существующий сертификат привязывается к новому блоку, http → https
if ! certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --reinstall --redirect --non-interactive --agree-tos; then
  restore; fail "certbot не прошёл — изменения откачены"
fi
nginx -t && systemctl reload nginx
ok "HTTPS настроен"

# 7. Итог
code="$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/" || true)"
case "$code" in
  200) ok "https://$DOMAIN отвечает 200 — магазин работает" ;;
  502) ok "https://$DOMAIN отвечает 502 — nginx готов, ждём контейнер (сделайте git push в morphinum)" ;;
  *)   warn "https://$DOMAIN отвечает $code" ;;
esac
