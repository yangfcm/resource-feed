import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFeed extends Document {
  rssUrl: string
  title: string
  description: string
  siteUrl: string
  favicon: string
  lastFetchedAt: Date | null
  createdAt: Date
}

const FeedSchema = new Schema<IFeed>({
  rssUrl: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  siteUrl: { type: String, default: '' },
  favicon: { type: String, default: '' },
  lastFetchedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

FeedSchema.index({ rssUrl: 1 })

const Feed: Model<IFeed> = mongoose.models.Feed || mongoose.model<IFeed>('Feed', FeedSchema)

export default Feed
