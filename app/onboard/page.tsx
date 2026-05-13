'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

// 郵便番号：ハイフンなし7桁
const postalRegex = /^[0-9]{7}$/

const consultTargetOptions = [
  { value: 'SELF', label: '自分自身' },
  { value: 'SPOUSE', label: '配偶者・パートナー' },
  { value: 'PARENT', label: '親（実父母・義父母）' },
  { value: 'GRANDPARENT', label: '祖父母' },
  { value: 'CHILD', label: '子' },
  { value: 'OTHER_RELATIVE', label: 'その他の親族' },
]

const ageBandOptions = [
  { value: 'UNDER_59', label: '〜59歳' },
  { value: 'AGE_60_64', label: '60〜64歳' },
  { value: 'AGE_65_69', label: '65〜69歳' },
  { value: 'AGE_70_74', label: '70〜74歳' },
  { value: 'AGE_75_79', label: '75〜79歳' },
  { value: 'AGE_80_84', label: '80〜84歳' },
  { value: 'AGE_85_89', label: '85〜89歳' },
  { value: 'AGE_90_94', label: '90〜94歳' },
  { value: 'AGE_95_99', label: '95〜99歳' },
  { value: 'AGE_100_PLUS', label: '100歳以上' },
  { value: 'NO_ANSWER', label: '分からない・回答しない' },
]

export default function OnboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [consultTargetType, setConsultTargetType] = useState<string>('')
  const [subjectAgeBand, setSubjectAgeBand] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession()
      const sessionEmail = data.session?.user.email ?? null

      if (error || !sessionEmail) {
        setError('認証情報が見つかりません。最初からやり直してください。')
        setCheckingAuth(false)
        return
      }

      setEmail(sessionEmail)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('authedEmail', sessionEmail)
      }

      setCheckingAuth(false)
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

    const normalizedDisplayName = displayName.trim()

    if (!normalizedDisplayName) {
      setError('相談時にお呼びするお名前またはニックネームを入力してください。')
      return
    }

    if (!consultTargetType) {
      setError('今回のご相談がどなたについてかを選択してください。')
      return
    }

    if (!subjectAgeBand) {
      setError(
        '相談の対象となる方の年代を選択してください。ご自身のご相談の場合は、ご自身の年代を選んでください。',
      )
      return
    }

    // 郵便番号は任意。入力がある場合のみ、数字以外を除去して7桁チェックする。
    // 例：123-4567 → 1234567
    const normalizedPostalCode = postalCode.replace(/[^\d]/g, '')

    if (normalizedPostalCode && !postalRegex.test(normalizedPostalCode)) {
      setError('郵便番号は7桁の数字で入力してください。')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/hubspot/create-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,

          // 今回は表示名のみ入力してもらい、HubSpot上は姓に格納する。
          // 名・カナ氏名は将来利用可能性を残すため、項目自体は維持しつつ今回は空で送信する。
          lastName: normalizedDisplayName,
          firstName: '',
          kanaFullName: '',

          // 郵便番号は任意。未入力の場合は空文字。
          postalCode: normalizedPostalCode,

          consultTargetType,
          subjectAgeBand,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'HubSpotへの登録に失敗しました。')
      }

      if (typeof window !== 'undefined' && data.hsTicketId) {
        window.localStorage.setItem('currentHsTicketId', data.hsTicketId)
      }

      router.replace('/book')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('authedEmail')
      window.localStorage.removeItem('currentHsTicketId')
    }

    await supabase.auth.signOut()
    router.replace('/start')
  }

  if (checkingAuth && !error) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <header style={headerStyle}>
            <div style={serviceNameStyle}>自立暮らしコンシェルジュ</div>
            <div style={serviceSubStyle}>オンライン相談予約</div>
          </header>

          <section style={cardStyle}>
            <h1 style={titleStyle}>認証情報を確認しています</h1>
            <p style={descriptionStyle}>
              予約手続きに必要な情報を確認しています。画面を閉じずにお待ちください。
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={serviceNameStyle}>自立暮らしコンシェルジュ</div>
          <div style={serviceSubStyle}>オンライン相談予約</div>
        </header>

        <section style={cardStyle}>
          <h1 style={titleStyle}>基本情報の入力</h1>

          <p style={descriptionStyle}>
            はじめてご利用の方は、予約に進む前に、相談時にお呼びするお名前などをご入力ください。
          </p>

          <p style={descriptionStyle}>
            本サービスでは、相談内容を個人に紐づけて残さない方針のため、本名でなくてもかまいません。
          </p>

          {email && (
            <div style={infoBoxStyle}>
              <p style={infoTitleStyle}>認証済みメールアドレス</p>
              <p style={infoTextStyle}>
                <strong>{email}</strong>
              </p>
            </div>
          )}

          {error && (
            <div style={errorBoxStyle}>
              <p style={errorTitleStyle}>入力内容を確認してください</p>
              <p style={errorTextStyle}>{error}</p>

              {!email && (
                <button type="button" onClick={handleRestart} style={secondaryButtonStyle}>
                  最初からやり直す
                </button>
              )}
            </div>
          )}

          {email && (
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={fieldStyle}>
                <label htmlFor="displayName" style={labelStyle}>
                  お名前またはニックネーム <span style={requiredStyle}>必須</span>
                </label>
                <p style={helpTextStyle}>
                  相談時にお呼びするためのお名前をご入力ください。本名でなくてもかまいません。
                </p>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例：山田、たろう、Yamada など"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="postalCode" style={labelStyle}>
                  郵便番号 <span style={optionalStyle}>任意</span>
                </label>
                <p style={helpTextStyle}>
                  相談内容や地域特性の分析、サービス改善のために利用します。差し支えなければご入力ください。
                </p>
                <input
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="例：1234567"
                  style={inputStyle}
                />
                <p style={smallHelpTextStyle}>
                  ハイフンありで入力しても、自動でハイフンを除いて登録します。
                </p>
              </div>

              <div style={fieldStyle}>
                <p style={sectionLabelStyle}>
                  今回のご相談は、どなたについての内容ですか？{' '}
                  <span style={requiredStyle}>必須</span>
                </p>

                <div style={optionGroupStyle}>
                  {consultTargetOptions.map((option) => (
                    <label
                      key={option.value}
                      style={{
                        ...radioCardStyle,
                        ...(consultTargetType === option.value ? selectedRadioCardStyle : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name="consultTarget"
                        value={option.value}
                        checked={consultTargetType === option.value}
                        onChange={(e) => setConsultTargetType(e.target.value)}
                        style={radioInputStyle}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={fieldStyle}>
                <p style={sectionLabelStyle}>
                  相談の対象となる方のおおよその年代をお選びください。{' '}
                  <span style={requiredStyle}>必須</span>
                </p>
                <p style={helpTextStyle}>
                  ご自身のご相談の場合は、ご自身の年代をお選びください。
                </p>

                <div style={optionGroupStyle}>
                  {ageBandOptions.map((option) => (
                    <label
                      key={option.value}
                      style={{
                        ...radioCardStyle,
                        ...(subjectAgeBand === option.value ? selectedRadioCardStyle : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name="subjectAgeBand"
                        value={option.value}
                        checked={subjectAgeBand === option.value}
                        onChange={(e) => setSubjectAgeBand(e.target.value)}
                        style={radioInputStyle}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={noticeBoxStyle}>
                <p style={noticeTitleStyle}>手続き中の注意</p>
                <p style={noticeTextStyle}>
                  予約完了まで、このまま同じブラウザで手続きを進めてください。
                  別の端末や別のブラウザで開くと、入力済みの情報を引き継げないことがあります。
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonStyle,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '送信中…' : '登録して予約に進む'}
              </button>
            </form>
          )}
        </section>

        <footer style={footerStyle}>
          <a href="https://kuracon.icuel.jp" style={footerLinkStyle}>
            サービスサイトへ戻る
          </a>
        </footer>
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f7f7f4',
  padding: '40px 16px',
  boxSizing: 'border-box',
}

const containerStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  marginBottom: 24,
}

const serviceNameStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#222222',
  letterSpacing: '0.03em',
}

const serviceSubStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 14,
  color: '#666666',
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 16,
  padding: 28,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e5e5e0',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  lineHeight: 1.4,
  color: '#222222',
}

const descriptionStyle: React.CSSProperties = {
  marginTop: 16,
  marginBottom: 0,
  fontSize: 15,
  lineHeight: 1.8,
  color: '#444444',
}

const infoBoxStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  borderRadius: 12,
  background: '#f8f8f5',
  border: '1px solid #e5e5dd',
}

const infoTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: '#333333',
}

const infoTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.7,
  color: '#555555',
}

const formStyle: React.CSSProperties = {
  marginTop: 24,
}

const fieldStyle: React.CSSProperties = {
  marginTop: 22,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 700,
  color: '#333333',
}

const sectionLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: '#333333',
}

const requiredStyle: React.CSSProperties = {
  marginLeft: 4,
  color: '#b42318',
  fontSize: 12,
  fontWeight: 700,
}

const optionalStyle: React.CSSProperties = {
  marginLeft: 4,
  color: '#666666',
  fontSize: 12,
  fontWeight: 700,
}

const helpTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.7,
  color: '#666666',
}

const smallHelpTextStyle: React.CSSProperties = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.6,
  color: '#777777',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 48,
  marginTop: 8,
  padding: '0 14px',
  boxSizing: 'border-box',
  border: '1px solid #cccccc',
  borderRadius: 10,
  background: '#ffffff',
  fontSize: 16,
  color: '#222222',
  outline: 'none',
}

const optionGroupStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 12,
}

const radioCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #dddddd',
  background: '#ffffff',
  fontSize: 14,
  color: '#333333',
  cursor: 'pointer',
}

const selectedRadioCardStyle: React.CSSProperties = {
  border: '1px solid #2f5d50',
  background: '#f2f7f4',
}

const radioInputStyle: React.CSSProperties = {
  margin: 0,
}

const noticeBoxStyle: React.CSSProperties = {
  marginTop: 24,
  padding: 16,
  borderRadius: 12,
  background: '#fbfaf6',
  border: '1px solid #e6dfc8',
}

const noticeTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: '#333333',
}

const noticeTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.7,
  color: '#666666',
}

const errorBoxStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  borderRadius: 12,
  background: '#fff4f2',
  border: '1px solid #f5c2bd',
}

const errorTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: '#8a1f11',
}

const errorTextStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 14,
  lineHeight: 1.7,
  color: '#8a1f11',
}

const buttonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 24,
  padding: '14px 18px',
  border: 'none',
  borderRadius: 999,
  background: '#2f5d50',
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 700,
  textAlign: 'center',
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 16,
  padding: '12px 18px',
  border: 'none',
  borderRadius: 999,
  background: '#2f5d50',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const footerStyle: React.CSSProperties = {
  marginTop: 20,
  textAlign: 'center',
  fontSize: 13,
}

const footerLinkStyle: React.CSSProperties = {
  color: '#555555',
  textDecoration: 'underline',
}
