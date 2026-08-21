import { useState } from 'react'
import './App.css'
import { CalendarConfigStep } from './components/CalendarConfigStep'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ScheduleInputStep } from './components/ScheduleInputStep'
import type { ParsedSchedule } from './types/schedule'

function App() {
  const [rawData, setRawData] = useState('')
  const [schedule, setSchedule] = useState<ParsedSchedule | null>(null)

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="app-panel">
          {schedule ? (
            <CalendarConfigStep schedule={schedule} onBack={() => setSchedule(null)} />
          ) : (
            <ScheduleInputStep
              rawData={rawData}
              onRawDataChange={setRawData}
              onParsed={setSchedule}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
