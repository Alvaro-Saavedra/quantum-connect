/**
 * Tipos para los formularios del catálogo público.
 * Mantenidos separados de los tipos generados por Supabase
 * para facilitar validación con Zod en los componentes.
 */

// ─── Formulario 1: Cotización ─────────────────────────────────────────────────

export type MetodoPago = 'contado' | 'credito';

export type PlanMeses = 12 | 24 | 36 | 48 | 60 | 'otro';

export interface CotizacionFormData {
  vehiculo: string;           // nombre del modelo o 'sin_especificar'
  metodoPago: MetodoPago;
  planMeses?: PlanMeses;      // solo cuando metodoPago === 'credito'
  mensaje?: string;           // máx 500 caracteres
}

// ─── Formulario 2: Perfil de usuario ─────────────────────────────────────────

export type Sexo = 'masculino' | 'femenino' | 'no_especificado';

export type SectorLaboral =
  | 'tecnologia'
  | 'salud'
  | 'educacion'
  | 'comercio'
  | 'transporte'
  | 'construccion'
  | 'finanzas'
  | 'estudiante'
  | 'otro';

export type RangoIngresos =
  | 'menos_300'
  | '300_700'
  | '700_1500'
  | '1500_3000'
  | 'mas_3000';

export type UsoPrincipal =
  | 'trabajo'
  | 'familiar'
  | 'viajes'
  | 'transporte_diario'
  | 'negocio'
  | 'otro';

export type DistanciaDiaria =
  | 'menos_10'
  | '10_30'
  | '30_60'
  | 'mas_60';

export interface PerfilFormData {
  edad: number;
  sexo: Sexo;
  miembrosFamilia: number;
  ocupacion: string;
  sectorLaboral: SectorLaboral;
  rangoIngresos: RangoIngresos;
  tieneVehiculo: boolean;
  usoPrincipal: UsoPrincipal;
  distanciaDiaria: DistanciaDiaria;
}
