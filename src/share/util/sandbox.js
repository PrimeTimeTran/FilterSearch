chrome.runtime.onMessage.addListener((msg) => {
  console.log('Message received in sandbox:', msg)
  if (msg.type !== 'EXEC') return

  if (msg.action === 'alert') {
    alert(msg.value)
  }

  if (msg.action === 'outline') {
    document.body.style.outline = '3px solid red'
  }
})
