import type { ClassSession } from '../types/schedule'

export const EVENT_COLOR_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

export const EVENT_COLOR_HEX: Record<string, string> = {
  '1': '#7986cb',
  '2': '#33b679',
  '3': '#8e24aa',
  '4': '#e67c73',
  '5': '#f6c026',
  '6': '#f5511d',
  '7': '#039be5',
  '8': '#616161',
  '9': '#3f51b5',
  '10': '#0b8043',
  '11': '#d60000',
}

export function buildSubjectColorMap(
  sessions: ClassSession[],
  colorOrder: string[] = EVENT_COLOR_IDS,
): Map<string, string> {
  const map = new Map<string, string>()
  for (const session of sessions) {
    if (!map.has(session.subjectCode)) {
      map.set(session.subjectCode, colorOrder[map.size % colorOrder.length])
    }
  }
  return map
}

export function shuffleColorOrder(order: string[] = EVENT_COLOR_IDS): string[] {
  const shuffled = [...order]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
