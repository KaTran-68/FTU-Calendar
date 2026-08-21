import { FiShuffle } from 'react-icons/fi'
import { EVENT_COLOR_HEX } from '../lib/colors'

interface ColorPreviewProps {
  subjects: { code: string; name: string }[]
  colorMap: Map<string, string>
  onShuffle: () => void
}

const PREVIEW_START_HOUR = 7

export function ColorPreview({ subjects, colorMap, onShuffle }: ColorPreviewProps) {
  return (
    <div className="color-preview">
      <span className="color-preview__label">Xem trước màu trên Google Calendar</span>
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
              <div
                className="color-preview__event"
                style={{ backgroundColor: EVENT_COLOR_HEX[colorMap.get(subject.code) ?? '1'] }}
              >
                {subject.name}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button type="button" className="color-preview__shuffle" onClick={onShuffle}>
        <FiShuffle aria-hidden="true" />
        Đổi màu
      </button>
    </div>
  )
}
