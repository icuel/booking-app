'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function StartPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://book.icuel.co.jp/auth/callback',
        },
      })

      if (error) {
        throw error
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('authedEmail', email)
      }

      setSent(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ padding: 24 }}>
        <h1>認証メールを送信しました</h1>
        <p>{email} 宛に認証リンクを送信しました。メールを開いてリンクをクリックしてください。</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>予約を始める</h1>
      <p>まずはメールアドレスを入力してください。</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
        />
        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={loading}>
            {loading ? '送信中…' : 'メールで認証する'}
          </button>
        </div>
      </form>
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
