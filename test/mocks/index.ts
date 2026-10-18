import { vi } from "vitest";

export const chrome = {
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    onActivated: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },

  action: {
    setBadgeText: vi.fn(),
    setTitle: vi.fn(),
  },

  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },

  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
};
