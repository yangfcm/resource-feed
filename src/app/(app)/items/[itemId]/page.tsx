import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import FeedItem from '@/models/FeedItem'
import { formatDate } from '@/lib/utils'

export const runtime = 'nodejs'

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = await params
  const session = await auth()
  if (!session) notFound()

  await connectDB()

  const item = await FeedItem.findById(itemId)
    .populate<{ feedId: { _id: string; title: string; favicon: string } }>(
      'feedId',
      'title favicon'
    )
    .lean()

  if (!item) notFound()

  const feed = item.feedId as { _id: string; title: string; favicon: string }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href={`/feeds/${feed._id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to {feed.title}
        </Link>

        {/* Article header */}
        <article>
          <h1 className="text-2xl font-bold text-foreground leading-tight mb-4">
            {item.title}
          </h1>

          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {feed.favicon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={feed.favicon} alt="" width={16} height={16} className="rounded-sm" />
              )}
              <span>{feed.title}</span>
            </div>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-sm text-muted-foreground">
              {formatDate(item.publishedAt)}
            </span>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Read original
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Thumbnail */}
          {item.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt=""
              className="w-full rounded-xl mb-6 object-cover max-h-80 bg-muted"
            />
          )}

          {/* Content */}
          {item.content ? (
            <div
              className="prose prose-slate dark:prose-invert max-w-none prose-img:rounded-lg prose-a:text-primary prose-headings:text-foreground"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
            <div className="text-muted-foreground">
              <p>{item.description}</p>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                Read full article
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
