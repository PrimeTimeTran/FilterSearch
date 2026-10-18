import { githubStep, linkedinStep, personalStep, portfolioStep } from './fields'

import { ApplicationBot } from './ApplicationBot'
import { details } from './data'

// =========================
// STEP EXECUTION WRAPPER (ADD ON TOP OF FILE)
// =========================

const DEFAULT_STEP_POLICY = {
  retries: 2,
  timeout: 5000,
  verify: false,
  log: true,
}

/**
 * Wraps any step function without breaking existing behavior.
 * You can migrate step-by-step later.
 */
async function runStepSafely(name, stepFn, ctx, policy = {}) {
  const cfg = { ...DEFAULT_STEP_POLICY, ...policy }

  let lastError = null

  for (let attempt = 1; attempt <= cfg.retries + 1; attempt++) {
    try {
      if (cfg.log) {
        console.log(`[STEP] ${name} attempt ${attempt}`)
      }

      const result = await stepFn(ctx)

      // -----------------------------
      // 🔴 PLACEHOLDER: VERIFY LAYER
      // -----------------------------
      // TODO: add per-step validation here
      // Example:
      // if (cfg.verify) await verifyStep(name, ctx)

      return result
    } catch (err) {
      lastError = err

      console.warn(`[STEP FAILED] ${name}`, err)

      // exponential backoff
      await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt - 1)))
    }
  }

  return {
    success: false,
    error: lastError?.message || 'unknown error',
    field: name,
  }
}

// =========================
// 🔴 STATE TRACKING (FUTURE UPGRADE)
// =========================
//
// ctx.state should eventually include:
//
// ctx.state = {
//   completed: [],
//   failed: [],
//   values: {},
//   retries: {},
// }
//
// This enables:
// - resume after crash
// - skipping already filled fields
// - partial re-runs
//
const bot = new ApplicationBot(details)

const steps = {
  summarizeInputs: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.summarizeInputs()
  },
  personal: personalStep,
  linkedin: linkedinStep,
  portfolio: portfolioStep,
  github: githubStep,
  country: (ctx) => {
    const bot = ctx.helpers._bot
    // 🔴 FUTURE UPGRADE POINT:
    // wrap this call in runStepSafely(...)
    // to enable retries + verification
    return bot.updateCountry()
  },
  phone: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updatePhone()
  },
  workAuthorization: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateWorkAuthorization()
  },
  visaSponsorship: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateVisaSponsorship()
  },
  gender: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateGender()
  },
  identifyAs: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateIdentifyAs()
  },
  sexualOrientation: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateSexualOrientation()
  },
  veteranStatus: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateVeteranStatus()
  },
  disability: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateDisability()
  },
  hispanic: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateHispanic()
  },
  race: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateRace()
  },
  checkCheckbox: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.checkCheckbox(['consent', 'demographic', 'gdpr'])
  },
  uploadResume: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.uploadResume()
  },
  referralSource: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateReferralSource()
  },
  confirmations: (ctx) => {
    const bot = ctx.helpers._bot
    return bot.updateConfirmations(true)
  },
}

// =========================
// ⚠️ EXECUTION UPGRADE HOOK (DO NOT ENABLE YET)
// =========================
// Future improvement:
// Replace direct step execution with:
//
// await runStepSafely(stepName, steps[stepName], ctx)
//
// This enables:
// - retries
// - logging
// - verification
// - fallback recovery
bot.run(
  [
    // 'uploadResume',
    'personal',

    'phone',
    'linkedin',
    'portfolio',
    'github',
    'portfolio',
    'github',
    'workAuthorization',
    'visaSponsorship',
    'gender',
    'sexualOrientation',
    'disability',
    'hispanic',
    'race',
    'checkCheckbox',
    'veteranStatus',
    'identifyAs',
    'referralSource',
    'country',
    // 'confirmations',
    // 'summarizeInputs',
  ],
  steps,
)

function reportStep(event) {
  // keep simple for now
  console.log('[REPORT]', {
    step: event.step,
    status: event.status,
    error: event.error,
    duration: event.duration,
  })

  // 🔴 FUTURE:
  // send to analytics / backend / logs
}
