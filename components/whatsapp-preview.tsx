"use client";

import { Bot, CheckCheck, MessageCircle, Phone, Search } from "lucide-react";

type WhatsappPreviewProps = {
  businessName: string;
  phone?: string;
  leadMessage: string;
  reply: string;
  questions?: string[];
  status?: string;
  attachmentTitle?: string;
  attachmentImage?: string;
};

export function WhatsappPreview({
  businessName,
  phone,
  leadMessage,
  reply,
  questions = [],
  status = "Asistido",
  attachmentTitle,
  attachmentImage
}: WhatsappPreviewProps) {
  return (
    <div className="whatsapp-phone">
      <div className="whatsapp-notch" />
      <div className="whatsapp-header">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--wa-accent)] text-white">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--wa-text)]">{businessName}</p>
            <p className="truncate text-[11px] text-[var(--wa-muted)]">{phone || "WhatsApp Business"} · {status}</p>
          </div>
        </div>
        <div className="flex gap-2 text-[var(--wa-muted)]">
          <Phone className="h-4 w-4" />
          <Search className="h-4 w-4" />
        </div>
      </div>

      <div className="whatsapp-chat">
        {attachmentTitle ? (
          <div className="wa-bubble wa-outgoing max-w-[88%]">
            <p className="mb-2 text-[11px] font-medium text-[var(--wa-muted-dark)]">Vista previa de pieza</p>
            <div className="overflow-hidden rounded-xl bg-[var(--wa-chip)]">
              {attachmentImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attachmentImage} alt={attachmentTitle} className="aspect-square w-full object-contain" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-[var(--wa-chip)] px-4 text-center text-xs text-[var(--wa-muted-dark)]">
                  Render pendiente
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-medium">{attachmentTitle}</p>
          </div>
        ) : null}

        <div className="wa-bubble wa-incoming">
          <p>{leadMessage}</p>
          <span className="wa-time">10:31</span>
        </div>

        <div className="wa-bubble wa-outgoing">
          <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[var(--wa-muted-dark)]">
            <Bot className="h-3.5 w-3.5" />
            Respuesta sugerida
          </div>
          <p>{reply}</p>
          <span className="wa-time justify-end">
            10:32 <CheckCheck className="h-3.5 w-3.5" />
          </span>
        </div>

        {questions.length > 0 ? (
          <div className="wa-bubble wa-outgoing">
            <p className="mb-1 text-[11px] font-medium text-[var(--wa-muted-dark)]">Preguntas de calificacion</p>
            <ul className="space-y-1">
              {questions.slice(0, 3).map((question) => (
                <li key={question}>• {question}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="whatsapp-compose">
        <span className="flex-1 rounded-full bg-[var(--wa-input)] px-4 py-2 text-xs text-[var(--wa-muted)]">Mensaje</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wa-accent)] text-white">
          <MessageCircle className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
