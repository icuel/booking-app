'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

declare global {
  interface Window {
    SimplybookWidget: any
  }
}

export default function BookPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // 認証済みか確認
      const { data } = await supabase.auth.getSession()
      const sessionEmail = data.session?.user.email ?? null

      if (!sessionEmail) {
        router.replace('/start')
        return
      }

      // SimplyBook のスクリプトを読み込む
      const script = document.createElement('script')
      script.src = '//widget.simplybook.asia/v2/widget/widget.js'
      script.onload = () => {
        // メールアドレスを事前入力として埋め込む
        new window.SimplybookWidget({
        "widget_type":"iframe",
        "url":"https:\/\/icuel.simplybook.asia",
        "theme":"adacompliant",
        "theme_settings":{"timeline_hide_unavailable":"1","hide_past_days":"0","timeline_show_end_time":"0","timeline_modern_display":"as_slots","display_item_mode":"block","sb_review_image":"","hide_img_mode":"0","show_sidebar":"1"},
        "timeline":"modern_week",
        "datepicker":"inline_datepicker",
        "is_rtl":false,
        "app_config":{
          "clear_session":0,
          "allow_switch_to_ada":0,
          "predefined": {
            "client": {
              "email": sessionEmail
            }
          }
        }
        })
      }
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }

    checkAuthAndLoad()
  }, [router])

  return (
    <div style={{ padding: 24 }}>
      <h1>相談予約</h1>
      <p>メール認証済みのアカウントで予約を行います。</p>
      {/* ウィジェット本体はスクリプトが自動でページ内に挿入します */}
    </div>
  )
}
