import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { fetchAndParseFeed } from '@/lib/rss'
import Feed from '@/models/Feed'
import FeedItem from '@/models/FeedItem'
import User from '@/models/User'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(session.user.id).populate('followedFeeds')
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ feeds: user.followedFeeds })
}

const AddFeedSchema = z.object({
  rssUrl: z.string().url('Invalid URL'),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = AddFeedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { rssUrl } = parsed.data

    await connectDB()

    const user = await User.findById(session.user.id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if already following
    let feed = await Feed.findOne({ rssUrl })
    if (feed && user.followedFeeds.some((id) => id.toString() === feed!._id.toString())) {
      return NextResponse.json({ error: 'Already following this feed' }, { status: 409 })
    }

    if (!feed) {
      // Fetch and parse the RSS feed
      const parsed = await fetchAndParseFeed(rssUrl)

      feed = await Feed.create({
        rssUrl,
        title: parsed.title,
        description: parsed.description,
        siteUrl: parsed.siteUrl,
        favicon: parsed.favicon,
        lastFetchedAt: new Date(),
      })

      // Bulk insert items
      if (parsed.items.length > 0) {
        const itemDocs = parsed.items.map((item) => ({
          feedId: feed!._id,
          ...item,
        }))
        await FeedItem.insertMany(itemDocs, { ordered: false }).catch(() => {
          // Ignore duplicate key errors
        })
      }
    }

    user.followedFeeds.push(feed._id as mongoose.Types.ObjectId)
    await user.save()

    return NextResponse.json({ feed }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add feed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
