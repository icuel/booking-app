'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function OnboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionEmail = data.session?.user.email ?? null

      if (!sessionEmail) {
        setError('認証情報が見つかりません。最初からやり直してください。')
        return
      }

      setEmail(sessionEmail)
    }

    run()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('メールアドレスが取得できません。')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/hubspot/create-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, postalCode }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'HubSpot へのコンタクト登録に失敗しました')
      }

      // 登録OK → 予約画面へ
      router.replace('/book')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!email && !error) {
    return (
      <div style={{ padding: 24 }}>
        <p>認証情報を確認しています…</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>基本情報の入力</h1>
      <p>はじめてのご利用のため、お名前と郵便番号を教えてください。</p>

      {email && (
        <p style={{ marginBottom: 16 }}>
          認証済みメールアドレス：<strong>{email}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            氏名<br />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            郵便番号<br />
            <input
              type="text"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '送信中…' : '登録して予約に進む'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
