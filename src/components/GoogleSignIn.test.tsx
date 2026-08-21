import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GoogleSignIn } from './GoogleSignIn'

afterEach(() => {
  window.google = undefined
})

function mockGoogleTokenFlow(onRequest: (config: GoogleTokenClientConfig) => void) {
  window.google = {
    accounts: {
      oauth2: {
        initTokenClient: (config) => ({
          requestAccessToken: () => onRequest(config),
        }),
        revoke: vi.fn(),
      },
    },
  }
}

describe('GoogleSignIn', () => {
  it('báo thiếu client id khi chưa cấu hình', () => {
    render(<GoogleSignIn />)

    fireEvent.click(screen.getByRole('button', { name: /đăng nhập google/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('VITE_GOOGLE_CLIENT_ID')
  })

  it('hiển thị trạng thái đã kết nối sau khi đăng nhập thành công', async () => {
    mockGoogleTokenFlow((config) => config.callback({ access_token: 'token-abc' }))
    const onConnected = vi.fn()

    render(<GoogleSignIn clientId="client-id" onConnected={onConnected} />)
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập google/i }))

    expect(await screen.findByText('Đã kết nối Google Calendar')).toBeInTheDocument()
    expect(onConnected).toHaveBeenCalledWith('token-abc')
  })

  it('hiển thị lỗi thân thiện khi người dùng huỷ đăng nhập', async () => {
    mockGoogleTokenFlow((config) => config.error_callback?.({ type: 'popup_closed' }))

    render(<GoogleSignIn clientId="client-id" />)
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập google/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('huỷ đăng nhập')
    expect(screen.getByRole('button', { name: /đăng nhập google/i })).toBeEnabled()
  })
})
