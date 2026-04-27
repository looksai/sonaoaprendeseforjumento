DROP POLICY IF EXISTS "Sticker files are publicly readable" ON storage.objects;

UPDATE storage.buckets
SET public = false
WHERE id = 'stickers';

CREATE POLICY "Authenticated users can read sticker files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'stickers');