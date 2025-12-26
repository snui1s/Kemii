import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from '../app/page'
import { AuthProvider } from '../context/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mocking window.matchMedia not implemented in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: () => null
    };
  }
}));

const queryClient = new QueryClient()

test('Page renders successfully', () => {
  render(
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <Page />
        </AuthProvider>
    </QueryClientProvider>
  )
  expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
})
