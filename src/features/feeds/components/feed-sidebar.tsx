'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Rss } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { ThemeToggle } from '@/components/theme-toggle'
import { AddFeedDialog } from './add-feed-dialog'
import { FeedSidebarItem } from './feed-sidebar-item'
import type { IFeed } from '@/models/Feed'

type Feed = IFeed & { _id: string }

export function FeedSidebar() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/feeds')
      if (res.ok) {
        const data = await res.json()
        setFeeds(data.feeds)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeeds()
  }, [fetchFeeds])

  return (
    <>
      <aside className="w-64 shrink-0 h-screen flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Rss size={18} className="text-primary" />
            <span className="font-semibold text-sm text-foreground">News Digest</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Add Feed Button */}
        <div className="px-3 py-3">
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent border border-dashed border-border transition-colors"
          >
            <Plus size={14} />
            Add feed
          </button>
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {loading ? (
            <div className="space-y-1 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : feeds.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-2">
              No feeds yet. Add your first RSS feed above.
            </p>
          ) : (
            feeds.map((feed) => (
              <FeedSidebarItem key={feed._id} feed={feed} onRemoved={fetchFeeds} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-4 py-3">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <AddFeedDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdded={fetchFeeds}
      />
    </>
  )
}
