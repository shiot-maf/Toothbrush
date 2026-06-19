ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(64);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS current_phase VARCHAR(30) DEFAULT 'normal';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS phase_intimacy_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS phase VARCHAR(30) DEFAULT 'normal';
CREATE INDEX IF NOT EXISTS idx_characters_current_phase ON characters(current_phase);