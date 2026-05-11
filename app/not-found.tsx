import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={serviceNameStyle}>自立暮らしコンシェルジュ</div>
          <div style={serviceSubStyle}>オンライン相談予約</div>
        </header>

        <section style={cardStyle}>
          <h1 style={titleStyle}>ページが見つかりませんでした</h1>

          <p style={descriptionStyle}>
            アクセスされたページは、URLが変更されたか、現在利用できない可能性があります。
          </p>

          <p style={descriptionStyle}>
            予約手続きを進める場合は、下のボタンから最初の画面へお進みください。
          </p>

          <Link href="/start" style={primaryButtonStyle}>
            予約手続きに進む
          </Link>

          <div style={noticeBoxStyle}>
            <p style={noticeTitleStyle}>認証メールのリンクから開いた場合</p>
            <p style={noticeTextStyle}>
              認証メールのリンクは、一定時間が経過すると使えなくなる場合があります。
              その場合は、最初からやり直してください。
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

const primaryButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 24,
  padding: '14px 18px',
  borderRadius: 999,
  background: '#2f5d50',
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 700,
  textAlign: 'center',
  textDecoration: 'none',
  boxSizing: 'border-box',
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
}
