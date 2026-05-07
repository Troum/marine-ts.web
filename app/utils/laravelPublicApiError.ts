type LaravelValidationBody = {
  message?: string
  errors?: Record<string, string[]>
}

export function getFetchErrorStatus(e: unknown): number | undefined {
  const x = e as { statusCode?: number; status?: number; response?: { status?: number } }
  return x.statusCode ?? x.status ?? x.response?.status
}

function validationBody(e: unknown): LaravelValidationBody | null {
  const data = (e as { data?: unknown })?.data
  if (!data || typeof data !== 'object') {
    return null
  }
  return data as LaravelValidationBody
}

/**
 * Первое сообщение по списку полей Laravel `errors` (например photo → перегруз файла).
 */
export function extractLaravelFirstFieldMessage(e: unknown, fieldKeys: string[]): string | null {
  const body = validationBody(e)
  const errors = body?.errors
  if (!errors || typeof errors !== 'object') {
    return null
  }
  for (const key of fieldKeys) {
    const arr = errors[key]
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string' && arr[0].trim() !== '') {
      return arr[0]
    }
  }
  return null
}

export function extractLaravelAnyFieldMessage(e: unknown): string | null {
  const body = validationBody(e)
  const errors = body?.errors
  if (!errors || typeof errors !== 'object') {
    return null
  }
  for (const arr of Object.values(errors)) {
    if (Array.isArray(arr) && typeof arr[0] === 'string' && arr[0].trim() !== '') {
      return arr[0]
    }
  }
  return null
}
