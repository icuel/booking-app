'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function SessionPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  const [consultTargetType, setConsultTargetType] = useState<string>('')
  const [consultTargetRelationOther, setConsultTargetRelationOther] = useState<string>('')
  const [targetAgeBand, setTargetAgeBand] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionEmail = data.session?.user.email ?? null
      if (!sessionEmail) {
        setError('認証情報が見つかりません。最初からやり直してください。')
        return
      }
      setEmail(sessionEmail)
    }
    run()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('メールアドレスが取得できません。最初からやり直してください。')
      return
    }

    if (!consultTargetType) {
      setError('今回のご相談がどなたについてかを選択してください')
      return
    }

    // SELF 以外のときは対象者年代が必須
    let subjectAgeBandTemp = ''
    if (consultTargetType === 'SELF') {
      // SELF の場合、対象者年代はサーバー側で age_band を使って決める
      subjectAgeBandTemp = '' // 仮。サーバー側で埋めるので空でもOKにする
    } else {
      if (!targetAgeBand) {
        setError('相談対象の方の年代を選択してください（分からない場合は「分からない」を選択）')
        return
      }
      subjectAgeBandTemp = targetAgeBand
    }

    setLoading(true)

    try {
      const res = await fetch('/api/hubspot/update-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          consultTargetType,
          consultTargetRelationOther,
          subjectAgeBandTemp,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'セッション情報の更新に失敗しました')
      }

      // 更新完了 → 予約画面へ
      router.replace('/book')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!email && !error) {
    return (
      <div style={{ padding: 24 }}>
        <p>認証情報を確認しています…</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1>今回のご相談について</h1>
      <p>今回のご相談がどなたについてか、およその年代とあわせて教えてください。</p>

      {email && (
        <p style={{ marginBottom: 16 }}>
          認証済みメールアドレス：<strong>{email}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {/* 誰の相談か */}
        <div style={{ marginBottom: 16 }}>
          <p>今回のご相談は、どなたについての内容ですか？<span style={{ color: 'red' }}>※</span></p>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="SELF"
                checked={consultTargetType === 'SELF'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              自分自身
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="SPOUSE"
                checked={consultTargetType === 'SPOUSE'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              配偶者・パートナー
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="PARENT"
                checked={consultTargetType === 'PARENT'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              親（実父母・義父母）
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="GRANDPARENT"
                checked={consultTargetType === 'GRANDPARENT'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              祖父母
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="CHILD"
                checked={consultTargetType === 'CHILD'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              子
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="consultTarget"
                value="OTHER_RELATIVE"
                checked={consultTargetType === 'OTHER_RELATIVE'}
                onChange={(e) => setConsultTargetType(e.target.value)}
              />{' '}
              その他の親族
            </label>
          </div>

          {consultTargetType === 'OTHER_RELATIVE' && (
            <div style={{ marginTop: 8 }}>
              <label>
                差し支えなければ、その方とのご関係を教えてください（任意）<br />
                <input
                  type="text"
                  value={consultTargetRelationOther}
                  onChange={(e) => setConsultTargetRelationOther(e.target.value)}
                  placeholder="例：叔父、いとこ、兄 など"
                  style={{ padding: 8, width: '100%', boxSizing: 'border-box' }}
                />
              </label>
            </div>
          )}
        </div>

        {/* 相談対象者の年代（SELF 以外の場合のみ表示） */}
        {consultTargetType && consultTargetType !== 'SELF' && (
          <div style={{ marginBottom: 16 }}>
            <p>その方のおおよその年代をお選びください。</p>
            <div>
              <label>
                <input
                  type="radio"
                  name="targetAgeBand"
                  value="UNDER_59"
                  checked={targetAgeBand === 'UNDER_59'}
                  onChange={(e) => setTargetAgeBand(e.target.value)}
                />{' '}
                〜59歳
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="targetAgeBand"
                  value="AGE_60_64"
                  checked={targetAgeBand === 'AGE_60_64'}
                  onChange={(e) => setTargetAgeBand(e.target.value)}
                />{' '}
                60〜64歳
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="targetAgeBand"
                  value="AGE_65_69"
                  checked={targetAgeBand === 'AGE_65_69'}
                  onChange={(e) => setTargetAgeBand(e.target.value)}
                />{' '}
                65〜69歳
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="targetAgeBand"
                  value="AGE_70_74"
                  checked={targetAgeBand === 'AGE_70_74'}
                  onChange={(e) => setTargetAgeBand(e.target.value)}
                />{' '}
                70〜74歳
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="targetAgeBand"
                  value="AGE_75_79"
                  checked={targetAgeBand === 'AGE_75_79'}
                  onChange={(e) => setTargetAgeBand(e.target.value)}
                />{' '}
                75〜79歳
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="targetAgeBand"
                  value="AGE_80_PLUS"
                  checked={targetAgeBand === 'AGE_80_PLUS'}
                  onChange={(e) => setTargetAgeBand(e.target.value)}
                />{' '}
                80歳以上
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="targetAgeBand"
                  value="NO_ANSWER"
                  checked={targetAgeBand === 'NO_ANSWER'}
                  onChange={(e) => setTargetAgeBand(e.target.value)}
                />{' '}
                分からない
              </label>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? '送信中…' : '予約に進む'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
