import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Facebook, Mail, Calendar, Instagram, Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/integraciones")({
  component: IntegracionesPage,
});

const integrations = [
  { name: "WhatsApp Business API", desc: "Atención y mensajería automática con clientes", icon: MessageCircle, color: "text-brand-primary" },
  { name: "Meta Business (Facebook)", desc: "Captura de leads desde campañas y Messenger", icon: Facebook, color: "text-brand-secondary" },
  { name: "Instagram", desc: "Mensajes directos y comentarios desde IG", icon: Instagram, color: "text-pink-400" },
  { name: "Gmail", desc: "Envío y recepción de correos vinculados a cada cliente", icon: Mail, color: "text-red-400" },
  { name: "Google Calendar", desc: "Agenda de test drives y citas comerciales", icon: Calendar, color: "text-brand-secondary" },
  { name: "Chatbot IA", desc: "Asistente automático 24/7 para preguntas frecuentes", icon: Bot, color: "text-brand-primary" },
];

function IntegracionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integraciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conecta canales externos y herramientas comerciales al CRM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((i) => (
          <div key={i.name} className="glass-card p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 rounded-lg bg-secondary flex items-center justify-center">
                <i.icon className={`size-5 ${i.color}`} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-widest px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                Próximamente
              </span>
            </div>
            <h3 className="text-sm font-medium text-foreground">{i.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
