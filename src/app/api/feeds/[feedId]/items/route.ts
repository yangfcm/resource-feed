import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import FeedItem from '@/models/FeedItem'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { feedId } = await params
  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') ?? '0', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  await connectDB()

  const [items, total] = await Promise.all([
    FeedItem.find({ feedId })
      .sort({ publishedAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean(),
    FeedItem.countDocuments({ feedId }),
  ])

  return NextResponse.json({
    items,
    total,
    hasMore: (page + 1) * limit < total,
  })
}
