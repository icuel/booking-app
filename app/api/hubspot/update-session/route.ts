import { NextResponse } from 'next/server'

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

export async function POST(req: Request) {
  try {
    const {
      email,
      consultTargetType,
      consultTargetRelationOther,
      subjectAgeBandTemp,
    } = await req.json()

    if (!email || !consultTargetType) {
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

    // 1. email から Contact を取得
    const getUrl =
      'https://api.hubapi.com/crm/v3/objects/contacts/' +
      encodeURIComponent(email) +
      '?idProperty=email&properties=age_band,subject_age_band_temp,consult_target_type,consult_target_relation_other'

    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (getRes.status === 404) {
      return NextResponse.json(
        { error: '該当するコンタクトが見つかりません' },
        { status: 404 },
      )
    }

    if (!getRes.ok) {
      const text = await getRes.text()
      console.error('HubSpot get contact error:', text)
      return NextResponse.json(
        { error: 'HubSpot contact lookup failed' },
        { status: 500 },
      )
    }

    const contactData = await getRes.json()
    const contactId = contactData.id
    const props = contactData.properties || {}

    const contactAgeBand: string | undefined = props.age_band

    // 2. 最終的な対象者年代を決める
    let finalSubjectAgeBand: string | undefined

    if (consultTargetType === 'SELF') {
      // 自分自身の相談なら、Contact.age_band を使う（なければ NO_ANSWER）
      finalSubjectAgeBand = contactAgeBand || 'NO_ANSWER'
    } else {
      // 家族・親族の相談なら、クライアントから送られてきた subjectAgeBandTemp を使う
      if (!subjectAgeBandTemp) {
        return NextResponse.json(
          { error: '相談対象者の年代が指定されていません' },
          { status: 400 },
        )
      }
      finalSubjectAgeBand = subjectAgeBandTemp
    }

    // 3. Contact を更新（consult_target_type / relation_other / subject_age_band_temp）
    const updateBody: any = {
      properties: {
        consult_target_type: consultTargetType,
        subject_age_band_temp: finalSubjectAgeBand,
      },
    }

    if (consultTargetRelationOther) {
      updateBody.properties.consult_target_relation_other = consultTargetRelationOther
    }

    const updateRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody),
      },
    )

    if (!updateRes.ok) {
      const text = await updateRes.text()
      console.error('HubSpot update contact error:', text)
      return NextResponse.json(
        { error: 'HubSpot contact update failed' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
