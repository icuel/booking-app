// app/api/hubspot/lookup/route.ts
import { NextResponse } from 'next/server'

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'email が指定されていません' },
        { status: 400 },
      )
    }

    if (!HUBSPOT_TOKEN) {
      return NextResponse.json(
        { error: 'HUBSPOT_ACCESS_TOKEN が設定されていません' },
        { status: 500 },
      )
    }

    const url =
      'https://api.hubapi.com/crm/v3/objects/contacts/' +
      encodeURIComponent(email) +
      '?idProperty=email'

    const hsRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    // 404 = 該当メールのコンタクトなし
    if (hsRes.status === 404) {
      return NextResponse.json({ exists: false })
    }

    if (!hsRes.ok) {
      const text = await hsRes.text()
      console.error('HubSpot lookup error:', text)
      return NextResponse.json(
        { error: 'HubSpot lookup failed' },
        { status: 500 },
      )
    }

    const data = await hsRes.json()

    return NextResponse.json({
      exists: true,
      id: data.id,
      properties: data.properties ?? {},
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
