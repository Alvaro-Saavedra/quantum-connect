-- Permite manejar clientes como usuarios autenticables.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

-- Vincula clients con auth.users.
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Evita que un usuario Auth esté vinculado a más de un cliente.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_auth_user_id_unique
ON public.clients(auth_user_id)
WHERE auth_user_id IS NOT NULL;

-- Evita duplicados de email en clientes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique
ON public.clients(lower(email))
WHERE email IS NOT NULL;

-- Crea la policy solo si todavía no existe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND policyname = 'Clients can view own client record'
  ) THEN
    CREATE POLICY "Clients can view own client record"
    ON public.clients
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());
  END IF;
END $$;