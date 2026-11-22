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

  it('báo lỗi khi chọn file không phải .xlsx', () => {
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    selectFile(new File(['x'], 'tkb.pdf'))

    expect(screen.getByRole('alert')).toHaveTextContent('Chỉ hỗ trợ file .xlsx')
    expect(screen.queryByText('tkb.pdf')).not.toBeInTheDocument()
  })

  it('báo lỗi khi kéo thả file không phải .xlsx', () => {
    render(<ScheduleInputStep onParsed={vi.fn()} />)

    const dropzone = screen.getByText(/kéo thả file/i)
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(['x'], 'anh.png')] } })

    expect(screen.getByRole('alert')).toHaveTextContent('Chỉ hỗ trợ file .xlsx')
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

  describe('tab Dán nội dung', () => {
    const TAB = String.fromCharCode(9)
    const PASTED_TEXT = [
      'Xem lịch thi',
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
    ].join(String.fromCharCode(10))

    function openPasteTab() {
      fireEvent.click(screen.getByRole('tab', { name: /dán nội dung/i }))
    }

    function paste(text: string) {
      fireEvent.change(screen.getByLabelText(/nội dung trang lịch thi/i), {
        target: { value: text },
      })
    }

    it('chuyển sang ô dán và ẩn ô chọn file', () => {
      render(<ScheduleInputStep onParsed={vi.fn()} />)

      openPasteTab()

      expect(screen.getByRole('tab', { name: /dán nội dung/i })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(screen.getByLabelText(/nội dung trang lịch thi/i)).toBeInTheDocument()
      expect(screen.queryByText(/kéo thả file/i)).not.toBeInTheDocument()
    })

    it('gọi onParsed với lịch thi đọc từ nội dung đã dán', async () => {
      const onParsed = vi.fn()
      render(<ScheduleInputStep onParsed={onParsed} />)

      openPasteTab()
      paste(PASTED_TEXT)
      fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

      await vi.waitFor(() => expect(onParsed).toHaveBeenCalledTimes(1))
      expect(onParsed.mock.calls[0][0]).toMatchObject({
        kind: 'exam',
        semester: '20261',
        sessions: [{ subjectCode: 'TOA105', date: '2026-12-05' }],
      })
      expect(parseScheduleExcelFile).not.toHaveBeenCalled()
    })

    it('báo lỗi khi bấm Tạo lịch mà chưa dán gì', () => {
      render(<ScheduleInputStep onParsed={vi.fn()} />)

      openPasteTab()
      fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

      expect(screen.getByRole('alert')).toHaveTextContent('dán nội dung')
    })

    it('báo lỗi khi nội dung dán không phải lịch thi', () => {
      const onParsed = vi.fn()
      render(<ScheduleInputStep onParsed={onParsed} />)

      openPasteTab()
      paste('Trang chủ Xem điểm Xem học phí')
      fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))

      expect(screen.getByRole('alert')).toHaveTextContent('Không nhận ra lịch thi')
      expect(onParsed).not.toHaveBeenCalled()
    })

    it('xoá lỗi cũ khi đổi tab', () => {
      render(<ScheduleInputStep onParsed={vi.fn()} />)

      openPasteTab()
      fireEvent.click(screen.getByRole('button', { name: /tạo lịch/i }))
      expect(screen.getByRole('alert')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('tab', { name: /tải file excel/i }))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
