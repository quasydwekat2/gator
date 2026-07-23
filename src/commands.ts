import { readConfig, setUser } from "./config.js";
import { randomUUID } from "node:crypto";

import {
  createUser,
  getAllUsers,
  getUser,
  resetUsers,
} from "./lib/db/queries/users.js";
import {
  createFeed,
  getAllFeeds,
  getFeedByURL,
  getNextFeedToFetch,
  markFeedFetched,
} from "./lib/db/queries/feeds.js";
import {
  createFeedFollow,
  deleteFeedFollowByUserAndURL,
  getFeedFollowsForUser,
} from "./lib/db/queries/feed-follows.js";
import {
  createPost,
  getPostsForUser,
} from "./lib/db/queries/posts.js";
import { feeds, users } from "./lib/db/schema.js";
import { parseDate } from "./lib/date.js";
import { fetchFeed } from "./rss.js";
import { eq } from "drizzle-orm";
import { db } from "./lib/db/index.js";

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(
      "Invalid duration format. Use a number followed by ms, s, m, or h",
    );
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      throw new Error("Unsupported duration unit");
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes}m${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m${seconds}s`;
  }

  if (totalSeconds > 0) {
    return `${totalSeconds}s`;
  }

  return `${ms}ms`;
}

function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);

    return;
  }

  console.error("Unknown error");
}

export async function scrapeFeeds(): Promise<void> {
  const nextFeed = await getNextFeedToFetch();

  if (!nextFeed) {
    console.log("No feeds to fetch");

    return;
  }

  console.log(`Fetching feed: ${nextFeed.name}`);

  const feed = await fetchFeed(nextFeed.url);
  await markFeedFetched(nextFeed.id);

  for (const item of feed.channel.item) {
    try {
      await createPost({
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        title: item.title,
        url: item.link,
        description: item.description ?? null,
        publishedAt: parseDate(item.pubDate ?? undefined),
        feedId: nextFeed.id,
      });
    } catch {
      // Duplicate post URLs are expected when polling the same feeds.
    }
  }
}

// Types
export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

async function getLoggedInUser(): Promise<User> {
  const config = readConfig();

  if (!config.currentUserName) {
    throw new Error("No current user set");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.name, config.currentUserName));

  if (!user) {
    throw new Error(`User '${config.currentUserName}' does not exist`);
  }

  return user;
}

// Login command
export async function handlerLogin(
  _cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("A username is required for login");
  }

  const username = args[0];

  const user = await getUser(username);

  if (!user) {
    throw new Error(`User '${username}' does not exist`);
  }

  setUser(username);

  console.log(`Logged in as ${username}`);
}

// Register command
export async function handlerRegister(
  _cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("A name is required to register");
  }

  const name = args[0];

  const existingUser = await getUser(name);

  if (existingUser) {
    throw new Error(`User '${name}' already exists`);
  }

  const user = await createUser(name);

  setUser(user.name);

  console.log(`User '${user.name}' created successfully`);

  console.dir(user);
}

// Reset command
export async function handlerReset(_cmdName: string): Promise<void> {
  await resetUsers();

  console.log("Database reset successfully");
}

// Users command
export async function handlerUsers(_cmdName: string): Promise<void> {
  const usersList = await getAllUsers();

  const config = readConfig();

  for (const user of usersList) {
    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}

export async function handlerFeeds(_cmdName: string): Promise<void> {
  const allFeeds = await getAllFeeds();

  for (const feed of allFeeds) {
    console.log(`Name: ${feed.name}`);
    console.log(`URL: ${feed.url}`);
    console.log(`User: ${feed.userName}`);
    console.log("");
  }
}

export async function handlerAgg(
  _cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length !== 1) {
    throw new Error("agg requires a single argument: time_between_reqs");
  }

  const timeBetweenRequests = parseDuration(args[0]);

  console.log(
    `Collecting feeds every ${formatDuration(timeBetweenRequests)}`,
  );

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

export async function handlerBrowse(
  _cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length > 1) {
    throw new Error("browse takes at most one optional argument: limit");
  }

  let limit = 2;

  if (args.length === 1) {
    const parsedLimit = Number(args[0]);

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      throw new Error("browse limit must be a positive integer");
    }

    limit = parsedLimit;
  }

  const posts = await getPostsForUser(user.id, limit);

  for (const post of posts) {
    console.log("---------------");
    console.log(post.title);
    console.log(post.feedName);
    console.log(post.url);

    if (post.description) {
      console.log(post.description);
    }

    console.log();
  }
}

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

type FeedFollowRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  feedId: string;
  feedName: string;
  userName: string;
};

export function printFeed(feed: Feed, user: User): void {
  console.log(`Feed ID: ${feed.id}`);
  console.log(`Created At: ${feed.createdAt}`);
  console.log(`Updated At: ${feed.updatedAt}`);
  console.log(`Name: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`User ID: ${feed.userId}`);
  console.log(`User Name: ${user.name}`);
}

export function printFeedFollow(feedFollow: FeedFollowRecord): void {
  console.log(`Feed Name: ${feedFollow.feedName}`);
  console.log(`User Name: ${feedFollow.userName}`);
}

export function middlewareLoggedIn(
  handler: UserCommandHandler,
): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const user = await getLoggedInUser();

    await handler(cmdName, user, ...args);
  };
}

export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("A feed URL is required");
  }

  const url = args[0];

  const feed = await getFeedByURL(url);

  if (!feed) {
    throw new Error(`Feed '${url}' does not exist`);
  }

  const feedFollow = await createFeedFollow(user.id, feed.id);

  printFeedFollow(feedFollow);
}

export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("A feed name and URL are required");
  }

  const name = args[0];
  const url = args[1];

  const feed = await createFeed(name, url, user.id);

  const feedFollow = await createFeedFollow(user.id, feed.id);

  printFeedFollow(feedFollow);
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
): Promise<void> {
  const feedFollows = await getFeedFollowsForUser(user.id);

  for (const feedFollow of feedFollows) {
    console.log(feedFollow.feedName);
  }
}

export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("A feed URL is required");
  }

  const url = args[0];

  await deleteFeedFollowByUserAndURL(user.id, url);
}

// Register command
export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}
///

// Run command
export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}
