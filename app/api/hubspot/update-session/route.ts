import { NextResponse } from 'next/server'

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'

const PIPELINE_ID =
  process.env.HUBSPOT_TICKET_PIPELINE_ID || '0'
const STAGE_PENDING =
  process.env.HUBSPOT_TICKET_STAGE_PENDING || '1'

const SUBJECT_TARGET_TYPE_PROP =
  process.env.HUBSPOT_SUBJECT_TARGET_TYPE_PROP || 'subject_target_type'
const SUBJECT_AGE_BAND_PROP =
  process.env.HUBSPOT_SUBJECT_AGE_BAND_PROP || 'subject_age_band'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = body?.email as string | undefined
    const consultTargetType = body?.consultTargetType as string | undefined
    const subjectAgeBand = body?.subjectAgeBand as string | undefined

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'email が指定されていません' },
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

    // 1. email から Contact を取得（既存前提）
    const contactRes = await fetch(
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

    if (contactRes.status === 404) {
      return NextResponse.json(
        { ok: false, error: '該当するコンタクトが見つかりませんでした' },
        { status: 404 },
      )
    }

    if (!contactRes.ok) {
      const text = await contactRes.text()
      console.error('HubSpot contact lookup error:', contactRes.status, text)
      return NextResponse.json(
        { ok: false, error: 'HubSpot からコンタクト取得に失敗しました' },
        { status: 500 },
      )
    }

    const contact = await contactRes.json()
    const contactId = contact.id as string

    // 2. Ticket を「予約未確定」で作成
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
                  associationTypeId: 16,
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
    console.error('update-session error', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}
