import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import fixtureData from '../../tests/fixtures/schedule.sample.json'
import { ScheduleInputStep } from './ScheduleInputStep'

const fixtureRaw = JSON.stringify(fixtureData)

describe('ScheduleInputStep', () => {
  it('hiển thị lỗi khi bấm Tạo lịch mà chưa dán dữ liệu', () => {
    render(<ScheduleInputStep rawData="" onRawDataChange={vi.fn()} onParsed={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('dán dữ liệu')
  })

  it('hiển thị lỗi khi JSON không hợp lệ', () => {
    render(
      <ScheduleInputStep rawData="không phải json" onRawDataChange={vi.fn()} onParsed={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('không phải JSON hợp lệ')
  })

  it('gọi onParsed với kết quả đúng khi dữ liệu hợp lệ', () => {
    const onParsed = vi.fn()
    render(<ScheduleInputStep rawData={fixtureRaw} onRawDataChange={vi.fn()} onParsed={onParsed} />)

    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(onParsed).toHaveBeenCalledTimes(1)
    expect(onParsed.mock.calls[0][0]).toMatchObject({ semester: '99991' })
    expect(onParsed.mock.calls[0][0].sessions).toHaveLength(2)
  })

  it('gọi onRawDataChange khi gõ vào textarea', () => {
    const onRawDataChange = vi.fn()
    render(<ScheduleInputStep rawData="" onRawDataChange={onRawDataChange} onParsed={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: 'abc' },
    })

    expect(onRawDataChange).toHaveBeenCalledWith('abc')
  })
})
