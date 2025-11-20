'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('認証処理中です…')

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        setMessage('認証に失敗しました。最初からやり直してください。')
        return
      }

      const email = data.session.user.email
      if (email && typeof window !== 'undefined') {
        localStorage.setItem('authedEmail', email)
      }

      // 認証OK → HubSpot判定用のページへ
      router.replace('/post-auth')
    }

    run()
  }, [router])

  return (
    <div style={{ padding: 24 }}>
      <p>{message}</p>
    </div>
  )
}
