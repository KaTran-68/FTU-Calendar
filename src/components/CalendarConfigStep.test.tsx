import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CalendarConfigStep } from './CalendarConfigStep'
import { requestGoogleAccessToken } from '../lib/googleAuth'
import { ensureCalendar, pushSessionsToGoogleCalendar } from '../lib/googleCalendar'
import type { ParsedSchedule } from '../types/schedule'

vi.mock('../lib/colors', async () => {
  const actual = await vi.importActual<typeof import('../lib/colors')>('../lib/colors')
  return {
    ...actual,
    shuffleColorOrder: () => ['2', '1', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  }
})

vi.mock('../lib/googleAuth', () => ({
  requestGoogleAccessToken: vi.fn(),
}))

vi.mock('../lib/googleCalendar', () => ({
  calendarSummaryForSemester: (semester: string) => `HK-${semester}`,
  ensureCalendar: vi.fn(),
  pushSessionsToGoogleCalendar: vi.fn(),
}))

const schedule: ParsedSchedule = {
  semester: '20261',
  sessions: [
    {
      id: '1',
      subjectCode: 'TST101',
      subjectName: 'Nhập môn kiểm thử',
      room: 'PH.A101',
      className: 'DEMO01',
      group: '101',
      date: '2025-09-08',
      startTime: '06:45',
      endTime: '11:30',
    },
    {
      id: '2',
      subjectCode: 'DEV202',
      subjectName: 'Phát triển phần mềm',
      room: 'PH.B202',
      className: 'DEMO01',
      group: '202',
      date: '2025-09-09',
      startTime: '15:00',
      endTime: '17:15',
    },
  ],
}

afterEach(() => {
  vi.mocked(requestGoogleAccessToken).mockReset()
  vi.mocked(ensureCalendar).mockReset()
  vi.mocked(pushSessionsToGoogleCalendar).mockReset()
})

describe('CalendarConfigStep', () => {
  it('điền sẵn tên calendar theo học kỳ và nhắc trước mặc định 45 phút', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    expect(screen.getByLabelText(/tên calendar/i)).toHaveValue('HK-20261')
    expect(screen.getByLabelText(/nhắc trước/i)).toHaveValue(45)
    expect(screen.getByText('Nhập môn kiểm thử')).toBeInTheDocument()
    expect(screen.getByText('Phát triển phần mềm')).toBeInTheDocument()
  })

  it('gọi onBack khi bấm Quay lại', () => {
    const onBack = vi.fn()
    render(<CalendarConfigStep schedule={schedule} onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: /quay lại/i }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('đổi màu khi bấm nút Đổi màu', () => {
    const { container } = render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)
    const eventBefore = container.querySelector('.color-preview__event') as HTMLElement
    const colorBefore = eventBefore.style.backgroundColor

    fireEvent.click(screen.getByRole('button', { name: /đổi màu/i }))

    const eventAfter = container.querySelector('.color-preview__event') as HTMLElement
    expect(eventAfter.style.backgroundColor).not.toBe(colorBefore)
  })

  it('báo lỗi khi tên calendar rỗng', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/tên calendar/i), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('tên calendar')
  })

  it('báo lỗi khi số phút nhắc vượt giới hạn', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/nhắc trước/i), { target: { value: '99999' } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Số phút nhắc phải từ')
  })

  it('đăng nhập Google rồi tạo lịch thành công, hiển thị tiến độ', async () => {
    vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
    vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
    vi.mocked(pushSessionsToGoogleCalendar).mockResolvedValue({
      total: 2,
      created: 2,
      skipped: 0,
      failed: 0,
    })

    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    expect(await screen.findByText(/2\/2/)).toBeInTheDocument()
    expect(requestGoogleAccessToken).toHaveBeenCalledTimes(1)
    expect(ensureCalendar).toHaveBeenCalledWith('token-abc', 'HK-20261')
    expect(pushSessionsToGoogleCalendar).toHaveBeenCalledWith(
      'token-abc',
      'cal-1',
      schedule.sessions,
      45,
      expect.any(Map),
      expect.any(Function),
    )
  })

  it('hiển thị lỗi thân thiện khi đăng nhập Google thất bại', async () => {
    vi.mocked(requestGoogleAccessToken).mockRejectedValue(
      new Error('Bạn đã huỷ đăng nhập hoặc từ chối cấp quyền Google Calendar.'),
    )

    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('huỷ đăng nhập')
    expect(ensureCalendar).not.toHaveBeenCalled()
  })
})
