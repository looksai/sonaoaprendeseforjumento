-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===== user_progress =====
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dopamine_profile JSONB,
  completed_lessons JSONB DEFAULT '[]'::jsonb,
  current_level TEXT,
  streak INTEGER NOT NULL DEFAULT 0,
  last_study_date TEXT,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "up_select_own" ON public.user_progress;
CREATE POLICY "up_select_own" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "up_insert_own" ON public.user_progress;
CREATE POLICY "up_insert_own" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "up_update_own" ON public.user_progress;
CREATE POLICY "up_update_own" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "up_delete_own" ON public.user_progress;
CREATE POLICY "up_delete_own" ON public.user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_user_progress_updated ON public.user_progress;
CREATE TRIGGER trg_user_progress_updated BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== phrase_reviews =====
CREATE TABLE IF NOT EXISTS public.phrase_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_key TEXT NOT NULL,
  en TEXT NOT NULL,
  pt TEXT,
  topic TEXT,
  lesson_id TEXT,
  source TEXT,
  difficulty NUMERIC NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  hesitation_count INTEGER NOT NULL DEFAULT 0,
  pronunciation_score NUMERIC,
  interval_days NUMERIC NOT NULL DEFAULT 1,
  last_seen TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, phrase_key)
);
CREATE INDEX IF NOT EXISTS idx_phrase_reviews_user_next ON public.phrase_reviews (user_id, next_review);
ALTER TABLE public.phrase_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pr_select_own" ON public.phrase_reviews;
CREATE POLICY "pr_select_own" ON public.phrase_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "pr_insert_own" ON public.phrase_reviews;
CREATE POLICY "pr_insert_own" ON public.phrase_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pr_update_own" ON public.phrase_reviews;
CREATE POLICY "pr_update_own" ON public.phrase_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "pr_delete_own" ON public.phrase_reviews;
CREATE POLICY "pr_delete_own" ON public.phrase_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_phrase_reviews_updated ON public.phrase_reviews;
CREATE TRIGGER trg_phrase_reviews_updated BEFORE UPDATE ON public.phrase_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== profiles =====
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle     TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_handle_lowercase CHECK (handle = lower(handle)),
  CONSTRAINT profiles_handle_format CHECK (handle ~ '^[a-z0-9_.-]{2,32}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_unique ON public.profiles (handle);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pf_select_auth" ON public.profiles;
CREATE POLICY "pf_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pf_insert_own" ON public.profiles;
CREATE POLICY "pf_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pf_update_own" ON public.profiles;
CREATE POLICY "pf_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_handle TEXT;
  candidate   TEXT;
  suffix      INT := 0;
  display     TEXT;
BEGIN
  display := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'user'
  );
  base_handle := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'handle', display, 'user'),
    '[^a-zA-Z0-9_.-]+', '', 'g'
  ));
  IF base_handle IS NULL OR length(base_handle) < 2 THEN
    base_handle := 'user' || substr(NEW.id::text, 1, 6);
  END IF;
  IF length(base_handle) > 28 THEN
    base_handle := substr(base_handle, 1, 28);
  END IF;
  candidate := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_handle || suffix::text;
  END LOOP;
  INSERT INTO public.profiles (user_id, handle, display_name)
  VALUES (NEW.id, candidate, display)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (user_id, handle, display_name)
SELECT u.id,
       lower('user' || substr(u.id::text, 1, 8)),
       COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'user')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT DO NOTHING;

-- ===== chat_rooms =====
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  topic       TEXT,
  vibe        TEXT NOT NULL DEFAULT 'uol',
  language    TEXT NOT NULL DEFAULT 'PT/EN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cr_select_auth" ON public.chat_rooms;
CREATE POLICY "cr_select_auth" ON public.chat_rooms FOR SELECT TO authenticated USING (true);
INSERT INTO public.chat_rooms (id, name, topic, vibe, language) VALUES
  ('r-geral',     'Bate-papo Geral',         'Chegue, puxe assunto e treine sem pressão.',     'uol',   'PT/EN'),
  ('r-pronuncia', 'Pronúncia sem vergonha',  'Repita frases curtas, receba ajuda e destrave.', 'voice', 'EN/PT')
ON CONFLICT (id) DO NOTHING;

-- ===== room_messages =====
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL DEFAULT 'r-geral',
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text','voice','system','sticker')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON public.room_messages (room_id, created_at);
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rm_select_auth" ON public.room_messages;
CREATE POLICY "rm_select_auth" ON public.room_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "rm_insert_self" ON public.room_messages;
CREATE POLICY "rm_insert_self" ON public.room_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "rm_delete_self" ON public.room_messages;
CREATE POLICY "rm_delete_self" ON public.room_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);
ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== direct_messages =====
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text','voice','sticker')),
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dm_no_self CHECK (sender_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS idx_dm_recipient_created ON public.direct_messages (recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_sender_created ON public.direct_messages (sender_id, created_at);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm_select_participants" ON public.direct_messages;
CREATE POLICY "dm_select_participants" ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS "dm_insert_self" ON public.direct_messages;
CREATE POLICY "dm_insert_self" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "dm_update_recipient" ON public.direct_messages;
CREATE POLICY "dm_update_recipient" ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "dm_delete_sender" ON public.direct_messages;
CREATE POLICY "dm_delete_sender" ON public.direct_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Guard direct message updates: recipient may only mark read_at, never edit message content/participants.
CREATE OR REPLACE FUNCTION public.guard_direct_message_read_update()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
    OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
    OR NEW.content IS DISTINCT FROM OLD.content
    OR NEW.kind IS DISTINCT FROM OLD.kind
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at can be updated on direct_messages';
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_guard_direct_message_read_update ON public.direct_messages;
CREATE TRIGGER trg_guard_direct_message_read_update
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_direct_message_read_update();

ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== user_status (presence) =====
DO $$ BEGIN
  CREATE TYPE public.presence_status AS ENUM ('online', 'invisible', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_status (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status     public.presence_status NOT NULL DEFAULT 'offline',
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "us_select_online_or_self" ON public.user_status;
CREATE POLICY "us_select_online_or_self" ON public.user_status FOR SELECT TO authenticated
  USING (status = 'online' OR auth.uid() = user_id);
DROP POLICY IF EXISTS "us_insert_self" ON public.user_status;
CREATE POLICY "us_insert_self" ON public.user_status FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "us_update_self" ON public.user_status;
CREATE POLICY "us_update_self" ON public.user_status FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_user_status_updated ON public.user_status;
CREATE TRIGGER trg_user_status_updated BEFORE UPDATE ON public.user_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.user_status REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_status;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;