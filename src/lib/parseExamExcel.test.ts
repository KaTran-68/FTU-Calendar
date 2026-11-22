import { utils, write } from 'xlsx'
import { describe, expect, it } from 'vitest'
import { parseExamText } from './parseExamExcel'
import { parseScheduleWorkbook } from './parseScheduleExcel'

const HEADER = [
  'Stt',
  'Mã MH',
  'Tên môn học',
  'Nhóm thi',
  'Tổ thi',
  'Sĩ số',
  'Ngày thi',
  'Giờ bắt đầu',
  'Phòng thi',
  'Cơ sở',
  'Phòng thi trực tuyến',
  'Hình thức thi',
  'Ghi chú',
]

function buildBuffer(rows: unknown[][], header: string[] = HEADER): ArrayBuffer {
  const sheet = utils.aoa_to_sheet([header, [], ['Kỳ thi:Thi kết thúc môn'], ...rows], {
    cellDates: true,
  })
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, sheet, 'Sheet1')
  return write(workbook, { type: 'array', bookType: 'xlsx', cellDates: true }) as ArrayBuffer
}

describe('parseScheduleWorkbook (lịch thi)', () => {
  it('đọc ngày thi dạng chuỗi dd/mm/yyyy và tính giờ kết thúc sau 90 phút', () => {
    const buffer = buildBuffer([
      [
        3,
        'PLU111',
        'Pháp luật đại cương',
        525,
        2,
        51,
        '16/12/2026',
        '07:30',
        'CS2.A206',
        2.1,
        null,
        'Tiểu Luận cá nhân',
        null,
      ],
    ])

    const schedule = parseScheduleWorkbook(buffer)

    expect(schedule.kind).toBe('exam')
    expect(schedule.semester).toBe('20261')
    expect(schedule.sessions).toHaveLength(1)
    expect(schedule.sessions[0]).toMatchObject({
      kind: 'exam',
      subjectCode: 'PLU111',
      subjectName: 'Pháp luật đại cương',
      room: 'CS2.A206',
      date: '2026-12-16',
      startTime: '07:30',
      endTime: '09:00',
    })
    expect(schedule.sessions[0].description).toBe(
      ['Nhóm thi 525 - Tổ thi 2', 'Cơ sở 2.1', 'Hình thức: Tiểu Luận cá nhân'].join('\n'),
    )
  })

  it('đảo lại ngày/tháng của ô ngày Excel vì Excel đã hiểu nhầm dd/mm thành mm/dd', () => {
    // Portal xuất chữ "10/11/2026" (10 tháng 11); Excel hiểu thành ô ngày 11/10/2026.
    const buffer = buildBuffer([
      [
        1,
        'ESP111',
        'Tiếng Anh chuyên ngành 1',
        601,
        2,
        31,
        new Date(Date.UTC(2026, 9, 11)),
        '13:30',
        'CS2.A403',
        2.1,
        null,
        'Thi trên máy',
        null,
      ],
    ])

    const { sessions } = parseScheduleWorkbook(buffer)

    expect(sessions[0].date).toBe('2026-11-10')
    expect(sessions[0].startTime).toBe('13:30')
    expect(sessions[0].endTime).toBe('15:00')
  })

  it('đọc "05/12/2026" bị Excel đổi thành ô ngày 12/05/2026 về đúng 5 tháng 12', () => {
    const buffer = buildBuffer([
      [
        1,
        'TOA105',
        'Toán cao cấp',
        531,
        2,
        52,
        new Date(Date.UTC(2026, 4, 12)),
        '15:30',
        'CS2.B401',
        2.1,
        null,
        '',
        null,
      ],
    ])

    expect(parseScheduleWorkbook(buffer).sessions[0].date).toBe('2026-12-05')
  })

  it('giữ nguyên ô ngày có ngày lớn hơn 12 vì không thể bị đảo', () => {
    const buffer = buildBuffer([
      [
        1,
        'A1',
        'Môn A',
        1,
        1,
        10,
        new Date(Date.UTC(2026, 11, 16)),
        '07:30',
        'P1',
        2.1,
        null,
        '',
        null,
      ],
    ])

    expect(parseScheduleWorkbook(buffer).sessions[0].date).toBe('2026-12-16')
  })

  it('bỏ qua dòng trống và dòng "Kỳ thi:" khi đếm buổi thi', () => {
    const buffer = buildBuffer([
      [1, 'A1', 'Môn A', 1, 1, 10, '01/12/2026', '07:30', 'P1', 2.1, null, 'Tự luận', null],
      [2, 'B2', 'Môn B', 2, 1, 10, '02/12/2026', '09:30', 'P2', 2.1, null, 'Tự luận', null],
    ])

    expect(parseScheduleWorkbook(buffer).sessions).toHaveLength(2)
  })

  it('sinh id ổn định để tránh trùng sự kiện khi đẩy lại', () => {
    const buffer = buildBuffer([
      [
        1,
        'TOA105',
        'Toán cao cấp',
        531,
        2,
        52,
        '12/05/2026',
        '15:30',
        'CS2.B401',
        2.1,
        null,
        '',
        null,
      ],
    ])

    expect(parseScheduleWorkbook(buffer).sessions[0].id).toBe('EXAM_TOA105_531_2_2026-05-12')
  })

  it('ném lỗi khi thiếu cột bắt buộc của lịch thi', () => {
    const header = HEADER.filter((column) => column !== 'Phòng thi')
    const buffer = buildBuffer([[1, 'A1', 'Môn A', 1, 1, 10, '01/12/2026', '07:30']], header)

    expect(() => parseScheduleWorkbook(buffer)).toThrow('thiếu cột "Phòng thi"')
  })

  it('ném lỗi khi không đọc được cột "Ngày thi"', () => {
    const buffer = buildBuffer([
      [1, 'A1', 'Môn A', 1, 1, 10, 'chưa có', '07:30', 'P1', 2.1, null, '', null],
    ])

    expect(() => parseScheduleWorkbook(buffer)).toThrow('Ngày thi')
  })

  it('ném lỗi khi không đọc được cột "Giờ bắt đầu"', () => {
    const buffer = buildBuffer([
      [1, 'A1', 'Môn A', 1, 1, 10, '01/12/2026', 'sáng', 'P1', 2.1, null, '', null],
    ])

    expect(() => parseScheduleWorkbook(buffer)).toThrow('Giờ bắt đầu')
  })

  it('suy ra học kỳ từ ngày thi sớm nhất sau khi đã sửa ngày bị đảo', () => {
    const buffer = buildBuffer([
      [
        1,
        'A1',
        'Môn A',
        1,
        1,
        10,
        new Date(Date.UTC(2026, 4, 12)),
        '15:30',
        'P1',
        2.1,
        null,
        '',
        null,
      ],
      [2, 'B2', 'Môn B', 2, 1, 10, '16/12/2026', '07:30', 'P2', 2.1, null, '', null],
      [3, 'C3', 'Môn C', 3, 1, 10, '19/12/2026', '07:30', 'P3', 2.1, null, '', null],
    ])

    expect(parseScheduleWorkbook(buffer).semester).toBe('20261')
  })

  it('tính giờ kết thúc đúng cho ca thi buổi tối', () => {
    const buffer = buildBuffer([
      [1, 'A1', 'Môn A', 1, 1, 10, '01/12/2026', '22:00', 'P1', 2.1, null, '', null],
    ])

    expect(parseScheduleWorkbook(buffer).sessions[0].endTime).toBe('23:30')
  })
})

const PASTE_HEADER = HEADER.join('\t')

function pasteRow(cells: (string | number)[]): string {
  return cells.join('\t')
}

/** Nội dung Ctrl+A / Ctrl+C trang "Xem lịch thi" của portal, rút gọn phần menu. */
const PASTED_PAGE = [
  'Nguyễn Ngọc Thanh Quyên',
  '262111110139',
  'Xem lịch thi',
  'Xem điểm',
  'Design byaqtech.vn',
  '',
  ' XEM LỊCH THI',
  'Học kỳ 1 Năm học 2026-2027',
  'Lịch thi học kỳ cá nhân',
  PASTE_HEADER,
  ...Array.from({ length: 12 }, () => '...'),
  'Kỳ thi: Thi kết thúc môn',
  pasteRow([
    1,
    'ESP111',
    'Tiếng Anh chuyên ngành 1 (Tiếng Anh thương mại nâng cao)',
    601,
    '002',
    31,
    '10/11/2026',
    '13:30',
    'CS2.A403',
    2.1,
    '',
    'Thi kết hợp trắc nghiệm trên giấy và tự luận',
    '',
  ]),
  pasteRow([
    2,
    'TOA105',
    'Toán cao cấp',
    531,
    '002',
    52,
    '05/12/2026',
    '15:30',
    'CS2.B401',
    2.1,
    '',
    'Tự luận',
    '',
  ]),
  pasteRow([
    3,
    'PLU111',
    'Pháp luật đại cương',
    525,
    '002',
    51,
    '16/12/2026',
    '07:30',
    'CS2.A206',
    2.1,
    '',
    'Tiểu Luận cá nhân',
    '',
  ]),
  'THỐNG KÊ TRUY CẬP',
  'Đang truy cập',
  '98',
  'SV đăng nhập',
  '83',
].join('\n')

describe('parseExamText (dán nội dung trang lịch thi)', () => {
  it('đọc các buổi thi từ nội dung trang, bỏ qua menu, dòng lọc và thống kê', () => {
    const schedule = parseExamText(PASTED_PAGE)

    expect(schedule.kind).toBe('exam')
    expect(schedule.semester).toBe('20261')
    expect(schedule.sessions.map((s) => s.subjectCode)).toEqual(['ESP111', 'TOA105', 'PLU111'])
  })

  it('giữ đúng cột khi ô "Phòng thi trực tuyến" để trống', () => {
    const [first, second] = parseExamText(PASTED_PAGE).sessions

    expect(first).toMatchObject({
      kind: 'exam',
      subjectName: 'Tiếng Anh chuyên ngành 1 (Tiếng Anh thương mại nâng cao)',
      group: '601',
      room: 'CS2.A403',
      date: '2026-11-10',
      startTime: '13:30',
      endTime: '15:00',
    })
    expect(first.description).toBe(
      'Nhóm thi 601 - Tổ thi 002\nCơ sở 2.1\nHình thức: Thi kết hợp trắc nghiệm trên giấy và tự luận',
    )
    // Ngày 05/12 không bị đảo thành 12/05 như khi đọc từ ô ngày của Excel.
    expect(second).toMatchObject({ date: '2026-12-05', startTime: '15:30', endTime: '17:00' })
  })

  it('chấp nhận xuống dòng kiểu Windows (CRLF)', () => {
    const schedule = parseExamText(PASTED_PAGE.replaceAll('\n', '\r\n'))

    expect(schedule.sessions).toHaveLength(3)
    expect(schedule.sessions[2].room).toBe('CS2.A206')
  })

  it('ném lỗi hướng dẫn khi nội dung trống', () => {
    expect(() => parseExamText('   \n  ')).toThrow('Vui lòng dán nội dung')
  })

  it('ném lỗi khi không thấy dòng tiêu đề của bảng lịch thi', () => {
    expect(() => parseExamText('Trang chủ\nXem điểm\nXem học phí')).toThrow(
      'Không nhận ra lịch thi',
    )
  })

  it('ném lỗi khi có bảng nhưng chưa có buổi thi nào', () => {
    const text = [PASTE_HEADER, '...', 'Kỳ thi: Thi kết thúc môn'].join('\n')

    expect(() => parseExamText(text)).toThrow('Không tìm thấy buổi thi nào')
  })

  it('ném lỗi khi ngày thi sai định dạng', () => {
    const text = [
      PASTE_HEADER,
      pasteRow([1, 'A1', 'Môn A', 1, '001', 10, 'sớm', '07:30', 'P1', 2.1, '', '', '']),
    ].join('\n')

    expect(() => parseExamText(text)).toThrow('Ngày thi')
  })
})
