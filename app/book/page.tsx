'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

declare global {
  interface Window {
    SimplybookWidget?: any
  }
}

// SimplyBook のカスタムフィールド「HubSpot TicketID」の内部名
const HUBSPOT_TICKET_FIELD_ID = '2999e9ec41b1efbd7b9f0516a2858c79'

export default function BookPage() {
  const router = useRouter()
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [hsTicketId, setHsTicketId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let scriptEl: HTMLScriptElement | null = null

    const initWidget = (email: string, ticketId: string | null) => {
      if (!window.SimplybookWidget) return

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
          clear_session: 0,
          allow_switch_to_ada: 0,
          predefined: {
            // ここで Supabase の認証済みメールアドレスを SimplyBook に渡す
            client: {
              email,
            },
            // カスタムフィールドに HubSpot TicketID を埋め込む（値があれば）
            ...(ticketId
              ? {
                  customfields: {
                    [HUBSPOT_TICKET_FIELD_ID]: ticketId,
                  },
                }
              : {}),
          },
        },
      })
    }

    const run = async () => {
      // 1. Supabase セッションからメールアドレス取得
      const { data } = await supabase.auth.getSession()
      const email = data.session?.user.email ?? null

      if (!email) {
        router.replace('/start')
        return
      }

      setSessionEmail(email)

      // 2. /onboard or /session で保存した hs_ticket_id を取得
      const storedTicketId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('currentHsTicketId')
          : null

      if (!storedTicketId) {
        setError(
          '予約情報が見つかりませんでした。一度はじめからやり直してください。',
        )
        return
      }

      setHsTicketId(storedTicketId)

      // 3. SimplyBook のウィジェットスクリプトを読み込んで初期化
      if (window.SimplybookWidget) {
        // すでに読み込み済みならそのまま初期化
        initWidget(email, storedTicketId)
        return
      }

      scriptEl = document.createElement('script')
      scriptEl.src = '//widget.simplybook.asia/v2/widget/widget.js'
      scriptEl.onload = () => initWidget(email, storedTicketId)
      document.body.appendChild(scriptEl)
    }

    run()

    // クリーンアップ（ページ離脱時にスクリプトタグを削除）
    return () => {
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl)
      }
    }
  }, [router])

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>相談予約</h1>

      {sessionEmail && (
        <p style={{ marginBottom: 12 }}>
          予約内容の確認メールは <strong>{sessionEmail}</strong> にお送りします。
          <br />
          メールアドレスを変更したい場合は、一度ログアウトして別のメールアドレスで再度認証してください。
        </p>
      )}

      {hsTicketId && (
        <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          （内部管理用 Ticket ID: {hsTicketId}）
        </p>
      )}

      {error && (
        <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>
      )}

      {/* ウィジェット本体はスクリプトがこのコンテナ内に iframe を挿入します */}
      <div id="sb-booking-widget" />

      {/* 
        メモ：
        widget_type: 'iframe' の場合、iframe 内部のフォーム（名前／電話／メール）は
        このコンポーネント側の CSS からは直接隠せません（クロスオリジンのため）。
        そのため「完全に非表示」にしたい場合は、SimplyBook 管理画面側で
        クライアントフィールドの表示／必須設定を調整する必要があります。
        
        もし将来 SimplyBook 側の設定を「iframe ではない埋め込み」に変えた場合には、
        以下のグローバルCSSで .sb-client-* クラスを非表示にすることもできます。
      */}
      <style jsx global>{`
        /* 非iframe型ウィジェット用の予備CSS（現在の iframe には効きません） */
        .sb-client-email,
        .sb-client-name,
        .sb-client-phone {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
