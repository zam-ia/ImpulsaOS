"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
};

const sizes = {
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl"
};

export function Modal({ open, title, description, children, onClose, footer, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button className="absolute inset-0 bg-ink/35 backdrop-blur-sm" aria-label="Cerrar modal" onClick={onClose} />
      <section className={`motion-panel relative z-10 flex max-h-[92vh] w-full ${sizes[size]} flex-col overflow-hidden rounded-3xl border border-ink/10 bg-[var(--color-surface)] shadow-2xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-5 text-ink/60">{description}</p> : null}
          </div>
          <button className="pressable rounded-full border border-ink/10 p-2 text-ink/60" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="overflow-auto p-5">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-ink/10 px-5 py-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
