import { useMemo, useState, type FormEvent } from 'react'
import { FiArrowLeft, FiCheck } from 'react-icons/fi'
import { ColorPreview } from './ColorPreview'
import { ProgressPanel } from './ProgressPanel'
import { buildSubjectColorMap, EVENT_COLOR_IDS, shuffleColorOrder } from '../lib/colors'
import { requestGoogleAccessToken } from '../lib/googleAuth'
import {
  calendarSummaryForSemester,
  ensureCalendar,
  pushSessionsToGoogleCalendar,
  type PushProgress,
} from '../lib/googleCalendar'
import type { ParsedSchedule } from '../types/schedule'

const MIN_REMINDER_MINUTES = 0
const MAX_REMINDER_MINUTES = 40320

type Status = 'idle' | 'authorizing' | 'pushing'

interface CalendarConfigStepProps {
  schedule: ParsedSchedule
  onBack: () => void
  clientId?: string
}

export function CalendarConfigStep({
  schedule,
  onBack,
  clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID,
}: CalendarConfigStepProps) {
  const [calendarName, setCalendarName] = useState(calendarSummaryForSemester(schedule.semester))
  const [reminderMinutes, setReminderMinutes] = useState(45)
  const [colorOrder, setColorOrder] = useState<string[]>(EVENT_COLOR_IDS)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<PushProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const subjects = useMemo(() => {
    const seen = new Map<string, string>()
    for (const session of schedule.sessions) {
      if (!seen.has(session.subjectCode)) seen.set(session.subjectCode, session.subjectName)
    }
    return Array.from(seen, ([code, name]) => ({ code, name }))
  }, [schedule])

  const colorMap = useMemo(
    () => buildSubjectColorMap(schedule.sessions, colorOrder),
    [schedule, colorOrder],
  )

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setProgress(null)

    if (!calendarName.trim()) {
      setError('Vui lòng nhập tên calendar.')
      return
    }
    if (reminderMinutes < MIN_REMINDER_MINUTES || reminderMinutes > MAX_REMINDER_MINUTES) {
      setError(`Số phút nhắc phải từ ${MIN_REMINDER_MINUTES} đến ${MAX_REMINDER_MINUTES}.`)
      return
    }

    try {
      let token = accessToken
      if (!token) {
        if (!clientId) {
          setError('Thiếu VITE_GOOGLE_CLIENT_ID trong file .env.')
          return
        }
        setStatus('authorizing')
        token = await requestGoogleAccessToken(clientId)
        setAccessToken(token)
      }

      setStatus('pushing')
      const calendarId = await ensureCalendar(token, calendarName.trim())
      const finalProgress = await pushSessionsToGoogleCalendar(
        token,
        calendarId,
        schedule.sessions,
        reminderMinutes,
        colorMap,
        setProgress,
      )
      setProgress(finalProgress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo lịch.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <form className="wizard-form" onSubmit={handleConfirm} noValidate>
      <button type="button" className="wizard-form__back" onClick={onBack}>
        <FiArrowLeft aria-hidden="true" />
        Quay lại
      </button>

      <label htmlFor="calendar-name">Tên Calendar</label>
      <input
        id="calendar-name"
        type="text"
        value={calendarName}
        onChange={(event) => setCalendarName(event.target.value)}
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

      <ColorPreview
        subjects={subjects}
        colorMap={colorMap}
        onShuffle={() => setColorOrder(shuffleColorOrder(colorOrder))}
      />

      <button type="submit" disabled={status !== 'idle'}>
        <FiCheck aria-hidden="true" />
        {status === 'authorizing' && 'Đang đăng nhập Google...'}
        {status === 'pushing' && 'Đang tạo lịch...'}
        {status === 'idle' && 'Xác nhận tạo lịch'}
      </button>

      {error && (
        <p role="alert" className="wizard-form__error">
          {error}
        </p>
      )}
      {progress && <ProgressPanel progress={progress} semester={schedule.semester} />}
    </form>
  )
}
