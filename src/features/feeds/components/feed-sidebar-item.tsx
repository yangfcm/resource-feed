'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { IFeed } from '@/models/Feed'

interface FeedSidebarItemProps {
  feed: IFeed & { _id: string }
  onRemoved: () => void
}

export function FeedSidebarItem({ feed, onRemoved }: FeedSidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === `/feeds/${feed._id}`
  const [removing, setRemoving] = useState(false)

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Unfollow "${feed.title}"?`)) return

    setRemoving(true)
    try {
      const res = await fetch(`/api/feeds/${feed._id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Unfollowed "${feed.title}"`)
        onRemoved()
      } else {
        toast.error('Failed to unfollow feed')
      }
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Link
      href={`/feeds/${feed._id}`}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground hover:bg-accent'
      )}
    >
      {feed.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={feed.favicon}
          alt=""
          width={16}
          height={16}
          className="rounded-sm shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="w-4 h-4 rounded-sm bg-muted shrink-0" />
      )}
      <span className="flex-1 truncate">{feed.title}</span>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all shrink-0"
        aria-label="Unfollow feed"
      >
        <Trash2 size={12} />
      </button>
    </Link>
  )
}
