# Gator

Gator is a terminal RSS reader and feed aggregator. It lets you register users, follow feeds, fetch posts into PostgreSQL, and browse the latest items from the feeds you follow.

## What you need

Before you run the CLI, install:

- Node.js 22 or newer
- npm
- PostgreSQL

You also need a PostgreSQL connection string that Gator can read.

## Install

Install dependencies from the repo root:

```bash
npm install
```

## Configure the app

Gator reads its database connection from either the `DATABASE_URL` environment variable or a config file at `~/.gatorconfig.json`.

Example config file:

```json
{
  "db_url": "postgresql://postgres:password@localhost:5432/gator",
  "current_user_name": "alice"
}
```

Only `db_url` is required. The `current_user_name` field is written automatically when you run `register` or `login`.

If you prefer environment variables, set `DATABASE_URL` instead of creating the config file.

## Run the program

For local development, run commands through the dev script:

```bash
npm run dev -- <command> [args]
```

To build the TypeScript and run the compiled app:

```bash
npm run build
npm start -- <command> [args]
```

## Commands

A few useful commands:

- `register <name>` creates a new user and logs you in.
- `login <name>` switches the active user.
- `addfeed <name> <url>` creates a feed and follows it.
- `follow <feed-url>` follows an existing feed.
- `unfollow <feed-url>` stops following a feed.
- `agg <duration>` starts polling feeds, such as `agg 30s` or `agg 5m`.
- `browse [limit]` shows recent posts from the feeds you follow. If you omit `limit`, it defaults to `2`.

Other available commands include `users`, `feeds`, `following`, and `reset`.

## Database migrations

The database schema is managed with Drizzle.

Apply migrations with:

```bash
npm run db:migrate
```

Generate a new migration after schema changes with:

```bash
npm run db:generate
```

Push schema changes directly with:

```bash
npm run db:push
```

## Quick check

If you want a fast sanity check that the docs are in place, look for: gator chack fast
