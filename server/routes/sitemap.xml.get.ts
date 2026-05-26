import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Явный application/xml (на случай прокси без nginx static). */
export default defineEventHandler(async (event) => {
  const base = process.env.NODE_ENV === 'production' ? '.output/public' : 'public'
  const body = await readFile(join(process.cwd(), base, 'sitemap.xml'), 'utf8')
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return body
})
