import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { VisitService } from '@/services/visitService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'demo-user'
    const { visitId } = await params

    const visit = await VisitService.findByVisitId(visitId, userId)

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }

    return NextResponse.json(visit)
  } catch (error) {
    console.error('Failed to fetch visit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visit' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'demo-user'
    const { visitId } = await params

    console.log('PUT /api/visits/[visitId] - visitId:', visitId, 'userId:', userId)

    const updates = await request.json()
    console.log('Updates:', JSON.stringify(updates, null, 2))

    let visit;

    // If the update contains an extraction field, use the specialized extraction update method
    if (updates.extraction && !updates.manualUpdate) {
      visit = await VisitService.updateVisitFromExtraction(visitId, userId, updates.extraction)
    } else {
      visit = await VisitService.updateVisit(visitId, userId, updates)
    }

    if (!visit) {
      console.log('Visit not found for visitId:', visitId, 'userId:', userId)
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }

    console.log('Visit updated successfully')
    return NextResponse.json(visit)
  } catch (error) {
    console.error('Failed to update visit:', error)
    return NextResponse.json(
      { error: 'Failed to update visit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'demo-user'
    const { visitId } = await params

    const success = await VisitService.deleteVisit(visitId, userId)

    if (!success) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete visit:', error)
    return NextResponse.json(
      { error: 'Failed to delete visit' },
      { status: 500 }
    )
  }
}