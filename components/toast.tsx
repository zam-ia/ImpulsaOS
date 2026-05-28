"use client";

import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info
};

export function ToastPreview({ type, title, message }: { type: ToastType; title: string; message: string }) {
  const Icon = icons[type];

  return (
    <div className={`toast toast-${type} flex items-start gap-3`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-ink/60">{message}</p>
      </div>
    </div>
  );
}
