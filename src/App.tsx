import './App.css'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ScheduleForm } from './components/ScheduleForm'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <ScheduleForm />
      </main>
      <Footer />
    </div>
  )
}

export default App
