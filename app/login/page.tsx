"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailError = email && !email.includes("@") ? "Ingresa un correo valido." : "";
  const passwordError = password && password.length < 6 ? "La clave debe tener minimo 6 caracteres." : "";

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1fr_0.95fr]">
      <section className="hidden bg-[#1d1d1f] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white/60">ImpulsaOS</p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-tight">Automatizacion comercial con control humano.</h1>
        </div>
        <div className="grid gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/8 p-4">Contenido, QA, disenos, leads y WhatsApp en un solo flujo.</div>
          <div className="rounded-3xl border border-white/10 bg-white/8 p-4">Modo noche con glow violet y componentes listos para Figma.</div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <form className="motion-panel w-full max-w-md rounded-3xl border border-ink/10 bg-[var(--color-surface)] p-6 shadow-panel">
          <h2 className="text-2xl font-semibold text-ink">Iniciar sesion</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">Accede al panel. En esta version queda listo para conectar Supabase Auth.</p>

          <label className="mt-6 block">
            <span className="mb-1 block text-sm font-medium text-ink/75">Correo</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input className="input pl-9" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@marca.com" />
            </div>
            {emailError ? <span className="mt-1 block text-xs text-coral">{emailError}</span> : null}
          </label>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/75">Clave</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input className="input pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
            </div>
            {passwordError ? <span className="mt-1 block text-xs text-coral">{passwordError}</span> : null}
          </label>

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink/65">
              <input type="checkbox" className="accent-violet" />
              Recordarme
            </label>
            <Link href="/password-recovery" className="font-semibold text-violet">
              Recuperar clave
            </Link>
          </div>

          <Link href="/dashboard" className="btn-primary mt-6 w-full">
            Entrar
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/onboarding" className="btn-secondary mt-3 w-full">
            Crear cuenta demo
          </Link>
        </form>
      </section>
    </main>
  );
}
