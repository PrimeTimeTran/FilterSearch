
```js
// WIP:
// Greenhouse:
// Yes/No fields(Do you acknowledge...?)
// Yes/No fields(Are you currently...?)
//
const inputs = [...document.querySelectorAll('input')].map((el) => {
  const label =
    document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() ||
    el.closest('.select__container')?.querySelector('label')?.textContent?.trim() ||
    null

  return {
    id: el.id,
    label,
    type: el.type,
    role: el.getAttribute('role'),
    value: el.value,
    required: el.required,
  }
})

console.log(JSON.stringify(inputs, null, 2))
```
