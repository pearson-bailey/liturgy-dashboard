# Liturgy Dashboard

An invite-only application for church elders and worship leaders to review Scripture
usage across worship services. It imports ordered non-song Planning Center elements,
preserves their liturgical context, and presents the entire Bible as a chapter heatmap.

## Run locally

Install Node.js 22.12+ or 24 LTS and Docker Desktop, start Docker, then:

```sh
npm ci
npx supabase start
npx supabase db reset
npm run db:env
npm run db:types
npm run dev
```

Open <http://127.0.0.1:3000>. Sign in with the synthetic local account
**elder@example.test** / **Local-elders-2026!**. Six seeded services work without live
Planning Center credentials. Resetting the local database deletes its existing data.
The environment setup command refuses to overwrite an existing .env.local file.

See [local development](docs/workflows/local-development.md) for invitations,
password recovery, local mail, Planning Center configuration, seed regeneration,
and stored-data reparsing. Public registration is disabled.

## Explore

Combine date, Service Type, liturgical movement, element, and book filters. Switch
between Usage Count and Recency, focus a chapter for count/date information, or
select it to inspect historical occurrences. Every unused chapter remains visible.
The recent-usage table retains the distinction between Sermon, Scripture Reading,
Confession, Call to Worship, and other actual service elements.

## Verify and contribute

Run `npm run check`, `npm run test:db`, `npm run test:e2e`, and `npm run build`.
Install the browser once with `npx playwright install chromium`. The database and
browser suites require local Supabase. See [commands](AGENTS.md#commands).

Start with [AGENTS.md](AGENTS.md), the [architecture map](ARCHITECTURE.md), and the
[documentation index](docs/README.md). [CLAUDE.md](CLAUDE.md) imports the same agent
contract. [Domain rules](docs/architecture/scripture-usage.md) define sync, parsing,
counting semantics, and known limits. No deployment or live Planning Center
connection is bundled; provide server credentials to perform a real sync.
