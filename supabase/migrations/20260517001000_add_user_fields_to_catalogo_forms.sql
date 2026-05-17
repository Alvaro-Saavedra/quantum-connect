-- ===== ADD USER FIELDS TO CATALOG FORM TABLES =====
-- Guarda los datos del usuario autenticado cuando envía cotizaciones y perfiles.

ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_nombre TEXT,
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS user_telefono TEXT,
  ADD COLUMN IF NOT EXISTS user_ciudad TEXT;

ALTER TABLE public.perfiles_usuario
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_nombre TEXT;
