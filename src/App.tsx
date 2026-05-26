import { useState } from 'react'

import { loadToken } from './api'
import { Dashboard } from './components/Dashboard'
import { LoginPage } from './components/LoginPage'

function App() {
  const [authed, setAuthed] = useState<boolean>(() => loadToken() !== null)

  if (!authed) {
    return <LoginPage onLoggedIn={() => setAuthed(true)} />
  }
  return <Dashboard onLogout={() => setAuthed(false)} />
}

export default App
