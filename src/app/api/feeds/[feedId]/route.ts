import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Feed from '@/models/Feed'
import User from '@/models/User'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { feedId } = await params
  await connectDB()

  const feed = await Feed.findById(feedId)
  if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 })

  return NextResponse.json({ feed })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { feedId } = await params
  await connectDB()

  await User.findByIdAndUpdate(session.user.id, {
    $pull: { followedFeeds: feedId },
  })

  return NextResponse.json({ success: true })
}
