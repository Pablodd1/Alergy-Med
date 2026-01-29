import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { VisitService } from '@/services/visitService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const statistics = await VisitService.getVisitStatistics(session.user.id)
    
    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Failed to fetch visit statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visit statistics' },
      { status: 500 }
    )
  }
}