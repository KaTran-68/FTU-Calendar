export interface ClassSession {
  id: string
  subjectCode: string
  subjectName: string
  room: string
  className: string
  group: string
  date: string
  startTime: string
  endTime: string
}

export interface ParsedSchedule {
  semester: string
  sessions: ClassSession[]
}
