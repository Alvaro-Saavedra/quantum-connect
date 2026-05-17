import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Zap, MessageCircle, Phone, X, Send, Battery, Timer, Users,
  ChevronRight, ChevronLeft, CheckCircle2, Calculator, FileText,
  DollarSign, Navigation
} from 'lucide-react'

export const Route = createFileRoute('/catalogo')({
  component: CatalogoView,
})

const vehicles = [
  {
    id: 1,
    name: "E-Rider Sport",
    year: "2026",
    range: "180 km",
    acceleration: "0-100 km/h en 3.5s",
    chargeTime: "0-100% en 2h",
    seats: "2 asientos",
    price: "$18.000.000",
    image: "/vehicles/car_compact.png"
  },
  {
    id: 2,
    name: "Urban Scooter",
    year: "2026",
    range: "80 km",
    acceleration: "0-50 km/h en 4.2s",
    chargeTime: "0-100% en 3h",
    seats: "2 asientos",
    price: "$8.500.000",
    image: "/vehicles/scooter.png"
  },
  {
    id: 3,
    name: "Adventure E-Bike",
    year: "2026",
    range: "220 km",
    acceleration: "0-100 km/h en 4.0s",
    chargeTime: "0-100% en 2.5h",
    seats: "2 asientos",
    price: "$25.000.000",
    image: "/vehicles/e_bike.png"
  }
];

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
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-primary/30">

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
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100 transition-colors shadow-sm"
          >
            <MessageCircle size={16} />
            Asistente Virtual
          </button>
        </div>
      </header>

      <main className="pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-12 pb-8 text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Nuestro Catálogo</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Explora los mejores vehículos eléctricos del mercado</p>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Todos', 'Compactos', 'Sedanes', 'SUVs', 'Motos'].map((filter, i) => (
              <button
                key={filter}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${i === 0
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-white/5'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {/* Vehicles Grid */}
        <section className="container mx-auto px-4 py-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 hidden lg:flex">
            <button className="bg-primary/10 p-2 rounded-full text-primary hover:bg-primary/20 transition-colors">
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 hidden lg:flex">
            <button className="bg-primary/10 p-2 rounded-full text-primary hover:bg-primary/20 transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {vehicles.map((v) => (
              <div key={v.id} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/5 bg-slate-900/50">
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-800">
                  <img src={v.image} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {v.name === "E-Rider Sport" && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                      Próximamente
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-1">{v.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{v.year}</p>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-slate-300 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Battery size={14} className="text-primary" />
                      <span>{v.range}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-primary" />
                      <span>{v.chargeTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Timer size={14} className="text-primary" />
                      <span>{v.acceleration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary" />
                      <span>{v.seats}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{v.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8 gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
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

            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
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

              <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all w-fit">
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
              <button className="hidden md:flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-xl font-medium text-sm transition-colors border border-primary/20 mt-4 md:mt-0">
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

      {/* Chat Widget */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-slate-900 border border-primary/30 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Asistente Quantum</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
                  <span className="text-[10px] text-primary-foreground/90">En línea</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="p-4 h-80 overflow-y-auto bg-slate-950 flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="bg-primary/20 p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border border-primary/30">
                <MessageCircle size={14} className="text-primary" />
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm p-3 border border-white/5 text-sm text-slate-200">
                <p className="mb-3">¡Hola! Soy el asistente virtual de Quantum Motors. ¿En qué puedo ayudarte?</p>
                <div className="flex flex-wrap gap-2">
                  <button className="bg-slate-900 border border-primary/40 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
                    Ver catálogo
                  </button>
                  <button className="bg-slate-900 border border-primary/40 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
                    Agendar test drive
                  </button>
                  <button className="bg-slate-900 border border-primary/40 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
                    Financiamiento
                  </button>
                  <button className="bg-slate-900 border border-primary/40 text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
                    Garantía
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-white/5 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button className="bg-primary p-2.5 rounded-xl text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
