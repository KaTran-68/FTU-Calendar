export type ScheduleKind = 'class' | 'exam'

export interface ClassSession {
  id: string
  subjectCode: string
  subjectName: string
  room: string
  className: string
  group: string
  teacher: string
  date: string
  startTime: string
  endTime: string
  /** Mặc định là buổi học; 'exam' cho buổi thi. */
  kind?: ScheduleKind
  /** Mô tả sự kiện dựng sẵn (dùng cho lịch thi). Nếu thiếu sẽ dựng từ lớp/nhóm/giảng viên. */
  description?: string
}

export interface ParsedSchedule {
  /** Mặc định là thời khóa biểu; 'exam' cho lịch thi. */
  kind?: ScheduleKind
  semester: string
  sessions: ClassSession[]
}
