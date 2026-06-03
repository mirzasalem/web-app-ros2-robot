import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LoginPage from './pages/LoginPage'

vi.mock('./api/auth', () => ({
  login: vi.fn(),
  fetchMe: vi.fn(),
  logout: vi.fn(),
  updateMe: vi.fn(),
}))

function Wrapper({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

describe('LoginPage', () => {
  it('renders sign in form and demo users', () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>,
    )
    expect(screen.getByRole('heading', { name: /buddy web/i })).toBeInTheDocument()
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
  })
})
