function findEmailField() {
  return (
    document.getElementById('email') ||
    document.querySelector('input[type="email"]') ||
    [...document.querySelectorAll('input')].find((el) => {
      const key = `${el.name} ${el.id} ${el.placeholder}`.toLowerCase()

      return (
        key.includes('email') &&
        !key.includes('confirm') &&
        !key.includes('alternate')
      )
    })
  )
}

export function personalStep(ctx) {
  const { details, helpers } = ctx
  const { fillTextField } = helpers

  // ----------------------------
  // 1. Preferred name (first priority)
  // ----------------------------
  const preferredEl =
    document.getElementById('preferred_name') ||
    document.querySelector('input[name*="preferred" i]')

  if (preferredEl && details.preferredName) {
    const success = fillTextField(preferredEl, details.preferredName)

    if (!success) {
      return {
        field: 'Personal Details',
        success: false,
        error: 'Failed preferred_name',
      }
    }
  }

  // ----------------------------
  // 2. First name
  // ----------------------------
  const firstNameEl =
    document.getElementById('first_name') ||
    document.querySelector('input[name*="first" i]')

  if (firstNameEl && details.firstName) {
    const success = fillTextField(firstNameEl, details.firstName)

    if (!success) {
      return {
        field: 'Personal Details',
        success: false,
        error: 'Failed first_name',
      }
    }
  }

  // ----------------------------
  // 3. Last name / surname / family name
  // ----------------------------
  const lastNameEl =
    document.getElementById('last_name') ||
    document.querySelector(
      'input[name*="last" i], input[name*="surname" i], input[name*="family" i]',
    )

  if (lastNameEl && details.lastName) {
    const success = fillTextField(lastNameEl, details.lastName)

    if (!success) {
      return {
        field: 'Personal Details',
        success: false,
        error: 'Failed last_name',
      }
    }
  }

  // ----------------------------
  // 4. Fallback: full name field (ONLY if above missing)
  // ----------------------------
  const fullName = [details.firstName, details.lastName]
    .filter(Boolean)
    .join(' ')

  const fullNameEl = [...document.querySelectorAll('input')].find((el) => {
    const key = `${el.name} ${el.id}`.toLowerCase()

    return (
      key.includes('name') &&
      !key.includes('first') &&
      !key.includes('last') &&
      !key.includes('preferred') &&
      !key.includes('user') &&
      !key.includes('company')
    )
  })

  if (fullNameEl && !firstNameEl && !lastNameEl) {
    const success = fillTextField(fullNameEl, fullName)

    if (!success) {
      return {
        field: 'Personal Details',
        success: false,
        error: 'Failed full name',
      }
    }
  }

  // ----------------------------
  // 5. Email
  // ----------------------------
  const emailEl = findEmailField()

  if (emailEl && details.email) {
    const success = fillTextField(emailEl, details.email)

    if (!success) {
      return {
        field: 'Personal Details',
        success: false,
        error: 'Failed email',
      }
    }
  }

  return { field: 'Personal Details', success: true }
}
