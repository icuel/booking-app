import { NextResponse } from 'next/server'

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = body?.email as string | undefined

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'email が指定されていません' },
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
      // 見つからない＝新規
      return NextResponse.json({ ok: true, exists: false })
    }

    if (!res.ok) {
      const text = await res.text()
      console.error('HubSpot lookup error:', res.status, text)
      return NextResponse.json(
        { ok: false, error: 'HubSpot からの取得に失敗しました' },
        { status: 500 },
      )
    }

    const data = await res.json()

    return NextResponse.json({
      ok: true,
      exists: true,
      id: data.id,
      properties: data.properties ?? {},
    })
  } catch (err: any) {
    console.error('lookup error', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}
