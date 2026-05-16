# Plan MVP — Quantum CRM

Plataforma interna para el equipo comercial de Quantum Motors. Tema oscuro tipo glassmorphism con acentos verde (#4ade80) y azul eléctrico (#3b82f6), basado en la dirección visual seleccionada.

## Alcance del MVP

Incluido en esta primera versión:
1. **Autenticación y roles** — login email/password + Google, con roles admin / supervisor / asesor / soporte
2. **Dashboard** — KPIs, embudo, actividad reciente, clientes recientes
3. **Gestión de clientes (CRM)** — listado con filtros, ficha completa, historial de interacciones, importación CSV
4. **Pipeline comercial** — vista kanban por estado, oportunidades, asignación a asesores, tareas
5. **Reportes** — métricas de conversión, rendimiento por asesor, exportación CSV
6. **Usuarios y roles** — panel admin para gestionar el equipo
7. **Búsqueda global, notificaciones (estructura) y modo oscuro por defecto**

Fuera del MVP (fases posteriores):
- Chatbot IA y automatización de respuestas
- Integraciones reales con WhatsApp API, Meta, Gmail, Google Calendar (la UI se deja preparada con secciones placeholder)
- Cotizaciones avanzadas y firma electrónica
- App móvil

## Arquitectura

```text
┌─────────────────────────────────────────┐
│  TanStack Start (React + TypeScript)    │
│  ├─ Rutas públicas: /login              │
│  └─ Rutas protegidas: /_authenticated/* │
│       ├─ /dashboard                     │
│       ├─ /clientes  /clientes/$id       │
│       ├─ /pipeline                      │
│       ├─ /reportes                      │
│       └─ /usuarios (solo admin)         │
├─────────────────────────────────────────┤
│  Server functions (createServerFn)      │
│  + Auth middleware (Supabase)           │
├─────────────────────────────────────────┤
│  Lovable Cloud (Supabase)               │
│  Auth · Postgres · RLS · Storage        │
└─────────────────────────────────────────┘
```

## Modelo de datos (Postgres)

- `profiles` — perfil del usuario interno (full_name, avatar_url, phone)
- `user_roles` — `(user_id, role)` con enum `admin | supervisor | asesor | soporte` (tabla separada por seguridad)
- `clients` — nombre, teléfono, email, ciudad, vehículo de interés, estado, prioridad, asesor asignado, observaciones
- `client_interactions` — historial cronológico (llamada, email, whatsapp, nota, reunión)
- `opportunities` — oportunidad de venta vinculada a cliente, etapa del pipeline, valor estimado, fecha de cierre prevista
- `tasks` — tareas/recordatorios asignados a asesores
- `activity_log` — auditoría general (quién hizo qué, cuándo)

Función `has_role(_user_id, _role)` con `SECURITY DEFINER` para usar dentro de las políticas RLS sin recursión. Toda tabla con RLS habilitado y políticas que limitan acceso por rol y por asesor asignado.

## Módulos a construir

### 1. Diseño base y shell
- Tokens en `src/styles.css` (canvas, surface-glass, brand-primary verde, brand-secondary azul, bordes neutral-800/50)
- Layout con sidebar fija + topbar con buscador global y botón "Nuevo Cliente"
- Componentes shadcn personalizados con la estética glassmorphism

### 2. Autenticación
- Activar Lovable Cloud
- Páginas `/login` (email/password + Google)
- Layout `_authenticated` con guard y redirect a /login
- Hook de sesión + invalidación en `onAuthStateChange`

### 3. Dashboard (`/dashboard`)
- 4 KPI cards (Ventas mensuales, Leads activos, Conversaciones, Cierre %)
- Embudo de ventas (recharts) + gráfico de actividad
- Tabla de clientes recientes con badges de estado

### 4. Clientes (`/clientes`, `/clientes/$id`)
- Listado con filtros (estado, ciudad, asesor, prioridad), búsqueda y paginación
- Formulario crear/editar con validación Zod
- Ficha cliente: datos + timeline de interacciones + tareas + oportunidades vinculadas
- Importación CSV (parseo en server function, validación, preview, commit)

### 5. Pipeline (`/pipeline`)
- Vista kanban con columnas por estado (Nuevo → Postventa)
- Drag & drop para mover oportunidades entre etapas
- Vista lista alternativa con filtros

### 6. Reportes (`/reportes`)
- Gráficos de conversión, tiempo de respuesta, efectividad por asesor
- Filtros por rango de fechas y asesor
- Exportación CSV

### 7. Usuarios (`/usuarios`, solo admin)
- Listado del equipo con su rol
- Invitar usuario, cambiar rol, desactivar

### 8. Integraciones (`/integraciones`)
- Página con tarjetas para WhatsApp, Meta, Gmail, Calendar marcadas como "Próximamente"

## Detalles técnicos

- **Stack**: TanStack Start (template actual), TypeScript, Tailwind v4, shadcn/ui, recharts para gráficos
- **Backend**: Lovable Cloud (Supabase) — auth, Postgres con RLS, server functions con `requireSupabaseAuth`
- **Validación**: Zod en cliente y server functions
- **Estado servidor**: TanStack Query (ya disponible)
- **Tipografía**: Inter (ya incluida en la dirección visual)
- **Data inicial**: seed con ~20 clientes y oportunidades de ejemplo para que el dashboard se vea poblado desde el primer login

## Seguridad

- Roles en tabla separada con `has_role()` SECURITY DEFINER (nunca en `profiles`)
- RLS en todas las tablas: cada asesor solo ve sus clientes; supervisor/admin ven todo
- Server functions protegidas con middleware de auth
- Inputs validados con Zod en cliente y servidor
- Sin secretos en el frontend; las integraciones futuras usarán secrets en server functions

## Entrega

Esta primera implementación deja la plataforma navegable de punta a punta con datos reales persistidos, login funcional y los 5 módulos del MVP operativos. El chatbot IA y las integraciones externas (WhatsApp/Meta/Gmail/Calendar) se construyen en una segunda fase sobre esta base.
