import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import FeedItem from '@/models/FeedItem'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { itemId } = await params
  await connectDB()

  const item = await FeedItem.findById(itemId).populate('feedId', 'title favicon siteUrl')
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  return NextResponse.json({ item })
}
