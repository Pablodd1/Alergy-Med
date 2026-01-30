import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { VisitService } from '@/services/visitService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'demo-user'

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const result = await VisitService.listVisits(userId, page, limit, status || undefined)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'demo-user'

    const { patientAlias, chiefComplaint, sources = [] } = await request.json()

    if (!patientAlias || !chiefComplaint) {
      return NextResponse.json(
        { error: 'Patient alias and chief complaint are required' },
        { status: 400 }
      )
    }

    const visitId = `visit_${Date.now()}`

    console.log('Creating visit with:', { userId, visitId, patientAlias, chiefComplaint })

    const visit = await VisitService.createVisit({
      userId,
      visitId,
      patientAlias,
      chiefComplaint,
      sources
    })

    console.log('Visit created successfully:', { visitId, _id: (visit as any)._id })

    return NextResponse.json({ visit, visitId })
  } catch (error) {
    console.error('Failed to create visit:', error)
    return NextResponse.json(
      { error: 'Failed to create visit' },
      { status: 500 }
    )
  }
}