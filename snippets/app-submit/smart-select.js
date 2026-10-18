function setValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  ).set

  setter.call(input, value)

  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

async function selectReactOption(option, container, input) {
  option.scrollIntoView({ block: 'center' })

  option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

  if (container) {
    container.dispatchEvent(new Event('input', { bubbles: true }))
    container.dispatchEvent(new Event('change', { bubbles: true }))
  }

  input?.dispatchEvent(new Event('change', { bubbles: true }))
  input?.blur()

  await new Promise((r) => setTimeout(r, 120))
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[\s\+\-\_]/g, '')
    .trim()
}

function findLabel(labelText) {
  return [...document.querySelectorAll('label')].find((l) =>
    l.textContent?.toLowerCase().includes(labelText.toLowerCase()),
  )
}

function findContainer(label) {
  return (
    label?.closest('.select__container') ||
    label?.parentElement ||
    document.body
  )
}

function findInput(container) {
  return (
    container.querySelector('input[role="combobox"]') ||
    container.querySelector('input[type="text"]') ||
    container.querySelector('input')
  )
}

function findNativeSelect(container) {
  return container.querySelector('select')
}

async function waitForListbox(input, timeout = 2500) {
  return new Promise((resolve) => {
    const start = Date.now()

    const check = () => {
      const listboxes = [...document.querySelectorAll('[role="listbox"]')]

      const visible = listboxes.find((el) => {
        const style = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()

        const isVisible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.height > 0

        if (!isVisible) return false

        const active = document.activeElement

        return (
          active && (el.contains(active) || el.contains(input) || true) // portal-safe fallback
        )
      })

      if (visible) return resolve(visible)
      if (Date.now() - start > timeout) return resolve(null)

      requestAnimationFrame(check)
    }

    check()
  })
}

function findBestMatch(options, candidates) {
  const normalizedCandidates = candidates.map(normalize)

  return options.find((opt) => {
    const text = normalize(opt.textContent || '')

    return normalizedCandidates.some((c) => {
      return text === c || text.includes(c) || c.includes(text)
    })
  })
}

export async function smartSelect(labelText, candidates = []) {
  const field = labelText

  const label = findLabel(labelText)

  if (!label) {
    return { field, success: false, error: 'label not found' }
  }

  const container = findContainer(label)
  const input = findInput(container)
  const select = findNativeSelect(container)

  // -------------------------
  // Native <select> path
  // -------------------------
  if (select) {
    select.focus()
    select.value = candidates[0]

    select.dispatchEvent(new Event('input', { bubbles: true }))
    select.dispatchEvent(new Event('change', { bubbles: true }))

    return {
      field,
      success: true,
      mode: 'native',
      actual: select.value,
    }
  }

  if (!input) {
    return {
      field,
      success: false,
      error: 'no input found',
    }
  }

  // -------------------------
  // Open dropdown (React / custom)
  // -------------------------
  input.focus()

  input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  input.dispatchEvent(new Event('focus', { bubbles: true }))

  const listbox = await waitForListbox(input)

  if (!listbox) {
    return {
      field,
      success: false,
      error: 'no active listbox',
    }
  }

  const options = [...listbox.querySelectorAll('[role="option"]')]

  const match = findBestMatch(options, candidates)

  if (match) {
    await selectReactOption(match, container, input)

    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.blur()

    return {
      field,
      success: true,
      mode: 'listbox',
      actual: match.textContent?.trim(),
    }
  }

  // -------------------------
  // fallback typing
  // -------------------------
  setValue(input, candidates[0] || '')

  return {
    field,
    success: false,
    mode: 'fallback',
    actual: input.value,
  }
}
export async function smartSelectFromLabel(label, candidates = []) {
  const field = label?.textContent?.trim?.() || 'unknown'

  const container = findContainer(label)
  const input = findInput(container)

  if (!input) {
    return { field, success: false, error: 'no input found' }
  }

  input.focus()

  input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  input.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  input.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    }),
  )

  // ----------------------------
  // WAIT FOR LISTBOX
  // ----------------------------
  const listbox = await waitForListbox(input)

  if (!listbox) {
    return { field, success: false, error: 'no active listbox' }
  }

  // ----------------------------
  // GET OPTIONS
  // ----------------------------
  const options = [
    ...listbox.querySelectorAll('[role="option"], div, li'),
  ].filter((el) => el.textContent?.trim?.().length > 0)

  const match = findBestMatch(options, candidates)

  if (!match) {
    return { field, success: false, error: 'no option match' }
  }

  // ----------------------------
  // SELECT
  // ----------------------------
  await selectReactOption(match, container, input)

  // ----------------------------
  // COMMIT (single reliable cycle)
  // ----------------------------
  await new Promise((r) => setTimeout(r, 80))

  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.dispatchEvent(new Event('blur', { bubbles: true }))
  input.blur()

  await new Promise((r) => setTimeout(r, 120))

  return {
    field,
    success: true,
    actual: match.textContent?.trim(),
  }
}
