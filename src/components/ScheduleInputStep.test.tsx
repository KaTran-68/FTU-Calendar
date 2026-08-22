import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScheduleInputStep } from './ScheduleInputStep'
import { parseScheduleExcelFile } from '../lib/parseScheduleExcel'
import type { ParsedSchedule } from '../types/schedule'

vi.mock('../lib/parseScheduleExcel', () => ({
  parseScheduleExcelFile: vi.fn(),
}))

const schedule: ParsedSchedule = {
  semester: '20261',
  sessions: [],
}

afterEach(() => {
  vi.mocked(parseScheduleExcelFile).mockReset()
})

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText(/file excel thời khoá biểu/i), {
    target: { files: [file] },
  })
}

describe('ScheduleInputStep', () => {
  it('hiển thị lỗi khi bấm Tạo lịch mà chưa chọn file', () => {
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('chọn file Excel')
  })

  it('gọi onParsed với kết quả khi file hợp lệ', async () => {
    vi.mocked(parseScheduleExcelFile).mockResolvedValue(schedule)
    const onParsed = vi.fn()
    render(<ScheduleInputStep onParsed={onParsed} />)

    selectFile(new File(['x'], 'tkb.xlsx'))
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    await vi.waitFor(() => expect(onParsed).toHaveBeenCalledWith(schedule))
  })

  it('hiển thị lỗi thân thiện khi đọc file thất bại', async () => {
    vi.mocked(parseScheduleExcelFile).mockRejectedValue(new Error('File Excel thiếu cột "Lớp".'))
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    selectFile(new File(['x'], 'tkb.xlsx'))
    fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('thiếu cột')
  })

  it('hiển thị tên file đã chọn', () => {
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    selectFile(new File(['x'], 'tkb-hk1.xlsx'))

    expect(screen.getByText('tkb-hk1.xlsx')).toBeInTheDocument()
  })

  it('nhận file khi kéo thả vào ô upload', () => {
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    const dropzone = screen.getByText(/kéo thả file/i)
    const file = new File(['x'], 'keo-tha.xlsx')
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(screen.getByText('keo-tha.xlsx')).toBeInTheDocument()
  })

  it('bỏ chọn file khi bấm nút xoá, quay lại ô kéo thả', () => {
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    selectFile(new File(['x'], 'tkb.xlsx'))
    expect(screen.getByText('tkb.xlsx')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /bỏ chọn file/i }))

    expect(screen.queryByText('tkb.xlsx')).not.toBeInTheDocument()
    expect(screen.getByText(/kéo thả file/i)).toBeInTheDocument()
  })

  it('mở modal hướng dẫn khi bấm nút Hướng dẫn, đóng lại khi bấm Đã hiểu', () => {
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /hướng dẫn/i }))

    expect(screen.getByText(/cách lấy file excel/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ftugate/i })).toHaveAttribute(
      'href',
      'https://ftugate.ftu.edu.vn/#/',
    )

    fireEvent.click(screen.getByRole('button', { name: /đã hiểu/i }))

    expect(screen.queryByText(/cách lấy file excel/i)).not.toBeInTheDocument()
  })
})
