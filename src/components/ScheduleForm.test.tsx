import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import fixtureData from '../../tests/fixtures/schedule.sample.json'
import { ensureCalendar, pushSessionsToGoogleCalendar } from '../lib/googleCalendar'
import { ScheduleForm } from './ScheduleForm'

vi.mock('../lib/googleCalendar', () => ({
  calendarSummaryForSemester: (semester: string) => `HK-${semester}`,
  ensureCalendar: vi.fn(),
  pushSessionsToGoogleCalendar: vi.fn(),
}))

const fixtureRaw = JSON.stringify(fixtureData)

afterEach(() => {
  vi.mocked(ensureCalendar).mockReset()
  vi.mocked(pushSessionsToGoogleCalendar).mockReset()
})

describe('ScheduleForm', () => {
  it('hiển thị lỗi khi bấm Tạo lịch mà chưa dán dữ liệu', () => {
    render(<ScheduleForm accessToken="token" />)

    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('dán dữ liệu')
  })

  it('hiển thị lỗi khi JSON không hợp lệ', () => {
    render(<ScheduleForm accessToken="token" />)

    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: 'không phải json' },
    })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('không phải JSON hợp lệ')
  })

  it('hiển thị lỗi khi số phút nhắc vượt giới hạn', () => {
    render(<ScheduleForm accessToken="token" />)

    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: fixtureRaw },
    })
    fireEvent.change(screen.getByLabelText(/nhắc trước/i), { target: { value: '99999' } })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Số phút nhắc phải từ')
  })

  it('yêu cầu đăng nhập Google trước khi tạo lịch', () => {
    render(<ScheduleForm accessToken={null} />)

    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: fixtureRaw },
    })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('đăng nhập Google')
    expect(ensureCalendar).not.toHaveBeenCalled()
  })

  it('đưa lịch lên Google Calendar thành công và hiển thị tiến độ', async () => {
    vi.mocked(ensureCalendar).mockResolvedValue('cal-1')
    vi.mocked(pushSessionsToGoogleCalendar).mockResolvedValue({
      total: 2,
      created: 2,
      skipped: 0,
      failed: 0,
    })

    render(<ScheduleForm accessToken="token" />)
    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: fixtureRaw },
    })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(await screen.findByText(/2\/2/)).toBeInTheDocument()
    expect(ensureCalendar).toHaveBeenCalledWith('token', 'HK-99991')
    expect(pushSessionsToGoogleCalendar).toHaveBeenCalledWith(
      'token',
      'cal-1',
      expect.any(Array),
      45,
      expect.any(Function),
    )
  })

  it('hiển thị lỗi khi đưa lịch lên Google Calendar thất bại', async () => {
    vi.mocked(ensureCalendar).mockRejectedValue(new Error('Không thể tạo lịch trên Google.'))

    render(<ScheduleForm accessToken="token" />)
    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: fixtureRaw },
    })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tạo lịch trên Google.')
  })
})
