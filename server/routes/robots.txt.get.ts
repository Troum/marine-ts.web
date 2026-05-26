import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const base = process.env.NODE_ENV === 'production' ? '.output/public' : 'public'
  const body = await readFile(join(process.cwd(), base, 'robots.txt'), 'utf8')
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return body
})
