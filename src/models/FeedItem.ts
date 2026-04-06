import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFeedItem extends Document {
  feedId: mongoose.Types.ObjectId
  title: string
  description: string
  content: string
  thumbnail: string
  link: string
  guid: string
  publishedAt: Date
  createdAt: Date
}

const FeedItemSchema = new Schema<IFeedItem>({
  feedId: { type: Schema.Types.ObjectId, ref: 'Feed', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  link: { type: String, required: true },
  guid: { type: String, required: true },
  publishedAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
})

FeedItemSchema.index({ feedId: 1, publishedAt: -1 })
FeedItemSchema.index({ feedId: 1, guid: 1 }, { unique: true })

const FeedItem: Model<IFeedItem> =
  mongoose.models.FeedItem || mongoose.model<IFeedItem>('FeedItem', FeedItemSchema)

export default FeedItem
