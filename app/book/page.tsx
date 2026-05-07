'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

declare global {
  interface Window {
    SimplybookWidget?: any
  }
}

export default function BookPage() {
  const router = useRouter()
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [hsTicketId, setHsTicketId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('予約画面を読み込んでいます。')

  useEffect(() => {
    let scriptEl: HTMLScriptElement | null = null

    const initWidget = (email: string, ticketId: string) => {
      if (!window.SimplybookWidget) {
        setError('予約画面の読み込みに失敗しました。時間をおいて再度お試しください。')
        return
      }

      setLoadingMessage('')

      new window.SimplybookWidget({
        widget_type: 'iframe',
        url: 'https://icuel.simplybook.asia',
        theme: 'adacompliant',
        theme_settings: {
          timeline_hide_unavailable: '1',
          hide_past_days: '0',
          timeline_show_end_time: '0',
          timeline_modern_display: 'as_slots',
          display_item_mode: 'block',
          sb_review_image: '',
          hide_img_mode: '0',
          show_sidebar: '1',
        },
        timeline: 'modern_week',
        datepicker: 'inline_datepicker',
        is_rtl: false,
        app_config: {
          // 既存のSimplyBook側セッションをクリアし、前回入力情報の影響を避ける
          clear_session: 1,
          allow_switch_to_ada: 0,
          predefined: {
            client: {
              // Supabaseで認証済みのメールアドレスをSimplyBookへ渡す
              email,

              // HubSpot項目数節約と一意性担保のため、Ticket IDを名前欄に渡す
              // SimplyBook側ではユーザーから見えにくい前提で運用
              name: ticketId,
            },
          },
        },
      })
    }

    const run = async () => {
      setError(null)
      setLoadingMessage('予約画面を読み込んでいます。')

      const { data } = await supabase.auth.getSession()
      const email = data.session?.user.email ?? null

      if (!email) {
        router.replace('/start')
        return
      }

      setSessionEmail(email)

      const storedTicketId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('currentHsTicketId')
          : null

      if (!storedTicketId) {
        setLoadingMessage('')
        setError(
          '予約手続きに必要な情報が見つかりませんでした。メール認証を行ったブラウザと異なるブラウザで開いた場合や、途中でブラウザの保存情報が削除された場合に発生することがあります。',
        )
        return
      }

      setHsTicketId(storedTicketId)

      if (window.SimplybookWidget) {
        initWidget(email, storedTicketId)
        return
      }

      scriptEl = document.createElement('script')
      scriptEl.src = 'https://widget.simplybook.asia/v2/widget/widget.js'
      scriptEl.onload = () => initWidget(email, storedTicketId)
      scriptEl.onerror = () => {
        setLoadingMessage('')
        setError('予約画面の読み込みに失敗しました。通信環境をご確認のうえ、再度お試しください。')
      }

      document.body.appendChild(scriptEl)
    }

    run()

    return () => {
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl)
      }
    }
  }, [router])

  const handleRestart = async () => {
    if (typeof window !== 'undefined') {
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
          <h1 style={titleStyle}>相談日時の選択</h1>

          <p style={descriptionStyle}>
            表示されている候補から、ご都合のよい日時をお選びください。
          </p>

          {sessionEmail && (
            <div style={infoBoxStyle}>
              <p style={infoTitleStyle}>予約確認メールの送信先</p>
              <p style={infoTextStyle}>
                予約内容の確認メールは <strong>{sessionEmail}</strong> 宛に送信されます。
              </p>
              <p style={infoTextStyle}>
                メールアドレスを変更したい場合は、最初からやり直して別のメールアドレスで認証してください。
              </p>
            </div>
          )}

          <div style={noticeBoxStyle}>
            <p style={noticeTitleStyle}>ご利用時の注意</p>
            <p style={noticeTextStyle}>
              メール認証を行ったブラウザと同じブラウザで手続きを進めてください。
              別の端末や別のブラウザで開いた場合、予約手続きに必要な情報を引き継げないことがあります。
            </p>
          </div>

          {loadingMessage && !error && (
            <p style={loadingStyle}>{loadingMessage}</p>
          )}

          {error && (
            <div style={errorBoxStyle}>
              <p style={errorTitleStyle}>予約画面を表示できませんでした</p>
              <p style={errorTextStyle}>{error}</p>
              <button type="button" onClick={handleRestart} style={secondaryButtonStyle}>
                最初からやり直す
              </button>
            </div>
          )}

          {hsTicketId && !error && (
            <div style={widgetWrapStyle}>
              <div id="sb-booking-widget" />
            </div>
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
  maxWidth: 760,
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

const noticeBoxStyle: React.CSSProperties = {
  marginTop: 16,
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

const loadingStyle: React.CSSProperties = {
  marginTop: 20,
  fontSize: 14,
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

const widgetWrapStyle: React.CSSProperties = {
  marginTop: 24,
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
