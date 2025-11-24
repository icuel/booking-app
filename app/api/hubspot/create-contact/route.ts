import { NextResponse } from 'next/server'

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'

const PIPELINE_ID =
  process.env.HUBSPOT_TICKET_PIPELINE_ID || '0' // 要自ポータル確認
const STAGE_PENDING =
  process.env.HUBSPOT_TICKET_STAGE_PENDING || '1' // 「予約未確定」ステージIDに合わせる

const SUBJECT_TARGET_TYPE_PROP =
  process.env.HUBSPOT_SUBJECT_TARGET_TYPE_PROP || 'subject_target_type'
const SUBJECT_AGE_BAND_PROP =
  process.env.HUBSPOT_SUBJECT_AGE_BAND_PROP || 'subject_age_band'
const KANA_FULL_NAME_PROP =
  process.env.HUBSPOT_KANA_FULL_NAME_PROP || 'kana_full_name'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = body?.email as string | undefined
    const lastName = body?.lastName as string | undefined
    const firstName = body?.firstName as string | undefined
    const kanaFullName = body?.kanaFullName as string | undefined
    const postalCode = body?.postalCode as string | undefined
    const consultTargetType = body?.consultTargetType as string | undefined
    const subjectAgeBand = body?.subjectAgeBand as string | undefined

    if (!email || !lastName || !firstName || !kanaFullName || !postalCode) {
      return NextResponse.json(
        {
          ok: false,
          error: 'email, 姓, 名, カナ氏名, 郵便番号 は必須です',
        },
        { status: 400 },
      )
    }

    if (!consultTargetType || !subjectAgeBand) {
      return NextResponse.json(
        {
          ok: false,
          error: 'consultTargetType と subjectAgeBand は必須です',
        },
        { status: 400 },
      )
    }

    const token = process.env.HUBSPOT_ACCESS_TOKEN
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'HUBSPOT_ACCESS_TOKEN が設定されていません' },
        { status: 500 },
      )
    }

    // 1. email で Contact を検索（あれば再利用）
    let contactId: string | null = null

    {
      const res = await fetch(
        `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${encodeURIComponent(
          email,
        )}?idProperty=email`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (res.status === 404) {
        contactId = null
      } else if (!res.ok) {
        const text = await res.text()
        console.error('HubSpot contact lookup error:', res.status, text)
        return NextResponse.json(
          { ok: false, error: 'HubSpot からコンタクト取得に失敗しました' },
          { status: 500 },
        )
      } else {
        const data = await res.json()
        contactId = data.id
      }
    }

    // 2. なければ Contact を作成
    if (!contactId) {
      const createRes = await fetch(
        `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              email,
              firstname: firstName,
              lastname: lastName,
              zip: postalCode,
              [KANA_FULL_NAME_PROP]: kanaFullName,
            },
          }),
        },
      )

      if (!createRes.ok) {
        const text = await createRes.text()
        console.error('HubSpot contact create error:', createRes.status, text)
        return NextResponse.json(
          { ok: false, error: 'HubSpot へのコンタクト作成に失敗しました' },
          { status: 500 },
        )
      }

      const created = await createRes.json()
      contactId = created.id
    }

    if (!contactId) {
      return NextResponse.json(
        { ok: false, error: 'コンタクトIDを取得できませんでした' },
        { status: 500 },
      )
    }

    // 3. Ticket を「予約未確定」ステージで作成
    const subject = '仮予約 - オンライン相談'

    const ticketRes = await fetch(
      `${HUBSPOT_BASE_URL}/crm/v3/objects/tickets`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            hs_pipeline: PIPELINE_ID,
            hs_pipeline_stage: STAGE_PENDING,
            subject,
            [SUBJECT_TARGET_TYPE_PROP]: consultTargetType,
            [SUBJECT_AGE_BAND_PROP]: subjectAgeBand,
          },
          associations: [
            {
              to: { id: contactId },
              types: [
                {
                  associationCategory: 'HUBSPOT_DEFINED',
                  associationTypeId: 16, // Ticket↔Contact の標準。念のため自ポータルで確認推奨
                },
              ],
            },
          ],
        }),
      },
    )

    if (!ticketRes.ok) {
      const text = await ticketRes.text()
      console.error('HubSpot ticket create error:', ticketRes.status, text)
      return NextResponse.json(
        { ok: false, error: 'HubSpot へのチケット作成に失敗しました' },
        { status: 500 },
      )
    }

    const ticket = await ticketRes.json()

    return NextResponse.json({
      ok: true,
      contactId,
      ticketId: ticket.id,
      hsTicketId: ticket.properties?.hs_ticket_id ?? null,
    })
  } catch (err: any) {
    console.error('create-contact error', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}
