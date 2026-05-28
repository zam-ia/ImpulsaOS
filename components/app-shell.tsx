"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Settings2,
  Sun,
  Users,
  WandSparkles
} from "lucide-react";
import { Modal } from "@/components/modal";
import { useWorkspace } from "@/lib/store";
import type { ModuleKey, ThemePreference } from "@/lib/types";

const navigation: Array<{ key: ModuleKey; href: string; icon: typeof LayoutDashboard; group: "core" | "ops" | "data" }> = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, group: "core" },
  { key: "business", href: "/business", icon: BrainCircuit, group: "core" },
  { key: "products", href: "/products", icon: Package, group: "core" },
  { key: "content", href: "/content", icon: FileText, group: "ops" },
  { key: "calendar", href: "/calendar", icon: CalendarDays, group: "ops" },
  { key: "designs", href: "/designs", icon: Image, group: "ops" },
  { key: "leads", href: "/leads", icon: Users, group: "ops" },
  { key: "connections", href: "/connections", icon: PlugZap, group: "data" },
  { key: "analytics", href: "/analytics", icon: BarChart3, group: "data" },
  { key: "automations", href: "/automations", icon: Bot, group: "data" }
];

const authPaths = ["/login", "/password-recovery", "/onboarding"];

function resolveTheme(theme: ThemePreference) {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, analytics, generateWeek, updateSettings } = useWorkspace();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ core: true, ops: true, data: true });
  const [showLogout, setShowLogout] = useState(false);
  const moduleLabels = state.settings.moduleLabels;
  const sidebarCollapsed = state.settings.sidebarCollapsed;
  const activeItem = navigation.find((item) => pathname === item.href) ?? navigation[0];
  const activeTitle = moduleLabels[activeItem.key] ?? "Automatizaciones";
  const actualTheme = useMemo(() => resolveTheme(state.settings.theme), [state.settings.theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = actualTheme;
    document.documentElement.style.colorScheme = actualTheme;
  }, [actualTheme]);

  if (authPaths.some((path) => pathname.startsWith(path))) {
    return <div className="min-h-screen bg-paper text-ink">{children}</div>;
  }

  function cycleTheme() {
    const next = actualTheme === "dark" ? "light" : "dark";
    updateSettings({ theme: next });
  }

  function navGroup(title: string, group: "core" | "ops" | "data") {
    const items = navigation.filter((item) => item.group === group);
    const open = sidebarCollapsed ? true : openGroups[group];

    return (
      <div>
        {!sidebarCollapsed ? (
          <button
            className="pressable flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-normal text-ink/45"
            type="button"
            onClick={() => setOpenGroups((current) => ({ ...current, [group]: !current[group] }))}
          >
            {title}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
          </button>
        ) : null}
        <div className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-[var(--ease-out-strong)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="min-h-0 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              const label = moduleLabels[item.key] ?? item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? label : undefined}
                  className={`nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                    active ? "bg-[var(--color-accent)] text-white shadow-[var(--glow-active)]" : "nav-link-idle text-ink/70"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed ? <span className="truncate">{label}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside
        className={`sidebar-shell fixed inset-y-0 left-0 z-20 hidden border-r border-ink/10 bg-[var(--color-surface)] xl:block ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        <button
          className="sidebar-collapse"
          type="button"
          aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          onClick={() => updateSettings({ sidebarCollapsed: !sidebarCollapsed })}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
        <div className="flex h-full flex-col">
          <div className="border-b border-ink/10 px-3 py-5">
            <Link href="/dashboard" className={`pressable flex items-center gap-3 rounded-xl ${sidebarCollapsed ? "justify-center" : ""}`}>
              <span className="motion-icon flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-accent)] text-white shadow-[var(--glow-violet)]">
                {state.brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.brand.logoUrl} alt={`Logo de ${state.business.name}`} className="h-full w-full object-cover" />
                ) : (
                  <WandSparkles className="h-5 w-5" />
                )}
              </span>
              {!sidebarCollapsed ? (
                <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight">{state.business.name}</span>
                <span className="block text-xs text-ink/55">Marketing autonomo</span>
              </span>
              ) : null}
            </Link>
          </div>

          <nav className="flex-1 space-y-3 px-2 py-4">
            {navGroup("Principal", "core")}
            {navGroup("Operacion", "ops")}
            {navGroup("Sistema", "data")}
          </nav>

          {!sidebarCollapsed ? <div className="m-3 rounded-2xl border border-ink/10 bg-paper p-3">
            <div className="flex items-center justify-between text-xs text-ink/60">
              <span>Pendiente revision</span>
              <span className="font-semibold text-coral">{analytics.review}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
              <div className="progress-fill h-full bg-coral" style={{ width: `${Math.min(100, analytics.review * 18)}%` }} />
            </div>
          </div> : null}
        </div>
      </aside>

      <div className={sidebarCollapsed ? "xl:pl-16" : "xl:pl-60"}>
        <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-normal text-[var(--color-accent)]">{state.business.niche}</p>
              <h1 className="text-xl font-semibold leading-tight text-ink md:text-2xl">{activeTitle}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="theme-toggle" type="button" onClick={cycleTheme} aria-label="Cambiar tema">
                <span className="theme-toggle-track">
                  <span className="theme-toggle-thumb">{actualTheme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}</span>
                </span>
              </button>
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
              <button className="btn-ghost" type="button" onClick={() => setShowLogout(true)}>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 xl:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              const label = moduleLabels[item.key] ?? item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                    active ? "bg-[var(--color-accent)] text-white" : "nav-link-idle bg-[var(--color-surface)] text-ink/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
      <Modal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        title="Cerrar sesion"
        description="Este MVP usa sesion local. Al confirmar se mantiene la configuracion, pero vuelves a la pantalla de acceso."
        size="md"
        footer={
          <>
            <button className="btn-secondary" type="button" onClick={() => setShowLogout(false)}>
              Cancelar
            </button>
            <Link className="btn-danger" href="/login" onClick={() => setShowLogout(false)}>
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Link>
          </>
        }
      >
        <div className="rounded-2xl border border-ink/10 bg-paper p-4 text-sm leading-6 text-ink/65">
          El cierre real con Supabase Auth se conecta en `signOut()`. La interfaz y confirmacion ya quedan listas para ese flujo.
        </div>
      </Modal>
    </div>
  );
}
