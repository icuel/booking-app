// app/api/hubspot/create-contact/route.ts
import { NextResponse } from 'next/server'

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

export async function POST(req: Request) {
  try {
    const { email, name, postalCode } = await req.json()

    if (!email || !name || !postalCode) {
      return NextResponse.json(
        { error: 'email / name / postalCode は必須です' },
        { status: 400 },
      )
    }

    if (!HUBSPOT_TOKEN) {
      return NextResponse.json(
        { error: 'HUBSPOT_ACCESS_TOKEN が設定されていません' },
        { status: 500 },
      )
    }

    // 氏名は雑に firstname に全部入れる例
    // postalCode は HubSpot デフォルトの zip プロパティに入れる
    const body = {
      properties: {
        email,
        firstname: name,
        zip: postalCode,
      },
    }

    const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!hsRes.ok) {
      const text = await hsRes.text()
      console.error('HubSpot create error:', text)
      return NextResponse.json(
        { error: 'HubSpot create failed' },
        { status: 500 },
      )
    }

    const data = await hsRes.json()

    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
