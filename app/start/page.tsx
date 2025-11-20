'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

type Step = 'email' | 'new-details' | 'sent'

export default function StartPage() {
  const [step, setStep] = useState<Step>('email')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailRedirectTo = 'https://book.icuel.co.jp/auth/callback'

  // 共通：Supabase でマジックリンクを送る関数
  const sendMagicLink = async (targetEmail: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo,
      },
    })
    if (error) {
      throw error
    }
  }

  // Step1: メールだけ入力 → HubSpotに問い合わせ
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // HubSpot にメールで問い合わせ
      const res = await fetch('/api/hubspot/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'HubSpot への問い合わせに失敗しました')
      }

      if (data.exists) {
        // 既存会員 → そのままマジックリンク送信
        await sendMagicLink(email)
        if (typeof window !== 'undefined') {
          localStorage.setItem('authedEmail', email)
        }
        setStep('sent')
      } else {
        // 新規会員 → 氏名＋郵便番号入力ステップへ
        setStep('new-details')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Step2: 新規のときだけ、HubSpotに登録してからマジックリンク送信
  const handleNewDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // HubSpot にコンタクト作成
      const res = await fetch('/api/hubspot/create-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, postalCode }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'HubSpot へのコンタクト登録に失敗しました')
      }

      // HubSpot登録ができたらマジックリンク送信
      await sendMagicLink(email)

      if (typeof window !== 'undefined') {
        localStorage.setItem('authedEmail', email)
      }

      setStep('sent')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Step3: メール送信完了画面
  if (step === 'sent') {
    return (
      <div style={{ padding: 24 }}>
        <h1>認証メールを送信しました</h1>
        <p>{email} 宛に認証リンクを送信しました。メールを開いてリンクをクリックしてください。</p>
      </div>
    )
  }

  // Step2 のフォーム（新規会員用）
  if (step === 'new-details') {
    return (
      <div style={{ padding: 24, maxWidth: 480 }}>
        <h1>基本情報の入力</h1>
        <p>はじめてのご利用のため、お名前と郵便番号を教えてください。</p>
        <form onSubmit={handleNewDetailsSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label>
              メールアドレス（変更不可）<br />
              <input
                type="email"
                value={email}
                readOnly
                style={{ padding: 8, width: '100%', boxSizing: 'border-box', backgroundColor: '#eee' }}
              />
            </label>
          </div>
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
            {loading ? '送信中…' : '登録して認証メールを送る'}
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
      </div>
    )
  }

  // Step1 のフォーム（メールだけ入力）
  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>予約を始める</h1>
      <p>まずはメールアドレスを入力してください。既に会員の方はそのまま認証メールをお送りします。初めての方は次の画面で基本情報をお伺いします。</p>
      <form onSubmit={handleEmailSubmit}>
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
            {loading ? '確認中…' : '次へ'}
          </button>
        </div>
      </form>
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
