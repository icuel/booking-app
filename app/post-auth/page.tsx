'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Status = 'checking' | 'error'

export default function PostAuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [message, setMessage] = useState('会員情報を確認しています…')

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionEmail = data.session?.user.email ?? null

      if (!sessionEmail) {
        setStatus('error')
        setMessage('認証情報が見つかりません。最初からやり直してください。')
        return
      }

      try {
        const res = await fetch('/api/hubspot/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sessionEmail }),
        })

        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || 'HubSpot への問い合わせに失敗しました')
        }

        if (json.exists) {
          // 既存会員 → そのまま予約画面へ
          router.replace('/book')
        } else {
          // 新規会員 → onboard へ
          router.replace('/onboard')
        }
      } catch (err: any) {
        console.error(err)
        setStatus('error')
        setMessage(err.message || 'エラーが発生しました。')
      }
    }

    run()
  }, [router])

  return (
    <div style={{ padding: 24 }}>
      <p>{message}</p>
    </div>
  )
}
