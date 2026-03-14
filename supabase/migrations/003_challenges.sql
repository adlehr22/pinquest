-- ── Challenge runs ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS challenge_runs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_code    text        UNIQUE NOT NULL,
  location_ids      integer[]   NOT NULL,
  original_score    integer     NOT NULL,
  original_username text,
  original_user_id  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  times_played      integer     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE challenge_runs ENABLE ROW LEVEL SECURITY;

-- Anyone can read (to accept a challenge)
CREATE POLICY "public_read_challenges"
  ON challenge_runs FOR SELECT
  USING (true);

-- Anyone can create a challenge
CREATE POLICY "public_create_challenges"
  ON challenge_runs FOR INSERT
  WITH CHECK (true);

-- Anyone can increment times_played
CREATE POLICY "public_update_challenges"
  ON challenge_runs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── Helper RPC ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_challenge_plays(code_arg text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE challenge_runs
  SET times_played = times_played + 1
  WHERE challenge_code = code_arg;
$$;
