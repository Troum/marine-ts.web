/**
 * Одноразовая/повторная генерация словаря en→ru для токенов имён Lucide.
 * Использует MyMemory (ограничения по квоте — при ошибках подставляет оригинал).
 *
 * Запуск из каталога app: node scripts/gen-lucide-word-ru.mjs
 */
import { icons } from 'lucide-vue-next'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outJson = path.join(__dirname, '../app/utils/lucideWordRu.json')

function uniqueTokens() {
  const w = new Set()
  for (const n of Object.keys(icons)) {
    for (const x of n.match(/[A-Z][a-z]*|[0-9]+/g) ?? []) {
      w.add(x)
    }
  }
  return [...w].sort((a, b) => a.localeCompare(b))
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function translateWord(word) {
  const u = new URL('https://api.mymemory.translated.net/get')
  u.searchParams.set('q', word)
  u.searchParams.set('langpair', 'en|ru')
  const res = await fetch(u)
  if (!res.ok) {
    throw new Error(String(res.status))
  }
  const data = await res.json()
  const t = data?.responseData?.translatedText
  if (typeof t !== 'string' || !t.trim()) {
    throw new Error('empty translation')
  }
  return t.trim()
}

/** Ручные поправки после автоперевода (смысл, морской/IT контекст). */
const OVERRIDES = {
  A: 'A',
  M: 'M',
  X: 'X',
  Z: 'Z',
  Lucide: 'Lucide',
  Off: 'Выкл.',
  On: 'Вкл.',
  Voicemail: 'Голосовая почта',
}

async function main() {
  const words = uniqueTokens()
  let existing = {}
  if (fs.existsSync(outJson)) {
    try {
      existing = JSON.parse(fs.readFileSync(outJson, 'utf8'))
    } catch {
      existing = {}
    }
  }

  const out = { ...existing }
  let n = 0
  for (const w of words) {
    if (/^\d+$/.test(w)) {
      out[w] = w
      continue
    }
    if (out[w]) {
      continue
    }
    n += 1
    try {
      const t = OVERRIDES[w] ?? (await translateWord(w))
      out[w] = OVERRIDES[w] ?? t
      fs.writeFileSync(outJson, JSON.stringify(out, null, 0) + '\n')
      await sleep(120)
    } catch {
      out[w] = out[w] ?? w
      fs.writeFileSync(outJson, JSON.stringify(out, null, 0) + '\n')
      await sleep(200)
    }
  }
  for (const [k, v] of Object.entries(OVERRIDES)) {
    if (k in out) {
      out[k] = v
    }
  }
  fs.writeFileSync(outJson, JSON.stringify(out, null, 0) + '\n')
  console.log('words:', words.length, 'updated approx:', n, '→', outJson)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
