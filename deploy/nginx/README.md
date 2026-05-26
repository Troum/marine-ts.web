# Nginx: marin-ts.com и api.marin-ts.com

## api.marin-ts.com — ошибка `options-ssl-nginx.conf`

Certbot добавляет в vhost:

```nginx
include /etc/letsencrypt/options-ssl-nginx.conf;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
```

Если файлов нет, `nginx -t` и `certbot --nginx` падают.

```bash
cd /var/www/marin-ts.com
git pull
sudo bash deploy/nginx/install-letsencrypt-snippets.sh
sudo cp deploy/nginx/api.marin-ts.com.conf /etc/nginx/sites-available/api.marin-ts.com.conf
```

**Зоны `limit_req_zone`** — только **один раз** в `http { }`. Если уже есть (как у sibyllon) — **не** копируйте `nginx-http-limits.conf.example` в `conf.d/`.

Проверка:

```bash
sudo nginx -T 2>/dev/null | grep limit_req_zone
```

Если зон нет — добавьте в `nginx.conf` содержимое из `nginx-http-limits.conf.example` (без отдельного include в conf.d, чтобы не дублировать).

**Ошибка `api_general is already bound`:** удалите дубликат:

```bash
sudo rm -f /etc/nginx/conf.d/marine-http-limits.conf
# и уберите строку include ... marine-http-limits.conf из nginx.conf
sudo nginx -t
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Исправления в `api.marin-ts.com.conf` относительно сломанного certbot-варианта:

- HTTP `:80` → **301 на HTTPS** (вместо `return 404`)
- `http2 on` вместо устаревшего `listen ... http2`
- выровнены блоки `location /storage/`

---

# Nginx: marin-ts.com

## Что настроено

| Задача | Реализация |
|--------|------------|
| 301 со старых URL | `legacy-redirects.map` + `map $uri` в `marin-ts.com.conf` |
| HTTP → HTTPS | отдельный `server` на :80 → `https://marin-ts.com` |
| www → non-www | `server_name www.marin-ts.com` на :443 → 301 на apex |
| `/services` → `/ship-repair` | в map и в Nuxt `routeRules` |
| robots.txt / sitemap.xml | файлы в `public/`, отдаются через Nuxt |

## Установка на сервере

```bash
sudo mkdir -p /etc/nginx/maps
sudo cp legacy-redirects.map /etc/nginx/maps/marin-ts-legacy-redirects.map
sudo cp marin-ts.com.conf /etc/nginx/sites-available/marin-ts.com.conf
sudo ln -sf /etc/nginx/sites-available/marin-ts.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### TLS (если сертификата ещё нет)

```bash
sudo certbot certonly --nginx -d marin-ts.com -d www.marin-ts.com
```

Пока нет HTTPS, можно временно оставить только прежний `listen 80` блок и подключить `legacy-redirects.map` через `include` внутри него — но для продакшена нужен HTTPS.

### Ошибка `map_hash_bucket_size: 64`

В `marin-ts.com.conf` уже задано `map_hash_bucket_size 256;` перед `map $uri`. Если ошибка останется — попробуйте `512` или добавьте ту же строку в `http { }` в `/etc/nginx/nginx.conf`.

### Проверка редиректов

```bash
curl -sI http://marin-ts.com/ru | grep -i location
curl -sI https://marin-ts.com/services | grep -i location
curl -sI https://www.marin-ts.com/ | grep -i location
```

Ожидаемо: `Location: https://marin-ts.com/...` и код `301`.

## Яндекс.Метрика

Используется модуль [nuxt-yandex-metrika](https://www.npmjs.com/package/nuxt-yandex-metrika) (Nuxt 4, SSR через `@nuxt/scripts` + `useHead`).

На сервере в `.env` **до** `npm run build`:

```env
NUXT_PUBLIC_YANDEX_METRIKA_ID=86888216
```

Поведение: `defer: false` (первый просмотр при загрузке SSR-страницы), `hit` после `router.isReady()` при клиентских переходах. `/admin/*` не трекается (`app/plugins/yandex-metrika.ts`).

Заголовки `Clear-Site-Data` / `Cache-Control: no-store` убраны из `marin-ts.com.conf` — они ломали Cmd+Shift+R (сброс cookies) и мешали нормальной загрузке после SSR.
