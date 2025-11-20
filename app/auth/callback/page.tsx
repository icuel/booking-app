'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('認証処理中です…')

  useEffect(() => {
    // 1回セッション取得してみる（すでにログイン済みなら即リダイレクト）
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const email = data.session.user.email
        if (email && typeof window !== 'undefined') {
          localStorage.setItem('authedEmail', email)
        }
        router.replace('/book')
      }
    })

    // その上で、authイベントも待ち受ける
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const email = session.user.email
        if (email && typeof window !== 'undefined') {
          localStorage.setItem('authedEmail', email)
        }
        router.replace('/book')
      } else if (event === 'SIGNED_OUT') {
        setMessage('認証に失敗しました。最初からやり直してください。')
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [router])

  return (
    <div style={{ padding: 24 }}>
      <p>{message}</p>
    </div>
  )
}
