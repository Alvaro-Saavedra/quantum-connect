/**
 * catalogo.tsx  —  RAMA: luci
 * ─────────────────────────────────────────────────────────────────────────────
 * Cambios respecto al original:
 *  1. Importa FormularioCotizacion y FormularioPerfil
 *  2. Agrega estados `isCotizacionOpen` e `isPerfilOpen`
 *  3. Los botones CTA de cada sección abren el Dialog correspondiente
 *  4. Sin cambios en el diseño visual ni en la estructura existente
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import {
  Zap, MessageCircle, Phone, Battery, Timer, Users,
  ChevronRight, ChevronLeft, CheckCircle2, Calculator, FileText,
  DollarSign, Navigation
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { CatalogChatWidget } from '@/components/CatalogChatWidget'
import { FormularioCotizacion } from '@/components/catalogo/FormularioCotizacion'
import { FormularioPerfil } from '@/components/catalogo/FormularioPerfil'

export const Route = createFileRoute('/catalogo')({
  component: CatalogoView,
})

const vehicles = [
  {
    id: 1,
    nombre: 'E-Rider Sport',
    categoria: 'vehiculo',
    precio: '$18.000.000',
    autonomia: '180 km',
    tiempoCarga: '0-100% en 2h',
    velocidadMaxima: '220 km/h',
    transmision: 'Automática',
    potenciaBateria: '85 kWh',
    image: '/vehicles/car_compact.png',
  },
  {
    id: 2,
    nombre: 'Urban Scooter',
    categoria: 'motocicleta',
    precio: '$8.500.000',
    autonomia: '80 km',
    tiempoCarga: '0-100% en 3h',
    velocidadMaxima: '90 km/h',
    transmision: 'Automática',
    potenciaBateria: '8 kWh',
    image: '/vehicles/scooter.png',
  },
  {
    id: 3,
    nombre: 'Adventure E-Bike',
    categoria: 'motocicleta',
    precio: '$25.000.000',
    autonomia: '220 km',
    tiempoCarga: '0-100% en 2.5h',
    velocidadMaxima: '160 km/h',
    transmision: 'Manual',
    potenciaBateria: '120 kWh',
    image: '/vehicles/e_bike.png',
  },
  {
    id: 4,
    nombre: 'CargoMaster Pro',
    categoria: 'vehiculo_carga',
    precio: '$32.000.000',
    autonomia: '300 km',
    tiempoCarga: '0-100% en 3.5h',
    velocidadMaxima: '140 km/h',
    transmision: 'Automática',
    potenciaBateria: '150 kWh',
    image: '/vehicles/truck.png',
  },
  {
    id: 5,
    nombre: 'Mini Hauler',
    categoria: 'vehiculo_carga',
    precio: '$22.000.000',
    autonomia: '200 km',
    tiempoCarga: '0-100% en 2.8h',
    velocidadMaxima: '120 km/h',
    transmision: 'Automática',
    potenciaBateria: '95 kWh',
    image: '/vehicles/truck_small.png',
  },
  {
    id: 6,
    nombre: 'City Skate',
    categoria: 'patineta',
    precio: '$1.200.000',
    autonomia: '35 km',
    tiempoCarga: '0-100% en 4h',
    velocidadMaxima: '25 km/h',
    transmision: 'Directa',
    potenciaBateria: '0.5 kWh',
    image: '/vehicles/scooter_small.png',
  },
  {
    id: 7,
    nombre: 'Commuter One',
    categoria: 'vehiculo',
    precio: '$12.500.000',
    autonomia: '150 km',
    tiempoCarga: '0-100% en 2.2h',
    velocidadMaxima: '180 km/h',
    transmision: 'Automática',
    potenciaBateria: '60 kWh',
    image: '/vehicles/compact2.png',
  },
  {
    id: 8,
    nombre: 'Family EV',
    categoria: 'vehiculo',
    precio: '$28.000.000',
    autonomia: '260 km',
    tiempoCarga: '0-100% en 3h',
    velocidadMaxima: '200 km/h',
    transmision: 'Automática',
    potenciaBateria: '110 kWh',
    image: '/vehicles/suv.png',
  },
]

const faqs = [
  {
    question: "¿Cuánto tiempo tarda en cargar?",
    answer: "Depende del modelo. Carga completa: 6-8h (110V) o 2-3h (220V). Carga rápida: 0-80% en 25-50 min."
  },
  {
    question: "¿Qué garantía tienen?",
    answer: "5 años o 100.000 km en vehículo completo. 8 años o 150.000 km en batería."
  },
  {
    question: "¿Puedo hacer test drive?",
    answer: "Sí, agenda tu test drive gratuito desde el chatbot o contactando a un asesor."
  },
  {
    question: "¿Ofrecen financiamiento?",
    answer: "Sí, planes desde 24 hasta 60 meses con tasas competitivas."
  },
  {
    question: "¿Cuánto cuesta cargar un vehículo eléctrico?",
    answer: "El costo promedio es de $3.000-5.000 COP por carga completa, muy inferior a la gasolina."
  },
  {
    question: "¿Dónde puedo cargar mi vehículo?",
    answer: "En casa con toma de 110V o 220V, estaciones de carga públicas, o centros comerciales."
  }
];

function CatalogoView() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false);
  // ── NUEVO: estado para los dos formularios ──────────────────────────────────
  const [isCotizacionOpen, setIsCotizacionOpen] = useState(false);
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'vehiculo' | 'vehiculo_carga' | 'motocicleta' | 'patineta'>('todos')
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function FilterButton({ label, value }: { label: string; value: string }) {
    return (
      <button
        onClick={() => setFilter(value as any)}
        className={cn(
          'px-5 py-2 rounded-xl text-sm font-medium transition-all',
          filter === value
            ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(34,197,94,0.3)]'
            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-white/5',
        )}
      >
        {label}
      </button>
    )
  }

  const filteredVehicles = vehicles.filter((v) => (filter === 'todos' ? true : v.categoria === filter))

  const scroll = (dir: 'left' | 'right') => {
    const el = carouselRef.current
    if (!el) return
    const amount = el.clientWidth || 800
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  const updateScrollButtons = () => {
    const el = carouselRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 8)
    setCanScrollRight(scrollLeft + clientWidth + 8 < scrollWidth)
  }

  // Attach listeners to update button visibility
  useEffect(() => {
    updateScrollButtons()
    const el = carouselRef.current
    if (!el) return
    const onScroll = () => updateScrollButtons()
    const onResize = () => updateScrollButtons()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [carouselRef.current])

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-primary/30">
      <style>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#0B1120]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/20">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Quantum Motors</h1>
              <p className="text-xs text-slate-400">Movilidad Eléctrica del Futuro</p>
            </div>
            <span className="hidden md:inline-flex ml-4 bg-primary px-2 py-0.5 rounded text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
              CRM
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100 transition-colors shadow-sm"
            >
              <MessageCircle size={16} />
              Asistente Virtual
            </button>

            {user ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  await signOut()
                  navigate({ to: '/login' })
                }}
                className="text-white border border-white/10 hover:bg-white/10"
              >
                Cerrar sesión
              </Button>
            ) : null}
          </div>

        </div>
      </header>

      <main className="pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-12 pb-8 text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Nuestro Catálogo</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Explora los mejores vehículos eléctricos del mercado</p>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'vehiculo', label: 'Vehículo' },
              { key: 'vehiculo_carga', label: 'Vehículo de carga' },
              { key: 'motocicleta', label: 'Motocicleta' },
              { key: 'patineta', label: 'Patineta' },
            ].map((f) => (
              <FilterButton key={f.key} label={f.label} value={f.key} />
            ))}
          </div>
        </section>

        {/* Vehicles Grid (carrusel) */}
        <section className="container mx-auto px-4 py-8 relative">
          <div className="relative">
            {canScrollLeft && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 lg:ml-0 z-50">
                <button aria-label="Anterior" onClick={() => scroll('left')} className="bg-primary/10 p-2 rounded-full text-primary hover:bg-primary/20 transition-colors pointer-events-auto">
                  <ChevronLeft size={24} />
                </button>
              </div>
            )}
            <div
              ref={carouselRef}
              onWheel={(e) => e.preventDefault()}
              onTouchMove={(e) => e.preventDefault()}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-2 animate-fade-in hide-scrollbar"
              style={{ animationDelay: '0.1s' }}
            >
              {filteredVehicles.map((v) => (
                <div key={v.id} className="min-w-[260px] max-w-[320px] snap-start glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/5 bg-slate-900/50">
                  <div className="aspect-[16/10] relative overflow-hidden bg-slate-800">
                    <img src={v.image} alt={v.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">{v.nombre}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-white/5 text-slate-200">{v.categoria.replace('_', ' ')}</span>
                    </div>
                    <p className="text-2xl font-bold text-primary mb-3">{v.precio}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4">
                      <div className="flex items-center gap-1.5"><Battery size={14} className="text-primary" /> <span>{v.autonomia}</span></div>
                      <div className="flex items-center gap-1.5"><Zap size={14} className="text-primary" /> <span>{v.tiempoCarga}</span></div>
                      <div className="flex items-center gap-1.5"><Timer size={14} className="text-primary" /> <span>{v.velocidadMaxima}</span></div>
                      <div className="flex items-center gap-1.5"><Users size={14} className="text-primary" /> <span>{v.transmision}</span></div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Batería: {v.potenciaBateria}</span>
                      <button onClick={() => setIsCotizacionOpen(true)} className="text-xs font-semibold text-primary/80 hover:text-primary flex items-center gap-1 transition-colors">Cotizar <ChevronRight size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {canScrollRight && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 lg:mr-0 z-50">
                <button aria-label="Siguiente" onClick={() => scroll('right')} className="bg-primary/10 p-2 rounded-full text-primary hover:bg-primary/20 transition-colors pointer-events-auto">
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
            
          </div>
        </section>

        {/* Cotizacion Section */}
        <section className="container mx-auto px-4 py-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card rounded-2xl p-6 md:p-8 bg-slate-900/50 border border-white/5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Genera tu Cotización</h3>
                <p className="text-slate-400 text-sm">Obtén un plan de financiamiento personalizado en minutos</p>
              </div>
              <div className="hidden md:flex bg-primary/10 p-3 rounded-xl border border-primary/20">
                <Calculator size={32} className="text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
                <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <FileText size={18} />
                </div>
                <h4 className="font-bold text-white text-sm mb-2">1. Selecciona tu Vehículo</h4>
                <p className="text-xs text-slate-400">Elige el modelo que más se ajuste a tus necesidades</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
                <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <DollarSign size={18} />
                </div>
                <h4 className="font-bold text-white text-sm mb-2">2. Personaliza tu Plan</h4>
                <p className="text-xs text-slate-400">Ajusta plazos y cuotas según tu presupuesto</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
                <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <Navigation size={18} />
                </div>
                <h4 className="font-bold text-white text-sm mb-2">3. Recibe tu Oferta</h4>
                <p className="text-xs text-slate-400">Un asesor te contactará con tu cotización</p>
              </div>
            </div>

            {/* ── MODIFICADO: onClick abre FormularioCotizacion ─────────────── */}
            <button
              onClick={() => setIsCotizacionOpen(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_25px_rgba(74,222,128,0.25)]"
            >
              <Calculator size={18} />
              Comenzar Cotización <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* Experiencia Personalizada */}
        <section className="container mx-auto px-4 py-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card rounded-2xl p-6 md:p-8 bg-slate-900/50 border border-white/5 flex flex-col lg:flex-row gap-8 lg:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-primary" size={24} />
                <h3 className="text-2xl font-bold text-white">Experiencia Personalizada</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">Ayúdanos a conocerte mejor para ofrecerte recomendaciones y ofertas diseñadas especialmente para ti</p>

              <ul className="space-y-3 mb-8">
                {[
                  "Recomendaciones de vehículos según tu perfil",
                  "Planes de financiamiento adaptados a tu situación",
                  "Ofertas exclusivas y promociones personalizadas",
                  "Asesoría especializada basada en tus necesidades"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* ── MODIFICADO: onClick abre FormularioPerfil ─────────────────── */}
              <button
                onClick={() => setIsPerfilOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_25px_rgba(74,222,128,0.25)] w-fit"
              >
                <FileText size={18} />
                Completar Perfil <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="container mx-auto px-4 py-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card rounded-2xl p-6 md:p-8 bg-slate-900/50 border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Preguntas Frecuentes</h3>
                <p className="text-slate-400 text-sm">Encuentra respuestas a las dudas más comunes</p>
              </div>
              <button
                onClick={() => setIsChatOpen(true)}
                className="hidden md:flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-xl font-medium text-sm transition-colors border border-primary/20 mt-4 md:mt-0"
              >
                <MessageCircle size={16} />
                Más Preguntas
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-800/30 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    <h4 className="font-bold text-white text-sm">{faq.question}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-3.5">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Banner */}
        <section className="container mx-auto px-4 py-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="bg-gradient-to-br from-primary to-[#166534] rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 relative z-10">¿Necesitas Asesoría Personalizada?</h3>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto relative z-10 text-sm">
              Nuestros expertos están listos para ayudarte a elegir tu vehículo ideal
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <button className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                <Phone size={18} />
                Llamar Ahora
              </button>
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/30"
              >
                <MessageCircle size={18} />
                Chat en Vivo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Widgets & Dialogs ─────────────────────────────────────────────────── */}
      <CatalogChatWidget open={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* NUEVO: Formulario 1 — Cotización */}
      <FormularioCotizacion
        open={isCotizacionOpen}
        onClose={() => setIsCotizacionOpen(false)}
      />

      {/* NUEVO: Formulario 2 — Perfil */}
      <FormularioPerfil
        open={isPerfilOpen}
        onClose={() => setIsPerfilOpen(false)}
      />
    </div>
  )
}
