import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { fetchAndParseFeed } from '@/lib/rss'
import Feed from '@/models/Feed'
import FeedItem from '@/models/FeedItem'

export const runtime = 'nodejs'

export async function POST(
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

  const parsed = await fetchAndParseFeed(feed.rssUrl)

  if (parsed.items.length > 0) {
    const ops = parsed.items.map((item) => ({
      updateOne: {
        filter: { feedId: feed._id, guid: item.guid },
        update: { $setOnInsert: { feedId: feed._id, ...item } },
        upsert: true,
      },
    }))

    const result = await FeedItem.bulkWrite(ops, { ordered: false })
    const newItemCount = result.upsertedCount

    await Feed.findByIdAndUpdate(feedId, { lastFetchedAt: new Date() })

    return NextResponse.json({ newItemCount })
  }

  await Feed.findByIdAndUpdate(feedId, { lastFetchedAt: new Date() })
  return NextResponse.json({ newItemCount: 0 })
}
