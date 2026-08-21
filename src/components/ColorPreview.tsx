import { FiShuffle } from 'react-icons/fi'
import { EVENT_COLOR_HEX } from '../lib/colors'

interface ColorPreviewProps {
  subjects: { code: string; name: string }[]
  colorMap: Map<string, string>
  onShuffle: () => void
}

export function ColorPreview({ subjects, colorMap, onShuffle }: ColorPreviewProps) {
  return (
    <div className="color-preview">
      <span className="color-preview__label">Màu theo môn học</span>
      <ul className="color-preview__list">
        {subjects.map((subject) => (
          <li key={subject.code} className="color-preview__item">
            <span
              className="color-preview__swatch"
              style={{ backgroundColor: EVENT_COLOR_HEX[colorMap.get(subject.code) ?? '1'] }}
            />
            {subject.name}
          </li>
        ))}
      </ul>
      <button type="button" className="color-preview__shuffle" onClick={onShuffle}>
        <FiShuffle aria-hidden="true" />
        Đổi màu
      </button>
    </div>
  )
}
