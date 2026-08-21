import type {
  ClassSession,
  ParsedSchedule,
  RawPeriod,
  RawScheduleResponse,
} from '../types/schedule'

function normalizeTime(raw: string): string {
  const [hours, minutes] = raw.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function buildPeriodMap(periods: RawPeriod[]): Map<number, { start: string; end: string }> {
  const map = new Map<number, { start: string; end: string }>()
  for (const period of periods) {
    map.set(period.tiet, {
      start: normalizeTime(period.gio_bat_dau),
      end: normalizeTime(period.gio_ket_thuc),
    })
  }
  return map
}

function dedupeRoom(raw: string): string {
  return raw.split('-')[0].trim()
}

export function parseSchedule(raw: string): ParsedSchedule {
  let parsed: RawScheduleResponse
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Dữ liệu dán vào không phải JSON hợp lệ.')
  }

  const data = parsed?.data
  if (!data || !Array.isArray(data.ds_tiet_trong_ngay) || !Array.isArray(data.ds_tuan_tkb)) {
    throw new Error(
      'Dữ liệu không đúng định dạng thời khoá biểu FTU (thiếu ds_tiet_trong_ngay hoặc ds_tuan_tkb).',
    )
  }

  const semester = data.loai_thoi_gian?.NHHK
  if (!semester) {
    throw new Error('Dữ liệu thiếu thông tin học kỳ (loai_thoi_gian.NHHK).')
  }

  const periodMap = buildPeriodMap(data.ds_tiet_trong_ngay)

  const sessions: ClassSession[] = []
  for (const week of data.ds_tuan_tkb) {
    for (const entry of week.ds_thoi_khoa_bieu) {
      if (entry.is_nghi_day) continue

      const endPeriodNumber = entry.tiet_bat_dau + entry.so_tiet - 1
      const startPeriod = periodMap.get(entry.tiet_bat_dau)
      const endPeriod = periodMap.get(endPeriodNumber)
      if (!startPeriod || !endPeriod) {
        throw new Error(
          `Không tìm thấy giờ cho tiết ${entry.tiet_bat_dau}–${endPeriodNumber} của môn ${entry.ma_mon}.`,
        )
      }

      sessions.push({
        id: entry.id_tkb,
        subjectCode: entry.ma_mon,
        subjectName: entry.ten_mon,
        room: dedupeRoom(entry.ma_phong),
        className: entry.ma_lop,
        group: entry.ma_nhom,
        date: entry.ngay_hoc.slice(0, 10),
        startTime: startPeriod.start,
        endTime: endPeriod.end,
      })
    }
  }

  return { semester: String(semester), sessions }
}
