import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { fetchAndParseFeed } from "../src/lib/rss";
import Feed from "../src/models/Feed";
import FeedItem from "../src/models/FeedItem";

async function refreshAllFeeds() {
  await connectDB();

  const feeds = await Feed.find({}).lean();
  console.log(`Found ${feeds.length} feed(s) to refresh`);

  let totalNew = 0;
  let failed = 0;

  for (const feed of feeds) {
    const feedId = feed._id as mongoose.Types.ObjectId;
    try {
      const parsed = await fetchAndParseFeed(feed.rssUrl);

      let newItemCount = 0;
      if (parsed.items.length > 0) {
        const ops = parsed.items.map((item) => ({
          updateOne: {
            filter: { feedId, guid: item.guid },
            update: { $setOnInsert: { feedId, ...item } },
            upsert: true,
          },
        }));
        const result = await FeedItem.bulkWrite(ops, { ordered: false });
        newItemCount = result.upsertedCount;
      }

      await Feed.findByIdAndUpdate(feedId, { lastFetchedAt: new Date() });

      console.log(`  ✓ ${feed.title}: ${newItemCount} new item(s)`);
      totalNew += newItemCount;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${feed.title} (${feed.rssUrl}): ${message}`);
      failed++;
    }
  }

  console.log(
    `\nDone. ${totalNew} new item(s) across ${feeds.length} feed(s). ${failed > 0 ? `${failed} feed(s) failed.` : "No failures."}`,
  );

  await mongoose.disconnect();
}

refreshAllFeeds().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
