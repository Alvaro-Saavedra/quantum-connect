export const statusLabels: Record<string, string> = {
  nuevo: "Nuevo",
  en_seguimiento: "En seguimiento",
  interesado: "Interesado",
  negociacion: "Negociación",
  cerrada: "Cerrada",
  postventa: "Postventa",
};

export const stageLabels: Record<string, string> = {
  prospeccion: "Prospección",
  contacto: "Contacto",
  interesado: "Interesado",
  negociacion: "Negociación",
  cerrada_ganada: "Cerrada (ganada)",
  cerrada_perdida: "Cerrada (perdida)",
};

export const priorityLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const roleLabels: Record<string, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  asesor: "Asesor",
  soporte: "Soporte",
};

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "nuevo":
      return "bg-muted text-muted-foreground border-border";
    case "en_seguimiento":
      return "bg-brand-secondary-soft text-brand-secondary border-brand-secondary/30";
    case "interesado":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "negociacion":
      return "bg-brand-secondary-soft text-brand-secondary border-brand-secondary/30";
    case "cerrada":
      return "bg-brand-primary-soft text-brand-primary border-brand-primary/30";
    case "postventa":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `Hace ${Math.floor(diff / 86400)} d`;
  return date.toLocaleDateString("es-PE");
}
