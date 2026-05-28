"use client";

import Link from "next/link";
import { ArrowRight, Building2, Palette, PlugZap, Target } from "lucide-react";

const steps = [
  { title: "Negocio", icon: Building2, text: "Nombre, rubro, promesa y WhatsApp." },
  { title: "Marca", icon: Palette, text: "Logo, colores, tono y referencias." },
  { title: "Oferta", icon: Target, text: "Productos, precios, beneficios y restricciones." },
  { title: "Canales", icon: PlugZap, text: "Facebook, Instagram, TikTok y WhatsApp." }
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-violet">Wizard de 4 pasos</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Configura ImpulsaOS</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Este onboarding deja el sistema listo para generar contenido, automatizaciones y captacion organica.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="motion-panel rounded-3xl border border-ink/10 bg-[var(--color-surface)] p-5 shadow-panel">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 text-violet">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-ink/45">Paso {index + 1}</p>
                    <h2 className="mt-1 text-xl font-semibold text-ink">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/60">{step.text}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/business" className="btn-primary">
            Empezar configuracion
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn-secondary">
            Volver a login
          </Link>
        </div>
      </section>
    </main>
  );
}
