
-- Storage RLS policies. Path convention: {group_id}/{user_id?}/{filename}
-- payment-proofs: {group_id}/{user_id}/{file}
CREATE POLICY "pp member upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND public.is_group_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
CREATE POLICY "pp member read own" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND ((storage.foldername(name))[2] = auth.uid()::text
       OR public.is_group_manager(auth.uid(), ((storage.foldername(name))[1])::uuid))
);
CREATE POLICY "pp manager manage" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-proofs' AND public.is_group_manager(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "pp manager delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-proofs' AND public.is_group_manager(auth.uid(), ((storage.foldername(name))[1])::uuid));

-- group-documents: {group_id}/{file}
CREATE POLICY "gd member read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'group-documents' AND public.is_group_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "gd manager write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'group-documents' AND public.is_group_manager(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "gd manager update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'group-documents' AND public.is_group_manager(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "gd manager delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'group-documents' AND public.is_group_manager(auth.uid(), ((storage.foldername(name))[1])::uuid));
