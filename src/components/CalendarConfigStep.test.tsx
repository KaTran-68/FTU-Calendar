import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CalendarConfigStep } from './CalendarConfigStep'
import { requestGoogleAccessToken } from '../lib/googleAuth'
import {
  deleteAppEvents,
  ensureCalendar,
  pushSessionsToGoogleCalendar,
} from '../lib/googleCalendar'
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
  calendarSummaryForSemester: (semester: string, kind?: 'class' | 'exam') =>
    kind === 'exam' ? `HK-${semester}-Thi` : `HK-${semester}`,
  deleteAppEvents: vi.fn(),
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
      teacher: '',
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
      teacher: '',
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
  vi.mocked(deleteAppEvents).mockReset()
})

describe('CalendarConfigStep', () => {
  it('điền sẵn mã học kỳ, hiện tên calendar sẽ dùng và nhắc trước mặc định 45 phút', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    expect(screen.getByLabelText(/học kỳ/i)).toHaveValue('20261')
    expect(screen.getByText(/calendar sẽ là/i)).toHaveTextContent('Calendar sẽ là: HK-20261')
    expect(screen.queryByLabelText(/tên calendar/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/nhắc trước/i)).toHaveValue(45)
    expect(screen.getByText('Nhập môn kiểm thử')).toBeInTheDocument()
    expect(screen.getByText('Phát triển phần mềm')).toBeInTheDocument()
  })

  it('hiển thị tóm tắt số buổi và khoảng ngày trước khi xác nhận', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    expect(screen.getByText(/sẽ tạo 2 buổi học/i)).toHaveTextContent(
      'Sẽ tạo 2 buổi học, từ 08/09/2025 đến 09/09/2025.',
    )
  })

  it('với lịch thi: tên calendar có hậu tố -Thi và tóm tắt ghi "buổi thi"', () => {
    const examSchedule: ParsedSchedule = {
      kind: 'exam',
      semester: '20261',
      sessions: [{ ...schedule.sessions[0], kind: 'exam' }],
    }
    render(<CalendarConfigStep schedule={examSchedule} onBack={vi.fn()} />)

    expect(screen.getByLabelText(/học kỳ/i)).toHaveValue('20261')
    expect(screen.getByText(/calendar sẽ là/i)).toHaveTextContent('Calendar sẽ là: HK-20261-Thi')
    expect(screen.getByText(/sẽ tạo 1 buổi thi/i)).toHaveTextContent(
      'Sẽ tạo 1 buổi thi, từ 08/09/2025 đến 08/09/2025.',
    )
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

  it('tự chọn màu riêng cho 1 môn nhưng vẫn đổi khi bấm Đổi màu ngẫu nhiên', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    fireEvent.click(screen.getByText('Nhập môn kiểm thử'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tomato' }))

    const event = screen.getByText('Nhập môn kiểm thử')
    expect(event.style.backgroundColor).toBe('rgb(214, 0, 0)')

    fireEvent.click(screen.getByRole('button', { name: /đổi màu/i }))

    expect(screen.getByText('Nhập môn kiểm thử').style.backgroundColor).not.toBe('rgb(214, 0, 0)')
  })

  it('cập nhật tên calendar ngay khi sửa mã học kỳ', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/học kỳ/i), { target: { value: '20252' } })

    expect(screen.getByText(/calendar sẽ là/i)).toHaveTextContent('Calendar sẽ là: HK-20252')
  })

  it.each(['', '  ', 'abc', '2026', '202611', '2026a'])(
    'báo lỗi khi mã học kỳ không hợp lệ: "%s"',
    (value) => {
      render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

      fireEvent.change(screen.getByLabelText(/học kỳ/i), { target: { value } })
      fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

      expect(screen.getByRole('alert')).toHaveTextContent('Học kỳ gồm 5 chữ số')
      expect(requestGoogleAccessToken).not.toHaveBeenCalled()
    },
  )

  it('dùng mã học kỳ đã sửa (bỏ khoảng trắng thừa) để tìm calendar', async () => {
    vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
    vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
    vi.mocked(pushSessionsToGoogleCalendar).mockResolvedValue({
      total: 2,
      created: 2,
      skipped: 0,
      failed: 0,
    })
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)

    fireEvent.change(screen.getByLabelText(/học kỳ/i), { target: { value: ' 20252 ' } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    await vi.waitFor(() => expect(ensureCalendar).toHaveBeenCalledWith('token-abc', 'HK-20252'))
  })

  it('với lịch thi: tạo calendar HK-<học kỳ>-Thi', async () => {
    vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
    vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
    vi.mocked(pushSessionsToGoogleCalendar).mockResolvedValue({
      total: 1,
      created: 1,
      skipped: 0,
      failed: 0,
    })
    const examSchedule: ParsedSchedule = {
      kind: 'exam',
      semester: '20261',
      sessions: [{ ...schedule.sessions[0], kind: 'exam' }],
    }
    render(
      <CalendarConfigStep schedule={examSchedule} onBack={vi.fn()} clientId="test-client-id" />,
    )

    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    await vi.waitFor(() => expect(ensureCalendar).toHaveBeenCalledWith('token-abc', 'HK-20261-Thi'))
  })

  it('báo lỗi khi số phút nhắc vượt giới hạn', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/nhắc trước/i), { target: { value: '99999' } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Số phút nhắc phải là số nguyên')
  })

  it('báo lỗi khi số phút nhắc là số thập phân', () => {
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/nhắc trước/i), { target: { value: '1.5' } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Số phút nhắc phải là số nguyên')
  })

  it('khoá nút Quay lại trong lúc đang đăng nhập/tạo lịch', async () => {
    vi.mocked(requestGoogleAccessToken).mockImplementation(() => new Promise(() => {}))
    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)

    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    expect(await screen.findByRole('button', { name: /quay lại/i })).toBeDisabled()
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

  it('bấm Thử lại buổi lỗi sẽ đẩy lại mà không đăng nhập lại', async () => {
    vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
    vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
    vi.mocked(pushSessionsToGoogleCalendar)
      .mockResolvedValueOnce({ total: 2, created: 1, skipped: 0, failed: 1 })
      .mockResolvedValueOnce({ total: 2, created: 2, skipped: 0, failed: 0 })

    render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)
    fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

    fireEvent.click(await screen.findByRole('button', { name: /thử lại buổi lỗi/i }))

    expect(await screen.findByText(/2\/2/)).toBeInTheDocument()
    expect(requestGoogleAccessToken).toHaveBeenCalledTimes(1)
    expect(pushSessionsToGoogleCalendar).toHaveBeenCalledTimes(2)
  })

  describe('xóa các buổi cũ rồi tạo lại', () => {
    const doneProgress = { total: 2, created: 2, skipped: 0, failed: 0 }

    it('ô tick mặc định tắt và không xóa gì khi chưa tick', async () => {
      vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
      vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
      vi.mocked(pushSessionsToGoogleCalendar).mockResolvedValue(doneProgress)

      render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)

      expect(screen.getByRole('checkbox', { name: /xóa các buổi cũ/i })).not.toBeChecked()

      fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))
      await screen.findByText(/2\/2/)

      expect(deleteAppEvents).not.toHaveBeenCalled()
      expect(screen.queryByText(/đã xóa \d+ buổi cũ/i)).not.toBeInTheDocument()
    })

    it('khi tick: xóa buổi cũ trước, rồi mới tạo lại, và hiển thị số buổi đã xóa', async () => {
      vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
      vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
      vi.mocked(deleteAppEvents).mockResolvedValue({ total: 5, deleted: 5, failed: 0 })
      vi.mocked(pushSessionsToGoogleCalendar).mockResolvedValue(doneProgress)

      render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)
      fireEvent.click(screen.getByRole('checkbox', { name: /xóa các buổi cũ/i }))
      fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

      expect(await screen.findByText(/đã xóa 5 buổi cũ/i)).toBeInTheDocument()
      expect(deleteAppEvents).toHaveBeenCalledWith('token-abc', 'cal-1')
      expect(vi.mocked(deleteAppEvents).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(pushSessionsToGoogleCalendar).mock.invocationCallOrder[0],
      )
    })

    it('dừng và không tạo lịch mới khi còn buổi cũ không xóa được', async () => {
      vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
      vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
      vi.mocked(deleteAppEvents).mockResolvedValue({ total: 5, deleted: 3, failed: 2 })

      render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)
      fireEvent.click(screen.getByRole('checkbox', { name: /xóa các buổi cũ/i }))
      fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Không xóa được 2 buổi cũ')
      expect(pushSessionsToGoogleCalendar).not.toHaveBeenCalled()
    })

    it('bấm Thử lại buổi lỗi không xóa lại những buổi vừa tạo', async () => {
      vi.mocked(requestGoogleAccessToken).mockResolvedValue('token-abc')
      vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
      vi.mocked(deleteAppEvents).mockResolvedValue({ total: 5, deleted: 5, failed: 0 })
      vi.mocked(pushSessionsToGoogleCalendar)
        .mockResolvedValueOnce({ total: 2, created: 1, skipped: 0, failed: 1 })
        .mockResolvedValueOnce(doneProgress)

      render(<CalendarConfigStep schedule={schedule} onBack={vi.fn()} clientId="test-client-id" />)
      fireEvent.click(screen.getByRole('checkbox', { name: /xóa các buổi cũ/i }))
      fireEvent.click(screen.getByRole('button', { name: /xác nhận tạo lịch/i }))

      fireEvent.click(await screen.findByRole('button', { name: /thử lại buổi lỗi/i }))

      expect(await screen.findByText(/2\/2/)).toBeInTheDocument()
      expect(deleteAppEvents).toHaveBeenCalledTimes(1)
      expect(pushSessionsToGoogleCalendar).toHaveBeenCalledTimes(2)
    })
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
