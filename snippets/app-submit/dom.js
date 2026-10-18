export function focusSubmitButton() {
  const selectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    '[role="button"][type="submit"]',
  ]

  let btn = null

  for (const sel of selectors) {
    btn = document.querySelector(sel)
    if (btn) break
  }

  if (!btn) {
    const buttons = [...document.querySelectorAll('button')]
    btn = buttons.find((b) =>
      (b.textContent || '').toLowerCase().includes('submit'),
    )
  }

  if (!btn) {
    return {
      success: false,
      error: 'submit button not found',
    }
  }

  btn.scrollIntoView({ block: 'center', behavior: 'instant' })

  setTimeout(() => {
    btn.focus()
    btn.dispatchEvent(new Event('focus', { bubbles: true }))

    // 🔥 ACTUAL SUBMIT
    btn.click()
  }, 80)

  return {
    success: true,
    element: btn,
  }
}
