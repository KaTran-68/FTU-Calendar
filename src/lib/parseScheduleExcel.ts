import { read, utils } from 'xlsx'
import type { ClassSession, ParsedSchedule } from '../types/schedule'
import { isExamHeader, parseExamRows, parseExamText } from './parseExamExcel'
import { formatDate, inferSemester } from './semester'

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '06:45', end: '07:30' },
  2: { start: '07:30', end: '08:15' },
  3: { start: '08:15', end: '09:00' },
  4: { start: '09:15', end: '10:00' },
  5: { start: '10:00', end: '10:45' },
  6: { start: '10:45', end: '11:30' },
  7: { start: '12:30', end: '13:15' },
  8: { start: '13:15', end: '14:00' },
  9: { start: '14:00', end: '14:45' },
  10: { start: '15:00', end: '15:45' },
  11: { start: '15:45', end: '16:30' },
  12: { start: '16:30', end: '17:15' },
  13: { start: '18:00', end: '18:45' },
  14: { start: '18:45', end: '19:15' },
  15: { start: '19:15', end: '20:00' },
  16: { start: '20:00', end: '20:45' },
}

const REQUIRED_COLUMNS = [
  'Mã MH',
  'Tên môn học',
  'Nhóm tổ',
  'Lớp',
  'Tiết bắt đầu',
  'Số tiết',
  'Phòng',
  'Giảng viên',
  'Thời gian học',
] as const

const DATE_RANGE_PATTERN = /(\d{2})\/(\d{2})\/(\d{2})\s*đến\s*(\d{2})\/(\d{2})\/(\d{2})/

type ExcelRow = Record<(typeof REQUIRED_COLUMNS)[number], unknown>

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function parseDateRange(value: unknown): { start: Date; end: Date } {
  const text = toText(value)
  const match = text.match(DATE_RANGE_PATTERN)
  if (!match) {
    throw new Error(`Không đọc được cột "Thời gian học": "${text}".`)
  }

  const [, d1, m1, y1, d2, m2, y2] = match
  return {
    start: new Date(2000 + Number(y1), Number(m1) - 1, Number(d1)),
    end: new Date(2000 + Number(y2), Number(m2) - 1, Number(d2)),
  }
}

function periodTime(period: number, subjectCode: string): { start: string; end: string } {
  const time = PERIOD_TIMES[period]
  if (!time) {
    throw new Error(`Không tìm thấy giờ cho tiết ${period} của môn ${subjectCode}.`)
  }
  return time
}

function parseScheduleRows(rows: ExcelRow[]): ParsedSchedule {
  for (const column of REQUIRED_COLUMNS) {
    if (!(column in rows[0])) {
      throw new Error(`File Excel thiếu cột "${column}". Hãy dùng đúng file export từ FTU2.`)
    }
  }

  const sessions: ClassSession[] = []
  let earliestDate: Date | null = null

  rows.forEach((row, index) => {
    const subjectCode = toText(row['Mã MH'])
    if (!subjectCode) return

    // Môn không có lịch học (vd "Tiếng Anh đầu khóa": 0 tiết, không có ngày) thì không có gì để tạo.
    if (!toText(row['Thời gian học']) && !(Number(row['Số tiết']) > 0)) return

    const subjectName = toText(row['Tên môn học'])
    const group = toText(row['Nhóm tổ'])
    const className = toText(row['Lớp'])
    const room = toText(row['Phòng'])
    const teacher = toText(row['Giảng viên'])
    const startPeriod = Number(row['Tiết bắt đầu'])
    const numPeriods = Number(row['Số tiết'])

    if (!Number.isInteger(startPeriod) || !Number.isInteger(numPeriods) || numPeriods < 1) {
      throw new Error(`Dòng ${index + 2}: "Tiết bắt đầu" hoặc "Số tiết" không hợp lệ.`)
    }

    const startTime = periodTime(startPeriod, subjectCode).start
    const endTime = periodTime(startPeriod + numPeriods - 1, subjectCode).end
    const { start, end } = parseDateRange(row['Thời gian học'])

    for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 7)) {
      if (!earliestDate || current < earliestDate) earliestDate = new Date(current)

      sessions.push({
        id: `${subjectCode}_${className}_${group}_${formatDate(current)}_${startPeriod}`,
        subjectCode,
        subjectName,
        room,
        className,
        group,
        teacher,
        date: formatDate(current),
        startTime,
        endTime,
      })
    }
  })

  if (sessions.length === 0 || !earliestDate) {
    throw new Error('Không tìm thấy buổi học nào trong file.')
  }

  return { semester: inferSemester(earliestDate), sessions }
}

export function parseScheduleWorkbook(buffer: ArrayBuffer): ParsedSchedule {
  const workbook = read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
  if (!sheet) {
    throw new Error('File Excel không có sheet dữ liệu.')
  }

  const rows = utils.sheet_to_json<ExcelRow>(sheet, { defval: '' })
  if (rows.length === 0) {
    throw new Error('File Excel không có dữ liệu.')
  }

  if (isExamHeader(rows[0])) {
    return parseExamRows(rows)
  }

  return parseScheduleRows(rows)
}

/**
 * Dựng các dòng dữ liệu từ nội dung trang "Thời khóa biểu dạng học kỳ" (Ctrl+A, Ctrl+C). Portal chỉ
 * ghi các cột thông tin môn (trước cột "Thứ") ở dòng đầu của mỗi môn; các buổi sau chỉ còn các ô từ
 * "Thứ" trở đi nên được ghép lại với thông tin của dòng đầy đủ liền trước.
 */
function parseTimetableText(lines: string[][], headerIndex: number): ParsedSchedule {
  const header = lines[headerIndex].map((cell) => cell.trim())
  while (header.length > 0 && header[header.length - 1] === '') header.pop()

  const carriedCount = Math.max(header.indexOf('Thứ'), 0)
  const rows: ExcelRow[] = []
  let carried: string[] | null = null

  for (const cells of lines.slice(headerIndex + 1)) {
    let fullRow: string[]
    if (cells.length === header.length) {
      fullRow = cells
      carried = cells.slice(0, carriedCount)
    } else if (carried && carriedCount > 0 && cells.length === header.length - carriedCount) {
      fullRow = [...carried, ...cells]
    } else {
      continue
    }
    rows.push(Object.fromEntries(header.map((name, index) => [name, fullRow[index]])) as ExcelRow)
  }

  if (rows.length === 0) {
    throw new Error('Không tìm thấy buổi học nào trong nội dung đã dán.')
  }
  return parseScheduleRows(rows)
}

/** Đọc lịch từ nội dung trang portal đã copy: tự nhận ra là lịch thi hay thời khóa biểu. */
export function parseScheduleText(text: string): ParsedSchedule {
  if (!text.trim()) {
    throw new Error('Vui lòng dán nội dung trang lịch thi hoặc thời khoá biểu.')
  }

  const lines = text.split(/\r?\n/).map((line) => line.split('\t'))
  const hasColumns = (cells: string[], columns: string[]) => {
    const names = cells.map((cell) => cell.trim())
    return columns.every((column) => names.includes(column))
  }

  if (lines.some((cells) => hasColumns(cells, ['Ngày thi', 'Giờ bắt đầu']))) {
    return parseExamText(text)
  }

  const headerIndex = lines.findIndex((cells) =>
    hasColumns(cells, ['Mã MH', 'Tiết bắt đầu', 'Thời gian học']),
  )
  if (headerIndex === -1) {
    throw new Error(
      'Không nhận ra lịch. Hãy bấm Ctrl+A trên trang Xem lịch thi hoặc Thời khóa biểu dạng học kỳ, Ctrl+C rồi dán lại.',
    )
  }
  return parseTimetableText(lines, headerIndex)
}

export async function parseScheduleExcelFile(file: File): Promise<ParsedSchedule> {
  const buffer = await file.arrayBuffer()
  return parseScheduleWorkbook(buffer)
}
