import { useState, type FormEvent } from 'react'
import { FiCalendar } from 'react-icons/fi'
import { parseSchedule } from '../lib/parseSchedule'
import type { ParsedSchedule } from '../types/schedule'

interface ScheduleInputStepProps {
  rawData: string
  onRawDataChange: (value: string) => void
  onParsed: (schedule: ParsedSchedule) => void
}

export function ScheduleInputStep({ rawData, onRawDataChange, onParsed }: ScheduleInputStepProps) {
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!rawData.trim()) {
      setError('Vui lòng dán dữ liệu thời khoá biểu trước.')
      return
    }

    try {
      onParsed(parseSchedule(rawData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi không xác định khi đọc dữ liệu.')
    }
  }

  return (
    <form className="wizard-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="schedule-data">Dữ liệu thời khoá biểu</label>
      <textarea
        id="schedule-data"
        value={rawData}
        onChange={(event) => onRawDataChange(event.target.value)}
        placeholder="Dán nội dung JSON thời khoá biểu vào đây..."
        rows={10}
      />

      <button type="submit">
        <FiCalendar aria-hidden="true" />
        Tạo lịch
      </button>

      {error && (
        <p role="alert" className="wizard-form__error">
          {error}
        </p>
      )}
    </form>
  )
}
