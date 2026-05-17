-- Agrega el rol cliente al enum usado por public.user_roles.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

-- Vincula cada cliente con un usuario real de auth.users.
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índices / restricciones útiles para evitar duplicados.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_auth_user_id_unique
ON public.clients(auth_user_id)
WHERE auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique
ON public.clients(lower(email))
WHERE email IS NOT NULL;

-- Permite que un cliente autenticado vea solamente su propia fila.
CREATE POLICY "Clients can view own client record"
ON public.clients
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Permite que un cliente autenticado actualice datos básicos de su propia fila.
-- Si en esta iteración NO quieres que el cliente edite nada, puedes omitir esta policy.
CREATE POLICY "Clients can update own basic client record"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());