import { useState } from 'react'
import { FiCheckCircle, FiLogIn } from 'react-icons/fi'
import { requestGoogleAccessToken } from '../lib/googleAuth'

type Status = 'idle' | 'connecting' | 'connected'

interface GoogleSignInProps {
  clientId?: string
  onConnected?: (accessToken: string) => void
}

export function GoogleSignIn({
  clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID,
  onConnected,
}: GoogleSignInProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)

    if (!clientId) {
      setError('Thiếu VITE_GOOGLE_CLIENT_ID trong file .env.')
      return
    }

    setStatus('connecting')
    try {
      const accessToken = await requestGoogleAccessToken(clientId)
      setStatus('connected')
      onConnected?.(accessToken)
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.')
    }
  }

  if (status === 'connected') {
    return (
      <p className="google-sign-in google-sign-in--connected">
        <FiCheckCircle aria-hidden="true" />
        Đã kết nối Google Calendar
      </p>
    )
  }

  return (
    <div className="google-sign-in">
      <button type="button" onClick={handleSignIn} disabled={status === 'connecting'}>
        <FiLogIn aria-hidden="true" />
        {status === 'connecting' ? 'Đang kết nối...' : 'Đăng nhập Google'}
      </button>
      {error && (
        <p role="alert" className="google-sign-in__error">
          {error}
        </p>
      )}
    </div>
  )
}
