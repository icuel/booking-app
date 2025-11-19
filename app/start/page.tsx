'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function StartPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://book.icuel.co.jp/auth/callback',
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('authedEmail', email)
      }
    }
  }

  if (sent) {
    return (
      <div style={{ padding: 24 }}>
        <h1>メールを送信しました</h1>
        <p>入力したメールアドレス宛に、認証用のリンクを送りました。メールを開いてリンクをクリックしてください。</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>予約を始める</h1>
      <p>まずはメールアドレスを入力し、メールで認証を行います。</p>
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
          <button type="submit">メールで認証する</button>
        </div>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
