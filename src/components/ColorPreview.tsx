import { useRef, useState } from 'react'
import { FiEye, FiShuffle } from 'react-icons/fi'
import { EVENT_COLOR_HEX, EVENT_COLOR_IDS, EVENT_COLOR_NAMES } from '../lib/colors'

interface ColorPreviewProps {
  subjects: { code: string; name: string }[]
  colorMap: Map<string, string>
  onShuffle: () => void
  onColorChange: (subjectCode: string, colorId: string) => void
}

const PREVIEW_START_HOUR = 7
const POPOVER_WIDTH = 260

export function ColorPreview({ subjects, colorMap, onShuffle, onColorChange }: ColorPreviewProps) {
  const [openSubjectCode, setOpenSubjectCode] = useState<string | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const openSubject = subjects.find((subject) => subject.code === openSubjectCode)

  function toggleSubject(subjectCode: string, button: HTMLButtonElement) {
    if (openSubjectCode === subjectCode) {
      setOpenSubjectCode(null)
      return
    }

    const containerRect = containerRef.current?.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    if (containerRect) {
      const left = Math.min(
        buttonRect.left - containerRect.left,
        containerRect.width - POPOVER_WIDTH,
      )
      setPopoverPosition({
        top: buttonRect.bottom - containerRect.top + 6,
        left: Math.max(left, 0),
      })
    }
    setOpenSubjectCode(subjectCode)
  }

  function applyColor(subjectCode: string, colorId: string) {
    onColorChange(subjectCode, colorId)
    setOpenSubjectCode(null)
  }

  return (
    <div className="color-preview" ref={containerRef}>
      <span className="color-preview__label">
        <FiEye aria-hidden="true" />
        Xem trước màu trên Google Calendar
      </span>
      <p className="color-preview__hint">
        Bạn có thể ấn vô các card để tự chỉnh màu hoặc ấn vào nút "Đổi màu" để thay đổi ngẫu nhiên.
      </p>
      <div className="color-preview__grid">
        <div className="color-preview__hours">
          {subjects.map((subject, index) => (
            <div key={subject.code} className="color-preview__hour">
              {PREVIEW_START_HOUR + index}:00
            </div>
          ))}
        </div>
        <div className="color-preview__column">
          {subjects.map((subject) => (
            <div key={subject.code} className="color-preview__row">
              <button
                type="button"
                className="color-preview__event"
                style={{ backgroundColor: EVENT_COLOR_HEX[colorMap.get(subject.code) ?? '1'] }}
                onClick={(event) => toggleSubject(subject.code, event.currentTarget)}
              >
                {subject.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {openSubject && popoverPosition && (
        <div
          className="color-preview__palette"
          role="menu"
          style={{ top: popoverPosition.top, left: popoverPosition.left, width: POPOVER_WIDTH }}
        >
          <span className="color-preview__palette-label">Chọn màu cho "{openSubject.name}"</span>
          <div className="color-preview__palette-swatches">
            {EVENT_COLOR_IDS.map((colorId) => (
              <button
                key={colorId}
                type="button"
                role="menuitem"
                className="color-preview__swatch-option"
                style={{ backgroundColor: EVENT_COLOR_HEX[colorId] }}
                aria-label={EVENT_COLOR_NAMES[colorId]}
                onClick={() => applyColor(openSubject.code, colorId)}
              />
            ))}
          </div>
        </div>
      )}

      <button type="button" className="color-preview__shuffle" onClick={onShuffle}>
        <FiShuffle aria-hidden="true" />
        Đổi màu
      </button>
    </div>
  )
}
