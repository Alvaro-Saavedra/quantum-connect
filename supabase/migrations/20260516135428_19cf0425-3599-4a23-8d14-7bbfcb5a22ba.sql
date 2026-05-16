
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'asesor', 'soporte');
CREATE TYPE public.client_status AS ENUM ('nuevo', 'en_seguimiento', 'interesado', 'negociacion', 'cerrada', 'postventa');
CREATE TYPE public.priority_level AS ENUM ('baja', 'media', 'alta');
CREATE TYPE public.interaction_type AS ENUM ('llamada', 'email', 'whatsapp', 'nota', 'reunion');
CREATE TYPE public.opportunity_stage AS ENUM ('prospeccion', 'contacto', 'interesado', 'negociacion', 'cerrada_ganada', 'cerrada_perdida');
CREATE TYPE public.task_status AS ENUM ('pendiente', 'en_progreso', 'completada', 'cancelada');

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER ROLES (separate table for security) =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check function (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is user staff (admin or supervisor)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'supervisor')
  )
$$;

-- ===== CLIENTS =====
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  vehicle_interest TEXT,
  status client_status NOT NULL DEFAULT 'nuevo',
  priority priority_level NOT NULL DEFAULT 'media',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX idx_clients_status ON public.clients(status);

-- ===== INTERACTIONS =====
CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type interaction_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_interactions_client_id ON public.client_interactions(client_id);

-- ===== OPPORTUNITIES =====
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage opportunity_stage NOT NULL DEFAULT 'prospeccion',
  estimated_value NUMERIC(12,2) DEFAULT 0,
  expected_close_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_opportunities_assigned_to ON public.opportunities(assigned_to);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);

-- ===== TASKS =====
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pendiente',
  priority priority_level NOT NULL DEFAULT 'media',
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ===== UPDATE TIMESTAMP TRIGGER =====
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== AUTO PROFILE + ROLE ON NEW USER =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Default role: asesor
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'asesor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== RLS POLICIES =====

-- profiles: everyone sees all profiles (needed for assigned_to display); user updates only own
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles: everyone reads (to know who has which role); only admin writes
CREATE POLICY "User roles viewable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- clients
CREATE POLICY "Staff sees all clients, asesor sees own" ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Authenticated can create clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Staff or assigned can update clients" ON public.clients
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Only staff can delete clients" ON public.clients
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- client_interactions
CREATE POLICY "Read interactions if can read client" ON public.client_interactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id
        AND (public.is_staff(auth.uid()) OR c.assigned_to = auth.uid() OR c.created_by = auth.uid())
    )
  );
CREATE POLICY "Authenticated create interactions" ON public.client_interactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes interaction" ON public.client_interactions
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- opportunities
CREATE POLICY "Staff sees all opps, asesor sees own" ON public.opportunities
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Authenticated create opps" ON public.opportunities
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff or assigned update opps" ON public.opportunities
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Staff delete opps" ON public.opportunities
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- tasks
CREATE POLICY "Staff sees all tasks, asesor sees own" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Authenticated create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff or assigned update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "Staff delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
