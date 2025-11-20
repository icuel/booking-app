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
  const [ageBand, setAgeBand] = useState<string>('') // 年代
  const [consultTargetType, setConsultTargetType] = useState<string>('') // 誰の相談か
  const [consultTargetRelationOther, setConsultTargetRelationOther] = useState<string>('') // その他親族の関係（任意）
  const [targetAgeBand, setTargetAgeBand] = useState<string>('') // 相談対象者の年代
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

  if (!ageBand) {
  setError('年代を選択してください')
  return
  }

  if (!consultTargetType) {
    setError('今回のご相談がどなたについてかを選択してください')
    return
  }

  // SELF 以外の場合は対象者年代もチェック
  let subjectAgeBandTemp = ''
  
  if (consultTargetType === 'SELF') {
    subjectAgeBandTemp = ageBand // 自分自身なら本人の年代をそのまま対象者年代として使う
  } else {
    if (!targetAgeBand) {
      setError('相談対象の方の年代を選択してください（分からない場合は「分からない」を選択）')
      return
    }
    subjectAgeBandTemp = targetAgeBand
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
        ageBand,                   // 追加
        consultTargetType,         // 追加
        consultTargetRelationOther // 追加
        subjectAgeBandTemp,
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

      {/* 年代 */}
      <div style={{ marginBottom: 16 }}>
        <p>年代<span style={{ color: 'red' }}>※</span></p>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="UNDER_59"
              checked={ageBand === 'UNDER_59'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            〜59歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_60_64"
              checked={ageBand === 'AGE_60_64'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            60〜64歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_65_69"
              checked={ageBand === 'AGE_65_69'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            65〜69歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_70_74"
              checked={ageBand === 'AGE_70_74'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            70〜74歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_75_79"
              checked={ageBand === 'AGE_75_79'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            75〜79歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_80_84"
              checked={ageBand === 'AGE_80_84'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            80〜84歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_85_89"
              checked={ageBand === 'AGE_85_89'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            85〜89歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_90_94"
              checked={ageBand === 'AGE_90_94'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            90〜94歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_95_99"
              checked={ageBand === 'AGE_95_99'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            95〜99歳
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="AGE_100_PLUS"
              checked={ageBand === 'AGE_100_PLUS'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            100歳以上
          </label>
        </div>   
        <div>
          <label>
            <input
              type="radio"
              name="ageBand"
              value="NO_ANSWER"
              checked={ageBand === 'NO_ANSWER'}
              onChange={(e) => setAgeBand(e.target.value)}
            />{' '}
            回答しない
          </label>
        </div>
      </div>

      {/* 誰の相談か */}
      <div style={{ marginBottom: 16 }}>
        <p>今回のご相談は、どなたについての内容ですか？<span style={{ color: 'red' }}>※</span></p>
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

        {/* その他の親族を選んだときだけ自由記述を出す */}
        {consultTargetType === 'OTHER_RELATIVE' && (
          <div style={{ marginTop: 8 }}>
            <label>
              差し支えなければ、その方とのご関係を教えてください（任意）<br />
              <input
                type="text"
                value={consultTargetRelationOther}
                onChange={(e) => setConsultTargetRelationOther(e.target.value)}
                placeholder="例：叔父、いとこ、兄 など"
                style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
              />
            </label>
          </div>
        )}
      </div>

      {/* 相談対象者の年代（自分自身以外のときだけ表示） */}
      {consultTargetType !== 'SELF' && (
        <div style={{ marginBottom: 16 }}>
          <p>その方のおおよその年代をお選びください。</p>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="UNDER_59"
                checked={targetAgeBand === 'UNDER_59'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              〜59歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_60_64"
                checked={targetAgeBand === 'AGE_60_64'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              60〜64歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_65_69"
                checked={targetAgeBand === 'AGE_65_69'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              65〜69歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_70_74"
                checked={targetAgeBand === 'AGE_70_74'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              70〜74歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_75_79"
                checked={targetAgeBand === 'AGE_75_79'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              75〜79歳
            </label>
          </div>          
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_80_84"
                checked={targetAgeBand === 'AGE_80_84'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              80〜84歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_85_89"
                checked={targetAgeBand === 'AGE_85_89'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              85〜89歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_90_94"
                checked={targetAgeBand === 'AGE_90_94'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              90〜94歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_95_99"
                checked={targetAgeBand === 'AGE_95_99'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              95〜99歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="AGE_100_PLUS"
                checked={targetAgeBand === 'AGE_100_PLUS'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              100歳以上
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="targetAgeBand"
                value="NO_ANSWER"
                checked={targetAgeBand === 'NO_ANSWER'}
                onChange={(e) => setTargetAgeBand(e.target.value)}
              />{' '}
              分からない
            </label>
          </div>
        </div>
      )}
      
      <button type="submit" disabled={loading}>
        {loading ? '送信中…' : '登録して予約に進む'}
      </button>
    </form>

    {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
  </div>
  )
}
