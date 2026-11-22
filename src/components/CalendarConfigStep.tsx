import { useMemo, useState, type FormEvent } from 'react'
import { FiArrowLeft, FiBell, FiCalendar, FiCheck, FiEdit3 } from 'react-icons/fi'
import { ColorPreview } from './ColorPreview'
import { Modal } from './Modal'
import { ProgressPanel } from './ProgressPanel'
import { AUTO_COLOR_IDS, buildSubjectColorMap, shuffleColorOrder } from '../lib/colors'
import { requestGoogleAccessToken } from '../lib/googleAuth'
import {
  calendarSummaryForSemester,
  deleteAppEvents,
  ensureCalendar,
  pushSessionsToGoogleCalendar,
  type PushProgress,
} from '../lib/googleCalendar'
import type { ParsedSchedule } from '../types/schedule'

const MIN_REMINDER_MINUTES = 0
const MAX_REMINDER_MINUTES = 40320
/** Mã học kỳ dạng <năm bắt đầu><số học kỳ>, ví dụ 20261. */
const SEMESTER_PATTERN = /^\d{5}$/

type Status = 'idle' | 'authorizing' | 'deleting' | 'pushing'

function formatDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

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
  const isExam = schedule.kind === 'exam'
  const [semester, setSemester] = useState(schedule.semester)
  const calendarName = calendarSummaryForSemester(semester.trim(), schedule.kind)
  const [reminderMinutes, setReminderMinutes] = useState(45)
  const [colorOrder, setColorOrder] = useState<string[]>(AUTO_COLOR_IDS)
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({})
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<PushProgress | null>(null)
  const [replaceOld, setReplaceOld] = useState(false)
  const [deletedCount, setDeletedCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const subjects = useMemo(() => {
    const seen = new Map<string, string>()
    for (const session of schedule.sessions) {
      if (!seen.has(session.subjectCode)) seen.set(session.subjectCode, session.subjectName)
    }
    return Array.from(seen, ([code, name]) => ({ code, name }))
  }, [schedule])

  const colorMap = useMemo(() => {
    const map = buildSubjectColorMap(schedule.sessions, colorOrder)
    for (const [subjectCode, colorId] of Object.entries(colorOverrides)) {
      map.set(subjectCode, colorId)
    }
    return map
  }, [schedule, colorOrder, colorOverrides])

  const sessionSummary = useMemo(() => {
    const dates = schedule.sessions.map((session) => session.date).sort()
    return {
      total: schedule.sessions.length,
      from: dates[0],
      to: dates[dates.length - 1],
    }
  }, [schedule])

  async function runPush(token: string, deleteOldFirst: boolean) {
    setStatus('pushing')
    try {
      const calendarId = await ensureCalendar(token, calendarName)

      if (deleteOldFirst) {
        setStatus('deleting')
        const deletion = await deleteAppEvents(token, calendarId)
        if (deletion.failed > 0) {
          setError(
            `Không xóa được ${deletion.failed} buổi cũ nên chưa tạo lịch mới. Hãy bấm "Xác nhận tạo lịch" để thử lại.`,
          )
          return
        }
        setDeletedCount(deletion.deleted)
        setStatus('pushing')
      }

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

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setProgress(null)
    setDeletedCount(null)

    if (!SEMESTER_PATTERN.test(semester.trim())) {
      setError('Học kỳ gồm 5 chữ số, ví dụ 20261.')
      return
    }
    if (
      !Number.isInteger(reminderMinutes) ||
      reminderMinutes < MIN_REMINDER_MINUTES ||
      reminderMinutes > MAX_REMINDER_MINUTES
    ) {
      setError(
        `Số phút nhắc phải là số nguyên từ ${MIN_REMINDER_MINUTES} đến ${MAX_REMINDER_MINUTES}.`,
      )
      return
    }

    let token = accessToken
    if (!token) {
      if (!clientId) {
        setError('Thiếu VITE_GOOGLE_CLIENT_ID trong file .env.')
        return
      }
      setStatus('authorizing')
      try {
        token = await requestGoogleAccessToken(clientId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo lịch.')
        setStatus('idle')
        return
      }
      setAccessToken(token)
    }

    await runPush(token, replaceOld)
  }

  function handleRetry() {
    if (!accessToken) return
    setError(null)
    setProgress(null)
    // Các buổi cũ đã được xóa ở lượt đầu; thử lại chỉ tạo nốt buổi lỗi, không xóa lại buổi vừa tạo.
    void runPush(accessToken, false)
  }

  return (
    <form className="wizard-form" onSubmit={handleConfirm} noValidate>
      <button
        type="button"
        className="wizard-form__back"
        onClick={onBack}
        disabled={status !== 'idle'}
      >
        <FiArrowLeft aria-hidden="true" />
        Quay lại
      </button>

      <div className="field-row">
        <div className="field">
          <label htmlFor="semester">Học kỳ</label>
          <div className="field__input-wrap">
            <FiEdit3 aria-hidden="true" />
            <input
              id="semester"
              type="text"
              inputMode="numeric"
              placeholder="20261"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
            />
          </div>
          <small className="field__hint">
            Calendar sẽ là: <strong>{calendarName}</strong>
          </small>
        </div>

        <div className="field">
          <label htmlFor="reminder-minutes">Nhắc trước (phút)</label>
          <div className="field__input-wrap">
            <FiBell aria-hidden="true" />
            <input
              id="reminder-minutes"
              type="number"
              step={1}
              min={MIN_REMINDER_MINUTES}
              max={MAX_REMINDER_MINUTES}
              value={reminderMinutes}
              onChange={(event) => setReminderMinutes(Number(event.target.value))}
            />
          </div>
        </div>
      </div>

      <p className="schedule-summary">
        <FiCalendar aria-hidden="true" />
        Sẽ tạo {sessionSummary.total} {isExam ? 'buổi thi' : 'buổi học'}, từ{' '}
        {formatDisplayDate(sessionSummary.from)} đến {formatDisplayDate(sessionSummary.to)}.
      </p>

      <div className="field-check">
        <label className="field-check__label" htmlFor="replace-old">
          <input
            id="replace-old"
            type="checkbox"
            checked={replaceOld}
            disabled={status !== 'idle'}
            onChange={(event) => setReplaceOld(event.target.checked)}
          />
          <span className="field-check__text">
            <strong>Xóa các buổi cũ rồi tạo lại</strong>
            <span>
              Dùng khi trường đổi lịch. Chỉ xóa các buổi do app tạo trong calendar này, không xóa sự
              kiện bạn tự thêm. Không hoàn tác được.
            </span>
          </span>
        </label>
      </div>

      <ColorPreview
        subjects={subjects}
        colorMap={colorMap}
        onShuffle={() => {
          setColorOrder(shuffleColorOrder(colorOrder))
          setColorOverrides({})
        }}
        onColorChange={(subjectCode, colorId) =>
          setColorOverrides((prev) => ({ ...prev, [subjectCode]: colorId }))
        }
      />

      <button type="submit" disabled={status !== 'idle'}>
        <FiCheck aria-hidden="true" />
        {status === 'authorizing' && 'Đang đăng nhập Google...'}
        {status === 'deleting' && 'Đang xóa lịch cũ...'}
        {status === 'pushing' && 'Đang tạo lịch...'}
        {status === 'idle' && 'Xác nhận tạo lịch'}
      </button>

      {error && (
        <p role="alert" className="wizard-form__error">
          {error}
        </p>
      )}
      {(status !== 'idle' || progress) && (
        <Modal onClose={status === 'idle' ? () => setProgress(null) : () => {}}>
          {status !== 'idle' ? (
            <div className="modal-loading">
              <span className="modal-loading__spinner" aria-hidden="true" />
              <p className="modal-loading__text">
                {status === 'authorizing' && 'Đang đăng nhập Google...'}
                {status === 'deleting' && 'Đang xóa các buổi cũ...'}
                {status === 'pushing' && 'Đang tạo lịch...'}
              </p>
              {status === 'pushing' && progress && (
                <p className="modal-loading__count">
                  {progress.created + progress.skipped}/{progress.total}
                </p>
              )}
            </div>
          ) : (
            progress && (
              <ProgressPanel
                progress={progress}
                semester={schedule.semester}
                deleted={deletedCount ?? undefined}
                onClose={() => setProgress(null)}
                onRetry={progress.failed > 0 ? handleRetry : undefined}
              />
            )
          )}
        </Modal>
      )}
    </form>
  )
}
