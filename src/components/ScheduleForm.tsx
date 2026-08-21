import { useState, type FormEvent } from 'react'
import { FiCalendar } from 'react-icons/fi'
import {
  calendarSummaryForSemester,
  ensureCalendar,
  pushSessionsToGoogleCalendar,
  type PushProgress,
} from '../lib/googleCalendar'
import { parseSchedule } from '../lib/parseSchedule'
import { ProgressPanel } from './ProgressPanel'

const MIN_REMINDER_MINUTES = 0
const MAX_REMINDER_MINUTES = 40320

interface ScheduleFormProps {
  accessToken: string | null
}

export function ScheduleForm({ accessToken }: ScheduleFormProps) {
  const [rawData, setRawData] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState(45)
  const [semester, setSemester] = useState<string | null>(null)
  const [progress, setProgress] = useState<PushProgress | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setProgress(null)
    setSemester(null)

    if (!rawData.trim()) {
      setError('Vui lòng dán dữ liệu thời khoá biểu trước.')
      return
    }
    if (reminderMinutes < MIN_REMINDER_MINUTES || reminderMinutes > MAX_REMINDER_MINUTES) {
      setError(`Số phút nhắc phải từ ${MIN_REMINDER_MINUTES} đến ${MAX_REMINDER_MINUTES}.`)
      return
    }
    if (!accessToken) {
      setError('Vui lòng đăng nhập Google trước khi tạo lịch.')
      return
    }

    let parsed
    try {
      parsed = parseSchedule(rawData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi không xác định khi đọc dữ liệu.')
      return
    }
    setSemester(parsed.semester)

    setIsSubmitting(true)
    try {
      const calendarId = await ensureCalendar(
        accessToken,
        calendarSummaryForSemester(parsed.semester),
      )
      const finalProgress = await pushSessionsToGoogleCalendar(
        accessToken,
        calendarId,
        parsed.sessions,
        reminderMinutes,
        setProgress,
      )
      setProgress(finalProgress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đưa lịch lên Google Calendar thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <button type="submit" disabled={isSubmitting}>
        <FiCalendar aria-hidden="true" />
        {isSubmitting ? 'Đang tạo lịch...' : 'Tạo lịch'}
      </button>

      {error && (
        <p role="alert" className="schedule-form__error">
          {error}
        </p>
      )}
      {progress && semester && <ProgressPanel progress={progress} semester={semester} />}
    </form>
  )
}
