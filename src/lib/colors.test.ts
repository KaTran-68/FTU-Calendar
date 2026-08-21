import { describe, expect, it } from 'vitest'
import { buildSubjectColorMap, EVENT_COLOR_IDS, shuffleColorOrder } from './colors'
import type { ClassSession } from '../types/schedule'

function sessionWithSubject(subjectCode: string): ClassSession {
  return {
    id: subjectCode,
    subjectCode,
    subjectName: subjectCode,
    room: 'PH.A101',
    className: 'DEMO01',
    group: '101',
    date: '2025-09-08',
    startTime: '06:45',
    endTime: '07:30',
  }
}

describe('buildSubjectColorMap', () => {
  it('gán màu ổn định theo thứ tự môn xuất hiện lần đầu', () => {
    const sessions = ['A', 'B', 'A', 'C'].map(sessionWithSubject)
    const colorMap = buildSubjectColorMap(sessions)

    expect(colorMap.get('A')).toBe('1')
    expect(colorMap.get('B')).toBe('2')
    expect(colorMap.get('C')).toBe('3')
  })

  it('lặp lại màu khi có nhiều hơn 11 môn', () => {
    const subjectCodes = Array.from({ length: 12 }, (_, i) => `SUB${i}`)
    const colorMap = buildSubjectColorMap(subjectCodes.map(sessionWithSubject))

    expect(colorMap.get('SUB0')).toBe('1')
    expect(colorMap.get('SUB10')).toBe('11')
    expect(colorMap.get('SUB11')).toBe('1')
  })

  it('dùng thứ tự màu tuỳ chỉnh khi được truyền vào', () => {
    const sessions = ['A', 'B'].map(sessionWithSubject)
    const colorMap = buildSubjectColorMap(sessions, ['7', '3'])

    expect(colorMap.get('A')).toBe('7')
    expect(colorMap.get('B')).toBe('3')
  })
})

describe('shuffleColorOrder', () => {
  it('trả về mảng có đúng các phần tử ban đầu, chỉ đổi thứ tự', () => {
    const shuffled = shuffleColorOrder()

    expect(shuffled).toHaveLength(EVENT_COLOR_IDS.length)
    expect([...shuffled].sort()).toEqual([...EVENT_COLOR_IDS].sort())
  })

  it('không chỉnh sửa mảng gốc truyền vào', () => {
    const original = [...EVENT_COLOR_IDS]
    shuffleColorOrder(original)

    expect(original).toEqual(EVENT_COLOR_IDS)
  })
})
