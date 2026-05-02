/**
 * Управляет видимостью подвала на конкретной странице.
 *
 * Публичные страницы вызывают `setHidden(true/false)` на основе поля `hideFooter`
 * из CMS-данных. Подвал (`LayoutFooter`) читает `hidden.value` и скрывает себя
 * при `true`. Лейаут сбрасывает состояние в `false` при каждой смене маршрута,
 * поэтому страницы, которые не вызывают `setHidden`, всегда показывают подвал.
 */
export function usePageFooterHidden() {
  const hidden = useState('page-footer-hidden', () => false)

  function setHidden(v: boolean) {
    hidden.value = v
  }

  return { hidden, setHidden }
}
