"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  FileText,
  Image,
  LayoutDashboard,
  Megaphone,
  Package,
  PlugZap,
  Settings2,
  Users,
  WandSparkles
} from "lucide-react";
import { useWorkspace } from "@/lib/store";

const navigation = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/business", label: "Business Brain", icon: BrainCircuit },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/content", label: "Contenido", icon: FileText },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/designs", label: "Disenos", icon: Image },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/connections", label: "Conexiones", icon: PlugZap },
  { href: "/analytics", label: "Analitica", icon: BarChart3 },
  { href: "/automations", label: "Automatizaciones", icon: Bot }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, analytics, generateWeek } = useWorkspace();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-ink/10 bg-[var(--color-surface)] xl:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-ink/10 px-5 py-5">
            <Link href="/dashboard" className="pressable flex items-center gap-3 rounded-xl">
              <span className="motion-icon flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-moss text-[var(--color-surface)]">
                {state.brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.brand.logoUrl} alt={`Logo de ${state.business.name}`} className="h-full w-full object-cover" />
                ) : (
                  <WandSparkles className="h-5 w-5" />
                )}
              </span>
              <span>
                <span className="block text-sm font-semibold leading-tight">{state.business.name}</span>
                <span className="block text-xs text-ink/55">Marketing autonomo</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                    active ? "bg-moss text-[var(--color-surface)]" : "nav-link-idle text-ink/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="m-3 rounded-2xl border border-ink/10 bg-paper p-3">
            <div className="flex items-center justify-between text-xs text-ink/60">
              <span>Pendiente revision</span>
              <span className="font-semibold text-coral">{analytics.review}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
              <div className="progress-fill h-full bg-coral" style={{ width: `${Math.min(100, analytics.review * 18)}%` }} />
            </div>
          </div>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-moss">{state.business.niche}</p>
              <h1 className="text-xl font-semibold leading-tight text-ink md:text-2xl">Motor de captacion organica</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/connections" className="btn-secondary">
                <PlugZap className="h-4 w-4" />
                Conectar canales
              </Link>
              <Link href="/business" className="btn-secondary">
                <Settings2 className="h-4 w-4" />
                Configurar
              </Link>
              <button className="btn-primary" onClick={generateWeek}>
                <Megaphone className="h-4 w-4" />
                Generar semana
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 xl:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                    active ? "bg-moss text-[var(--color-surface)]" : "nav-link-idle bg-[var(--color-surface)] text-ink/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
