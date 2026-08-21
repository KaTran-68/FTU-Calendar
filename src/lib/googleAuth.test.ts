import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestGoogleAccessToken, revokeGoogleAccessToken } from './googleAuth'

afterEach(() => {
  window.google = undefined
})

describe('requestGoogleAccessToken', () => {
  it('trả về access_token khi đăng nhập thành công', async () => {
    let capturedConfig: GoogleTokenClientConfig | undefined

    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (config) => {
            capturedConfig = config
            return {
              requestAccessToken: () => {
                config.callback({ access_token: 'token-123' })
              },
            }
          },
          revoke: vi.fn(),
        },
      },
    }

    const token = await requestGoogleAccessToken('client-id')

    expect(token).toBe('token-123')
    expect(capturedConfig?.client_id).toBe('client-id')
    expect(capturedConfig?.scope).toContain('calendar')
  })

  it('ném lỗi thân thiện khi người dùng huỷ hoặc từ chối cấp quyền', async () => {
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (config) => ({
            requestAccessToken: () => {
              config.error_callback?.({ type: 'popup_closed' })
            },
          }),
          revoke: vi.fn(),
        },
      },
    }

    await expect(requestGoogleAccessToken('client-id')).rejects.toThrow('huỷ đăng nhập')
  })
})

describe('revokeGoogleAccessToken', () => {
  it('gọi revoke của Google Identity Services', () => {
    const revoke = vi.fn()
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(),
          revoke,
        },
      },
    }

    revokeGoogleAccessToken('token-123')

    expect(revoke).toHaveBeenCalledWith('token-123')
  })
})
