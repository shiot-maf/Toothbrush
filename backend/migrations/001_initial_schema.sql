CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    refresh_token_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    relationship VARCHAR(50),
    personality TEXT NOT NULL,
    speech_style TEXT NOT NULL,
    background TEXT,
    likes TEXT,
    dislikes TEXT,
    api_provider VARCHAR(20) DEFAULT 'novelai',
    intimacy_score INTEGER NOT NULL DEFAULT 0,
    current_stage INTEGER NOT NULL DEFAULT 0,
    stage_name TEXT NOT NULL DEFAULT '?뺣왂寃고샎',
    current_phase VARCHAR(30) DEFAULT 'normal',
    phase_intimacy_score INTEGER NOT NULL DEFAULT 0,
    consecutive_negative_count INTEGER NOT NULL DEFAULT 0,
    current_mood TEXT,
    recent_story_event TEXT,
    last_message_date TIMESTAMPTZ DEFAULT now(),
    total_messages INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    phase VARCHAR(30) DEFAULT 'normal',
    sentiment VARCHAR(10) DEFAULT 'neutral',
    tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_character_id ON chat_messages(character_id);
CREATE INDEX IF NOT EXISTS idx_messages_tsv ON chat_messages USING GIN(tsv);