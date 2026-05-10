'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Status = 'checking' | 'error'

export default function PostAuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [message, setMessage] = useState('会員情報を確認しています。')

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession()
      const sessionEmail = data.session?.user.email ?? null

      if (error || !sessionEmail) {
        setStatus('error')
        setMessage('認証情報を確認できませんでした。お手数ですが、最初からやり直してください。')
        return
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('authedEmail', sessionEmail)
      }

      try {
        const res = await fetch('/api/hubspot/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sessionEmail }),
        })

        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || '会員情報の確認に失敗しました。')
        }

        if (json.exists) {
          // 既存会員 → 今回の相談対象を聞く画面へ
          router.replace('/session')
        } else {
          // 新規会員 → 基本情報＋相談対象を聞く画面へ
          router.replace('/onboard')
        }
      } catch (err: any) {
        console.error(err)
        setStatus('error')
        setMessage(err.message || '会員情報の確認中にエラーが発生しました。')
      }
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
          {status === 'checking' && (
            <>
              <h1 style={titleStyle}>予約手続きの準備中です</h1>

              <p style={descriptionStyle}>
                メールアドレスの確認が完了しました。
                続けて、会員情報を確認しています。
              </p>

              <div style={noticeBoxStyle}>
                <p style={noticeTitleStyle}>画面を閉じずにお待ちください</p>
                <p style={noticeTextStyle}>{message}</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 style={titleStyle}>手続きを続けられませんでした</h1>

              <div style={errorBoxStyle}>
                <p style={errorTitleStyle}>会員情報を確認できませんでした</p>
                <p style={errorTextStyle}>{message}</p>
              </div>

              <div style={noticeBoxStyle}>
                <p style={noticeTitleStyle}>考えられる原因</p>
                <p style={noticeTextStyle}>
                  通信状況の影響や、認証情報の有効期限切れにより、手続きを続けられない場合があります。
                </p>
                <p style={noticeTextStyle}>
                  また、メール認証を行った端末・ブラウザと異なる環境で開いた場合、
                  途中までの情報を引き継げないことがあります。
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
