# ADR-0003: Real-world shooting locations

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Tanja

## Context

`locations` (added in the original schema, unchanged by ADR-0001/0002) only ever stored the fictional location name as written in the script - e.g. "Annan koti" (Anna's home). There was no way to attach a real-world shooting address to it. This is the exact same shape of problem ADR-0002 solved for characters vs. contacts (fictional person vs. real person), just for places instead of people: a call sheet, a schedule, or a location-permit tracker all need the real address, not just the script's name for the place.

A single real address commonly covers several fictional locations at once - e.g. "Annan koti - keittiö" (INT) and "Annan koti - piha" (EXT) might both be shot at the same house. The data model needs to support that many-to-one relationship cleanly.

## Decision

Add a `shooting_locations` table holding the real-world place: address, coordinates, the location contact (owner/manager), parking/access notes, and permit status. `locations.shooting_location_id` links a fictional location to one `shooting_locations` row (nullable - a location that hasn't been scouted yet simply has no link). Multiple `locations` rows can point at the same `shooting_locations` row, covering the "one house, several scripted locations" case directly.

This mirrors `characters.played_by_contact_id` from ADR-0002 on purpose: a single current link, not a history or a set of candidates. If a "location scouting" workflow with multiple candidate addresses per fictional location is ever needed, that's a separate future table (e.g. `location_scouting_options`) - not a reason to complicate this now.

## Consequences

- Easier: call sheets and schedules can show the real address; multiple script locations sharing one physical location is represented directly instead of duplicating address text across `locations` rows
- Not addressed here: location scouting history (several candidate addresses before one is confirmed) - out of scope for now, same reasoning as recast history in ADR-0002
- Verified: schema change parses cleanly against the real PostgreSQL grammar via `pglast`, and `shooting_locations` is defined before `locations` in `schema.sql` so the foreign key resolves correctly

## Action items

1. [x] Add `shooting_locations` table to `SQL/schema.sql`
2. [x] Add `locations.shooting_location_id` (nullable FK)
3. [ ] When building the location UI: decide whether to geocode addresses automatically (for travel-time-aware scheduling) or keep lat/long manual entry for now
