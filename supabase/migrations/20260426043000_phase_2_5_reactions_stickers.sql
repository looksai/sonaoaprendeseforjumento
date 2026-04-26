-- Phase 2.5: reactions + sticker storage.
-- Fully additive and safe to run after the base chat migration.

-- ===== message_reactions =====
DO $$ BEGIN
  CREATE TYPE public.reaction_target AS ENUM ('room', 'dm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type  public.reaction_target NOT NULL,
  message_id   UUID NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_type, message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_target
  ON public.message_reactions (target_type, message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_created
  ON public.message_reactions (user_id, created_at DESC);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mr_select_room" ON public.message_reactions;
CREATE POLICY "mr_select_room" ON public.message_reactions FOR SELECT TO authenticated
  USING (target_type = 'room');

DROP POLICY IF EXISTS "mr_select_dm" ON public.message_reactions;
CREATE POLICY "mr_select_dm" ON public.message_reactions FOR SELECT TO authenticated
  USING (
    target_type = 'dm'
    AND EXISTS (
      SELECT 1 FROM public.direct_messages d
      WHERE d.id = message_reactions.message_id
        AND (auth.uid() = d.sender_id OR auth.uid() = d.recipient_id)
    )
  );

DROP POLICY IF EXISTS "mr_insert_room" ON public.message_reactions;
CREATE POLICY "mr_insert_room" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (
    target_type = 'room'
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.room_messages r
      WHERE r.id = message_reactions.message_id
    )
  );

DROP POLICY IF EXISTS "mr_insert_dm" ON public.message_reactions;
CREATE POLICY "mr_insert_dm" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (
    target_type = 'dm'
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.direct_messages d
      WHERE d.id = message_reactions.message_id
        AND (auth.uid() = d.sender_id OR auth.uid() = d.recipient_id)
    )
  );

DROP POLICY IF EXISTS "mr_delete_own" ON public.message_reactions;
CREATE POLICY "mr_delete_own" ON public.message_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Cleanup orphan reactions when messages are deleted.
CREATE OR REPLACE FUNCTION public.delete_room_message_reactions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.message_reactions
  WHERE target_type = 'room' AND message_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_delete_room_message_reactions ON public.room_messages;
CREATE TRIGGER trg_delete_room_message_reactions
  AFTER DELETE ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION public.delete_room_message_reactions();

CREATE OR REPLACE FUNCTION public.delete_direct_message_reactions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.message_reactions
  WHERE target_type = 'dm' AND message_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_delete_direct_message_reactions ON public.direct_messages;
CREATE TRIGGER trg_delete_direct_message_reactions
  AFTER DELETE ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.delete_direct_message_reactions();

-- ===== sticker storage + catalog =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('stickers', 'stickers', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.sticker_packs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sp_select_visible" ON public.sticker_packs;
CREATE POLICY "sp_select_visible" ON public.sticker_packs FOR SELECT TO authenticated
  USING (is_public OR owner_id = auth.uid());
DROP POLICY IF EXISTS "sp_insert_own" ON public.sticker_packs;
CREATE POLICY "sp_insert_own" ON public.sticker_packs FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "sp_update_own" ON public.sticker_packs;
CREATE POLICY "sp_update_own" ON public.sticker_packs FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "sp_delete_own" ON public.sticker_packs;
CREATE POLICY "sp_delete_own" ON public.sticker_packs FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.stickers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id      TEXT NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt          TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stickers_pack ON public.stickers (pack_id, sort_order);
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "st_select_visible" ON public.stickers;
CREATE POLICY "st_select_visible" ON public.stickers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sticker_packs p
    WHERE p.id = stickers.pack_id
      AND (p.is_public OR p.owner_id = auth.uid())
  ));
DROP POLICY IF EXISTS "st_insert_own_pack" ON public.stickers;
CREATE POLICY "st_insert_own_pack" ON public.stickers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sticker_packs p
    WHERE p.id = stickers.pack_id AND p.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "st_update_own_pack" ON public.stickers;
CREATE POLICY "st_update_own_pack" ON public.stickers FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sticker_packs p
    WHERE p.id = stickers.pack_id AND p.owner_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.sticker_packs p
    WHERE p.id = stickers.pack_id AND p.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "st_delete_own_pack" ON public.stickers;
CREATE POLICY "st_delete_own_pack" ON public.stickers FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sticker_packs p
    WHERE p.id = stickers.pack_id AND p.owner_id = auth.uid()
  ));

-- Starter global pack using emoji sticker content already supported by the client.
-- Real image packs can be added later under storage path global/<pack>/<file>.
INSERT INTO public.sticker_packs (id, name, owner_id, is_public)
VALUES ('starter-br', 'Figurinhas BR — Básico', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Storage write policies for user-uploaded stickers.
DROP POLICY IF EXISTS "stickers_user_upload" ON storage.objects;
CREATE POLICY "stickers_user_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'stickers'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "stickers_user_update" ON storage.objects;
CREATE POLICY "stickers_user_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'stickers'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'stickers'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "stickers_user_delete" ON storage.objects;
CREATE POLICY "stickers_user_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'stickers'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
