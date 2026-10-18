export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      const el = document.querySelector(selector)

      if (el) return resolve(el)

      if (Date.now() - start > timeout) {
        return reject(new Error('Timeout waiting for: ' + selector))
      }

      requestAnimationFrame(check)
    }

    check()
  })
}

export function waitForElementToContainText(text, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      const el = Array.from(document.querySelectorAll('label')).find((l) =>
        l.textContent?.includes(text),
      )

      if (el) return resolve(el)

      if (Date.now() - start > timeout) {
        return reject(new Error(`Timeout waiting for label: ${text}`))
      }

      requestAnimationFrame(check)
    }

    check()
  })
}

export async function waitForTextMatch(getter, matchFn, timeout = 5000) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const el = getter()
    if (el && matchFn(el)) return el

    await new Promise((r) => setTimeout(r, 150))
  }

  return null
}

export async function stableReadValue(getter, timeout = 4000) {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const el = getter()
    const value = el?.value || el?.textContent

    if (value?.trim()) return value.trim()

    await new Promise((r) => setTimeout(r, 100))
  }

  return null
}
