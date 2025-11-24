'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function SessionPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  const [consultTargetType, setConsultTargetType] = useState<string>('') // 誰の相談か
  const [subjectAgeBand, setSubjectAgeBand] = useState<string>('') // 相談対象者の年代（SELF の場合もここ）

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

    if (!subjectAgeBand) {
      setError(
        '相談の対象となる方の年代を選択してください（ご自身のご相談の場合は、ご自身の年代を選んでください）',
      )
      return
    }

    setLoading(true)

    try {
      // ★ここで「既存コンタクト向けの初回 Ticket」を作成する API に変更
      //   サーバー側:
      //   - email で Contact を検索
      //   - Ticket を「予約未確定」ステージで作成
      //   - Ticket.subject_target_type / subject_age_band に以下を保存
      const res = await fetch('/api/hubspot/update-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          consultTargetType,
          subjectAgeBand,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'セッション情報の登録に失敗しました')
      }

      // 必要に応じて Ticket ID や hs_ticket_id を保存して /book で使う
      // 例:
      // if (data.ticketId) {
      //   localStorage.setItem('currentTicketId', data.ticketId)
      // }

      // 登録完了 → 予約画面へ
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
      <p>今回のご相談がどなたについてか、おおよその年代とあわせて教えてください。</p>

      {email && (
        <p style={{ marginBottom: 16 }}>
          認証済みメールアドレス：<strong>{email}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {/* 誰の相談か */}
        <div style={{ marginBottom: 16 }}>
          <p>
            今回のご相談は、どなたについての内容ですか？
            <span style={{ color: 'red' }}>※</span>
          </p>
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

          {/* ★「その他の親族」の自由記述は削除 */}
        </div>

        {/* 相談対象者の年代（SELF の場合も毎回聞く） */}
        <div style={{ marginBottom: 16 }}>
          <p>
            相談の対象となる方のおおよその年代をお選びください。
            <br />
            <span style={{ fontSize: 12 }}>
              ※自分自身のご相談の場合は、ご自身の年代をお選びください。
            </span>
          </p>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="UNDER_59"
                checked={subjectAgeBand === 'UNDER_59'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              〜59歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_60_64"
                checked={subjectAgeBand === 'AGE_60_64'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              60〜64歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_65_69"
                checked={subjectAgeBand === 'AGE_65_69'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              65〜69歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_70_74"
                checked={subjectAgeBand === 'AGE_70_74'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              70〜74歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_75_79"
                checked={subjectAgeBand === 'AGE_75_79'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              75〜79歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_80_84"
                checked={subjectAgeBand === 'AGE_80_84'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              80〜84歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_85_89"
                checked={subjectAgeBand === 'AGE_85_89'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              85〜89歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_90_94"
                checked={subjectAgeBand === 'AGE_90_94'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              90〜94歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_95_99"
                checked={subjectAgeBand === 'AGE_95_99'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              95〜99歳
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="AGE_100_PLUS"
                checked={subjectAgeBand === 'AGE_100_PLUS'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              100歳以上
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="subjectAgeBand"
                value="NO_ANSWER"
                checked={subjectAgeBand === 'NO_ANSWER'}
                onChange={(e) => setSubjectAgeBand(e.target.value)}
              />{' '}
              分からない・回答しない
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? '送信中…' : '予約に進む'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  )
}
