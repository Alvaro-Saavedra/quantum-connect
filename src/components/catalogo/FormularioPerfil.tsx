/**
 * FormularioPerfil.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Formulario "Completar perfil" del catálogo público.
 *
 * Tecnologías:
 *  - react-hook-form + zod
 *  - shadcn/ui: Dialog, Form, Select, Input, Button
 *  - Supabase: INSERT anónimo en tabla `perfiles_usuario`
 *  - Sonner: toasts (patrón del proyecto)
 *  - Multi-step visual (2 pasos) para reducir cognitive load en móvil
 */

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  UserCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Car,
  Briefcase,
  Users,
  MapPin,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SuccessState } from './FormularioCotizacion'

// ─── Opciones ────────────────────────────────────────────────────────────────

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no_especificado', label: 'Prefiero no decirlo' },
]

const SECTOR_OPTIONS = [
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educación' },
  { value: 'comercio', label: 'Comercio' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'construccion', label: 'Construcción' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'otro', label: 'Otro' },
]

const INGRESOS_OPTIONS = [
  { value: 'menos_300', label: 'Menos de $300' },
  { value: '300_700', label: '$300 – $700' },
  { value: '700_1500', label: '$700 – $1,500' },
  { value: '1500_3000', label: '$1,500 – $3,000' },
  { value: 'mas_3000', label: 'Más de $3,000' },
]

const USO_OPTIONS = [
  { value: 'trabajo', label: 'Trabajo', icon: Briefcase },
  { value: 'familiar', label: 'Familiar', icon: Users },
  { value: 'viajes', label: 'Viajes', icon: MapPin },
  { value: 'transporte_diario', label: 'Transporte diario', icon: Car },
  { value: 'negocio', label: 'Negocio', icon: Zap },
  { value: 'otro', label: 'Otro', icon: Car },
]

const DISTANCIA_OPTIONS = [
  { value: 'menos_10', label: 'Menos de 10 km' },
  { value: '10_30', label: '10 – 30 km' },
  { value: '30_60', label: '30 – 60 km' },
  { value: 'mas_60', label: 'Más de 60 km' },
]

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const perfilSchema = z.object({
  // Paso 1: Datos personales
  edad: z
    .number({ invalid_type_error: 'Ingresa tu edad' })
    .int()
    .min(16, 'La edad mínima es 16 años')
    .max(100, 'Ingresa una edad válida'),
  sexo: z.enum(['masculino', 'femenino', 'no_especificado'], {
    required_error: 'Selecciona una opción',
  }),
  miembrosFamilia: z
    .number({ invalid_type_error: 'Ingresa la cantidad de miembros' })
    .int()
    .min(1, 'Mínimo 1 persona')
    .max(20, 'Máximo 20 personas'),
  ocupacion: z
    .string()
    .min(2, 'Ingresa tu ocupación')
    .max(100, 'Máximo 100 caracteres'),
  sectorLaboral: z.string({ required_error: 'Selecciona un sector' }),
  rangoIngresos: z.string({ required_error: 'Selecciona un rango' }),

  // Paso 2: Hábitos de movilidad
  tieneVehiculo: z.boolean({ required_error: 'Selecciona una opción' }),
  usoPrincipal: z.string({ required_error: 'Selecciona el uso principal' }),
  distanciaDiaria: z.string({ required_error: 'Selecciona la distancia' }),
})

type PerfilFormValues = z.infer<typeof perfilSchema>

// Campos que pertenecen a cada paso para validación parcial
const CAMPOS_PASO_1 = ['edad', 'sexo', 'miembrosFamilia', 'ocupacion', 'sectorLaboral', 'rangoIngresos'] as const
const CAMPOS_PASO_2 = ['tieneVehiculo', 'usoPrincipal', 'distanciaDiaria'] as const

// ─── Props ───────────────────────────────────────────────────────────────────

interface FormularioPerfilProps {
  open: boolean
  onClose: () => void
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FormularioPerfil({ open, onClose }: FormularioPerfilProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    mode: 'onTouched',
    defaultValues: {
      edad: undefined,
      sexo: undefined,
      miembrosFamilia: undefined,
      ocupacion: '',
      sectorLaboral: undefined,
      rangoIngresos: undefined,
      tieneVehiculo: undefined,
      usoPrincipal: undefined,
      distanciaDiaria: undefined,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  // ─── Avanzar al paso 2 validando solo campos del paso 1 ────────────────────
  const handleNext = async () => {
    const valid = await form.trigger(CAMPOS_PASO_1)
    if (valid) setStep(2)
  }

  // ─── Submit final ──────────────────────────────────────────────────────────
  const onSubmit = async (values: PerfilFormValues) => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar tu perfil.')
      return
    }

    const userName = (user.user_metadata as any)?.full_name ?? user.email ?? null

    const payload = {
      edad: values.edad,
      sexo: values.sexo,
      miembros_familia: values.miembrosFamilia,
      ocupacion: values.ocupacion,
      sector_laboral: values.sectorLaboral,
      rango_ingresos: values.rangoIngresos,
      tiene_vehiculo: values.tieneVehiculo,
      uso_principal: values.usoPrincipal,
      distancia_diaria: values.distanciaDiaria,
      user_id: user.id,
      user_nombre: userName,
    } as any

    const isSchemaColumnError = (message?: string | null) =>
      Boolean(message?.match(/column \"(user_id|user_nombre)\" does not exist/i))

    try {
      let { error } = await supabase.from('perfiles_usuario').insert(payload)

      if (error && isSchemaColumnError(error.message)) {
        const fallbackPayload = {
          edad: payload.edad,
          sexo: payload.sexo,
          miembros_familia: payload.miembros_familia,
          ocupacion: payload.ocupacion,
          sector_laboral: payload.sector_laboral,
          rango_ingresos: payload.rango_ingresos,
          tiene_vehiculo: payload.tiene_vehiculo,
          uso_principal: payload.uso_principal,
          distancia_diaria: payload.distancia_diaria,
        }

        const fallbackResult = await supabase.from('perfiles_usuario').insert(fallbackPayload)
        if (fallbackResult.error) {
          console.error('[Perfil] Supabase fallback insert error:', fallbackResult.error)
          toast.error(`No se pudo guardar el perfil: ${fallbackResult.error.message || 'error desconocido'}`)
          return
        }
      } else if (error) {
        console.error('[Perfil] Supabase insert error:', error)
        toast.error(`No se pudo guardar el perfil: ${error.message || 'error desconocido'}`)
        return
      }

      setSubmitted(true)
      toast.success('¡Perfil completado exitosamente!')
    } catch (err) {
      console.error('[Perfil] Unexpected error:', err)
      toast.error('Ocurrió un error al guardar el perfil. Revisa la consola para más detalles.')
    }
  }

  // ─── Reset al cerrar ───────────────────────────────────────────────────────
  const handleClose = () => {
    onClose()
    setTimeout(() => {
      form.reset()
      setStep(1)
      setSubmitted(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className={cn(
          'max-w-lg w-full border-white/10 p-0 overflow-hidden',
          'bg-[#0d1526] shadow-[0_0_60px_rgba(74,222,128,0.08)]',
        )}
      >
        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-white/5 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 border border-primary/25 p-2.5 rounded-xl">
                <UserCircle2 className="text-primary" size={22} />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold leading-tight">
                  Completar Perfil
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-0.5">
                  Personaliza tu experiencia con Quantum Motors
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5 shrink-0"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          {!submitted && (
            <div className="mt-4 flex items-center gap-2">
              <StepIndicator step={1} current={step} label="Datos personales" />
              <div className="flex-1 h-px bg-white/10 relative overflow-hidden rounded-full">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full',
                    step === 2 ? 'w-full' : 'w-0',
                  )}
                />
              </div>
              <StepIndicator step={2} current={step} label="Movilidad" />
            </div>
          )}
        </div>

        {/* ── Contenido ── */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
          {submitted ? (
            <SuccessState onClose={handleClose} type="perfil" />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

                {/* ──── PASO 1 ──── */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-200">

                    <div className="grid grid-cols-2 gap-4">
                      {/* Edad */}
                      <FormField
                        control={form.control}
                        name="edad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 text-sm font-medium">Edad</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={16}
                                max={100}
                                placeholder="Ej: 28"
                                className="bg-slate-800/60 border-white/10 text-slate-200 placeholder:text-slate-500 focus-visible:ring-primary/50"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Miembros familia */}
                      <FormField
                        control={form.control}
                        name="miembrosFamilia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 text-sm font-medium">Miembros familia</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                placeholder="Ej: 4"
                                className="bg-slate-800/60 border-white/10 text-slate-200 placeholder:text-slate-500 focus-visible:ring-primary/50"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Sexo — pill buttons */}
                    <FormField
                      control={form.control}
                      name="sexo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 text-sm font-medium">Sexo</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-3 gap-2">
                              {SEXO_OPTIONS.map(({ value, label }) => (
                                <PillButton
                                  key={value}
                                  label={label}
                                  selected={field.value === value}
                                  onClick={() => field.onChange(value)}
                                />
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Ocupación */}
                    <FormField
                      control={form.control}
                      name="ocupacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 text-sm font-medium">Ocupación</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Ingeniero, Médico, Comerciante…"
                              className="bg-slate-800/60 border-white/10 text-slate-200 placeholder:text-slate-500 focus-visible:ring-primary/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sector laboral */}
                      <FormField
                        control={form.control}
                        name="sectorLaboral"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 text-sm font-medium">Sector laboral</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-800/60 border-white/10 text-slate-200 focus:ring-primary/50 h-10">
                                  <SelectValue placeholder="Selecciona…" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#111827] border-white/10">
                                {SECTOR_OPTIONS.map(({ value, label }) => (
                                  <SelectItem key={value} value={value} className="text-slate-200 focus:bg-primary/15 focus:text-white">
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Rango de ingresos */}
                      <FormField
                        control={form.control}
                        name="rangoIngresos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200 text-sm font-medium">Ingresos mensuales</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-800/60 border-white/10 text-slate-200 focus:ring-primary/50 h-10">
                                  <SelectValue placeholder="Selecciona…" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#111827] border-white/10">
                                {INGRESOS_OPTIONS.map(({ value, label }) => (
                                  <SelectItem key={value} value={value} className="text-slate-200 focus:bg-primary/15 focus:text-white">
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleNext}
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.2)] hover:shadow-[0_0_30px_rgba(74,222,128,0.35)] transition-all duration-200 text-sm"
                    >
                      Continuar
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}

                {/* ──── PASO 2 ──── */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-200">

                    {/* ¿Tienes vehículo? */}
                    <FormField
                      control={form.control}
                      name="tieneVehiculo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 text-sm font-medium flex items-center gap-1.5">
                            <Car size={14} className="text-primary" />
                            ¿Tienes vehículo actualmente?
                          </FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { value: true, label: 'Sí, tengo' },
                                { value: false, label: 'No tengo' },
                              ].map(({ value, label }) => (
                                <PillButton
                                  key={String(value)}
                                  label={label}
                                  selected={field.value === value}
                                  onClick={() => field.onChange(value)}
                                />
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Uso principal del vehículo */}
                    <FormField
                      control={form.control}
                      name="usoPrincipal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 text-sm font-medium">Uso principal del vehículo</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 gap-2">
                              {USO_OPTIONS.map(({ value, label, icon: Icon }) => {
                                const isSelected = field.value === value
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => field.onChange(value)}
                                    className={cn(
                                      'flex items-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-150 text-left',
                                      isSelected
                                        ? 'bg-primary/15 border-primary/50 text-primary'
                                        : 'bg-slate-800/40 border-white/8 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 hover:border-white/15',
                                    )}
                                  >
                                    <Icon size={14} className={isSelected ? 'text-primary' : 'text-slate-500'} />
                                    {label}
                                  </button>
                                )
                              })}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Distancia diaria */}
                    <FormField
                      control={form.control}
                      name="distanciaDiaria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 text-sm font-medium flex items-center gap-1.5">
                            <MapPin size={14} className="text-primary" />
                            Distancia diaria promedio
                          </FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 gap-2">
                              {DISTANCIA_OPTIONS.map(({ value, label }) => (
                                <PillButton
                                  key={value}
                                  label={label}
                                  selected={field.value === value}
                                  onClick={() => field.onChange(value)}
                                />
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Footer: atrás + enviar */}
                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(1)}
                        className="flex-1 h-11 border border-white/10 text-slate-300 hover:bg-slate-800/60 hover:text-white rounded-xl text-sm font-medium"
                      >
                        <ChevronLeft size={16} />
                        Atrás
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.2)] hover:shadow-[0_0_30px_rgba(74,222,128,0.35)] transition-all duration-200 text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Guardando…
                          </>
                        ) : (
                          <>
                            <UserCircle2 size={16} />
                            Guardar Perfil
                            <ChevronRight size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Sub-componentes locales ──────────────────────────────────────────────────

function StepIndicator({
  step,
  current,
  label,
}: {
  step: number
  current: number
  label: string
}) {
  const isDone = current > step
  const isActive = current === step

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all',
          isActive
            ? 'bg-primary border-primary text-primary-foreground'
            : isDone
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-slate-800 border-white/10 text-slate-500',
        )}
      >
        {step}
      </div>
      <span
        className={cn(
          'text-[11px] font-medium transition-colors hidden sm:inline',
          isActive ? 'text-slate-200' : 'text-slate-500',
        )}
      >
        {label}
      </span>
    </div>
  )
}

function PillButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 text-center',
        selected
          ? 'bg-primary/15 border-primary/50 text-primary shadow-[0_0_8px_rgba(74,222,128,0.12)]'
          : 'bg-slate-800/40 border-white/8 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 hover:border-white/15',
      )}
    >
      {label}
    </button>
  )
}
