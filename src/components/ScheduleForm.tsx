import { useState, type FormEvent } from 'react'
import { FiCalendar } from 'react-icons/fi'
import { parseSchedule } from '../lib/parseSchedule'
import type { ParsedSchedule } from '../types/schedule'

const MIN_REMINDER_MINUTES = 0
const MAX_REMINDER_MINUTES = 40320

export function ScheduleForm() {
  const [rawData, setRawData] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState(45)
  const [result, setResult] = useState<ParsedSchedule | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResult(null)
    setError(null)

    if (!rawData.trim()) {
      setError('Vui lòng dán dữ liệu thời khoá biểu trước.')
      return
    }
    if (reminderMinutes < MIN_REMINDER_MINUTES || reminderMinutes > MAX_REMINDER_MINUTES) {
      setError(`Số phút nhắc phải từ ${MIN_REMINDER_MINUTES} đến ${MAX_REMINDER_MINUTES}.`)
      return
    }

    try {
      setResult(parseSchedule(rawData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi không xác định khi đọc dữ liệu.')
    }
  }

  const subjectCount = result ? new Set(result.sessions.map((s) => s.subjectCode)).size : 0

  return (
    <form className="schedule-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="schedule-data">Dữ liệu thời khoá biểu</label>
      <textarea
        id="schedule-data"
        value={rawData}
        onChange={(event) => setRawData(event.target.value)}
        placeholder="Dán nội dung JSON thời khoá biểu vào đây..."
        rows={10}
      />

      <label htmlFor="reminder-minutes">Nhắc trước (phút)</label>
      <input
        id="reminder-minutes"
        type="number"
        min={MIN_REMINDER_MINUTES}
        max={MAX_REMINDER_MINUTES}
        value={reminderMinutes}
        onChange={(event) => setReminderMinutes(Number(event.target.value))}
      />

      <button type="submit">
        <FiCalendar aria-hidden="true" />
        Tạo lịch
      </button>

      {error && (
        <p role="alert" className="schedule-form__error">
          {error}
        </p>
      )}
      {result && (
        <p className="schedule-form__result">
          Đã đọc {result.sessions.length} buổi học của {subjectCount} môn (học kỳ {result.semester}
          ).
        </p>
      )}
    </form>
  )
}
