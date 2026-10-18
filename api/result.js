export function ok(field, extra = {}) {
  return { field, success: true, ...extra }
}

export function fail(field, error) {
  return { field, success: false, error }
}
