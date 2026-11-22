import { useState, type DragEvent, type FormEvent } from 'react'
import { FiCalendar, FiClipboard, FiFileText, FiHelpCircle, FiUpload, FiX } from 'react-icons/fi'
import { Modal } from './Modal'
import { parseExamText } from '../lib/parseExamExcel'
import { parseScheduleExcelFile } from '../lib/parseScheduleExcel'
import type { ParsedSchedule } from '../types/schedule'

interface ScheduleInputStepProps {
  onParsed: (schedule: ParsedSchedule) => void
}

type InputMode = 'file' | 'paste'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx')
}

export function ScheduleInputStep({ onParsed }: ScheduleInputStepProps) {
  const [mode, setMode] = useState<InputMode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [guideTab, setGuideTab] = useState<InputMode>('file')

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

  function openGuide() {
    setGuideTab(mode)
    setIsGuideOpen(true)
  }

  function switchMode(next: InputMode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (mode === 'file' && !file) {
      setError('Vui lòng chọn file Excel thời khoá biểu hoặc lịch thi trước.')
      return
    }

    setIsParsing(true)
    try {
      if (mode === 'paste') {
        onParsed(parseExamText(pastedText))
      } else if (file) {
        onParsed(await parseScheduleExcelFile(file))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi không xác định khi đọc file.')
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <form className="wizard-form" onSubmit={handleSubmit} noValidate>
      <div className="input-tabs" role="tablist" aria-label="Cách nhập lịch">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'file'}
          className={`input-tabs__tab${mode === 'file' ? ' input-tabs__tab--active' : ''}`}
          onClick={() => switchMode('file')}
        >
          <FiUpload aria-hidden="true" />
          Tải file Excel
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'paste'}
          className={`input-tabs__tab${mode === 'paste' ? ' input-tabs__tab--active' : ''}`}
          onClick={() => switchMode('paste')}
        >
          <FiClipboard aria-hidden="true" />
          Dán nội dung
        </button>
      </div>

      <div className="field">
        <div className="field__header">
          <label htmlFor={mode === 'paste' ? 'schedule-text' : undefined}>
            {mode === 'paste'
              ? 'Nội dung trang lịch thi'
              : 'File Excel thời khoá biểu hoặc lịch thi'}
          </label>
          <button type="button" className="field__guide-btn" onClick={openGuide}>
            <FiHelpCircle aria-hidden="true" />
            Hướng dẫn
          </button>
        </div>
        {mode === 'paste' && (
          <textarea
            id="schedule-text"
            className="paste-box"
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
            placeholder="Mở trang Xem lịch thi trên FtuGate, bấm Ctrl+A rồi Ctrl+C, sau đó dán vào đây (Ctrl+V)."
            spellCheck={false}
          />
        )}
        {mode === 'file' &&
          (file ? (
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
          ))}
        {mode === 'file' && (
          <input
            id="schedule-file"
            type="file"
            accept=".xlsx"
            aria-label="File Excel thời khoá biểu hoặc lịch thi"
            className="file-drop__input"
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
        )}
      </div>

      <button type="submit" disabled={isParsing}>
        <FiCalendar aria-hidden="true" />
        {isParsing ? 'Đang đọc...' : 'Tạo lịch'}
      </button>

      {error && (
        <p role="alert" className="wizard-form__error">
          {error}
        </p>
      )}

      {isGuideOpen && (
        <Modal onClose={() => setIsGuideOpen(false)}>
          <div className="guide-modal">
            <h2 className="guide-modal__title">Hướng dẫn nhập lịch</h2>
            <div className="input-tabs" role="tablist" aria-label="Loại hướng dẫn">
              <button
                type="button"
                role="tab"
                aria-selected={guideTab === 'file'}
                className={`input-tabs__tab${guideTab === 'file' ? ' input-tabs__tab--active' : ''}`}
                onClick={() => setGuideTab('file')}
              >
                <FiUpload aria-hidden="true" />
                Import Excel
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={guideTab === 'paste'}
                className={`input-tabs__tab${guideTab === 'paste' ? ' input-tabs__tab--active' : ''}`}
                onClick={() => setGuideTab('paste')}
              >
                <FiClipboard aria-hidden="true" />
                Dán nội dung
              </button>
            </div>
            {guideTab === 'file' ? (
              <div className="guide-modal__sections">
                <section className="guide-modal__section">
                  <h3>Thời khoá biểu</h3>
                  <ol className="guide-modal__steps">
                    <li>
                      Đăng nhập vào{' '}
                      <a
                        href="https://ftugate.ftu.edu.vn/#/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        FtuGate
                      </a>
                      .
                    </li>
                    <li>
                      Vào phần <strong>Thời khóa biểu dạng học kỳ</strong> ở thanh menu bên trái.
                    </li>
                    <li>
                      Chọn loại Thời khóa biểu và Học kỳ bạn mong muốn (ví dụ: Học kỳ 1 - Năm học
                      2026 - 2027 và Thời khóa biểu lớp sinh viên).
                    </li>
                    <li>
                      Chọn <strong>"Xuất Excel"</strong> để tải file Excel về.
                    </li>
                  </ol>
                </section>
                <section className="guide-modal__section">
                  <h3>Lịch thi</h3>
                  <ol className="guide-modal__steps">
                    <li>
                      Trên FtuGate, vào phần <strong>Lịch thi</strong> ở thanh menu bên trái.
                    </li>
                    <li>Chọn Học kỳ và đợt thi bạn mong muốn.</li>
                    <li>
                      Chọn <strong>"Xuất Excel"</strong> để tải file Excel về. App tự nhận ra file
                      lịch thi và tạo calendar riêng (mỗi buổi thi mặc định kéo dài 90 phút).
                    </li>
                  </ol>
                </section>
              </div>
            ) : (
              <section className="guide-modal__section">
                <h3>Lịch thi: dán nội dung thay cho file</h3>
                <ol className="guide-modal__steps">
                  <li>
                    Mở trang <strong>Xem lịch thi</strong> trên FtuGate, chọn Học kỳ và đợt thi, đợi
                    bảng hiện đủ.
                  </li>
                  <li>
                    Bấm <strong>Ctrl+A</strong> rồi <strong>Ctrl+C</strong> để copy cả trang.
                  </li>
                  <li>
                    Quay lại đây, chọn tab <strong>Dán nội dung</strong>, bấm{' '}
                    <strong>Ctrl+V</strong> vào ô trống rồi bấm Tạo lịch. Phần menu và thống kê
                    trong nội dung dán sẽ tự bị bỏ qua.
                  </li>
                </ol>
                <p className="guide-modal__note">
                  Cách dán chỉ dùng cho lịch thi. Thời khoá biểu vẫn cần import file Excel.
                </p>
              </section>
            )}
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
