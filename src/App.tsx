import { useState } from 'react'
import './App.css'
import { BackgroundLogos } from './components/BackgroundLogos'
import { CalendarConfigStep } from './components/CalendarConfigStep'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ScheduleInputStep } from './components/ScheduleInputStep'
import type { ParsedSchedule } from './types/schedule'

function App() {
  const [schedule, setSchedule] = useState<ParsedSchedule | null>(null)

  return (
    <div className="app">
      <BackgroundLogos />
      <Header />
      <main className="app-main">
        <div className="app-panel">
          {schedule ? (
            <CalendarConfigStep schedule={schedule} onBack={() => setSchedule(null)} />
          ) : (
            <ScheduleInputStep onParsed={setSchedule} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
