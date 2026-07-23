## Gator

Gator is a terminal RSS reader and feed aggregator. It lets you register users, follow feeds, fetch posts into PostgreSQL, and browse the latest items from the feeds you follow.

### Requirements

You need the following installed before running the CLI:

* Node.js 22 or newer
* npm
* PostgreSQL

### Install

Install dependencies from the repo root:

```bash
npm install
```

### Configuration

Gator reads its database connection from either the `DATABASE_URL` environment variable or `~/.gatorconfig.json`.

Example `~/.gatorconfig.json`:

```json
{
  "db_url": "postgresql://postgres:password@localhost:5432/gator",
  "current_user_name": "alice"
}
```

Only `db_url` is required. `current_user_name` is set for you when you run `register` or `login`.

### Run

Use the dev script while working locally:

```bash
npm run dev -- <command> [args]
```

Or build and run the compiled output:

```bash
npm run build
npm start -- <command> [args]
```

### Commands

Some useful commands:

* `register <name>` creates a new user and logs you in.
* `login <name>` switches the current user.
* `addfeed <name> <url>` creates a feed and follows it.
* `follow <feed-url>` follows an existing feed.
* `agg <duration>` starts the feed fetch loop, such as `agg 30s` or `agg 5m`.
* `browse [limit]` shows the most recent posts from the feeds you follow. If you omit `limit`, it defaults to `2`.

Other available commands include `users`, `feeds`, `following`, `unfollow`, and `reset`.

### Database

The database schema is managed with Drizzle. To apply migrations, use:

```bash
npm run db:migrate
```

If you want to generate a new migration after changing the schema, use:

```bash
npm run db:generate
```

### Notes

* Posts are stored in PostgreSQL as they are fetched from each feed.
* `browse` orders posts with the newest published items first.
* The scraper supports both RSS and Atom feeds.
