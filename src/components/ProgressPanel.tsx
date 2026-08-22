import { FiCheckCircle } from 'react-icons/fi'
import type { PushProgress } from '../lib/googleCalendar'

interface ProgressPanelProps {
  progress: PushProgress
  semester: string
  onClose: () => void
}

export function ProgressPanel({ progress, semester, onClose }: ProgressPanelProps) {
  const success = progress.failed === 0

  return (
    <div className="progress-panel">
      <FiCheckCircle className="progress-panel__icon" aria-hidden="true" />
      <h2 className="progress-panel__title">
        {success ? 'Đã tạo lịch thành công!' : 'Đã tạo lịch xong'}
      </h2>
      <p className="progress-panel__summary">
        Đã tạo {progress.created}/{progress.total} sự kiện vào lịch học kỳ {semester}
        {progress.skipped > 0 ? `, bỏ qua ${progress.skipped} buổi đã có` : ''}
        {progress.failed > 0 ? `, lỗi ${progress.failed} buổi` : ''}.
      </p>
      <button type="button" className="progress-panel__close" onClick={onClose}>
        Đóng
      </button>
    </div>
  )
}
