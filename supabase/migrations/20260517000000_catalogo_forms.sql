-- ===== TABLA: cotizaciones =====
-- Almacena leads generados desde el formulario "Comenzar Cotización" del catálogo público.
-- No requiere auth (RLS permite INSERT anónimo).

CREATE TABLE public.cotizaciones (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo       TEXT,                          -- modelo de interés o 'sin_especificar'
  metodo_pago    TEXT        NOT NULL CHECK (metodo_pago IN ('contado', 'credito')),
  plan_meses     INTEGER,                       -- NULL cuando metodo_pago = 'contado'
  mensaje        TEXT,
  -- trazabilidad
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para queries por vehículo en el panel CRM
CREATE INDEX idx_cotizaciones_vehiculo ON public.cotizaciones(vehiculo);
CREATE INDEX idx_cotizaciones_created  ON public.cotizaciones(created_at DESC);

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede insertar (formulario público)
CREATE POLICY "anon insert cotizaciones"
  ON public.cotizaciones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo staff autenticado puede leer
CREATE POLICY "staff read cotizaciones"
  ON public.cotizaciones FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));


-- ===== TABLA: perfiles_usuario =====
-- Almacena datos demográficos / segmentación capturados en "Completar Perfil".
-- Igual: INSERT público, lectura solo staff.

CREATE TABLE public.perfiles_usuario (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  edad                 INTEGER     CHECK (edad BETWEEN 16 AND 100),
  sexo                 TEXT        CHECK (sexo IN ('masculino', 'femenino', 'no_especificado')),
  miembros_familia     INTEGER     CHECK (miembros_familia BETWEEN 1 AND 20),
  ocupacion            TEXT,
  sector_laboral       TEXT,
  rango_ingresos       TEXT,
  tiene_vehiculo       BOOLEAN,
  uso_principal        TEXT,
  distancia_diaria     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_perfiles_created ON public.perfiles_usuario(created_at DESC);

ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert perfiles"
  ON public.perfiles_usuario FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "staff read perfiles"
  ON public.perfiles_usuario FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));
