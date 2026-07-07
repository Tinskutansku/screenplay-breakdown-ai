CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
-- password_hash is nullable because a user who only ever signs in via
-- Google OAuth (see oauth_accounts) never sets a password.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- OAUTH_ACCOUNTS
-- Links a third-party login (Google, later maybe GitHub) to a user row so
-- password and OAuth login both resolve to the same account.
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

-- REFRESH_TOKENS
-- Stores a hash of each issued refresh token (never the raw token) so a
-- specific session can be revoked before its natural expiry.
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PROJECTS
-- created_by is kept for display/audit ("created by X") but access control
-- goes through project_members, not this column - a project can be shared
-- across a production team (script supervisor, 1st AD, coordinator, etc.).
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- PROJECT_MEMBERS
-- Who can access a project and with what role. This is what authorization
-- checks in the API should query - never projects.created_by alone.
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer', -- 'owner' | 'editor' | 'viewer'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

-- SCRIPTS
-- One logical screenplay within a project (a project could have more than
-- one script, e.g. multiple episodes). Actual scene content lives under
-- script_revisions, not directly here - see below.
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SCRIPT_REVISIONS
-- Industry-standard colored-page revision tracking (White, Blue, Pink,
-- Yellow, Green, Goldenrod, ...). Each new upload/parse of a script
-- creates a new revision rather than overwriting the previous one, so
-- schedules already built against an older revision aren't silently
-- invalidated. Only one revision per script should be "current" at a
-- time - enforced below with a partial unique index.
-- Matching a scene in a new revision to "the same" scene in a previous
-- revision (to carry forward its schedule placement) is done by
-- scene_number and is an application-level concern, not enforced by the
-- schema, since scene numbers can still change (splits like "24A") even
-- though they're usually stable across revisions.
CREATE TABLE script_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    color_name TEXT NOT NULL DEFAULT 'white',
    label TEXT,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_one_current_revision_per_script
    ON script_revisions(script_id) WHERE is_current;

-- CONTACTS
-- Real people involved in the production (cast and crew), as opposed to
-- `characters` below, which are fictional people in the story. This is
-- what a call sheet actually needs to know who to call and when.
-- agent_name/agent_phone/agent_email are separate from the contact's own
-- phone/email - a call sheet needs to reach the agent for scheduling and
-- contract matters, not just the talent directly. Nullable since crew
-- typically don't have an agent on file.
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT, -- e.g. 'Actor', '1st AD', 'Script Supervisor', 'Gaffer'
    department TEXT, -- e.g. 'Cast', 'Camera', 'Grip', 'Production' - for grouping on the call sheet
    phone TEXT,
    email TEXT,
    agent_name TEXT,
    agent_phone TEXT,
    agent_email TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SHOOTING_LOCATIONS
-- The real-world place, as opposed to `locations` below, which is the
-- fictional location name as written in the script (e.g. "Annan koti").
-- One shooting_locations row commonly covers several `locations` rows -
-- "Annan koti - keittiö" (INT) and "Annan koti - piha" (EXT) might both
-- be the same house.
CREATE TABLE shooting_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT, -- a friendly label for the real place, e.g. "Meilahden omakotitalo"
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT,
    latitude FLOAT,
    longitude FLOAT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    parking_notes TEXT,
    access_notes TEXT,
    permit_status TEXT, -- e.g. 'not started' | 'requested' | 'confirmed'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- LOCATIONS
-- shooting_location_id is nullable - a scripted location that hasn't been
-- scouted yet simply has no real-world place linked yet.
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    shooting_location_id UUID REFERENCES shooting_locations(id) ON DELETE SET NULL
);

-- CHARACTERS
-- played_by_contact_id links a fictional character to the real actor
-- playing them (nullable - not cast yet, or a background/unnamed role).
-- Kept as a single FK rather than a join table for simplicity - a recast
-- mid-production would just repoint this FK, with no history kept. If
-- recast history ever matters, this should become its own join table.
-- cast_number is the production-assigned cast list number shown across
-- the breakdown, strips, and call sheet UI (e.g. "1 - Hayes"). Assigned
-- by importance/billing, not scene order, so it must be stored, not
-- computed. Nullable - background/unnamed characters don't get one.
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    character_type TEXT,
    cast_number INTEGER,
    played_by_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_one_cast_number_per_project
    ON characters(project_id, cast_number) WHERE cast_number IS NOT NULL;

-- SCENES
-- Belongs to a specific script revision (not the script directly), since
-- scene content can change between revisions.
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_revision_id UUID NOT NULL REFERENCES script_revisions(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    scene_number TEXT,
    int_ext TEXT,
    time_of_day TEXT,
    page_eighths INTEGER,
    page_display TEXT,
    script_day INTEGER,
    complexity_score FLOAT,
    complexity_label TEXT,
    description TEXT,
    scene_order INTEGER,
    notes TEXT
);

-- SCENE_CHARACTERS
CREATE TABLE scene_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    role_type TEXT
);

-- SCENE_ELEMENTS
CREATE TABLE scene_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL,
    value TEXT NOT NULL
);

-- SHOOTING_DAYS
CREATE TABLE shooting_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    shoot_date DATE
);

-- STRIPS
-- A stripboard strip is its own entity, deliberately decoupled 1:1 from
-- scenes, so scenes and strips can be combined and split independently:
--   - one long scene shot across two days -> two strips, both pointing at
--     the same scene via strip_scenes (partial_note distinguishes them,
--     e.g. "sivut 24-24A" vs. "sivu 24B")
--   - several short scenes covered by one setup -> one strip with several
--     strip_scenes rows
-- A strip that exists but isn't yet assigned to a shooting day (no
-- schedule_items row) represents an unscheduled strip sitting on the
-- board, same as a physical stripboard before the day-by-day arrangement
-- is finalized.
CREATE TABLE strips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT,
    estimated_eighths INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- STRIP_SCENES
CREATE TABLE strip_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strip_id UUID NOT NULL REFERENCES strips(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    partial_note TEXT -- e.g. "sivut 24-24A vain", for a split scene
);

-- SCHEDULE_ITEMS
-- Places a strip (not a scene directly - see STRIPS above) on a specific
-- shooting day and position.
CREATE TABLE schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shooting_day_id UUID NOT NULL REFERENCES shooting_days(id) ON DELETE CASCADE,
    strip_id UUID NOT NULL REFERENCES strips(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL
);

-- CALL_SHEETS
-- One call sheet per shooting day. Which scenes/characters are covered
-- that day is already derivable via schedule_items -> strips ->
-- strip_scenes -> scenes -> scene_characters, so it isn't duplicated
-- here - this table only holds the logistics layer a call sheet adds on
-- top of the schedule.
CREATE TABLE call_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shooting_day_id UUID NOT NULL UNIQUE REFERENCES shooting_days(id) ON DELETE CASCADE,
    general_call_time TIME,
    crew_call_time TIME,
    shooting_call_time TIME,
    location_notes TEXT,
    weather_notes TEXT,
    nearest_hospital TEXT,
    parking_notes TEXT,
    general_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CALL_SHEET_ENTRIES
-- Per-person call time for a given call sheet - background/crew are
-- typically called earlier than lead cast, so each person needs their
-- own time, not just the sheet-wide default times above.
-- Three separate times (not one) because a shooting day genuinely has
-- three distinct moments per person: when makeup/hair starts, when they
-- need to be ready on set, and the general unit call. Collapsing these
-- into a single call_time would lose information the call sheet UI
-- already models.
CREATE TABLE call_sheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sheet_id UUID NOT NULL REFERENCES call_sheets(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    makeup_hair_time TIME,
    on_set_time TIME,
    unit_call_time TIME,
    pickup_time TIME,
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    UNIQUE (call_sheet_id, contact_id)
);

-- CALL_SHEET_DEPARTMENT_NOTES
-- One row per note/bullet, grouped by department (Camera, Lighting,
-- Art/Set Dec, Transport, ...) and ordered within that department.
-- Replaces a single call_sheets.general_notes blob so individual notes
-- can be added/removed/reordered independently in the UI, per
-- department, without rewriting a shared text field on every edit.
CREATE TABLE call_sheet_department_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sheet_id UUID NOT NULL REFERENCES call_sheets(id) ON DELETE CASCADE,
    department TEXT NOT NULL, -- e.g. 'Camera', 'Lighting', 'Art / Set Dec', 'Transport'
    note_text TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- INDEKSIT nopeuttamaan hakuja
CREATE INDEX idx_scenes_script_revision_id ON scenes(script_revision_id);
CREATE INDEX idx_scenes_location_id ON scenes(location_id);
CREATE INDEX idx_scene_elements_scene_id ON scene_elements(scene_id);
CREATE INDEX idx_scene_characters_scene_id ON scene_characters(scene_id);
CREATE INDEX idx_schedule_items_shooting_day_id ON schedule_items(shooting_day_id);
CREATE INDEX idx_schedule_items_strip_id ON schedule_items(strip_id);
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_script_revisions_script_id ON script_revisions(script_id);
CREATE INDEX idx_contacts_project_id ON contacts(project_id);
CREATE INDEX idx_characters_played_by_contact_id ON characters(played_by_contact_id);
CREATE INDEX idx_strips_project_id ON strips(project_id);
CREATE INDEX idx_strip_scenes_strip_id ON strip_scenes(strip_id);
CREATE INDEX idx_strip_scenes_scene_id ON strip_scenes(scene_id);
CREATE INDEX idx_call_sheet_entries_call_sheet_id ON call_sheet_entries(call_sheet_id);
CREATE INDEX idx_call_sheet_entries_contact_id ON call_sheet_entries(contact_id);
CREATE INDEX idx_locations_shooting_location_id ON locations(shooting_location_id);
CREATE INDEX idx_shooting_locations_project_id ON shooting_locations(project_id);
CREATE INDEX idx_call_sheet_department_notes_call_sheet_id ON call_sheet_department_notes(call_sheet_id);
