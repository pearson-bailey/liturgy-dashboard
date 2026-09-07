# Scripture usage

> Status: Active
> Scope: Church worship analytics
> Canonical for: Liturgical classification, reference normalization, counting and sync

## Source and liturgical context

Ordered non-song Planning Center items, including headers and items without
references, are retained. Source titles, descriptions, HTML details, ordering, and
provider update timestamps are preserved. Duration is not modeled or used.

`liturgical-structure-service.ts` normalizes case, whitespace, punctuation, and
HTML text for deterministic header matching. Its explicit phrase allowlist maps
the church's headings to `god-calls`, `god-convicts-and-cleanses`, `god-renews`, and
`god-sends`. Before the first recognized header the movement is `pre-service`.
Known headers change the active movement until the next recognized one.
Unknown headers remain stored as raw section titles and do not change the active
canonical movement. Consecutive known headers leave the last one active.

Movement describes the theological section; element describes the individual
item. The original element title is retained alongside a deterministic key for
minor formatting differences. Element filter options come from stored items,
not an exhaustive hard-coded list. Sermon, Confession, and all other non-song
elements participate. Headers themselves define structure, not Scripture occurrences.

## Extraction and normalization

The service wraps `bible-passage-reference-parser` through `lib/scripture/`.
HTML is converted to plain text before parsing; scripts and styles are excluded.
Raw HTML MUST NOT be rendered in the UI. Parsing inspects title, description, and
HTML details separately. Invalid books/chapters/verses are ignored; book-only and
book-sequence inference are disabled. The parser uses the standard Protestant
versification and the application exposes one 66-book canon in `utils/bible-canon.ts`.
Parser diagnostics that repair invalid input (such as clipping an excessive verse
range) cause that match to be rejected rather than silently changing the passage.

Each item has at most one record per canonical OSIS reference. A provenance array
retains the matched text and every source field where that reference was found.
Explicit verse bounds are retained even when the parser compacts a full-chapter
range. A chapter-only input keeps verse bounds null. Each reference expands into
one row per touched canonical chapter. Parser-specific objects never leave the adapter.

Parser extraction is conservative but cannot resolve every ambiguous piece of
prose. Preserve source data, add regression examples when actual church data
reveals problems, and reparse stored data after changing rules.

## Counting and filters

A chapter usage counts distinct plan item IDs, not verses, normalized references,
or joined rows. Two overlapping references in one item count once for that chapter;
two elements in one service count twice. A multi-chapter range touches each chapter.
The previous-use date is the preceding distinct service date.

Services combine date, Service Type, movement, element, and book filters. Repositories
apply their persistence predicates to a security-invoker join view; services count,
deduplicate, and construct the view models. Results are paginated from the database
in batches of 1,000, never queried once per chapter. Only the 1,189 cells, up to 50
recent item occurrences, and requested detail pages are sent to the browser.

Liturgical element selection accepts multiple elements (OR within the selection,
AND with the other filters). Repeated `element` URL parameters retain selections
for analytics and chapter details; no selection includes all elements.
Element options refresh as the From/Through inputs change, using inclusive service
dates (either bound may be omitted). Options come from stored non-header items,
including those without Scripture references. Out-of-range options are omitted
from the selection submitted by Apply filters. Loading and invalid ranges prevent
submission; an empty range shows an explicit no-elements message. Other filters
do not narrow this option list.

All 66 books/1,189 chapters remain visible under every filter. Nonmatching chapters
show zero qualifying usage. Count levels are 0, 1, 2, 3–4, and 5+. Recency levels are
unused, over a year, 91–365 days, 31–90 days, and the last 30 days, relative to the
server's current UTC date. Legends, focus text, labels, and used-cell dots complement
color. Chapter history shows 50 occurrences per page, newest first.

## Synchronization and reparse

```text
Planning Center -> paginated integration client -> sync service
  -> ordered source snapshot -> classification + parsing services
  -> repository transaction -> source items + references + chapter usages
  -> repository join reads -> analytics service -> dashboard
```

`POST /api/sync/planning-center` runs serially in the local Node request lifecycle.
It requires an explicit historical start date and ends at the current UTC date.
Service Types can be limited by configured external IDs. Plans are dated by the
organization-local date portion of Planning Center `sort_date`, its first service
time; plans with no service times are excluded. A multi-day plan is counted once,
on that first date. Pagination covers all accessible plans; the service selects
the configured range. No arbitrary historical date is supplied.
The dashboard displays the configured import range. A sync with no accessible
matching Service Types or no eligible plans is recorded as failed with actionable
configuration guidance, rather than reporting a successful zero-plan import.

The integration uses a personal access token, identifying User-Agent, and API
version `2018-11-01`. SDK/API fields are Zod-validated; irrelevant fields are
discarded. Pagination URLs are restricted to the provider's Services origin/path.
Requests have a 30-second timeout. 429/5xx retries are bounded to four attempts and
respect numeric or HTTP-date Retry-After. Delays above two minutes fail with retry
guidance rather than retrying early. Pagination cycles are rejected.

The database grants one running sync/reparse lease at a time. Retrieval heartbeats
and completed plan writes refresh it; after ten minutes without a heartbeat a new
run marks the old one failed. Every plan replacement checks/locks its run row so a
superseded worker cannot write. Each plan transaction upserts external IDs, removes
items absent from that fetched snapshot (including items changed into songs), and
replaces obsolete references/chapter rows atomically. Earlier completed plans
survive a later failure; retrying converges without duplicates.

Whole plans deleted upstream are retained as historical source records because
the provider's absence may also reflect permission changes. This MVP does not
silently delete history based on missing plans. Source snapshots are not a version
history: edits replace the prior snapshot. The sync service records counts and safe
failure messages in `sync_runs`; raw provider errors and credentials are never logged.

`POST /api/sync/reparse` uses the same lease and transaction against stored plans
and items without any Planning Center requests. The dashboard exposes this action.
The local request lifecycle is intentional; deployment behind a short request
timeout requires a durable worker/queue decision before large historical imports.

## Related documentation

[Local setup](../workflows/local-development.md), [backend](backend.md),
[database](database.md), [auth](authentication.md),
[Planning Center API reference](https://api.planningcenteronline.com/services/v2/open_api/2018-11-01),
[parser reference](https://github.com/openbibleinfo/Bible-Passage-Reference-Parser).
