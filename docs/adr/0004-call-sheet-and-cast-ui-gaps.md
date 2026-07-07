# ADR-0004: Cast numbering, agent contacts, split call times, structured department notes

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Tanja

## Context

Tanja has been designing the production UI in Figma (Script Breakdown, Strips Board, Call Sheet views) independently of this schema work. Reviewing that design against `SQL/schema.sql` surfaced four concrete gaps - things the UI needs that the schema, as it stood after ADR-0002/0003, has no place for. Same motivation as every prior ADR in this project: catching these now, before a live database exists, is far cheaper than migrating real production data later.

The UI review covered all three workflow views and the call sheet's cast table specifically, since that's the most data-dense screen and the one most likely to expose missing fields.

## Decision

Four additions:

1. **`characters.cast_number`** (nullable `INTEGER`). Every view in the UI (breakdown sidebar, strips, call sheet) labels cast members with a stable number - "1 - Hayes", "2 - Mora" - consistently across screens. This is the industry-standard cast list number, assigned by the production (typically by importance, not scene order), not something derivable from scene appearance order. Nullable because background/unnamed characters don't get one. A partial unique index enforces uniqueness per project only where a number is actually assigned.

2. **Agent contact fields on `contacts`**: `agent_name`, `agent_phone`, `agent_email`. The call sheet's cast table has a distinct "Agent / Contact" column, separate from the actor's own phone/email - productions need to reach the agent, not just the talent directly, for scheduling and contract matters. This is plain data on the same `contacts` row rather than a separate table, since an agent is a property of the contact, not an independent entity the schema needs to query on its own.

3. **Split call time on `call_sheet_entries`**: replace the single `call_time` with `makeup_hair_time`, `on_set_time`, `unit_call_time`. The call sheet's cast table shows three distinct times per person, because makeup/hair, being ready on set, and the general unit call are genuinely different moments in a shooting day - collapsing them into one field would lose information the UI already models. `pickup_time` is unchanged (separate transport concern).

4. **New `call_sheet_department_notes` table**: `id`, `call_sheet_id`, `department`, `note_text`, `order_index`. The prior schema held all department notes (Camera, Lighting, Art/Set Dec, Transport, ...) in one `call_sheets.general_notes` text blob. Tanja's own instructions to the Figma design tool explicitly asked for this section to be "completely editable" with add/remove buttons per note and per department - that only works if each note is its own row, not a paragraph inside a shared blob. One row per bullet, grouped by `department`, ordered by `order_index` - mirrors how `scene_elements` already models one-row-per-item instead of a blob.

## Options considered

For cast numbering, the alternative was deriving a display number from scene appearance order on the fly. Rejected: real productions assign cast numbers by importance/billing, not scene order, and once assigned they don't change even if the script is re-ordered - this has to be stored, not computed.

For the agent fields, the alternative was a separate `agents` table with its own `contacts`-style row, referenced from `contacts.agent_id`. Rejected for now as over-engineering: nothing in the roadmap needs to query or list agents independently (e.g. "all actors who share an agent"), so three plain columns on `contacts` is the simpler model. If that need ever appears, this can be split out later without touching unrelated tables.

For call times, the alternative was keeping one `call_time` and pushing makeup/on-set timing into `notes` text. Rejected: these are exactly the kind of structured, sortable, per-person data a call sheet exists to communicate - free text defeats the point of having the field at all.

For department notes, the alternative was keeping `general_notes` as one blob and parsing/splitting it by department heading in the frontend. Rejected: fragile (depends on consistent heading formatting), and doesn't support add/remove of individual bullets or reordering without rewriting the whole blob every edit.

## Consequences

- Easier: the call sheet UI (including Tanja's own edit/add/remove requirements) is now directly representable; cast numbering is consistent everywhere it's displayed instead of being computed inconsistently in different views
- Harder: one more join (`call_sheet_department_notes`) to assemble a full call sheet instead of reading one text field; `contacts` grows three more nullable columns that are irrelevant for crew (only cast typically have agents)
- Not addressed here: an `agents` entity of its own - deferred until something actually needs to query across agents, not just display one per contact
- Verified: schema change parses cleanly against the real PostgreSQL grammar via `pglast`, and foreign-key ordering was re-checked across all tables

## Action items

1. [ ] Add `characters.cast_number` (nullable, partial unique index per project)
2. [ ] Add `contacts.agent_name`, `contacts.agent_phone`, `contacts.agent_email`
3. [ ] Replace `call_sheet_entries.call_time` with `makeup_hair_time`, `on_set_time`, `unit_call_time`
4. [ ] Add `call_sheet_department_notes` table
5. [ ] When building the call sheet UI: decide whether `department` becomes a fixed lookup list or stays free text, same open question ADR-0002 already flagged for call sheet departments generally
