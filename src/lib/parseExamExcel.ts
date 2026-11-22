import { SSF } from 'xlsx'
import type { ClassSession, ParsedSchedule } from '../types/schedule'
import { formatDate, inferSemester } from './semester'

export const EXAM_REQUIRED_COLUMNS = [
  'Mã MH',
  'Tên môn học',
  'Nhóm thi',
  'Tổ thi',
  'Ngày thi',
  'Giờ bắt đầu',
  'Phòng thi',
] as const

/** File export lịch thi không có giờ kết thúc, nên dùng thời lượng mặc định. */
export const EXAM_DURATION_MINUTES = 90

const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/

export type ExamRow = Record<string, unknown>

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function parseExamDate(value: unknown): Date {
  if (typeof value === 'number') {
    const parsed = SSF.parse_date_code(value)
    if (parsed) {
      // Portal xuất ngày dạng chữ dd/mm/yyyy. Với ngày <= 12 (vd "05/12/2026"), Excel hiểu nhầm
      // theo kiểu Mỹ mm/dd thành ô ngày 12/05/2026, nên phải đảo lại. Ô ngày có ngày > 12 không
      // thể là kết quả của việc đảo này nên giữ nguyên.
      if (parsed.d <= 12) return new Date(parsed.y, parsed.d - 1, parsed.m)
      return new Date(parsed.y, parsed.m - 1, parsed.d)
    }
  } else {
    const match = toText(value).match(DATE_PATTERN)
    if (match) {
      const [, day, month, year] = match
      const date = new Date(Number(year), Number(month) - 1, Number(day))
      if (date.getDate() === Number(day) && date.getMonth() === Number(month) - 1) return date
    }
  }
  throw new Error(`Không đọc được cột "Ngày thi": "${toText(value)}".`)
}

function parseStartTime(value: unknown): { hours: number; minutes: number } {
  const match = toText(value).match(TIME_PATTERN)
  const hours = match ? Number(match[1]) : NaN
  const minutes = match ? Number(match[2]) : NaN
  if (!match || hours > 23 || minutes > 59) {
    throw new Error(`Không đọc được cột "Giờ bắt đầu": "${toText(value)}".`)
  }
  return { hours, minutes }
}

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function isExamHeader(row: ExamRow): boolean {
  return 'Ngày thi' in row && 'Giờ bắt đầu' in row
}

/**
 * Đọc lịch thi từ nội dung trang "Xem lịch thi" (Ctrl+A, Ctrl+C). Trình duyệt copy bảng thành
 * text, các ô cách nhau bằng tab; dòng tiêu đề của bảng dùng để ghép tên cột cho từng dòng thi.
 */
export function parseExamText(text: string): ParsedSchedule {
  if (!text.trim()) {
    throw new Error('Vui lòng dán nội dung trang lịch thi.')
  }

  const lines = text.split(/\r?\n/).map((line) => line.split('\t'))
  const headerIndex = lines.findIndex((cells) => {
    const names = cells.map((cell) => cell.trim())
    return names.includes('Ngày thi') && names.includes('Giờ bắt đầu')
  })
  if (headerIndex === -1) {
    throw new Error(
      'Không nhận ra lịch thi. Hãy bấm Ctrl+A trên trang Xem lịch thi, Ctrl+C rồi dán lại.',
    )
  }

  const header = lines[headerIndex].map((cell) => cell.trim())
  // Giữ nguyên ô trống (không lọc) để các cột phía sau không bị lệch.
  const rows = lines.slice(headerIndex + 1).flatMap((cells): ExamRow[] => {
    const row = Object.fromEntries(header.map((name, index) => [name, cells[index] ?? '']))
    return toText(row['Mã MH']) ? [row] : []
  })
  if (rows.length === 0) {
    throw new Error('Không tìm thấy buổi thi nào trong nội dung đã dán.')
  }

  return parseExamRows(rows)
}

export function parseExamRows(rows: ExamRow[]): ParsedSchedule {
  for (const column of EXAM_REQUIRED_COLUMNS) {
    if (!(column in rows[0])) {
      throw new Error(`File Excel thiếu cột "${column}". Hãy dùng đúng file export từ FTU2.`)
    }
  }

  const sessions: ClassSession[] = []
  let earliestDate: Date | null = null

  for (const row of rows) {
    const subjectCode = toText(row['Mã MH'])
    if (!subjectCode) continue

    const examDate = parseExamDate(row['Ngày thi'])
    const { hours, minutes } = parseStartTime(row['Giờ bắt đầu'])
    const startMinutes = hours * 60 + minutes
    const group = toText(row['Nhóm thi'])
    const examTeam = toText(row['Tổ thi'])
    const campus = toText(row['Cơ sở'])
    const format = toText(row['Hình thức thi'])
    const date = formatDate(examDate)

    if (!earliestDate || examDate < earliestDate) earliestDate = examDate

    sessions.push({
      id: `EXAM_${subjectCode}_${group}_${examTeam}_${date}`,
      kind: 'exam',
      subjectCode,
      subjectName: toText(row['Tên môn học']),
      room: toText(row['Phòng thi']),
      className: '',
      group,
      teacher: '',
      date,
      startTime: formatTime(startMinutes),
      endTime: formatTime(startMinutes + EXAM_DURATION_MINUTES),
      description: [
        `Nhóm thi ${group} - Tổ thi ${examTeam}`,
        campus ? `Cơ sở ${campus}` : null,
        format ? `Hình thức: ${format}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    })
  }

  if (sessions.length === 0 || !earliestDate) {
    throw new Error('Không tìm thấy buổi thi nào trong file.')
  }

  return { kind: 'exam', semester: inferSemester(earliestDate), sessions }
}
