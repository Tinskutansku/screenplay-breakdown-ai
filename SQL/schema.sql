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
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- LOCATIONS
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- CHARACTERS
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    character_type TEXT
);

-- SCENES
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
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

-- SCHEDULE_ITEMS
CREATE TABLE schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shooting_day_id UUID NOT NULL REFERENCES shooting_days(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL
);

-- INDEKSIT nopeuttamaan hakuja
CREATE INDEX idx_scenes_script_id ON scenes(script_id);
CREATE INDEX idx_scenes_location_id ON scenes(location_id);
CREATE INDEX idx_scene_elements_scene_id ON scene_elements(scene_id);
CREATE INDEX idx_scene_characters_scene_id ON scene_characters(scene_id);
CREATE INDEX idx_schedule_items_shooting_day_id ON schedule_items(shooting_day_id);
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
