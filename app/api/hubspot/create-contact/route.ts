// app/api/hubspot/create-contact/route.ts
import { NextResponse } from 'next/server'

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

export async function POST(req: Request) {
  try {
    const {
      email,
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      postalCode,
    } = await req.json()

    if (!email || !lastName || !firstName || !lastNameKana || !firstNameKana || !postalCode) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 },
      )
    }

    if (!HUBSPOT_TOKEN) {
      return NextResponse.json(
        { error: 'HUBSPOT_ACCESS_TOKEN が設定されていません' },
        { status: 500 },
      )
    }

    const body = {
      properties: {
        email,
        lastname: lastName,          // HubSpot標準「姓」
        firstname: firstName,        // HubSpot標準「名」
        zip: postalCode,             // 郵便番号（標準プロパティ）
        lastname_kana: lastNameKana, // カスタムプロパティ（ステップ0で作成）
        firstname_kana: firstNameKana,
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
