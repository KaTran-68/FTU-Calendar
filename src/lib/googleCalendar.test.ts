import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSubjectColorMap } from './colors'
import {
  calendarSummaryForSemester,
  ensureCalendar,
  pushSessionsToGoogleCalendar,
} from './googleCalendar'
import type { ClassSession } from '../types/schedule'

function makeSession(overrides: Partial<ClassSession> = {}): ClassSession {
  return {
    id: 'id-1',
    subjectCode: 'TST101',
    subjectName: 'Nhập môn kiểm thử',
    room: 'PH.A101',
    className: 'DEMO01',
    group: '101',
    teacher: '',
    date: '2025-09-08',
    startTime: '06:45',
    endTime: '11:30',
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('calendarSummaryForSemester', () => {
  it('tạo tên lịch dạng HK-<mã học kỳ>', () => {
    expect(calendarSummaryForSemester('20261')).toBe('HK-20261')
  })

  it('thêm hậu tố -Thi cho lịch thi', () => {
    expect(calendarSummaryForSemester('20261', 'exam')).toBe('HK-20261-Thi')
  })
})

describe('ensureCalendar', () => {
  it('trả về id lịch đã tồn tại nếu trùng tên', async () => {
    const get = vi.fn().mockResolvedValue({
      data: { items: [{ id: 'cal-1', summary: 'HK-20261' }] },
    })
    const post = vi.fn()
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const id = await ensureCalendar('token', 'HK-20261')

    expect(id).toBe('cal-1')
    expect(post).not.toHaveBeenCalled()
  })

  it('tạo lịch mới nếu chưa có', async () => {
    const get = vi.fn().mockResolvedValue({ data: { items: [] } })
    const post = vi.fn().mockResolvedValue({ data: { id: 'cal-new' } })
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const id = await ensureCalendar('token', 'HK-20261')

    expect(id).toBe('cal-new')
    expect(post).toHaveBeenCalledWith('/calendars', {
      summary: 'HK-20261',
      timeZone: 'Asia/Ho_Chi_Minh',
    })
  })
})

describe('pushSessionsToGoogleCalendar', () => {
  it('bỏ qua buổi đã tồn tại và tạo buổi mới với đúng nội dung sự kiện', async () => {
    const sessions = [makeSession({ id: 'existing' }), makeSession({ id: 'new-one' })]

    const get = vi.fn().mockResolvedValue({
      data: { items: [{ extendedProperties: { private: { ftuId: 'existing' } } }] },
    })
    const post = vi.fn().mockResolvedValue({ data: {} })
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const colorMap = buildSubjectColorMap(sessions)
    const progress = await pushSessionsToGoogleCalendar('token', 'cal-1', sessions, 45, colorMap)

    expect(progress).toEqual({ total: 2, created: 1, skipped: 1, failed: 0 })
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith(
      '/calendars/cal-1/events',
      expect.objectContaining({
        summary: 'Nhập môn kiểm thử (TST101)',
        location: 'PH.A101',
        description: 'Lớp DEMO01 - Nhóm 101',
        start: { dateTime: '2025-09-08T06:45:00', timeZone: 'Asia/Ho_Chi_Minh' },
        end: { dateTime: '2025-09-08T11:30:00', timeZone: 'Asia/Ho_Chi_Minh' },
        colorId: '1',
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 45 }] },
        extendedProperties: { private: { ftuId: 'new-one' } },
      }),
    )
  })

  it('thêm tên giảng viên vào mô tả sự kiện khi có', async () => {
    const sessions = [makeSession({ teacher: 'Nguyễn Văn A' })]
    const get = vi.fn().mockResolvedValue({ data: { items: [] } })
    const post = vi.fn().mockResolvedValue({ data: {} })
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const colorMap = buildSubjectColorMap(sessions)
    await pushSessionsToGoogleCalendar('token', 'cal-1', sessions, 45, colorMap)

    expect(post).toHaveBeenCalledWith(
      '/calendars/cal-1/events',
      expect.objectContaining({
        description: 'Lớp DEMO01 - Nhóm 101\nGV: Nguyễn Văn A',
      }),
    )
  })

  it('tạo sự kiện lịch thi với tiêu đề [Thi] và mô tả riêng', async () => {
    const sessions = [
      makeSession({
        id: 'EXAM_TST101_1_1_2025-12-16',
        kind: 'exam',
        room: 'CS2.A206',
        className: '',
        description: 'Nhóm thi 1 - Tổ thi 1\nCơ sở 2.1',
        startTime: '07:30',
        endTime: '09:00',
        date: '2025-12-16',
      }),
    ]
    const get = vi.fn().mockResolvedValue({ data: { items: [] } })
    const post = vi.fn().mockResolvedValue({ data: {} })
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const colorMap = buildSubjectColorMap(sessions)
    await pushSessionsToGoogleCalendar('token', 'cal-1', sessions, 45, colorMap)

    expect(post).toHaveBeenCalledWith(
      '/calendars/cal-1/events',
      expect.objectContaining({
        summary: '[Thi] Nhập môn kiểm thử (TST101)',
        location: 'CS2.A206',
        description: 'Nhóm thi 1 - Tổ thi 1\nCơ sở 2.1',
        start: { dateTime: '2025-12-16T07:30:00', timeZone: 'Asia/Ho_Chi_Minh' },
        end: { dateTime: '2025-12-16T09:00:00', timeZone: 'Asia/Ho_Chi_Minh' },
      }),
    )
  })

  it('thử lại khi gặp lỗi rate limit rồi mới thành công', async () => {
    const sessions = [makeSession()]
    const get = vi.fn().mockResolvedValue({ data: { items: [] } })

    const rateLimitError = Object.assign(new Error('rate limited'), {
      isAxiosError: true,
      response: { status: 403, data: { error: { errors: [{ reason: 'rateLimitExceeded' }] } } },
    })
    const post = vi.fn().mockRejectedValueOnce(rateLimitError).mockResolvedValueOnce({ data: {} })
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const colorMap = buildSubjectColorMap(sessions)
    const progress = await pushSessionsToGoogleCalendar('token', 'cal-1', sessions, 45, colorMap)

    expect(progress).toEqual({ total: 1, created: 1, skipped: 0, failed: 0 })
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('đánh dấu thất bại khi lỗi không thể thử lại', async () => {
    const sessions = [makeSession()]
    const get = vi.fn().mockResolvedValue({ data: { items: [] } })

    const permanentError = Object.assign(new Error('bad request'), {
      isAxiosError: true,
      response: { status: 400, data: {} },
    })
    const post = vi.fn().mockRejectedValue(permanentError)
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const colorMap = buildSubjectColorMap(sessions)
    const progress = await pushSessionsToGoogleCalendar('token', 'cal-1', sessions, 45, colorMap)

    expect(progress).toEqual({ total: 1, created: 0, skipped: 0, failed: 1 })
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('vòng thử lại tuần tự thứ hai cứu được buổi bị lỗi ở lượt chạy song song', async () => {
    const sessions = [makeSession()]
    const get = vi.fn().mockResolvedValue({ data: { items: [] } })

    const permanentError = Object.assign(new Error('bad request'), {
      isAxiosError: true,
      response: { status: 400, data: {} },
    })
    const post = vi.fn().mockRejectedValueOnce(permanentError).mockResolvedValueOnce({ data: {} })
    vi.spyOn(axios, 'create').mockReturnValue({ get, post } as never)

    const colorMap = buildSubjectColorMap(sessions)
    const progress = await pushSessionsToGoogleCalendar('token', 'cal-1', sessions, 45, colorMap)

    expect(progress).toEqual({ total: 1, created: 1, skipped: 0, failed: 0 })
    expect(post).toHaveBeenCalledTimes(2)
  })
})
