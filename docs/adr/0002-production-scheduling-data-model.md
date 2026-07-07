# ADR-0002: Production scheduling data model (script revisions, stripboard, call sheets)

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Tanja

## Context

The product roadmap goes beyond a one-shot script breakdown: scenes get broken into schedule "strips" that can be freely combined and split, those strips get arranged into a day-by-day stripboard/calendar, and a daily call sheet gets derived from that schedule. The original `schema.sql` (from before ADR-0001) modeled this only partially:

- `schedule_items` tied one scene directly to one shooting day, with no way to split a scene across multiple days or combine several scenes into a single setup
- `characters` represented only fictional people in the story - there was no representation of the real actors/crew a call sheet needs to list with phone numbers and call times
- `scripts` had no concept of revisions, even though screenplay revisions are near-universal industry practice (colored pages: White, Blue, Pink, Yellow, ...)

Since no database is connected yet, this is the cheapest possible moment to fix these gaps - doing it after real schedules and call sheets exist in production would mean migrating live data instead of just extending an empty schema.

## Decision

Three additions to the schema:

1. **Script revisions**: a new `script_revisions` table under `scripts`. `scenes` now belongs to a `script_revision_id`, not a `script_id` directly. Only one revision per script can be `is_current` (enforced with a partial unique index). Matching "the same" scene across revisions is left as an application-level concern (by `scene_number`), since the schema can't reliably infer that on its own.

2. **Strips as first-class entities**: a new `strips` table, joined to `scenes` via `strip_scenes` (many-to-many with an `order_index` and an optional `partial_note`). `schedule_items` now places a *strip* on a shooting day, not a scene directly. This supports both splitting one scene into multiple strips and combining multiple scenes into one strip - the actual stripboard behavior the roadmap describes. A strip that exists but has no `schedule_items` row represents an unscheduled strip still sitting on the board.

3. **Real people, not just characters**: a new `contacts` table for actual cast and crew (name, role, department, phone, email), and `characters.played_by_contact_id` linking a fictional character to the contact playing them. New `call_sheets` (one per shooting day) and `call_sheet_entries` (per-person call time, one row per contact per call sheet) tables hold the logistics layer a call sheet needs - which people, what time, pickup, notes - without duplicating what's already derivable from the schedule (which scenes/characters are needed that day is reached via `schedule_items -> strips -> strip_scenes -> scenes -> scene_characters`).

## Options considered

For strips specifically, the alternative to a first-class `strips` table was keeping `schedule_items` pointing straight at `scenes` and just allowing multiple rows per scene (for splits) or a `group_id` column to cluster combined scenes. This was rejected: it conflates "this scene needs multiple time slots" with "these scenes share one setup" using the same loose mechanism, makes querying "what's on the board today" awkward, and doesn't cleanly support a strip existing before it's scheduled (the actual physical stripboard workflow). A dedicated `strips` entity models the domain directly.

For cast/crew, the alternative was adding phone/email columns straight onto `characters`. Rejected because a character is fictional and a contact is a real person - conflating them breaks as soon as a character needs recasting, or a crew member (who plays no character at all) needs a call sheet entry.

## Consequences

- Harder: one more join hop to get from a shooting day to its scenes (via strips), and scenes now hang off a revision rather than a script directly
- Easier: splitting/combining strips, adding new script revisions, and generating call sheets are all now directly representable instead of needing awkward workarounds
- Not addressed here: recast history (characters.played_by_contact_id is a single current link, not a history) - fine for now, would need its own join table if that ever matters
- Verified: the full schema was validated against the real PostgreSQL grammar via `pglast` (no live Postgres instance available in this environment) and checked for correct foreign-key ordering; it has not been executed against a live database yet, since none is connected

## Action items

1. [x] Add `script_revisions`, `contacts`, `strips`, `strip_scenes`, `call_sheets`, `call_sheet_entries` to `SQL/schema.sql`
2. [x] Repoint `scenes.script_revision_id` and `schedule_items.strip_id`
3. [x] Add `characters.played_by_contact_id`
4. [ ] When the database is wired: build the application-level logic for carrying a scene's schedule placement forward when a new script revision arrives (matching by scene_number)
5. [ ] When building the stripboard UI: decide how "unscheduled strips" are surfaced (a holding area, same as a physical corkboard)
6. [ ] When building call sheets: decide whether department/role become a fixed lookup list or stay free text once real usage patterns are clearer
