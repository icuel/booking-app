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
          emailRedirectTo: 'https://book.kuracon.icuel.jp/auth/callback',
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
      <main style={pageStyle}>
        <div style={containerStyle}>
          <header style={headerStyle}>
            <div style={serviceNameStyle}>自立暮らしコンシェルジュ</div>
            <div style={serviceSubStyle}>オンライン相談予約</div>
          </header>

          <section style={cardStyle}>
            <h1 style={titleStyle}>認証メールを送信しました</h1>

            <p style={descriptionStyle}>
              {email} 宛に、予約手続き用の認証メールを送信しました。
              メールを開いて、本文内のリンクをクリックしてください。
            </p>

            <div style={noticeBoxStyle}>
              <p style={noticeTitleStyle}>メールが届かない場合</p>
              <p style={noticeTextStyle}>
                数分待ってもメールが届かない場合は、迷惑メールフォルダをご確認ください。
                また、メールの受信設定でドメインによる受取制限がかかっていないかをご確認ください。
              </p>
              <p style={noticeTextStyle}>
                それでも届かない場合は、メールアドレスに誤りがないかをご確認のうえ、
                前の画面に戻って再度お試しください。
              </p>
            </div>
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
          <h1 style={titleStyle}>オンライン相談のご予約</h1>

          <p style={descriptionStyle}>
            退院後の生活、住まいの見直し、公的支援制度の調べ方など、
            これからの暮らしについて考えたいことを整理するためのオンライン相談です。
          </p>

          <p style={descriptionStyle}>
            予約手続きに進むため、まずはメールアドレスをご入力ください。
            入力いただいたメールアドレス宛に、予約手続き用の認証メールを自動送信します。
            メール本文内のリンクを押すと、予約手続きを続けられます。
          </p>

          <form onSubmit={handleSubmit} style={formStyle}>
            <label htmlFor="email" style={labelStyle}>
              メールアドレス
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '送信中…' : 'メールで認証する'}
            </button>
          </form>

          {error && <p style={errorStyle}>{error}</p>}

          <div style={noticeBoxStyle}>
            <p style={noticeTitleStyle}>認証メールについて</p>
            <p style={noticeTextStyle}>
              数分待ってもメールが届かない場合は、迷惑メールフォルダをご確認ください。
              また、メールの受信設定でドメインによる受取制限がかかっていないかをご確認のうえ、
              再度お試しください。
            </p>
          </div>
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
  maxWidth: 640,
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

const formStyle: React.CSSProperties = {
  marginTop: 24,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: '#333333',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 48,
  padding: '0 14px',
  boxSizing: 'border-box',
  border: '1px solid #cccccc',
  borderRadius: 10,
  background: '#ffffff',
  fontSize: 16,
  color: '#222222',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 18,
  padding: '14px 18px',
  border: 'none',
  borderRadius: 999,
  background: '#2f5d50',
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 700,
  textAlign: 'center',
}

const errorStyle: React.CSSProperties = {
  marginTop: 16,
  color: '#b42318',
  background: '#fff4f2',
  border: '1px solid #f5c2bd',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
}

const noticeBoxStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  borderRadius: 12,
  background: '#f8f8f5',
  border: '1px solid #e5e5dd',
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

const footerStyle: React.CSSProperties = {
  marginTop: 20,
  textAlign: 'center',
  fontSize: 13,
}

const footerLinkStyle: React.CSSProperties = {
  color: '#555555',
  textDecoration: 'underline',
}'use client'

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
          emailRedirectTo: 'https://book.kuracon.icuel.jp/auth/callback',
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
      <main style={pageStyle}>
        <div style={containerStyle}>
          <header style={headerStyle}>
            <div style={serviceNameStyle}>自立暮らしコンシェルジュ</div>
            <div style={serviceSubStyle}>オンライン相談予約</div>
          </header>

          <section style={cardStyle}>
            <h1 style={titleStyle}>認証メールを送信しました</h1>

            <p style={descriptionStyle}>
              {email} 宛に、予約手続き用の認証メールを送信しました。
              メールを開いて、本文内のリンクをクリックしてください。

              数分待ってもメールが届かない場合は、迷惑メールフォルダをご確認ください。
              また、メールの受信設定でドメインによる受取制限がかかっていないかをご確認ください。
              
              それでも届かない場合は、メールアドレスに誤りがないかをご確認のうえ、前の画面に戻って再度お試しください。
            </p>

            <p style={noteStyle}>
              数分待ってもメールが届かない場合は、迷惑メールフォルダをご確認ください。
              また、メールの受信設定でドメインによる受取制限がかかっていないかをご確認のうえ、再度お試しください。
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
          <h1 style={titleStyle}>オンライン相談のご予約</h1>

          <p style={descriptionStyle}>
            退院後の生活、住まいの見直し、公的支援制度の調べ方など、
            これからの暮らしについて考えたいことを整理するためのオンライン相談です。
          </p>

          <p style={descriptionStyle}>
            予約手続きに進むため、まずはメールアドレスをご入力ください。
            入力いただいたメールアドレス宛に、予約手続き用の認証メールを自動送信します。
            メール本文内のリンクを押すと、予約手続きを続けられます。
          </p>

          <form onSubmit={handleSubmit} style={formStyle}>
            <label htmlFor="email" style={labelStyle}>
              メールアドレス
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '送信中…' : 'メールで認証する'}
            </button>
          </form>

          {error && <p style={errorStyle}>{error}</p>}

          <p style={noteStyle}>
            予約確認や接続案内をお送りするため、受信可能なメールアドレスをご入力ください。
          </p>
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
  maxWidth: 640,
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

const formStyle: React.CSSProperties = {
  marginTop: 24,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: '#333333',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 48,
  padding: '0 14px',
  boxSizing: 'border-box',
  border: '1px solid #cccccc',
  borderRadius: 10,
  background: '#ffffff',
  fontSize: 16,
  color: '#222222',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 18,
  padding: '14px 18px',
  border: 'none',
  borderRadius: 999,
  background: '#2f5d50',
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 700,
  textAlign: 'center',
}

const errorStyle: React.CSSProperties = {
  marginTop: 16,
  color: '#b42318',
  background: '#fff4f2',
  border: '1px solid #f5c2bd',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
}

const noteStyle: React.CSSProperties = {
  marginTop: 16,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.7,
  color: '#666666',
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
