export const state = {
  lastValidTabId: null,
  sandboxTabId: null,
};

export function setLastValidTabId(id) {
  state.lastValidTabId = id;
}

export function getLastValidTabId() {
  return state.lastValidTabId;
}

export function setSandboxTabId(id) {
  state.sandboxTabId = id;
}

export function getSandboxTabId() {
  return state.sandboxTabId;
}
