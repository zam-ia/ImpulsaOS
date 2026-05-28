"use client";

import { FormEvent, useMemo, useState } from "react";
import { MessageCircle, Pencil, Plus, Save, Send } from "lucide-react";
import { Modal } from "@/components/modal";
import { Field, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { Lead, LeadStage } from "@/lib/types";
import { buildTrackedWhatsappUrl, buildWhatsappMessage, suggestedReply } from "@/lib/whatsapp";

const stages: LeadStage[] = ["new", "contacted", "qualified", "proposal_sent", "won", "lost", "nurture"];

export default function LeadsPage() {
  const { state, addLead, updateLead, updateLeadStage } = useWorkspace();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    channel: "instagram",
    source: "manual",
    interest: state.products[0]?.name ?? "",
    interestLevel: 70,
    stage: "new" as LeadStage,
    assignedTo: "Usuaria"
  });
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    channel: "",
    source: "",
    interest: "",
    interestLevel: 0,
    stage: "new" as LeadStage,
    assignedTo: ""
  });
  const [linkProductId, setLinkProductId] = useState(state.products[0]?.id ?? "");
  const [campaign, setCampaign] = useState("semana_01");
  const selectedProduct = state.products.find((product) => product.id === linkProductId);
  const trackedLink = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    const message = buildWhatsappMessage({
      businessName: state.business.name,
      productName: selectedProduct?.name,
      campaign,
      channel: "instagram"
    });
    return buildTrackedWhatsappUrl({
      baseUrl,
      campaign,
      productId: linkProductId,
      channel: "instagram",
      phone: state.business.whatsappPhone,
      text: message
    });
  }, [campaign, linkProductId, selectedProduct?.name, state.business.name, state.business.whatsappPhone]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addLead({
      ...form,
      sourcePostId: null
    });
    setForm({ ...form, name: "", phone: "" });
  }

  function openLeadEdit(lead: Lead) {
    setEditingLeadId(lead.id);
    setLeadForm({
      name: lead.name,
      phone: lead.phone,
      channel: lead.channel,
      source: lead.source,
      interest: lead.interest,
      interestLevel: lead.interestLevel,
      stage: lead.stage,
      assignedTo: lead.assignedTo
    });
  }

  function saveLeadEdit() {
    if (!editingLeadId) return;
    updateLead(editingLeadId, leadForm);
    setEditingLeadId(null);
  }

  return (
    <>
      <PageHeader
        title="Lead Capture + WhatsApp Handoff"
        description="Registra clics, leads manuales, etapas y respuestas sugeridas sin automatizar envíos masivos ni usar WhatsApp Web no oficial."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Link trackeado a WhatsApp" description="Úsalo en posts, stories o bio para registrar origen antes de redirigir." />
            <div className="grid gap-4 p-4">
              <Field label="Producto">
                <select className="select" value={linkProductId} onChange={(event) => setLinkProductId(event.target.value)}>
                  {state.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Campaña">
                <input className="input" value={campaign} onChange={(event) => setCampaign(event.target.value)} />
              </Field>
              <div className="rounded-md bg-paper p-3">
                <p className="break-all text-sm leading-6 text-ink/70">{trackedLink}</p>
              </div>
              <a className="btn-primary" href={trackedLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                Probar link
              </a>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Captura manual" description="Útil mientras no configures webhooks o Supabase." />
            <form className="grid gap-4 p-4" onSubmit={submit}>
              <Field label="Nombre">
                <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </Field>
              <Field label="Teléfono">
                <input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <Field label="Interés">
                <input className="input" value={form.interest} onChange={(event) => setForm({ ...form, interest: event.target.value })} />
              </Field>
              <Field label="Nivel de interés">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={form.interestLevel}
                  onChange={(event) => setForm({ ...form, interestLevel: Number(event.target.value) })}
                />
              </Field>
              <button className="btn-primary" type="submit">
                <Plus className="h-4 w-4" />
                Agregar lead
              </button>
            </form>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Bandeja de leads" description="Etapas comerciales y respuesta sugerida para WhatsApp." />
          <div className="stagger-list divide-y divide-ink/10">
            {state.leads.map((lead) => (
              <article key={lead.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <StatusBadge status={lead.stage} />
                      <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{lead.channel}</span>
                      <span className="rounded bg-coral/10 px-2 py-1 text-xs font-semibold text-coral">{lead.interestLevel}%</span>
                    </div>
                    <h3 className="text-base font-semibold text-ink">{lead.name || "Lead sin nombre"}</h3>
                    <p className="mt-1 text-sm text-ink/60">{lead.interest}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button className="btn-secondary" type="button" onClick={() => openLeadEdit(lead)}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                    <select className="select max-w-56" value={lead.stage} onChange={(event) => updateLeadStage(lead.id, event.target.value as LeadStage)}>
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 rounded-md bg-paper p-3 text-sm leading-6 text-ink/70">
                  {suggestedReply({ leadName: lead.name, productName: lead.interest, stage: lead.stage })}
                </div>
                <a
                  className="btn-secondary mt-3"
                  href={`https://wa.me/${lead.phone}?text=${encodeURIComponent(suggestedReply({ leadName: lead.name, productName: lead.interest, stage: lead.stage }))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send className="h-4 w-4" />
                  Abrir WhatsApp
                </a>
              </article>
            ))}
          </div>
        </Panel>
      </div>
      <Modal
        open={editingLeadId !== null}
        onClose={() => setEditingLeadId(null)}
        title="Editar lead"
        description="Actualiza los datos comerciales. Las respuestas sugeridas y la etapa de seguimiento usan esta informacion."
        size="lg"
        footer={
          <>
            <button className="btn-secondary" type="button" onClick={() => setEditingLeadId(null)}>
              Cancelar
            </button>
            <button className="btn-primary" type="button" onClick={saveLeadEdit}>
              <Save className="h-4 w-4" />
              Guardar lead
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre">
            <input className="input" value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} />
          </Field>
          <Field label="Telefono">
            <input className="input" value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} />
          </Field>
          <Field label="Canal">
            <input className="input" value={leadForm.channel} onChange={(event) => setLeadForm({ ...leadForm, channel: event.target.value })} />
          </Field>
          <Field label="Fuente">
            <input className="input" value={leadForm.source} onChange={(event) => setLeadForm({ ...leadForm, source: event.target.value })} />
          </Field>
          <Field label="Interes">
            <input className="input" value={leadForm.interest} onChange={(event) => setLeadForm({ ...leadForm, interest: event.target.value })} />
          </Field>
          <Field label="Nivel de interes">
            <input
              className="input"
              type="number"
              min="0"
              max="100"
              value={leadForm.interestLevel}
              onChange={(event) => setLeadForm({ ...leadForm, interestLevel: Number(event.target.value) })}
            />
          </Field>
          <Field label="Etapa">
            <select className="select" value={leadForm.stage} onChange={(event) => setLeadForm({ ...leadForm, stage: event.target.value as LeadStage })}>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Asignado a">
            <input className="input" value={leadForm.assignedTo} onChange={(event) => setLeadForm({ ...leadForm, assignedTo: event.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
