"use client";

import Link from "next/link";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";

const steps = [
  "Ingresar correo",
  "Validar cuenta",
  "Enviar enlace seguro",
  "Abrir correo",
  "Crear nueva clave",
  "Confirmar acceso"
];

export default function PasswordRecoveryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-10">
      <section className="motion-panel grid w-full max-w-4xl gap-6 rounded-3xl border border-ink/10 bg-[var(--color-surface)] p-6 shadow-panel lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 text-violet">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-ink">Recuperar contrasena</h1>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Flujo de 6 pasos preparado para Supabase Auth. En demo no envia correos reales.
          </p>
          <label className="mt-6 block">
            <span className="mb-1 block text-sm font-medium text-ink/75">Correo de la cuenta</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input className="input pl-9" placeholder="tu@marca.com" />
            </div>
          </label>
          <button className="btn-primary mt-4 w-full" type="button">
            Enviar enlace
          </button>
          <Link className="btn-secondary mt-3 w-full" href="/login">
            Volver a login
          </Link>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper p-4">
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet/10 text-sm font-semibold text-violet">{index + 1}</span>
                <span className="flex-1 text-sm font-medium text-ink">{step}</span>
                {index < 2 ? <CheckCircle2 className="h-4 w-4 text-moss" /> : <span className="h-2 w-2 rounded-full bg-ink/20" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
