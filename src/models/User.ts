import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  email: string
  hashedPassword: string
  followedFeeds: mongoose.Types.ObjectId[]
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hashedPassword: { type: String, required: true },
  followedFeeds: [{ type: Schema.Types.ObjectId, ref: 'Feed' }],
  createdAt: { type: Date, default: Date.now },
})

UserSchema.index({ email: 1 })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
