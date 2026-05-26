import { useState } from 'react'

import { login, register } from '../api'

interface Props {
  onLoggedIn: () => void
}

export function LoginPage({ onLoggedIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        await register(email, password)
      }
      await login(email, password)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="centered">
      <form onSubmit={submit} className="card">
        <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create & sign in'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </main>
  )
}
