interface GoogleTokenResponse {
  access_token: string
  error?: string
}

interface GoogleTokenClientError {
  type: string
  message?: string
}

interface GoogleTokenClientConfig {
  client_id: string
  scope: string
  callback: (response: GoogleTokenResponse) => void
  error_callback?: (error: GoogleTokenClientError) => void
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient
        revoke: (accessToken: string, callback?: () => void) => void
      }
    }
  }
}
