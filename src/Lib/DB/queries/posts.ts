import { desc, eq, sql } from "drizzle-orm";

import { db } from "../index.js";
import { feedFollows, feeds, posts } from "../schema.js";

export async function createPost(post: typeof posts.$inferInsert) {
  const [result] = await db.insert(posts).values(post).returning();

  return result;
}

export async function getPostsForUser(userId: string, limit: number) {
  return await db
    .select({
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
    .where(eq(feedFollows.userId, userId))
    .orderBy(sql`${posts.publishedAt} DESC NULLS LAST`, desc(posts.createdAt))
    .limit(limit);
}
