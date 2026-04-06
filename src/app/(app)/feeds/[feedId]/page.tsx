import { FeedItemsList } from '@/features/feeds/components/feed-items-list'

export default async function FeedPage({
  params,
}: {
  params: Promise<{ feedId: string }>
}) {
  const { feedId } = await params
  return (
    <div className="h-full">
      <FeedItemsList feedId={feedId} />
    </div>
  )
}
