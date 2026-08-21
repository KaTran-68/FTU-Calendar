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

    render(<ColorPreview subjects={subjects} colorMap={colorMap} onShuffle={vi.fn()} />)

    expect(screen.getByText('Nhập môn kiểm thử')).toBeInTheDocument()
    expect(screen.getByText('Phát triển phần mềm nâng cao')).toBeInTheDocument()
  })

  it('gọi onShuffle khi bấm nút Đổi màu', () => {
    const onShuffle = vi.fn()
    render(
      <ColorPreview
        subjects={[{ code: 'TST101', name: 'Nhập môn kiểm thử' }]}
        colorMap={new Map([['TST101', '1']])}
        onShuffle={onShuffle}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /đổi màu/i }))

    expect(onShuffle).toHaveBeenCalledTimes(1)
  })
})
