import { Rss } from 'lucide-react'

export function EmptyFeedState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Rss size={28} className="text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Select a feed</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Choose a feed from the sidebar to read its latest articles, or add a new RSS feed to get started.
      </p>
    </div>
  )
}
