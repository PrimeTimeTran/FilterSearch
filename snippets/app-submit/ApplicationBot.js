import {
  DISABILITY_MAP,
  IDENTIFY_AS_MAP,
  SEXUAL_ORIENTATION_MAP,
  VETERAN_STATUS_MAP,
} from './maps'
import {
  base64ToFile,
  fillTextField,
  findBestLabel,
  normalizeKey,
  resolveInput,
  typeIntoField,
} from './'
import { smartSelect, smartSelectFromLabel } from './smart-select'

// import { RESUME_BASE64 } from './resumeBASE64'
// import { focusSubmitButton } from './dom'

console.log('Starting shortcut script...')

// WIP
// greenhouse, lever, ashby, workday, iCIMS

export class ApplicationBot {
  constructor(userDetails) {
    this.details = userDetails
    this.results = []
  }
  // =========================
  // 🔴 EXECUTION CONTROL POINT (IMPORTANT)
  // =========================
  //
  // CURRENT STATE:
  // steps are executed directly with no:
  // - retries
  // - verification
  // - timeout control
  // - structured logging
  //
  // FUTURE MIGRATION PATH:
  // wrap execution like:
  //
  // runStepSafely(stepName, () => this[stepName](ctx), ctx)
  //
  // This will NOT change behavior initially,
  // but unlocks:
  // - ATS resilience (Greenhouse/Ashby/Workday)
  // - retry recovery
  // - failure reporting
  // - step observability
  //
  async runStep(name, fn) {
    console.log(`▶ Running: ${name}`)

    try {
      const result = await fn()

      console.log(`✔ ${name}:`, result)

      const normalized =
        result && typeof result === 'object'
          ? result
          : {
              field: name,
              success: Boolean(result),
              error: result ? undefined : 'Invalid result',
            }

      this.results.push(normalized)
      return normalized
    } catch (e) {
      const error = {
        field: name,
        success: false,
        error: e.message || String(e),
      }

      this.results.push(error)
      return error
    }
  }

  async run(steps, fieldMap) {
    const ctx = {
      details: this.details,
      helpers: {
        fillTextField: fillTextField.bind(this),
        resolveInput: resolveInput.bind(this),
        _bot: this, // 👈 add this
      },
    }

    for (const step of steps) {
      const fn = fieldMap[step]

      if (!fn) {
        console.warn(`No handler for step: ${step}`)
        continue
      }

      await this.runStep(step, () => fn(ctx))
    }

    // const submitResult = focusSubmitButton()

    // setTimeout(() => {
    //   console.log('SUBMIT RESULT:', submitResult)
    //   return this.results
    // }, 5000)
  }
  updatePersonalDetails() {
    const fields = [
      ['first_name', this.details.firstName],
      ['last_name', this.details.lastName],
      ['preferred_name', this.details.preferredName],
      ['email', this.details.email],
    ]

    for (const [id, value] of fields) {
      const el = document.getElementById(id)

      if (!fillTextField(el, value)) {
        return {
          field: 'Personal Details',
          success: false,
          error: `Failed ${id}`,
        }
      }
    }
  }
  async updateCountry() {
    return await smartSelect('country', [
      'United States',
      'United States of America',
      'United States+1',
      'United States +1',
      'United States+1',
      '+1 United States',
      '+1UnitedStates',
    ])
  }
  updatePhone() {
    const field = 'Phone'
    const value = this.details.phone || '5551234567'

    const input =
      document.querySelector('input[type="tel"]') ||
      document.querySelector('#phone') ||
      document.querySelector('input[name*="phone" i]')

    if (!input) {
      return { field, success: false, error: 'Phone input not found' }
    }

    const success = typeIntoField(input, value)

    return {
      field,
      success,
      actual: input.value,
    }
  }
  updateLinkedIn() {
    const field = 'LinkedIn'
    const value = this.details.linkedin

    if (!label) {
      return { field, success: false, error: 'Label not found' }
    }

    const input = resolveInput(label)

    const success = fillTextField(input, value)

    return {
      field,
      success,
      actual: input?.value,
    }
  }
  updatePortfolio() {
    const field = 'Portfolio'
    const value = this.details.linkedin

    if (!label) {
      return { field, success: false, error: 'Label not found' }
    }

    const input = resolveInput(label)

    const success = fillTextField(input, value)

    return {
      field,
      success,
      actual: input?.value,
    }
  }
  async updateGender(value = 'male') {
    const candidates = {
      male: ['man', 'male'],
      female: ['woman', 'female'],
      other: ['non-binary', 'prefer not to say', 'self-describe'],
    }

    const key = normalizeKey(value)
    const options = candidates[key] || [value]

    // ----------------------------
    // 1. FIND MOST ACCURATE LABEL
    // ----------------------------
    let label = findBestLabel([
      'gender',
      'i identify my gender',
      'what is your gender',
    ])

    if (!label) {
      return {
        field: 'gender',
        success: false,
        error: 'gender label not found',
      }
    }

    // optional safety: avoid wrong "gender" matches
    const text = label.textContent.toLowerCase()
    if (!text.includes('gender') && !text.includes('identify')) {
      return {
        field: 'gender',
        success: false,
        error: 'invalid gender label match',
      }
    }

    // ----------------------------
    // 2. USE PROVEN SELECT ENGINE
    // ----------------------------
    return smartSelectFromLabel(label, options)
  }
  async updateWorkAuthorization() {
    const raw = this.details.workAuthorization

    const key = normalizeKey(raw)

    const candidates = {
      yes: ['yes', 'y', 'yeah', 'true'],
      no: ['no', 'n', 'nope', 'false'],
    }

    const label = findBestLabel([
      'eligible to work',
      'work authorization',
      'legally authorized',
      'authorized to work',
    ])

    if (!label) {
      return {
        field: 'workAuthorization',
        success: false,
        error: 'label not found',
      }
    }

    const options = candidates[key] || candidates.no

    return smartSelect(label.textContent.trim().toLowerCase(), options)
  }
  async updateVisaSponsorship() {
    const raw = this.details.visaSponsorship

    if (!raw) {
      return {
        field: 'visa',
        success: false,
        error: 'No visa sponsorship value in details',
      }
    }

    const key = normalizeKey(raw)

    const candidates = {
      yes: ['yes', 'y', 'require sponsorship', 'need sponsorship', 'true'],
      no: ['no', 'n', 'do not require sponsorship', 'no sponsorship', 'false'],
    }

    const label = findBestLabel([
      'visa sponsorship',
      'require sponsorship',
      'sponsorship required',
      'immigration sponsorship',
    ])

    if (!label) {
      return {
        field: 'visa',
        success: false,
        error: 'visa label not found',
      }
    }

    const options = candidates[key] || candidates.no

    return smartSelect(label.textContent.trim().toLowerCase(), options)
  }
  async updateIdentifyAs() {
    const raw = this.details.identifyAs

    console.log({ rupdateIdentifyAs: aw })

    if (!raw) {
      return {
        field: 'identifyAs',
        success: false,
        error: 'No identifyAs value in details',
      }
    }

    const key = normalizeKey(raw)
    const candidates = IDENTIFY_AS_MAP[key] || [raw]

    // 1. try most specific labels first
    let label = findBestLabel(['i identify as'])
    console.log({ identifyAsLabelResults: label })

    // explicitly avoid gender-specific variant
    if (label && label.textContent.toLowerCase().includes('gender')) {
      label = null
    }

    if (!label) {
      label = findBestLabel(['identify as'])

      // still filter out gender + sexual orientation variants
      if (
        label &&
        (label.textContent.toLowerCase().includes('gender') ||
          label.textContent.toLowerCase().includes('sexual'))
      ) {
        label = null
      }
    }

    return smartSelect(label.textContent.trim().toLowerCase(), candidates)
  }
  async updateSexualOrientation() {
    const raw = this.details.sexualOrientation

    if (!raw) {
      return {
        field: 'sexualOrientation',
        success: false,
        error: 'No sexualOrientation value in details',
      }
    }

    const key = normalizeKey(raw)

    const candidates = SEXUAL_ORIENTATION_MAP?.[key] || [raw]

    const label = findBestLabel([
      'sexual orientation',
      'sexual identity',
      'orientation',
    ])

    if (!label) {
      return {
        field: 'sexualOrientation',
        success: false,
        error: 'label not found',
      }
    }

    return smartSelectFromLabel(label, candidates)
  }
  async updateVeteranStatus() {
    const raw = this.details.veteranStatus

    if (!raw) {
      return {
        field: 'veteranStatus',
        success: false,
        error: 'No veteranStatus value in details',
      }
    }

    const key = normalizeKey(raw)

    const candidates = VETERAN_STATUS_MAP[key] || [raw]

    const label = findBestLabel([
      'veteran status',
      'protected veteran',
      'veteran',
    ])

    if (!label) {
      return {
        field: 'veteranStatus',
        success: false,
        error: 'label not found',
      }
    }

    return smartSelectFromLabel(label, candidates)
  }
  async updateDisability() {
    const raw = this.details.disabilityStatus

    if (!raw) {
      return {
        field: 'disability',
        success: false,
        error: 'No disability value in details',
      }
    }

    const key = normalizeKey(raw)

    const candidates = DISABILITY_MAP?.[key] || [raw]

    // 1. Try strongest semantic matches first
    let label = findBestLabel([
      'disability',
      'disabled',
      'disability status',
      'disability status (voluntary)',
    ])

    // 2. Broader fallback (common ATS phrasing)
    if (!label) {
      label = findBestLabel([
        'do you have a disability',
        'disability voluntary',
        'self-identification',
      ])
    }

    if (!label) {
      return {
        field: 'disability',
        success: false,
        error: 'label not found',
      }
    }

    return smartSelect('disability', candidates)
  }
  async updateHispanic() {
    const raw = this.details.hispanic

    if (!raw) {
      return {
        field: 'hispanic',
        success: false,
        error: 'No hispanic value in details',
      }
    }

    const key = normalizeKey(raw)

    const candidates = HISPANIC_MAP?.[key] || [raw]

    const label = findBestLabel([
      'hispanic',
      'latino',
      'latina',
      'latinx',
      'hispanic or latino',
      'ethnicity (hispanic)',
    ])

    if (!label) {
      return {
        field: 'hispanic',
        success: false,
        error: 'label not found',
      }
    }

    return smartSelect('hispanic', candidates)
  }
  // async updateRace(value = this.details.race) {
  //   const key = normalizeKey(value)

  //   const candidates = RACE_MAP?.[key] || [value]

  //   // 1. Find correct label first (same pattern that now works everywhere)
  //   const label = findBestLabel([
  //     'race',
  //     'racial identity',
  //     'race/ethnicity',
  //   ])

  //   if (!label) {
  //     return {
  //       field: 'race',
  //       success: false,
  //       error: 'race label not found',
  //     }
  //   }

  //   // 2. Use your proven dropdown engine
  //   return smartSelectFromLabel(label, candidates)
  // }
  updateRace() {
    const field = 'Race/Ethnicity'
    const value = 'Southeast Asian'

    const input =
      document.querySelector(
        'input[aria-labelledby*="race"], input[aria-label*="race"], input[role="combobox"]',
      ) ||
      document.querySelector('#race') ||
      document.querySelector('input[id*="question_"][role="combobox"]')

    if (!input) {
      return { field, success: false, error: 'Race input not found' }
    }

    try {
      // 1. open dropdown first
      input.focus()

      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      // 2. type value (filter trigger)
      typeIntoField(input, value)

      // 3. wait for React filtering
      return new Promise((resolve) => {
        setTimeout(() => {
          const listboxId = input.getAttribute('aria-controls')
          const listbox = listboxId
            ? document.getElementById(listboxId)
            : document.querySelector('[role="listbox"]')

          if (!listbox) {
            resolve({
              field,
              success: false,
              error: 'listbox not found',
            })
            return
          }

          const options = [
            ...listbox.querySelectorAll('[role="option"]'),
          ].filter((el) => el.textContent.trim())

          const match =
            options.find((o) =>
              o.textContent.toLowerCase().includes('southeast'),
            ) || options[0]

          if (!match) {
            resolve({
              field,
              success: false,
              error: 'no matching option',
            })
            return
          }

          // 4. select option
          match.scrollIntoView({ block: 'center' })
          match.click()

          // 5. force React commit
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.blur()

          resolve({
            field,
            success: true,
            actual: match.textContent.trim(),
          })
        }, 400) // key: allow async options render
      })
    } catch (e) {
      return {
        field,
        success: false,
        error: e.message,
      }
    }
  }
  uploadResume() {
    const field = 'Resume'

    const input = document.querySelector('input[type="file"]#resume')

    if (!input) {
      return { field, success: false, error: 'Resume input not found' }
    }

    if (!window.RESUME_BASE64) {
      return {
        field,
        success: false,
        error: 'RESUME_BASE64 missing',
      }
    }

    try {
      const file = base64ToFile(
        window.RESUME_BASE64,
        'Loi_Tran_Resume.pdf',
        'application/pdf',
      )

      const dt = new DataTransfer()
      dt.items.add(file)

      // ----------------------------
      // 1. Attach file (core step)
      // ----------------------------
      input.files = dt.files

      // ----------------------------
      // 2. React/ATS event chain
      // ----------------------------
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))

      // some systems specifically listen for file selection
      input.dispatchEvent(new Event('filechange', { bubbles: true }))

      // ----------------------------
      // 3. Force internal update cycle
      // ----------------------------
      input.focus()

      // give framework time to register FileList mutation
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = !!(input.files && input.files.length > 0)

          resolve({
            field,
            success,
            actual: success ? input.files[0]?.name : null,
          })
        }, 150)
      })
    } catch (e) {
      return {
        field,
        success: false,
        error: e.message || String(e),
      }
    }
  }
  async updateReferralSource(value = 'LinkedIn') {
    console.log('🔥 ENTER updateReferralSource')

    const label = findBestLabel([
      'how did you hear',
      'referral',
      'hear about this job',
    ])

    if (!label) {
      return {
        field: 'referralSource',
        success: false,
        error: 'label not found',
      }
    }

    const container =
      label.closest('.select__container') ||
      label.parentElement ||
      document.body

    const input =
      container.querySelector('input[type="text"]') ||
      container.querySelector('input') ||
      container.querySelector('[role="textbox"]')

    if (!input) {
      return {
        field: 'referralSource',
        success: false,
        error: 'input not found',
      }
    }

    // ----------------------------
    // simplest possible fill
    // ----------------------------
    input.focus()
    input.value = value

    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.blur()

    return {
      field: 'referralSource',
      success: true,
      actual: input.value,
    }
  }
  async checkCheckbox(labelHints = []) {
    const label = [...document.querySelectorAll('label')].find((l) => {
      const text = (l.textContent || '').toLowerCase()
      return labelHints.some((h) => text.includes(h.toLowerCase()))
    })

    if (!label) {
      return {
        success: false,
        error: 'checkbox label not found',
      }
    }

    const container = label.closest('.checkbox__wrapper')

    const input = container?.querySelector('input[type="checkbox"]')

    if (!input) {
      return {
        success: false,
        error: 'checkbox input not found',
      }

      // await this.runStep(step, fn)
    }

    // already checked
    if (input.checked) {
      return {
        success: true,
        alreadyChecked: true,
      }
    }

    input.focus()
    input.click()

    // force framework sync (React/ATS forms often require this)
    input.checked = true

    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))

    return {
      success: input.checked,
      actual: input.checked,
    }
  }
  async updateConfirmations() {
    console.log('🔥 ENTER updateConfirmations')

    const containers = [...document.querySelectorAll('.select__container')]

    const targets = containers.filter((c) => {
      const input = c.querySelector('input[role="combobox"]')
      const label = c.querySelector('label')

      if (!input || !label) return false

      const text = (label.textContent || '').toLowerCase()

      return (
        text.includes('acknowledge') ||
        text.includes('agree') ||
        text.includes('confirm') ||
        text.includes('understand')
      )
    })

    console.log('CONFIRM FIELDS:', targets.length)

    let success = 0

    for (const container of targets) {
      const input = container.querySelector('input[role="combobox"]')
      if (!input) continue

      input.focus()
      input.click()

      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      )

      await new Promise((r) => setTimeout(r, 150))

      const listboxId = input.getAttribute('aria-controls')
      const listbox = document.getElementById(listboxId)

      if (!listbox) continue

      const options = [...listbox.querySelectorAll('[role="option"]')]

      const match = options.find((o) => {
        const t = o.textContent.toLowerCase()
        return t.includes('yes')
      })

      if (!match) continue

      const label = match.textContent.trim()

      // 1. React-Select interaction
      match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      match.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
      match.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      // 2. CRITICAL: force controlled input update (THIS is what you're missing)
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      ).set

      setter.call(input, label)

      // 3. React state sync events
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))

      // 4. let React finalize
      input.blur()

      await new Promise((r) => setTimeout(r, 120))

      success++
    }

    const result = {
      field: 'confirmations',
      success: success > 0,
      actual: `${success}/${targets.length} completed`,
    }

    console.log('CONFIRM RESULT:', result)

    return result
  }
  summarizeInputs() {
    const inputs = [...document.querySelectorAll('input')].map((el) => {
      const label =
        document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() ||
        el
          .closest('.select__container')
          ?.querySelector('label')
          ?.textContent?.trim() ||
        null

      return {
        id: el.id,
        label,
        type: el.type,
        role: el.getAttribute('role'),
        value: el.value,
        required: el.required,
        isEmpty: !el.value || el.value.trim() === '',
      }
    })

    const emptyInputs = inputs.filter((i) => i.isEmpty)
    const filledInputs = inputs.filter((i) => !i.isEmpty)

    // console.log('📦 ALL INPUTS')
    // console.log(JSON.stringify(inputs, null, 2))
    // console.log('✅ FILLED INPUTS')
    // console.log(JSON.stringify(filledInputs, null, 2))

    // console.log('🧼 EMPTY INPUTS')
    // console.log(JSON.stringify(emptyInputs, null, 2))

    // optional: quick debug access
    window.__LOI_INPUTS__ = inputs
    window.__LOI_EMPTY_INPUTS__ = emptyInputs
    window.__LOI_FILLED_INPUTS__ = filledInputs
  }
}
