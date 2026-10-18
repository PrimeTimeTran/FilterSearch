;(() => {
  console.log('🔥 CONTENT SCRIPT BOOT')

  // ONLY guard duplicate script execution
  if (globalThis.__CMD_INSTANCE__) return
  globalThis.__CMD_INSTANCE__ = true

  // DO NOT guard everything else
  let paletteOpen = false
  let paletteRoot = null
  let commands = []

  window.__CMD_DEV_MODE__ = false

  function waitForReady(cb) {
    if (document.body && document.readyState !== 'loading') {
      return cb()
    }

    window.addEventListener('DOMContentLoaded', cb, { once: true })
  }

  function maybeAutoRun(commands) {
    if (!window.__CMD_DEV_MODE__) return
    if (!commands?.length) return

    requestAnimationFrame(() => {
      setTimeout(() => {
        console.log('🚀 DEV MODE auto-run snippet 1')
        executeCommand(commands[0], { fromAuto: true })
      }, 150)
    })
  }

  function mountPalette(commands) {
    console.log('🧠 mountPalette called', commands)

    if (paletteRoot) return

    paletteRoot = document.createElement('div')
    paletteRoot.id = 'cmd-palette'

    paletteRoot.innerHTML = `
    <input id="cmd-input" />
    <div id="cmd-list">PALETTE LOADED</div>
  `

    document.body.appendChild(paletteRoot)

    console.log('📌 palette mounted:', paletteRoot)
  }

  function unmountPalette() {
    if (!paletteRoot) return

    window.removeEventListener('keydown', handleGlobalKeys, true)

    paletteRoot.remove()
    paletteRoot = null
  }

  function focusInput() {
    requestAnimationFrame(() => {
      const input = document.getElementById('cmd-input')
      if (!input) return

      const focus = () => {
        input.focus({ preventScroll: true })
        input.setSelectionRange(0, input.value.length)
      }

      focus()

      requestAnimationFrame(focus)

      setTimeout(focus, 50)
    })
  }

  function handleGlobalKeys(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      togglePalette()
    }
  }

  function togglePalette() {
    if (paletteOpen) {
      unmountPalette()
      paletteOpen = false
      return
    }

    paletteOpen = true

    mountPalette(commands) // always global source
  }

  function executeCommand(cmd, { fromAuto = false } = {}) {
    console.log('EXEC:', cmd.title, { fromAuto })

    chrome.runtime.sendMessage({
      type: 'RUN',
      command: cmd.id, // ❌ FIXED (was always commands[0])
    })

    if (!fromAuto) {
      document.getElementById('cmd-palette')?.remove()
    }
  }

  function renderList(container, items) {
    if (!container) return

    const list = Array.isArray(items) ? items : items?.commands || []

    container.innerHTML = ''

    list.forEach((cmd) => {
      const el = document.createElement('div')
      el.textContent = cmd.title

      el.onclick = () => executeCommand(cmd)

      container.appendChild(el)
    })
  }

  function runDevMode(cmds) {
    const first = cmds?.[0]
    if (!first?.id) return

    console.log('🚀 DEV MODE RUN:', first.title)

    chrome.runtime.sendMessage({
      type: 'RUN',
      command: first.id,
    })
  }
  function init(commands) {
    if (!Array.isArray(commands)) return

    // ALWAYS allow UI to initialize if not dev
    if (!window.__CMD_DEV_MODE__) {
      mountPalette(commands)
      return
    }

    // DEV MODE only handles execution
    setTimeout(() => {
      runDevMode(commands)
    }, 0)
  }
  function initUI(cmds) {
    window.__CMD_LISTENER__ ??= true

    if (!window.__CMD_LISTENER_BOUND__) {
      window.__CMD_LISTENER_BOUND__ = true

      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'OPEN_PALETTE') {
          togglePalette()
        }
      })
    }
  }
  if (!window.__CMD_LISTENER__) {
    window.__CMD_LISTENER__ = true

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'OPEN_PALETTE') {
        togglePalette()
      }
    })
  }

  window.__cmd_palette_loaded__ = true

  chrome.runtime.sendMessage({ type: 'GET_COMMANDS' }, (res) => {
    const cmds = res?.commands ?? []

    commands = cmds

    if (!commands.length) {
      console.warn('No commands')
      return
    }

    if (window.__CMD_DEV_MODE__) {
      runDevMode(commands)
      mountPalette(commands) // optional if you still want UI in dev
      return
    }

    mountPalette(commands) // ALWAYS for prod
  })
})()
