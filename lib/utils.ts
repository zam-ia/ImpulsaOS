export function makeId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function todayIso(): string {
  return new Date().toISOString();
}

export function addDaysIso(days: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function formatMoney(amount: number | null | undefined, currency = "PEN"): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Precio por confirmar";
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

export function cleanList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function shortDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function readableStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "Borrador",
    needs_review: "Requiere revisión",
    approved: "Aprobado",
    scheduled: "Programado",
    published: "Publicado",
    rejected: "Rechazado",
    failed: "Fallido",
    new: "Nuevo",
    contacted: "Contactado",
    qualified: "Calificado",
    proposal_sent: "Propuesta enviada",
    won: "Ganado",
    lost: "Perdido",
    nurture: "Nutrición"
  };

  return map[status] ?? status;
}
