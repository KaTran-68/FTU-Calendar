import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ColorPreview } from './ColorPreview'

describe('ColorPreview', () => {
  it('hiển thị mỗi môn kèm ô màu tương ứng', () => {
    const subjects = [
      { code: 'TST101', name: 'Nhập môn kiểm thử' },
      { code: 'DEV202', name: 'Phát triển phần mềm nâng cao' },
    ]
    const colorMap = new Map([
      ['TST101', '1'],
      ['DEV202', '2'],
    ])

    render(
      <ColorPreview
        subjects={subjects}
        colorMap={colorMap}
        onShuffle={vi.fn()}
        onColorChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Nhập môn kiểm thử')).toBeInTheDocument()
    expect(screen.getByText('Phát triển phần mềm nâng cao')).toBeInTheDocument()
  })

  it('hiển thị ghi chú hướng dẫn ấn vào card để đổi màu', () => {
    render(
      <ColorPreview
        subjects={[{ code: 'TST101', name: 'Nhập môn kiểm thử' }]}
        colorMap={new Map([['TST101', '1']])}
        onShuffle={vi.fn()}
        onColorChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/ấn vô các card để tự chỉnh màu/i)).toBeInTheDocument()
  })

  it('gọi onShuffle khi bấm nút Đổi màu', () => {
    const onShuffle = vi.fn()
    render(
      <ColorPreview
        subjects={[{ code: 'TST101', name: 'Nhập môn kiểm thử' }]}
        colorMap={new Map([['TST101', '1']])}
        onShuffle={onShuffle}
        onColorChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /đổi màu/i }))

    expect(onShuffle).toHaveBeenCalledTimes(1)
  })

  it('bấm vào 1 môn mở bảng chọn màu riêng cho môn đó', () => {
    render(
      <ColorPreview
        subjects={[{ code: 'TST101', name: 'Nhập môn kiểm thử' }]}
        colorMap={new Map([['TST101', '1']])}
        onShuffle={vi.fn()}
        onColorChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Nhập môn kiểm thử'))

    expect(screen.getByText(/Chọn màu cho/)).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(11)
  })

  it('bấm chọn màu gọi onColorChange rồi đóng bảng chọn', () => {
    const onColorChange = vi.fn()
    render(
      <ColorPreview
        subjects={[{ code: 'TST101', name: 'Nhập môn kiểm thử' }]}
        colorMap={new Map([['TST101', '1']])}
        onShuffle={vi.fn()}
        onColorChange={onColorChange}
      />,
    )

    fireEvent.click(screen.getByText('Nhập môn kiểm thử'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Grape' }))

    expect(onColorChange).toHaveBeenCalledWith('TST101', '3')
    expect(screen.queryByText(/Chọn màu cho/)).not.toBeInTheDocument()
  })
})
