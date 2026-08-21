const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'

let scriptLoadPromise: Promise<void> | null = null

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không tải được Google Identity Services.'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

function describeGoogleError(type: string): string {
  if (type === 'popup_closed' || type === 'access_denied') {
    return 'Bạn đã huỷ đăng nhập hoặc từ chối cấp quyền Google Calendar.'
  }
  return `Đăng nhập Google thất bại (${type}).`
}

export async function requestGoogleAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript()

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(describeGoogleError(response.error)))
          return
        }
        resolve(response.access_token)
      },
      error_callback: (error) => {
        reject(new Error(describeGoogleError(error.type)))
      },
    })
    client.requestAccessToken()
  })
}

export function revokeGoogleAccessToken(accessToken: string): void {
  window.google?.accounts.oauth2.revoke(accessToken)
}
