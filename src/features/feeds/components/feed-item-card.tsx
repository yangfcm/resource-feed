import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import type { IFeedItem } from '@/models/FeedItem'

type FeedItem = IFeedItem & { _id: string }

export function FeedItemCard({ item }: { item: FeedItem }) {
  return (
    <Link
      href={`/items/${item._id}`}
      className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
    >
      {item.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          className="w-24 h-16 object-cover rounded-lg shrink-0 bg-muted"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-card-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground/70">
          {formatRelativeTime(item.publishedAt)}
        </p>
      </div>
    </Link>
  )
}
