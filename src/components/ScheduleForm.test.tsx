import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import fixtureData from '../../tests/fixtures/schedule.sample.json'
import { ScheduleForm } from './ScheduleForm'

const fixtureRaw = JSON.stringify(fixtureData)

describe('ScheduleForm', () => {
  it('hiển thị lỗi khi bấm Tạo lịch mà chưa dán dữ liệu', () => {
    render(<ScheduleForm />)

    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('dán dữ liệu')
  })

  it('parse thành công và hiển thị số buổi học / môn học', () => {
    render(<ScheduleForm />)

    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: fixtureRaw },
    })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByText(/2 buổi học/)).toBeInTheDocument()
    expect(screen.getByText(/2 môn/)).toBeInTheDocument()
  })

  it('hiển thị lỗi khi JSON không hợp lệ', () => {
    render(<ScheduleForm />)

    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: 'không phải json' },
    })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('không phải JSON hợp lệ')
  })

  it('hiển thị lỗi khi số phút nhắc vượt giới hạn', () => {
    render(<ScheduleForm />)

    fireEvent.change(screen.getByLabelText(/dữ liệu thời khoá biểu/i), {
      target: { value: fixtureRaw },
    })
    fireEvent.change(screen.getByLabelText(/nhắc trước/i), { target: { value: '99999' } })
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Số phút nhắc phải từ')
  })
})
