-- Profiles used by social presence
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  handle TEXT NOT NULL DEFAULT ('user-' || substr(gen_random_uuid()::text, 1, 8)),
  display_name TEXT NOT NULL DEFAULT 'Usuário',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User progress cloud sync
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  dopamine_profile JSONB,
  completed_lessons TEXT[] NOT NULL DEFAULT '{}',
  current_level TEXT NOT NULL DEFAULT 'A1',
  streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.user_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
ON public.user_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Spaced review queue
CREATE TABLE public.phrase_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phrase_key TEXT NOT NULL,
  en TEXT NOT NULL,
  pt TEXT,
  topic TEXT NOT NULL DEFAULT 'Geral',
  lesson_id TEXT,
  source TEXT NOT NULL DEFAULT 'lesson',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  hesitation_count INTEGER NOT NULL DEFAULT 0,
  pronunciation_score NUMERIC,
  interval_days INTEGER NOT NULL DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_review TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, phrase_key)
);

ALTER TABLE public.phrase_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own phrase reviews"
ON public.phrase_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own phrase reviews"
ON public.phrase_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phrase reviews"
ON public.phrase_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public room chat
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view room messages"
ON public.room_messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can send their own room messages"
ON public.room_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Direct messages
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own direct messages"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send their own direct messages"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark direct messages read"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Presence
CREATE TABLE public.user_status (
  user_id UUID NOT NULL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view status"
ON public.user_status
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own status"
ON public.user_status
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own status"
ON public.user_status
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Message reactions
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (target_type, message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reactions"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own reactions"
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Sticker metadata
CREATE TABLE public.sticker_packs (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visible sticker packs"
ON public.sticker_packs
FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create their own sticker packs"
ON public.sticker_packs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own sticker packs"
ON public.sticker_packs
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  alt TEXT,
  sort_order BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visible stickers"
ON public.stickers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sticker_packs sp
    WHERE sp.id = stickers.pack_id
      AND (sp.is_public = true OR sp.owner_id = auth.uid())
  )
);

CREATE POLICY "Users can create stickers in their own packs"
ON public.stickers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sticker_packs sp
    WHERE sp.id = stickers.pack_id
      AND sp.owner_id = auth.uid()
  )
);

-- File bucket for stickers
INSERT INTO storage.buckets (id, name, public)
VALUES ('stickers', 'stickers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sticker files are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'stickers');

CREATE POLICY "Users can upload sticker files to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stickers'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Helpful indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_phrase_reviews_user_next ON public.phrase_reviews(user_id, next_review);
CREATE INDEX idx_room_messages_created_at ON public.room_messages(created_at);
CREATE INDEX idx_direct_messages_participants ON public.direct_messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_message_reactions_message ON public.message_reactions(target_type, message_id);
CREATE INDEX idx_stickers_pack_id ON public.stickers(pack_id);

-- Keep realtime subscriptions working for these features
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;