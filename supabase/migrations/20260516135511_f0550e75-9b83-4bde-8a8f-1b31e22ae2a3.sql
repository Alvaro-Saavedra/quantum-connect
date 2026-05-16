
-- Fix mutable search_path on update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke public/anon execute on security definer helpers (only authenticated should call has_role/is_staff)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten WITH CHECK (true) policies
DROP POLICY IF EXISTS "Authenticated create opps" ON public.opportunities;
CREATE POLICY "Staff or asesor create opps" ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND (c.assigned_to = auth.uid() OR c.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated create tasks" ON public.tasks;
CREATE POLICY "Staff or asesor create tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    OR assigned_to = auth.uid()
  );
