import axios, { type AxiosInstance } from 'axios'
import type { ClassSession } from '../types/schedule'

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'
const CALENDAR_TIME_ZONE = 'Asia/Ho_Chi_Minh'
const MAX_CONCURRENCY = 3
const MAX_RETRIES = 6
const RETRY_BASE_DELAY_MS = 500
const MAX_RETRY_DELAY_MS = 8000
const RETRYABLE_REASONS = [
  'rateLimitExceeded',
  'userRateLimitExceeded',
  'quotaExceeded',
  'backendError',
]

export interface PushProgress {
  total: number
  created: number
  skipped: number
  failed: number
}

interface GoogleApiErrorPayload {
  error?: {
    errors?: { reason?: string }[]
  }
}

export function calendarSummaryForSemester(semester: string): string {
  return `HK-${semester}`
}

function createClient(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: CALENDAR_API_BASE,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  if (!error.response) return true
  const status = error.response.status
  if (status === 429 || status >= 500) return true
  if (status !== 403) return false
  const reason = (error.response.data as GoogleApiErrorPayload | undefined)?.error?.errors?.[0]
    ?.reason
  return reason !== undefined && RETRYABLE_REASONS.includes(reason)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(task: () => Promise<T>): Promise<T> {
  let attempt = 0
  for (;;) {
    try {
      return await task()
    } catch (error) {
      attempt += 1
      if (attempt > MAX_RETRIES || !isRetryableError(error)) throw error
      await wait(Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS))
    }
  }
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0

  async function runNext(): Promise<void> {
    const current = index
    index += 1
    if (current >= items.length) return
    await worker(items[current])
    await runNext()
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runNext()))
}

export async function ensureCalendar(accessToken: string, summary: string): Promise<string> {
  const client = createClient(accessToken)

  let pageToken: string | undefined
  do {
    const { data } = await client.get('/users/me/calendarList', { params: { pageToken } })
    const existing = (data.items as { id: string; summary?: string }[] | undefined)?.find(
      (item) => item.summary === summary,
    )
    if (existing) return existing.id
    pageToken = data.nextPageToken
  } while (pageToken)

  const { data } = await client.post('/calendars', {
    summary,
    timeZone: CALENDAR_TIME_ZONE,
  })
  return data.id
}

async function fetchExistingFtuIds(
  client: AxiosInstance,
  calendarId: string,
): Promise<Set<string>> {
  const ids = new Set<string>()

  let pageToken: string | undefined
  do {
    const { data } = await client.get(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      params: { pageToken, maxResults: 250 },
    })
    for (const event of (data.items ?? []) as {
      extendedProperties?: { private?: { ftuId?: string } }
    }[]) {
      const ftuId = event.extendedProperties?.private?.ftuId
      if (ftuId) ids.add(ftuId)
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  return ids
}

function buildEventBody(session: ClassSession, colorId: string, reminderMinutes: number) {
  return {
    summary: `${session.subjectName} (${session.subjectCode})`,
    location: session.room,
    description: `Lớp ${session.className} - Nhóm ${session.group}`,
    start: {
      dateTime: `${session.date}T${session.startTime}:00`,
      timeZone: CALENDAR_TIME_ZONE,
    },
    end: {
      dateTime: `${session.date}T${session.endTime}:00`,
      timeZone: CALENDAR_TIME_ZONE,
    },
    colorId,
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: reminderMinutes }],
    },
    extendedProperties: {
      private: { ftuId: session.id },
    },
  }
}

export async function pushSessionsToGoogleCalendar(
  accessToken: string,
  calendarId: string,
  sessions: ClassSession[],
  reminderMinutes: number,
  colorMap: Map<string, string>,
  onProgress?: (progress: PushProgress) => void,
): Promise<PushProgress> {
  const client = createClient(accessToken)
  const existingFtuIds = await fetchExistingFtuIds(client, calendarId)

  const progress: PushProgress = { total: sessions.length, created: 0, skipped: 0, failed: 0 }
  const pending: ClassSession[] = []
  for (const session of sessions) {
    if (existingFtuIds.has(session.id)) {
      progress.skipped += 1
    } else {
      pending.push(session)
    }
  }
  onProgress?.({ ...progress })

  async function attemptCreate(session: ClassSession): Promise<boolean> {
    const colorId = colorMap.get(session.subjectCode) ?? '1'
    const body = buildEventBody(session, colorId, reminderMinutes)
    try {
      await withRetry(() =>
        client.post(`/calendars/${encodeURIComponent(calendarId)}/events`, body),
      )
      return true
    } catch {
      return false
    }
  }

  const stragglers: ClassSession[] = []
  await runWithConcurrency(pending, MAX_CONCURRENCY, async (session) => {
    if (await attemptCreate(session)) {
      progress.created += 1
    } else {
      stragglers.push(session)
    }
    onProgress?.({ ...progress })
  })

  for (const session of stragglers) {
    if (await attemptCreate(session)) {
      progress.created += 1
    } else {
      progress.failed += 1
    }
    onProgress?.({ ...progress })
  }

  return progress
}
