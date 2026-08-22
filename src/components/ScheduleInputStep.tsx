import { useState, type DragEvent, type FormEvent } from 'react'
import { FiCalendar, FiFileText, FiHelpCircle, FiUpload, FiX } from 'react-icons/fi'
import { Modal } from './Modal'
import { parseScheduleExcelFile } from '../lib/parseScheduleExcel'
import type { ParsedSchedule } from '../types/schedule'

interface ScheduleInputStepProps {
  onParsed: (schedule: ParsedSchedule) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx')
}

export function ScheduleInputStep({ onParsed }: ScheduleInputStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  function pickFile(candidate: File | null | undefined) {
    if (!candidate) return

    if (!isExcelFile(candidate)) {
      setError('Chỉ hỗ trợ file .xlsx. Hãy chọn đúng file Excel export từ FTU2.')
      setFile(null)
      return
    }

    setError(null)
    setFile(candidate)
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsDragActive(false)
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsDragActive(false)
    pickFile(event.dataTransfer.files[0])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!file) {
      setError('Vui lòng chọn file Excel thời khoá biểu trước.')
      return
    }

    setIsParsing(true)
    try {
      onParsed(await parseScheduleExcelFile(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi không xác định khi đọc file.')
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <form className="wizard-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <div className="field__header">
          <label>
            <FiUpload aria-hidden="true" />
            File Excel thời khoá biểu
          </label>
          <button type="button" className="field__guide-btn" onClick={() => setIsGuideOpen(true)}>
            <FiHelpCircle aria-hidden="true" />
            Hướng dẫn
          </button>
        </div>
        {file ? (
          <div
            className={`file-chip${isDragActive ? ' file-chip--active' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="file-chip__icon">
              <FiFileText aria-hidden="true" />
            </span>
            <div className="file-chip__info">
              <span className="file-chip__name">{file.name}</span>
              <span className="file-chip__size">{formatFileSize(file.size)}</span>
            </div>
            <label className="file-chip__change" htmlFor="schedule-file">
              Đổi file
            </label>
            <button
              type="button"
              className="file-chip__remove"
              aria-label="Bỏ chọn file"
              onClick={() => setFile(null)}
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label
            className={`file-drop${isDragActive ? ' file-drop--active' : ''}`}
            htmlFor="schedule-file"
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FiUpload className="file-drop__icon" aria-hidden="true" />
            <span className="file-drop__text">Kéo thả file .xlsx vào đây, hoặc bấm để chọn</span>
          </label>
        )}
        <input
          id="schedule-file"
          type="file"
          accept=".xlsx"
          aria-label="File Excel thời khoá biểu"
          className="file-drop__input"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
      </div>

      <button type="submit" disabled={isParsing}>
        <FiCalendar aria-hidden="true" />
        {isParsing ? 'Đang đọc file...' : 'Tạo lịch'}
      </button>

      {error && (
        <p role="alert" className="wizard-form__error">
          {error}
        </p>
      )}

      {isGuideOpen && (
        <Modal onClose={() => setIsGuideOpen(false)}>
          <div className="guide-modal">
            <h2 className="guide-modal__title">Cách lấy file Excel thời khoá biểu</h2>
            <ol className="guide-modal__steps">
              <li>
                Đăng nhập vào{' '}
                <a href="https://ftugate.ftu.edu.vn/#/" target="_blank" rel="noopener noreferrer">
                  FtuGate
                </a>
                .
              </li>
              <li>
                Vào phần <strong>Thời khóa biểu dạng học kỳ</strong> ở thanh menu bên trái.
              </li>
              <li>
                Chọn loại Thời khóa biểu và Học kỳ bạn mong muốn (ví dụ: Học kỳ 1 - Năm học 2026 -
                2027 và Thời khóa biểu lớp sinh viên).
              </li>
              <li>
                Chọn <strong>"Xuất Excel"</strong> để tải file Excel về.
              </li>
            </ol>
            <button
              type="button"
              className="guide-modal__close"
              onClick={() => setIsGuideOpen(false)}
            >
              Đã hiểu
            </button>
          </div>
        </Modal>
      )}
    </form>
  )
}
