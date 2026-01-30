import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { VisitService } from '@/services/visitService'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'demo-user'

    const statistics = await VisitService.getVisitStatistics(userId)

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Failed to fetch visit statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visit statistics' },
      { status: 500 }
    )
  }
}