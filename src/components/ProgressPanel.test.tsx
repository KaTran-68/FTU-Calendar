import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProgressPanel } from './ProgressPanel'

describe('ProgressPanel', () => {
  it('hiển thị số liệu tạo/bỏ qua/lỗi', () => {
    render(
      <ProgressPanel
        progress={{ total: 10, created: 7, skipped: 2, failed: 1 }}
        semester="20261"
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(/7\/10/)).toBeInTheDocument()
    expect(screen.getByText(/20261/)).toBeInTheDocument()
    expect(screen.getByText(/bỏ qua 2 buổi/)).toBeInTheDocument()
    expect(screen.getByText(/lỗi 1 buổi/)).toBeInTheDocument()
  })

  it('không hiển thị phần bỏ qua/lỗi khi bằng 0', () => {
    render(
      <ProgressPanel
        progress={{ total: 3, created: 3, skipped: 0, failed: 0 }}
        semester="20261"
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByText(/bỏ qua/)).not.toBeInTheDocument()
    expect(screen.queryByText(/lỗi/)).not.toBeInTheDocument()
  })

  it('gọi onClose khi bấm nút Đóng', () => {
    const onClose = vi.fn()
    render(
      <ProgressPanel
        progress={{ total: 3, created: 3, skipped: 0, failed: 0 }}
        semester="20261"
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /đóng/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('luôn có link Mở Google Calendar', () => {
    render(
      <ProgressPanel
        progress={{ total: 3, created: 3, skipped: 0, failed: 0 }}
        semester="20261"
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: /mở google calendar/i })).toHaveAttribute(
      'href',
      'https://calendar.google.com/',
    )
  })

  it('không hiện nút Thử lại khi không có onRetry', () => {
    render(
      <ProgressPanel
        progress={{ total: 3, created: 3, skipped: 0, failed: 0 }}
        semester="20261"
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /thử lại/i })).not.toBeInTheDocument()
  })

  it('gọi onRetry khi bấm nút Thử lại', () => {
    const onRetry = vi.fn()
    render(
      <ProgressPanel
        progress={{ total: 3, created: 2, skipped: 0, failed: 1 }}
        semester="20261"
        onClose={vi.fn()}
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /thử lại/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
