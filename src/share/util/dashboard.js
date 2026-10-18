console.log('dashboard loaded')

function runSnippet(command) {
  chrome.runtime.sendMessage({
    type: 'RUN',
    command,
  })
}

document.getElementById('run1').addEventListener('click', () => {
  runSnippet('run-snippet-1')
})
document.getElementById('run2').addEventListener('click', () => {
  runSnippet('run-snippet-2')
})
document.getElementById('run3').addEventListener('click', () => {
  runSnippet('run-snippet-3')
})

window.addEventListener('DOMContentLoaded', () => {
  const codeEl = document.getElementById('code')
  const saveBtn = document.getElementById('save')
  const runBtn = document.getElementById('run')

  console.log({ codeEl, saveBtn, runBtn })

  if (!codeEl || !saveBtn || !runBtn) {
    console.error('❌ Missing DOM elements')
    return
  }

  const KEY = 'userSnippet'

  chrome.storage.local.get([KEY], (res) => {
    if (res[KEY]) codeEl.value = res[KEY]
  })

  saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({ [KEY]: codeEl.value })
    console.log('saved')
  })

  runBtn.addEventListener('click', async () => {
    console.log('Run: 1. Clicked')
    chrome.runtime.sendMessage({
      type: 'RUN_SNIPPET',
      action: 'alert',
      value: codeEl.value,
    })
  })
})
