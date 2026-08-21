import type { PushProgress } from '../lib/googleCalendar'

interface ProgressPanelProps {
  progress: PushProgress
  semester: string
}

export function ProgressPanel({ progress, semester }: ProgressPanelProps) {
  return (
    <p className="progress-panel">
      Đã tạo {progress.created}/{progress.total} sự kiện vào lịch học kỳ {semester}
      {progress.skipped > 0 ? `, bỏ qua ${progress.skipped} buổi đã có` : ''}
      {progress.failed > 0 ? `, lỗi ${progress.failed} buổi` : ''}.
    </p>
  )
}
