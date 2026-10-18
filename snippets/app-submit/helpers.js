// =========================
// dom/input/typing.js
// =========================

export function typeIntoField(input, value) {
  if (!input) return false

  input.focus()
  input.click()

  input.value = ''

  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  ).set

  for (const char of value) {
    setter.call(input, input.value + char)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.blur()

  return input.value?.includes(value)
}

export async function typeLikeHuman(el, value) {
  el.focus()
  el.value = ''

  for (const char of value) {
    el.value += char
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 10))
  }

  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.blur()
}

// =========================
// dom/input/setters.js
// =========================

export function setValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  ).set

  setter.call(input, value)

  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export function fillTextField(input, value) {
  if (!input) return false

  input.focus()
  setValue(input, value)
  input.blur()

  return input.value?.trim() === value
}

export function commitInput(input) {
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.dispatchEvent(new Event('blur', { bubbles: true }))
  input.blur()
}

// =========================
// dom/input/resolve.js
// =========================

export function resolveInput(label) {
  const strategies = [
    () => document.getElementById(label.htmlFor),
    () => document.querySelector(`[aria-label="${label.textContent.trim()}"]`),
    () => label.parentElement?.querySelector('input'),
    () => document.querySelector('input[name*="linkedin" i]'),
    () => document.querySelector('input[id*="linkedin" i]'),
  ]

  for (const fn of strategies) {
    const input = fn()
    if (input) return input
  }

  return null
}

export function findLabel(text) {
  return [...document.querySelectorAll('label')].find((l) =>
    l.textContent?.toLowerCase().includes(text.toLowerCase()),
  )
}

export function findContainer(label) {
  return (
    label.closest('.select__container') || label.parentElement || document.body
  )
}

export function findInput(container) {
  return (
    container.querySelector('input[role="combobox"]') ||
    container.querySelector('input[type="text"]') ||
    container.querySelector('input')
  )
}

// =========================
// dom/select/react-select.js
// =========================

export async function selectReactOption(option, container, labelText) {
  option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

  const control = container?.querySelector('.select__control')

  if (control) {
    control.dispatchEvent(new Event('input', { bubbles: true }))
    control.dispatchEvent(new Event('change', { bubbles: true }))
  }

  document.activeElement?.blur()

  await new Promise((r) => setTimeout(r, 120))
}

// =========================
// dom/select/native-select.js
// =========================

// import { normalizeText } from '../utils/normalize.js'

export function findOption(listbox, candidates = []) {
  const options = [...listbox.querySelectorAll('li, div, option')]

  let best = null
  let bestScore = 0

  for (const opt of options) {
    const text = normalizeText(opt.textContent || '')

    for (const c of candidates) {
      const target = normalizeText(c)
      if (!target) continue

      let score = 0

      if (text === target) score = 100
      else if (text.includes(target)) score = 80
      else if (target.includes(text)) score = 60
      else if (
        text.includes('united states') &&
        target.includes('united states')
      )
        score = 70

      if (score > bestScore) {
        bestScore = score
        best = opt
      }
    }
  }

  return best
}

export async function selectOption(option, input) {
  option.scrollIntoView({ block: 'center' })

  option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export function findOptions(listbox) {
  return [...listbox.querySelectorAll('[role="option"], li, div')].filter(
    (el) => el.textContent?.trim(),
  )
}

// =========================
// dom/select/dropdown.js
// =========================

export function openDropdown(input) {
  input.focus()
  input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

// =========================
// dom/utils/normalize.js
// =========================

export function normalizeKey(value) {
  return (value || '').toString().toLowerCase().replace(/\s+/g, '')
}

export function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[\s\+\-\_,.:;()]/g, '')
    .trim()
}

export function classifyField(el, label) {
  const hasCombobox = el.getAttribute('role') === 'combobox'
  const hasOptions = label?.textContent?.match(/select|choose|yes|no/i)

  if (hasCombobox && hasOptions) return 'select'
  if (el.type === 'text') return 'text'
  if (el.type === 'checkbox') return 'checkbox'

  return 'unknown'
}

// =========================
// dom/utils/file.js
// =========================

export function base64ToFile(base64, filename, mimeType) {
  const byteCharacters = atob(base64)

  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  const byteArray = new Uint8Array(byteNumbers)

  return new File([byteArray], filename, { type: mimeType })
}

// =========================
// dom/utils/dom-query.js
// =========================

export function findBestLabel(keywords) {
  const elements = [
    ...document.querySelectorAll('label'),
    ...document.querySelectorAll('[role="group"]'),
    ...document.querySelectorAll('div, span, legend'),
  ]

  const scored = elements
    .map((el) => {
      const text = (el.textContent || '').toLowerCase()

      const score = keywords.reduce((acc, k) => {
        return text.includes(k.toLowerCase()) ? acc + 1 : acc
      }, 0)

      return { el, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored[0]?.el || null
}

// =========================
// dom/wait/observers.js
// =========================

export function waitForStableElement(el, timeout = 2000) {
  return new Promise((resolve) => {
    let lastHTML = el.innerHTML
    let stableTicks = 0

    const start = Date.now()

    const obs = new MutationObserver(() => {
      const now = el.innerHTML

      if (now === lastHTML) stableTicks++
      else {
        stableTicks = 0
        lastHTML = now
      }

      if (stableTicks >= 3) {
        obs.disconnect()
        resolve(true)
      }
    })

    obs.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })

    const interval = setInterval(() => {
      if (Date.now() - start > timeout) {
        clearInterval(interval)
        obs.disconnect()
        resolve(false)
      }
    }, 100)
  })
}

export function waitForListbox(input, { timeout = 3000 } = {}) {
  return new Promise((resolve) => {
    const start = Date.now()

    const obs = new MutationObserver(() => {
      const found = [
        document.querySelector('[role="listbox"]'),
        document.querySelector('.iti__country-list'),
        document.querySelector('.dropdown-menu'),
        document.querySelector("ul[role='list']"),
      ].find(Boolean)

      if (found) {
        obs.disconnect()
        resolve(found)
      }
    })

    obs.observe(document.body, {
      childList: true,
      subtree: true,
    })

    const interval = setInterval(() => {
      if (Date.now() - start > timeout) {
        clearInterval(interval)
        obs.disconnect()
        resolve(null)
      }
    }, 100)
  })
}

// =========================
// dom/result/result.js
// =========================

export function fail(field, error) {
  return { field, success: false, error }
}

export function success(field, mode, value) {
  return { field, success: true, mode, value }
}
