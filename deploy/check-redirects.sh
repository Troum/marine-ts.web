#!/usr/bin/env bash
# Проверка 301-редиректов marin-ts.com после деплоя nginx/Nuxt.
#
# Использование:
#   ./deploy/check-redirects.sh
#   BASE_URL=https://marin-ts.com ./deploy/check-redirects.sh
#   INSECURE=1 ./deploy/check-redirects.sh   # curl -k (самоподписанный TLS)
#
# Выход: 0 — все проверки OK, 1 — есть ошибки.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAP_FILE="${SCRIPT_DIR}/nginx/legacy-redirects.map"
BASE_URL="${BASE_URL:-https://marin-ts.com}"
BASE_URL="${BASE_URL%/}"

CURL=(curl -sI --max-redirs 0)
if [[ "${INSECURE:-}" == "1" ]]; then
  CURL+=(-k)
fi

LEGACY_OK=0
LEGACY_FAIL=0
CANON_OK=0
CANON_FAIL=0

fail_legacy() {
  LEGACY_FAIL=$((LEGACY_FAIL + 1))
  printf 'FAIL legacy %s\n' "$1"
  printf '     code=%s location=%s\n' "$2" "$3"
  printf '     expect=%s\n' "$4"
}

fail_canon() {
  CANON_FAIL=$((CANON_FAIL + 1))
  printf 'FAIL %s\n' "$1"
  printf '     code=%s location=%s\n' "$2" "$3"
  printf '     expect=%s\n' "$4"
}

# Нормализует Location (относительный или абсолютный) к полному URL.
resolve_location() {
  local base="$1"
  local loc="$2"
  case "$loc" in
    http://*|https://*) printf '%s' "$loc" ;;
    /*) printf '%s%s' "${base}" "$loc" ;;
    '') printf '' ;;
    *) printf '%s/%s' "${base}" "$loc" ;;
  esac
}

# Один HEAD-запрос: печатает "code|location" (location уже нормализован).
fetch_redirect() {
  local url="$1"
  local out code loc
  out="$("${CURL[@]}" "$url" 2>/dev/null || true)"
  code="$(printf '%s' "$out" | head -1 | awk '{print $2}')"
  loc="$(printf '%s' "$out" | grep -i '^location:' | tail -1 | sed 's/^[Ll]ocation: //' | tr -d '\r')"
  loc="$(resolve_location "$BASE_URL" "$loc")"
  printf '%s|%s' "$code" "$loc"
}

check_legacy() {
  local path="$1"
  local expect_path="$2"
  local expect="${BASE_URL}${expect_path}"
  local url="${BASE_URL}${path}"
  local result code loc

  result="$(fetch_redirect "$url")"
  code="${result%%|*}"
  loc="${result#*|}"

  if [[ "$code" == "301" && "$loc" == "$expect" ]]; then
    LEGACY_OK=$((LEGACY_OK + 1))
  else
    fail_legacy "$path" "$code" "$loc" "$expect"
  fi
}

check_canon() {
  local label="$1"
  local url="$2"
  local expect="$3"
  local result code loc

  result="$(fetch_redirect "$url")"
  code="${result%%|*}"
  loc="${result#*|}"

  if [[ "$code" == "301" && "$loc" == "$expect" ]]; then
    CANON_OK=$((CANON_OK + 1))
    printf 'OK   %s\n' "$label"
  else
    fail_canon "$label" "$code" "$loc" "$expect"
  fi
}

check_status() {
  local label="$1"
  local url="$2"
  local expect_code="$3"
  local result code

  result="$(fetch_redirect "$url")"
  code="${result%%|*}"

  if [[ "$code" == "$expect_code" ]]; then
    printf 'OK   %s (HTTP %s)\n' "$label" "$code"
  else
    CANON_FAIL=$((CANON_FAIL + 1))
    fail_canon "$label" "$code" "(no redirect)" "HTTP ${expect_code}"
  fi
}

if [[ ! -f "$MAP_FILE" ]]; then
  printf 'error: map not found: %s\n' "$MAP_FILE" >&2
  exit 1
fi

printf '=== Redirect check: %s ===\n\n' "$BASE_URL"

printf '%s\n' '--- Canonical ---'
check_canon 'HTTP → HTTPS' 'http://marin-ts.com/ru' 'https://marin-ts.com/ru'
check_canon 'HTTPS legacy /ru → /' "${BASE_URL}/ru" "${BASE_URL}/"
check_canon 'HTTP www → HTTPS apex' 'http://www.marin-ts.com/services' 'https://marin-ts.com/services'
check_canon 'HTTPS www → apex' 'https://www.marin-ts.com/services' 'https://marin-ts.com/services'
check_canon '/services → /ship-repair' "${BASE_URL}/services" "${BASE_URL}/ship-repair"
check_canon '/ru/ trailing slash → /' "${BASE_URL}/ru/" "${BASE_URL}/"

printf '%s\n' '' '--- Target pages (no redirect) ---'
check_status '/ship-repair' "${BASE_URL}/ship-repair" '200'
check_status '/about' "${BASE_URL}/about" '200'
check_status '/contacts' "${BASE_URL}/contacts" '200'

printf '%s\n' '' "--- Legacy map ($(basename "$MAP_FILE")) ---"
# Строки map: "/from /to;" — убираем комментарии и завершающую ";"
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="${line//;/}"
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"
  [[ -z "$line" ]] && continue
  from="${line%% *}"
  to="${line#* }"
  to="${to%% *}"
  [[ -z "$from" || -z "$to" ]] && continue
  check_legacy "$from" "$to"
done < "$MAP_FILE"

LEGACY_TOTAL=$((LEGACY_OK + LEGACY_FAIL))
CANON_TOTAL=$((CANON_OK + CANON_FAIL))

printf '%s\n' '' '=== Summary ==='
printf 'Canonical: %s/%s OK\n' "$CANON_OK" "$CANON_TOTAL"
printf 'Legacy:    %s/%s OK\n' "$LEGACY_OK" "$LEGACY_TOTAL"

TOTAL_FAIL=$((LEGACY_FAIL + CANON_FAIL))
if [[ "$TOTAL_FAIL" -gt 0 ]]; then
  printf '%s\n' '' "Failed: $TOTAL_FAIL"
  exit 1
fi

printf '%s\n' '' 'All redirects OK.'
exit 0
