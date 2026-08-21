import { describe, expect, it } from 'vitest'
import fixtureData from '../../tests/fixtures/schedule.sample.json'
import { parseSchedule } from './parseSchedule'

const fixtureRaw = JSON.stringify(fixtureData)

describe('parseSchedule', () => {
  it('đọc đúng học kỳ và bỏ qua buổi nghỉ dạy', () => {
    const { semester, sessions } = parseSchedule(fixtureRaw)

    expect(semester).toBe('99991')
    expect(sessions).toHaveLength(2)
  })

  it('tính đúng giờ bắt đầu/kết thúc và tách phòng học từ ma_phong lặp', () => {
    const { sessions } = parseSchedule(fixtureRaw)
    const [first, second] = sessions

    expect(first).toMatchObject({
      subjectCode: 'TST101',
      date: '2025-09-08',
      startTime: '06:45',
      endTime: '11:30',
      room: 'PH.A101',
    })

    expect(second).toMatchObject({
      subjectCode: 'DEV202',
      date: '2025-09-09',
      startTime: '15:00',
      endTime: '17:15',
      room: 'PH.B202',
    })
  })

  it('ném lỗi khi input không phải JSON', () => {
    expect(() => parseSchedule('không phải json')).toThrow('không phải JSON hợp lệ')
  })

  it('ném lỗi khi thiếu ds_tuan_tkb', () => {
    expect(() => parseSchedule(JSON.stringify({ data: {} }))).toThrow(
      'không đúng định dạng thời khoá biểu',
    )
  })
})
