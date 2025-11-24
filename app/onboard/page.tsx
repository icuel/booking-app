'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

// ひらがなをカタカナに変換する
const toKatakana = (input: string) =>
  input.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60),
  )

// 全角カタカナ＋長音＋スペースだけ許可
const katakanaRegex = /^[\u30A1-\u30FA\u30FC\s\u3000]+$/

// 郵便番号：ハイフンなし7桁
const postalRegex = /^[0-9]{7}$/

export default function OnboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [kanaFullNameRaw, setKanaFullNameRaw] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [consultTargetType, setConsultTargetType] = useState<string>('') // 誰の相談か
  const [subjectAgeBand, setSubjectAgeBand] = useState<string>('') // 相談対象者の年代
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

    if (!consultTargetType) {
      setError('今回のご相談がどなたについてかを選択してください')
      return
    }

    if (!subjectAgeBand) {
      setError(
        '相談の対象となる方の年代を選択してください（ご自身のご相談の場合は、ご自身の年代を選んでください）',
      )
      return
    }

    // ひらがな→カタカナ変換
    const kanaFullName = toKatakana(kanaFullNameRaw.trim())

    // カタカナだけになっているかチェック（スペースは許可）
    if (!katakanaRegex.test(kanaFullName)) {
      setError(
        'カナ氏名はカタカナ（全角）で入力してください（ひらがなも可、姓と名の間にスペース可）',
      )
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
          kanaFullName,
          postalCode,
          consultTargetType,
          subjectAgeBand,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'HubSpot への登録に失敗しました')
      }

      // ★ ここで HubSpot Ticket の hs_ticket_id を localStorage に保存
      if (typeof window !== 'undefined' && data.hsTicketId) {
        window.localStorage.setItem('currentHsTicketId', data.hsTicketId)
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
      <p>はじめてのご利用のため、お名前と郵便番号、今回のご相談の対象となる方について教えてください。</p>

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

        {/* カナ氏名 */}
        <div style={{ marginBottom: 12 }}>
          <label>
            カナ氏名（ひらがな or カタカナ、姓と名の間はスペース可）<br />
            <input
              type="text"
              required
              value={kanaFullNameRaw}
              onChange={(e) => setKanaFullNameRaw(e.target.value)}
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

        {/* 誰の相談か */}
        <div style={{ marginBottom: 16 }}>
          <p>
            今回のご相談は、どなたについての内容ですか？
            <span style={{ color: 'red' }}>※</span>
          </p>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="SELF"
                checked={consultTargetType === 'SELF'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              自分自身
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="SPOUSE"
                checked={consultTargetType === 'SPOUSE'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              配偶者・パートナー
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="PARENT"
                checked={consultTargetType === 'PARENT'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              親（実父母・義父母）
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="GRANDPARENT"
                checked={consultTargetType === 'GRANDPARENT'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              祖父母
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="CHILD"
                checked={consultTargetType === 'CHILD'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              子
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="OTHER_RELATIVE"
                checked={consultTargetType === 'OTHER_RELATIVE'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              その他の親族
            </label>
          </div>
        </div>

        {/* 相談対象者の年代（常に表示、自分自身の場合もここに入れる） */}
        <div style={{ marginBottom: 16 }}>
          <p>
            相談の対象となる方のおおよその年代をお選びください。
            <br />
            <span style={{ fontSize: 12 }}>
              ※ご自身のご相談の場合は、ご自身の年代をお選びください。
            </span>
          </p>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="UNDER_59"
                checked={subjectAgeBand === 'UNDER_59'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              〜59歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_60_64"
                checked={subjectAgeBand === 'AGE_60_64'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              60〜64歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_65_69"
                checked={subjectAgeBand === 'AGE_65_69'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              65〜69歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_70_74"
                checked={subjectAgeBand === 'AGE_70_74'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              70〜74歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_75_79"
                checked={subjectAgeBand === 'AGE_75_79'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              75〜79歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_80_84"
                checked={subjectAgeBand === 'AGE_80_84'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              80〜84歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_85_89"
                checked={subjectAgeBand === 'AGE_85_89'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              85〜89歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_90_94"
                checked={subjectAgeBand === 'AGE_90_94'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              90〜94歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_95_99"
                checked={subjectAgeBand === 'AGE_95_99'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              95〜99歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_100_PLUS"
                checked={subjectAgeBand === 'AGE_100_PLUS'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              100歳以上
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="NO_ANSWER"
                checked={subjectAgeBand === 'NO_ANSWER'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              分からない・回答しない
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? '送信中…' : '登録して予約に進む'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
