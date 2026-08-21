import type { ClassSession } from '../types/schedule'

const EVENT_COLOR_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

export function buildSubjectColorMap(sessions: ClassSession[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const session of sessions) {
    if (!map.has(session.subjectCode)) {
      map.set(session.subjectCode, EVENT_COLOR_IDS[map.size % EVENT_COLOR_IDS.length])
    }
  }
  return map
}
