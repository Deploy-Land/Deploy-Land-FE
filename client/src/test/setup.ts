import { expect, afterEach, vi, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.location.reload
export const mockReload = vi.fn();
Object.defineProperty(window, "location", {
  value: {
    reload: mockReload,
    href: "http://localhost:5173",
    origin: "http://localhost:5173",
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  mockReload.mockClear();
});

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();
