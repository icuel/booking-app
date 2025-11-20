'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

// ひらがなをカタカナに変換する
const toKatakana = (input: string) =>
  input.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60),
  )

// 全角カタカナ＋長音だけ許可
const katakanaRegex = /^[\u30A1-\u30FA\u30FC]+$/

// 郵便番号：ハイフンなし7桁
const postalRegex = /^[0-9]{7}$/

export default function OnboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastNameKanaRaw, setLastNameKanaRaw] = useState('')
  const [firstNameKanaRaw, setFirstNameKanaRaw] = useState('')
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
    setError('メールアドレスが取得できません。最初からやり直してください。')
    return
  }

  // ひらがな→カタカナ変換
  const lastnameKana = toKatakana(lastNameKanaRaw.trim())
  const firstnameKana = toKatakana(firstNameKanaRaw.trim())

  // カタカナだけになっているかチェック
  if (!katakanaRegex.test(lastnameKana) || !katakanaRegex.test(firstnameKana)) {
    setError('フリガナはカタカナ（全角）で入力してください（ひらがなも可）')
    return
  }

  // 郵便番号チェック（数字7桁）
  if (!postalRegex.test(postalCode)) {
    setError('郵便番号はハイフンなし7桁の数字で入力してください')
    return
  }

  setLoading(true)

  try {
    const res = await fetch('/api/hubspot/create-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        lastName,
        firstName,
        lastNameKana: lastnameKana,
        firstNameKana: firstnameKana,
        postalCode,
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'HubSpot へのコンタクト登録に失敗しました')
    }

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
      {/* 姓・名 */}
      <div style={{ marginBottom: 12 }}>
        <label>
          姓<br />
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          名<br />
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
          />
        </label>
      </div>

      {/* フリガナ（ひらがな/カタカナどちらでもOKだが最終的にカタカナに変換） */}
      <div style={{ marginBottom: 12 }}>
        <label>
          姓（フリガナ・ひらがなorカタカナ）<br />
          <input
            type="text"
            required
            value={lastNameKanaRaw}
            onChange={(e) => setLastNameKanaRaw(e.target.value)}
            style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          名（フリガナ・ひらがなorカタカナ）<br />
          <input
            type="text"
            required
            value={firstNameKanaRaw}
            onChange={(e) => setFirstNameKanaRaw(e.target.value)}
            style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
          />
        </label>
      </div>

      {/* 郵便番号 */}
      <div style={{ marginBottom: 12 }}>
        <label>
          郵便番号（ハイフンなし7桁）<br />
          <input
            type="text"
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            inputMode="numeric"
            maxLength={7}
            pattern="^[0-9]{7}$"
            title="ハイフンなし7桁の数字で入力してください（例：1234567）"
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
