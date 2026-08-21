import { useState } from 'react'
import './App.css'
import { Footer } from './components/Footer'
import { GoogleSignIn } from './components/GoogleSignIn'
import { Header } from './components/Header'
import { ScheduleForm } from './components/ScheduleForm'

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="app-panel">
          <GoogleSignIn onConnected={setAccessToken} />
          <ScheduleForm accessToken={accessToken} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
