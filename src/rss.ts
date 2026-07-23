import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string | null;
  pubDate: string | null;
};

function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getStringValue(value: unknown): string | null {
  return isValidString(value) ? value : null;
}

function getAtomLink(link: unknown, fallback?: unknown): string | null {
  if (isValidString(link)) {
    return link;
  }

  if (Array.isArray(link)) {
    for (const entry of link) {
      const resolved = getAtomLink(entry);

      if (resolved) {
        return resolved;
      }
    }

    return null;
  }

  if (typeof link === "object" && link !== null) {
    const typedLink = link as { href?: unknown; rel?: unknown };

    if (isValidString(typedLink.href)) {
      return typedLink.href;
    }

    if (Array.isArray(typedLink.rel)) {
      return getAtomLink(typedLink.rel, fallback);
    }
  }

  return getStringValue(fallback);
}

function getItemDescription(item: {
  description?: unknown;
  summary?: unknown;
  content?: unknown;
}): string | null {
  return (
    getStringValue(item.description) ??
    getStringValue(item.summary) ??
    getStringValue(item.content)
  );
}

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch feed: ${response.status} ${response.statusText}`,
    );
  }

  const feedXML = await response.text();
  const parser = new XMLParser({
    processEntities: false,
  });

  const parsedFeed = parser.parse(feedXML) as {
    rss?: {
      channel?: {
        title?: unknown;
        link?: unknown;
        description?: unknown;
        item?: unknown;
      };
    };
    feed?: {
      title?: unknown;
      link?: unknown;
      subtitle?: unknown;
      entry?: unknown;
    };
    channel?: {
      title?: unknown;
      link?: unknown;
      description?: unknown;
      item?: unknown;
    };
  };

  const channel = parsedFeed.rss?.channel ?? parsedFeed.channel;

  if (channel) {
    if (
      !isValidString(channel.title) ||
      !isValidString(channel.link) ||
      !isValidString(channel.description)
    ) {
      throw new Error("Invalid RSS feed: missing required channel metadata");
    }

    const rawItems = Array.isArray(channel.item)
      ? channel.item
      : channel.item
        ? [channel.item]
        : [];

    const items: RSSItem[] = [];

    for (const rawItem of rawItems) {
      if (
        typeof rawItem !== "object" ||
        rawItem === null ||
        !("title" in rawItem) ||
        !("link" in rawItem)
      ) {
        continue;
      }

      const item = rawItem as {
        title: unknown;
        link: unknown;
        description?: unknown;
        pubDate?: unknown;
        published?: unknown;
        updated?: unknown;
        "dc:date"?: unknown;
      };

      const link = getAtomLink(item.link);

      if (!isValidString(item.title) || !link) {
        continue;
      }

      const pubDate =
        (isValidString(item.pubDate) && item.pubDate) ||
        (isValidString(item.published) && item.published) ||
        (isValidString(item.updated) && item.updated) ||
        (isValidString(item["dc:date"]) && item["dc:date"]) ||
        null;

      items.push({
        title: item.title,
        link,
        description: getItemDescription(item),
        pubDate,
      });
    }

    return {
      channel: {
        title: channel.title,
        link: channel.link,
        description: channel.description,
        item: items,
      },
    };
  }

  const atomFeed = parsedFeed.feed;

  if (!atomFeed) {
    throw new Error("Invalid RSS feed: missing channel field");
  }

  const atomTitle = getStringValue(atomFeed.title);
  const atomLink = getAtomLink(atomFeed.link, atomFeed.id);
  const atomDescription = getStringValue(atomFeed.subtitle) ?? atomTitle;

  if (!atomTitle || !atomLink) {
    throw new Error("Invalid Atom feed: missing required metadata");
  }

  const rawEntries = Array.isArray(atomFeed.entry)
    ? atomFeed.entry
    : atomFeed.entry
      ? [atomFeed.entry]
      : [];

  const items: RSSItem[] = [];

  for (const rawEntry of rawEntries) {
    if (
      typeof rawEntry !== "object" ||
      rawEntry === null ||
      !("title" in rawEntry) ||
      !("link" in rawEntry)
    ) {
      continue;
    }

    const entry = rawEntry as {
      title: unknown;
      link: unknown;
      summary?: unknown;
      content?: unknown;
      published?: unknown;
      updated?: unknown;
    };

    const link = getAtomLink(entry.link, entry.id);

    if (!isValidString(entry.title) || !link) {
      continue;
    }

    const pubDate =
      (isValidString(entry.published) && entry.published) ||
      (isValidString(entry.updated) && entry.updated) ||
      null;

    items.push({
      title: entry.title,
      link,
      description: getItemDescription(entry),
      pubDate,
    });
  }

  return {
    channel: {
      title: atomTitle,
      link: atomLink,
      description: atomDescription,
      item: items,
    },
  };
}
