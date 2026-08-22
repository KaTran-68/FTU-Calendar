import { utils, write } from 'xlsx'
import { describe, expect, it } from 'vitest'
import { parseScheduleWorkbook } from './parseScheduleExcel'

const HEADER = [
  'Mã MH',
  'Tên môn học',
  'Nhóm tổ',
  'Số tín chỉ',
  'Lớp',
  'Thứ',
  'Tiết bắt đầu',
  'Số tiết',
  'Phòng',
  'Giảng viên',
  'Thời gian học',
]

function buildBuffer(rows: unknown[][]): ArrayBuffer {
  const sheet = utils.aoa_to_sheet([HEADER, ...rows])
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, sheet, 'DanhSach')
  return write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('parseScheduleWorkbook', () => {
  it('mở rộng 1 dòng lặp lại hàng tuần thành từng buổi học riêng', () => {
    const buffer = buildBuffer([
      [
        'EAB111',
        'Tiếng Anh học thuật và thương mại 1',
        '597',
        '3',
        'DC65KTDN01',
        3,
        7,
        3,
        'PH.A504',
        '',
        '08/09/26 đến 22/09/26',
      ],
    ])

    const { semester, sessions } = parseScheduleWorkbook(buffer)

    expect(semester).toBe('20261')
    expect(sessions).toHaveLength(3)
    expect(sessions[0]).toMatchObject({
      subjectCode: 'EAB111',
      subjectName: 'Tiếng Anh học thuật và thương mại 1',
      className: 'DC65KTDN01',
      group: '597',
      room: 'PH.A504',
      date: '2026-09-08',
      startTime: '12:30',
      endTime: '14:45',
    })
    expect(sessions[1].date).toBe('2026-09-15')
    expect(sessions[2].date).toBe('2026-09-22')
  })

  it('sinh id ổn định để tránh trùng sự kiện khi đẩy lại', () => {
    const buffer = buildBuffer([
      ['ABC123', 'Môn học', '1', '3', 'LOP01', 2, 1, 1, 'PH.A1', '', '07/09/26 đến 07/09/26'],
    ])

    const { sessions } = parseScheduleWorkbook(buffer)

    expect(sessions[0].id).toBe('ABC123_LOP01_1_2026-09-07_1')
  })

  it('ném lỗi khi thiếu cột bắt buộc', () => {
    const sheet = utils.aoa_to_sheet([['Mã MH'], ['ABC']])
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, sheet, 'DanhSach')
    const buffer = write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

    expect(() => parseScheduleWorkbook(buffer)).toThrow('thiếu cột')
  })

  it('ném lỗi khi không đọc được cột "Thời gian học"', () => {
    const buffer = buildBuffer([
      ['ABC123', 'Môn học', '1', '3', 'LOP01', 2, 1, 1, 'PH.A1', '', 'không hợp lệ'],
    ])

    expect(() => parseScheduleWorkbook(buffer)).toThrow('Thời gian học')
  })

  it('ném lỗi khi không tìm thấy giờ cho tiết học', () => {
    const buffer = buildBuffer([
      ['ABC123', 'Môn học', '1', '3', 'LOP01', 2, 99, 1, 'PH.A1', '', '07/09/26 đến 07/09/26'],
    ])

    expect(() => parseScheduleWorkbook(buffer)).toThrow('Không tìm thấy giờ cho tiết')
  })
})
