import './App.css'
import { Footer } from './components/Footer'
import { GoogleSignIn } from './components/GoogleSignIn'
import { Header } from './components/Header'
import { ScheduleForm } from './components/ScheduleForm'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="app-panel">
          <GoogleSignIn />
          <ScheduleForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
