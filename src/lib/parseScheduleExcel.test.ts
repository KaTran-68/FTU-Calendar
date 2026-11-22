import { utils, write } from 'xlsx'
import { describe, expect, it } from 'vitest'
import { parseScheduleText, parseScheduleWorkbook } from './parseScheduleExcel'

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
        'Nguyễn Văn A',
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
      teacher: 'Nguyễn Văn A',
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

describe('parseScheduleWorkbook (môn không có lịch học)', () => {
  it('bỏ qua dòng không có tiết học và không có "Thời gian học" (vd Tiếng Anh đầu khóa)', () => {
    const buffer = buildBuffer([
      ['TADK', 'Tiếng Anh đầu khóa', '700', '0', 'DC65QTKD01', '', 0, 0, '', '', ''],
      [
        'TOA105',
        'Toán cao cấp',
        '531',
        '3',
        'DC65KTDN01',
        2,
        7,
        3,
        'PH.B501',
        'Tú',
        '07/09/26 đến 07/09/26',
      ],
    ])

    const schedule = parseScheduleWorkbook(buffer)

    expect(schedule.sessions.map((s) => s.subjectCode)).toEqual(['TOA105'])
  })
})

const TAB = '\t'
const TIMETABLE_HEADER = [
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
  'Cơ sở',
].join(TAB)

function row(cells: (string | number)[]): string {
  return cells.join(TAB)
}

/** Nội dung Ctrl+A / Ctrl+C trang "Thời khóa biểu dạng học kỳ": dòng đầy đủ 12 ô, dòng rút gọn 7 ô. */
const TIMETABLE_PAGE = [
  'Nguyễn Ngọc Thanh Quyên',
  'Thời khóa biểu dạng học kỳ',
  'THỜI KHÓA BIỂU DẠNG HỌC KỲ',
  'Học kỳ 1 - Năm học 2026 - 2027',
  'Thời khóa biểu cá nhân',
  TIMETABLE_HEADER,
  row([
    'ESP111',
    'Tiếng Anh chuyên ngành 1',
    601,
    3,
    'DC65KTDN31',
    3,
    1,
    3,
    'PH.A305',
    'Nguyễn Quỳnh Trang',
    '27/10/26 đến 27/10/26',
    '15 đường D5',
  ]),
  row([3, 7, 3, 'PH.A502', 'Nguyễn Quỳnh Trang', '15/09/26 đến 29/09/26', '15 đường D5']),
  row([3, 7, 3, 'PH.A205', 'Nguyễn Quỳnh Trang', '06/10/26 đến 06/10/26', '15 đường D5']),
  row([
    'KDO441',
    'Kỹ năng phát triển nghề nghiệp',
    513,
    3,
    'DC65KTDN01',
    2,
    10,
    3,
    'PH.A305',
    'Nguyễn Thị Huỳnh Giao',
    '02/11/26 đến 07/12/26',
    '15 đường D5',
  ]),
  row([4, 10, 3, 'PH.A502', 'Nguyễn Thị Huỳnh Giao', '28/10/26 đến 28/10/26', '15 đường D5']),
  row([
    'SHCD01',
    'Sinh hoạt công dân sinh viên năm I',
    441,
    0,
    'DC65KTDN01',
    3,
    1,
    6,
    'PH.A206',
    '',
    '25/08/26 đến 25/08/26',
    '15 đường D5',
  ]),
  row([4, 1, 6, 'PH.A206', '', '26/08/26 đến 26/08/26', '15 đường D5']),
  row(['TADK', 'Tiếng Anh đầu khóa', 700, 0, 'DC65QTKD01', '', 0, 0, '', '', '', '']),
  'THỐNG KÊ TRUY CẬP',
  'Đang truy cập',
  '94',
  'SV đăng nhập',
  '81',
].join('\n')

describe('parseScheduleText (dán nội dung trang thời khóa biểu)', () => {
  it('đọc đủ buổi học: dòng đầy đủ và dòng rút gọn, bỏ qua môn không có lịch, menu và thống kê', () => {
    const schedule = parseScheduleText(TIMETABLE_PAGE)

    expect(schedule.kind).toBeUndefined()
    expect(schedule.semester).toBe('20261')
    // ESP111: 1 + 3 + 1, KDO441: 6 + 1, SHCD01: 1 + 1
    expect(schedule.sessions).toHaveLength(14)
    expect(new Set(schedule.sessions.map((s) => s.subjectCode))).toEqual(
      new Set(['ESP111', 'KDO441', 'SHCD01']),
    )
  })

  it('dòng rút gọn được ghép thêm mã môn, tên môn, nhóm tổ và lớp từ dòng đầy đủ liền trước', () => {
    const session = parseScheduleText(TIMETABLE_PAGE).sessions.find((s) => s.date === '2026-09-15')

    expect(session).toMatchObject({
      id: 'ESP111_DC65KTDN31_601_2026-09-15_7',
      subjectCode: 'ESP111',
      subjectName: 'Tiếng Anh chuyên ngành 1',
      group: '601',
      className: 'DC65KTDN31',
      room: 'PH.A502',
      teacher: 'Nguyễn Quỳnh Trang',
      startTime: '12:30',
      endTime: '14:45',
    })
  })

  it('mỗi môn lấy đúng thông tin của riêng nó, dòng rút gọn không bị ghép nhầm môn khác', () => {
    const { sessions } = parseScheduleText(TIMETABLE_PAGE)

    expect(sessions.find((s) => s.date === '2026-10-28')).toMatchObject({
      subjectCode: 'KDO441',
      group: '513',
      startTime: '15:00',
    })
  })

  it('giữ đúng cột khi ô Giảng viên để trống', () => {
    const { sessions } = parseScheduleText(TIMETABLE_PAGE)

    expect(sessions.find((s) => s.date === '2026-08-25')).toMatchObject({
      subjectCode: 'SHCD01',
      room: 'PH.A206',
      teacher: '',
      startTime: '06:45',
      endTime: '11:30',
    })
    expect(sessions.find((s) => s.date === '2026-08-26')).toMatchObject({
      subjectCode: 'SHCD01',
      room: 'PH.A206',
      teacher: '',
    })
  })

  it('chấp nhận xuống dòng kiểu Windows (CRLF)', () => {
    const schedule = parseScheduleText(TIMETABLE_PAGE.replaceAll('\n', '\r\n'))

    expect(schedule.sessions).toHaveLength(14)
  })

  it('bỏ qua dòng rút gọn đứng trước mọi dòng đầy đủ', () => {
    const text = [
      TIMETABLE_HEADER,
      row([3, 7, 3, 'PH.A502', 'Ai đó', '15/09/26 đến 15/09/26', '15 đường D5']),
      row([
        'TOA105',
        'Toán cao cấp',
        531,
        3,
        'DC65KTDN01',
        2,
        7,
        3,
        'PH.B501',
        'Tú',
        '07/09/26 đến 07/09/26',
        '15 đường D5',
      ]),
    ].join('\n')

    expect(parseScheduleText(text).sessions.map((s) => s.subjectCode)).toEqual(['TOA105'])
  })

  it('vẫn nhận ra lịch thi và trả về lịch thi', () => {
    const text = [
      [
        'Stt',
        'Mã MH',
        'Tên môn học',
        'Nhóm thi',
        'Tổ thi',
        'Ngày thi',
        'Giờ bắt đầu',
        'Phòng thi',
      ].join(TAB),
      ['2', 'TOA105', 'Toán cao cấp', '531', '002', '05/12/2026', '15:30', 'CS2.B401'].join(TAB),
    ].join('\n')

    const schedule = parseScheduleText(text)

    expect(schedule.kind).toBe('exam')
    expect(schedule.sessions[0].subjectCode).toBe('TOA105')
  })

  it('ném lỗi hướng dẫn khi nội dung trống', () => {
    expect(() => parseScheduleText('  \n ')).toThrow('Vui lòng dán nội dung')
  })

  it('ném lỗi khi không nhận ra đó là lịch thi hay thời khóa biểu', () => {
    expect(() => parseScheduleText('Trang chủ\nXem điểm\nXem học phí')).toThrow(
      'Không nhận ra lịch',
    )
  })

  it('ném lỗi khi có bảng thời khóa biểu nhưng chưa có buổi học nào', () => {
    expect(() => parseScheduleText([TIMETABLE_HEADER, 'THỐNG KÊ TRUY CẬP'].join('\n'))).toThrow(
      'Không tìm thấy buổi học nào',
    )
  })

  it('ném lỗi khi cột "Thời gian học" sai định dạng', () => {
    const text = [
      TIMETABLE_HEADER,
      row([
        'TOA105',
        'Toán cao cấp',
        531,
        3,
        'DC65KTDN01',
        2,
        7,
        3,
        'PH.B501',
        'Tú',
        'sớm',
        '15 đường D5',
      ]),
    ].join('\n')

    expect(() => parseScheduleText(text)).toThrow('Thời gian học')
  })
})
