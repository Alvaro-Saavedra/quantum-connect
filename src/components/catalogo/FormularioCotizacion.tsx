/**
 * FormularioCotizacion.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Formulario "Comenzar cotización" del catálogo público.
 *
 * Tecnologías:
 *  - react-hook-form + zod (ya instalados en el proyecto)
 *  - shadcn/ui: Dialog, Form, Select, RadioGroup, Textarea, Button, Label
 *  - Supabase: INSERT anónimo en tabla `cotizaciones`
 *  - Sonner: feedback toasts (patrón del proyecto)
 *  - Design tokens del proyecto: glass-card, primary, bg-[#0B1120], etc.
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Calculator,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Car,
  CreditCard,
  Wallet,
  MessageSquare,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/integrations/supabase/client'
import { catalogoQuantum } from '@/lib/datosCatalogo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

// ─── Opciones ────────────────────────────────────────────────────────────────

/** Extrae los modelos de datosCatalogo.ts dinámicamente */
const vehiculosDelCatalogo = Object.values(catalogoQuantum).map((v) => v.modelo)

const PLANES_MESES = [
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
  { value: '36', label: '36 meses' },
  { value: '48', label: '48 meses' },
  { value: '60', label: '60 meses' },
  { value: 'otro', label: 'Otro plazo' },
]

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const cotizacionSchema = z
  .object({
    vehiculo: z.string().min(1, 'Selecciona un vehículo o elige "Sin especificar"'),
    metodoPago: z.enum(['contado', 'credito'], {
      required_error: 'Selecciona un método de pago',
    }),
    planMeses: z.string().optional(),
    mensaje: z
      .string()
      .max(500, 'El mensaje no puede superar los 500 caracteres')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.metodoPago === 'credito' && !data.planMeses) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona un plan de financiamiento',
        path: ['planMeses'],
      })
    }
  })

type CotizacionFormValues = z.infer<typeof cotizacionSchema>

// ─── Props ───────────────────────────────────────────────────────────────────

interface FormularioCotizacionProps {
  open: boolean
  onClose: () => void
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FormularioCotizacion({ open, onClose }: FormularioCotizacionProps) {
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [userClient, setUserClient] = useState<{ phone: string | null; city: string | null } | null>(null)

  const form = useForm<CotizacionFormValues>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: {
      vehiculo: '',
      metodoPago: undefined,
      planMeses: undefined,
      mensaje: '',
    },
  })

  const metodoPago = form.watch('metodoPago')
  const mensaje = form.watch('mensaje') ?? ''
  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (!open || !user?.id) return

    const fetchClient = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('phone, city')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        console.warn('[Cotizacion] No se pudo obtener el cliente del usuario:', error)
        return
      }

      setUserClient({
        phone: data?.phone ?? null,
        city: data?.city ?? null,
      })
    }

    void fetchClient()
  }, [open, user?.id])

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: CotizacionFormValues) => {
    if (!user) {
      toast.error('Debes iniciar sesión para enviar tu cotización.')
      return
    }

    const userName = (user.user_metadata as any)?.full_name ?? user.email ?? null
    const userPhone = (user.user_metadata as any)?.phone ?? userClient?.phone ?? null
    const userCity = (user.user_metadata as any)?.city ?? userClient?.city ?? null

    const payload = {
      vehiculo: values.vehiculo === 'sin_especificar' ? null : values.vehiculo,
      metodo_pago: values.metodoPago,
      plan_meses:
        values.metodoPago === 'credito' && values.planMeses && values.planMeses !== 'otro'
          ? parseInt(values.planMeses, 10)
          : null,
      mensaje: values.mensaje?.trim() || null,
      user_id: user.id,
      user_nombre: userName,
      user_email: user.email,
      user_telefono: userPhone,
      user_ciudad: userCity,
    } as any

    const isSchemaColumnError = (message?: string | null) =>
      Boolean(message?.match(/column \"(user_id|user_nombre|user_email|user_telefono|user_ciudad)\" does not exist/i))

    try {
      let { error } = await supabase.from('cotizaciones').insert(payload)

      if (error && isSchemaColumnError(error.message)) {
        const fallbackPayload = {
          vehiculo: payload.vehiculo,
          metodo_pago: payload.metodo_pago,
          plan_meses: payload.plan_meses,
          mensaje: payload.mensaje,
        }

        const fallbackResult = await supabase.from('cotizaciones').insert(fallbackPayload)
        if (fallbackResult.error) {
          console.error('[Cotizacion] Supabase fallback insert error:', fallbackResult.error)
          toast.error(`No se pudo enviar la cotización: ${fallbackResult.error.message || 'error desconocido'}`)
          return
        }
      } else if (error) {
        console.error('[Cotizacion] Supabase insert error:', error)
        toast.error(`No se pudo enviar la cotización: ${error.message || 'error desconocido'}`)
        return
      }

      setSubmitted(true)
      toast.success('¡Cotización enviada! Te contactaremos pronto.')
    } catch (err) {
      console.error('[Cotizacion] Unexpected error:', err)
      toast.error('Ocurrió un error al enviar la cotización. Ver consola para más detalles.')
    }
  }

  // ─── Reset al cerrar ───────────────────────────────────────────────────────
  const handleClose = () => {
    onClose()
    // Delay reset para que no se vea el parpadeo al cerrar el dialog
    setTimeout(() => {
      form.reset()
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
        {/* ── Header con gradiente ── */}
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-white/5 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 border border-primary/25 p-2.5 rounded-xl">
                <Calculator className="text-primary" size={22} />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold leading-tight">
                  Comenzar Cotización
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-0.5">
                  Completa el formulario y un asesor te contactará
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
        </div>

        {/* ── Contenido ── */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
          {submitted ? (
            <SuccessState onClose={handleClose} type="cotizacion" />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>

                {/* 1. Vehículo de interés */}
                <FormField
                  control={form.control}
                  name="vehiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 text-sm font-medium flex items-center gap-1.5">
                        <Car size={14} className="text-primary" />
                        Vehículo de interés
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/60 border-white/10 text-slate-200 focus:ring-primary/50 h-10">
                            <SelectValue placeholder="Selecciona un modelo…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#111827] border-white/10">
                          <SelectItem
                            value="sin_especificar"
                            className="text-slate-400 focus:bg-slate-700/50 focus:text-white"
                          >
                            Sin especificar
                          </SelectItem>
                          {vehiculosDelCatalogo.map((modelo) => (
                            <SelectItem
                              key={modelo}
                              value={modelo}
                              className="text-slate-200 focus:bg-primary/15 focus:text-white"
                            >
                              {modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                {/* 2. Método de pago — pill buttons */}
                <FormField
                  control={form.control}
                  name="metodoPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 text-sm font-medium flex items-center gap-1.5">
                        <Wallet size={14} className="text-primary" />
                        Método de pago
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'contado', label: 'Contado', icon: Wallet },
                            { value: 'credito', label: 'Crédito', icon: CreditCard },
                          ].map(({ value, label, icon: Icon }) => {
                            const isSelected = field.value === value
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  field.onChange(value)
                                  // Si cambia a contado, limpiar planMeses
                                  if (value === 'contado') form.setValue('planMeses', undefined)
                                }}
                                className={cn(
                                  'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200',
                                  isSelected
                                    ? 'bg-primary/15 border-primary/50 text-primary shadow-[0_0_12px_rgba(74,222,128,0.15)]'
                                    : 'bg-slate-800/40 border-white/8 text-slate-400 hover:bg-slate-800/70 hover:border-white/15 hover:text-slate-200',
                                )}
                              >
                                <Icon size={16} />
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

                {/* 3. Plan de financiamiento — solo visible si metodoPago === 'credito' */}
                {metodoPago === 'credito' && (
                  <FormField
                    control={form.control}
                    name="planMeses"
                    render={({ field }) => (
                      <FormItem
                        className="animate-in fade-in-0 slide-in-from-top-2 duration-200"
                      >
                        <FormLabel className="text-slate-200 text-sm font-medium flex items-center gap-1.5">
                          <CreditCard size={14} className="text-primary" />
                          Plan de financiamiento
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-3 gap-2">
                            {PLANES_MESES.map(({ value, label }) => {
                              const isSelected = field.value === value
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => field.onChange(value)}
                                  className={cn(
                                    'py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all duration-150 text-center',
                                    isSelected
                                      ? 'bg-primary/20 border-primary/60 text-primary'
                                      : 'bg-slate-800/40 border-white/8 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 hover:border-white/15',
                                  )}
                                >
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
                )}

                {/* 4. Mensaje adicional */}
                <FormField
                  control={form.control}
                  name="mensaje"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-200 text-sm font-medium flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-primary" />
                          Mensaje adicional
                          <span className="text-slate-500 font-normal">(opcional)</span>
                        </FormLabel>
                        <span
                          className={cn(
                            'text-xs tabular-nums transition-colors',
                            mensaje.length > 450 ? 'text-amber-400' : 'text-slate-500',
                            mensaje.length >= 500 ? 'text-red-400' : '',
                          )}
                        >
                          {mensaje.length}/500
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Cuéntanos más sobre tus necesidades, presupuesto, o cualquier pregunta…"
                          maxLength={500}
                          rows={3}
                          className="bg-slate-800/60 border-white/10 text-slate-200 placeholder:text-slate-500 focus-visible:ring-primary/50 resize-none text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.2)] hover:shadow-[0_0_30px_rgba(74,222,128,0.35)] transition-all duration-200 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Calculator size={16} />
                      Enviar Cotización
                      <ChevronRight size={16} />
                    </>
                  )}
                </Button>

              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Estado de éxito compartido ───────────────────────────────────────────────

function SuccessState({
  onClose,
  type,
}: {
  onClose: () => void
  type: 'cotizacion' | 'perfil'
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center animate-in fade-in-0 zoom-in-95 duration-300">
      <div className="bg-primary/15 border border-primary/25 rounded-full p-4">
        <CheckCircle2 className="text-primary" size={36} />
      </div>
      <div>
        <p className="text-white font-bold text-lg">
          {type === 'cotizacion' ? '¡Cotización enviada!' : '¡Perfil completado!'}
        </p>
        <p className="text-slate-400 text-sm mt-1.5 max-w-xs mx-auto">
          {type === 'cotizacion'
            ? 'Uno de nuestros asesores revisará tu solicitud y se pondrá en contacto contigo a la brevedad.'
            : 'Usaremos tu información para ofrecerte recomendaciones y ofertas personalizadas.'}
        </p>
      </div>
      <Button
        onClick={onClose}
        className="mt-2 bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary font-semibold px-6 rounded-xl"
        variant="ghost"
      >
        Cerrar
      </Button>
    </div>
  )
}

// Re-exportamos SuccessState para que FormularioPerfil lo reutilice
export { SuccessState }
