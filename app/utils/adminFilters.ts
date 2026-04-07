/** Значение фильтра «все / да / нет» из AdminSelect → тип для query API. */
export function triState01(v: string): '' | '0' | '1' {
  return v === '0' || v === '1' ? v : ''
}
