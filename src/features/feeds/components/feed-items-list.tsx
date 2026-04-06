'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FeedItemCard } from './feed-item-card'
import type { IFeedItem } from '@/models/FeedItem'
import type { IFeed } from '@/models/Feed'

type FeedItem = IFeedItem & { _id: string }
type Feed = IFeed & { _id: string }

export function FeedItemsList({ feedId }: { feedId: string }) {
  const [feed, setFeed] = useState<Feed | null>(null)
  const [items, setItems] = useState<FeedItem[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFeed = useCallback(async () => {
    const res = await fetch(`/api/feeds/${feedId}`)
    if (res.ok) {
      const data = await res.json()
      setFeed(data.feed)
    }
  }, [feedId])

  const fetchItems = useCallback(async (pageNum: number, append = false) => {
    const res = await fetch(`/api/feeds/${feedId}/items?page=${pageNum}&limit=20`)
    if (res.ok) {
      const data = await res.json()
      setItems((prev) => (append ? [...prev, ...data.items] : data.items))
      setHasMore(data.hasMore)
    }
  }, [feedId])

  useEffect(() => {
    setLoading(true)
    setPage(0)
    setItems([])
    Promise.all([fetchFeed(), fetchItems(0)]).finally(() => setLoading(false))
  }, [feedId, fetchFeed, fetchItems])

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setLoadingMore(true)
    await fetchItems(nextPage, true)
    setPage(nextPage)
    setLoadingMore(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/feeds/${feedId}/refresh`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        await fetchItems(0)
        setPage(0)
        toast.success(
          data.newItemCount > 0
            ? `${data.newItemCount} new article${data.newItemCount > 1 ? 's' : ''} found`
            : 'Feed is up to date'
        )
      }
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {feed?.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={feed.favicon} alt="" width={20} height={20} className="rounded-sm" />
          )}
          <h1 className="font-semibold text-foreground">{feed?.title ?? 'Feed'}</h1>
          <span className="text-xs text-muted-foreground">{items.length} articles</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No articles yet. Try refreshing the feed.
          </div>
        ) : (
          items.map((item) => <FeedItemCard key={item._id} item={item} />)
        )}

        {hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
