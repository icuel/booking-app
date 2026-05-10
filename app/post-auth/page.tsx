'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type AuthStatus = 'loading' | 'error'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [message, setMessage] = useState('メールアドレスを確認しています。')

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        setStatus('error')
        setMessage(
          '認証に失敗しました。認証リンクの有効期限が切れている、またはすでに使用済みの可能性があります。',
        )
        return
      }

      const email = data.session.user.email

      if (email && typeof window !== 'undefined') {
        localStorage.setItem('authedEmail', email)
      }

      router.replace('/post-auth')
    }

    run()
  }, [router])

  const handleRestart = async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('authedEmail')
      window.localStorage.removeItem('currentHsTicketId')
    }

    await supabase.auth.signOut()
    router.replace('/start')
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={serviceNameStyle}>自立暮らしコンシェルジュ</div>
          <div style={serviceSubStyle}>オンライン相談予約</div>
        </header>

        <section style={cardStyle}>
          {status === 'loading' && (
            <>
              <h1 style={titleStyle}>認証処理中です</h1>
              <p style={descriptionStyle}>
                メールアドレスの確認を行っています。
                処理が完了すると、予約手続きの続きに自動で進みます。
              </p>

              <div style={noticeBoxStyle}>
                <p style={noticeTitleStyle}>画面を閉じずにお待ちください</p>
                <p style={noticeTextStyle}>
                  この画面が長時間変わらない場合は、認証リンクの有効期限切れや通信状況の影響が考えられます。
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 style={titleStyle}>認証できませんでした</h1>

              <div style={errorBoxStyle}>
                <p style={errorTitleStyle}>認証リンクを確認できませんでした</p>
                <p style={errorTextStyle}>{message}</p>
              </div>

              <div style={noticeBoxStyle}>
                <p style={noticeTitleStyle}>考えられる原因</p>
                <p style={noticeTextStyle}>
                  認証メールのリンクは、一定時間が経過すると使えなくなる場合があります。
                  また、すでに一度使用したリンクは再利用できない場合があります。
                </p>
                <p style={noticeTextStyle}>
                  メールアドレスを入力した端末・ブラウザと異なる環境で開いた場合、
                  途中まで入力した情報を引き継げないことがあります。
                </p>
              </div>

              <button type="button" onClick={handleRestart} style={buttonStyle}>
                最初からやり直す
              </button>
            </>
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
  display: 'inline-block',
  marginTop: 20,
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
