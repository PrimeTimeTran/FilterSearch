export function portfolioStep(ctx) {
  const { details, helpers } = ctx
  const { fillTextField, resolveInput } = helpers

  const field = 'Portfolio'
  const value = details.portfolio

  const label = Array.from(document.querySelectorAll('label')).find((l) => {
    const text = (l.textContent || '').toLowerCase()

    return (
      text.includes('portfolio') ||
      text.includes('website') ||
      text.includes('personal site') ||
      text.includes('personal website') ||
      text.includes('url')
    )
  })

  if (!label) {
    return { field, success: false, error: 'Label not found' }
  }

  const input = resolveInput(label)

  if (!input) {
    return { field, success: false, error: 'Input not found' }
  }

  const success = fillTextField(input, value)

  return {
    field,
    success,
    actual: input.value,
  }
}

export function githubStep(ctx) {
  const { details, helpers } = ctx
  const { fillTextField, resolveInput } = helpers

  const field = 'GitHub'
  const value = details.github

  const label = Array.from(document.querySelectorAll('label')).find((l) =>
    (l.textContent || '').toLowerCase().includes('github'),
  )

  if (!label) {
    return { field, success: false, error: 'Label not found' }
  }

  const input = resolveInput(label)

  if (!input) {
    return { field, success: false, error: 'Input not found' }
  }

  const success = fillTextField(input, value)

  return {
    field,
    success,
    actual: input.value,
  }
}

export function linkedinStep(ctx) {
  const { details, helpers } = ctx
  const { fillTextField, resolveInput } = helpers

  const field = 'LinkedIn'
  const value = details.linkedin

  const label = Array.from(document.querySelectorAll('label')).find((l) =>
    l.textContent.includes('LinkedIn'),
  )

  if (!label) {
    return { field, success: false, error: 'Label not found' }
  }

  const input = resolveInput(label)

  if (!input) {
    return { field, success: false, error: 'Input not found' }
  }

  const success = fillTextField(input, value)

  return {
    field,
    success,
    actual: input.value,
  }
}
