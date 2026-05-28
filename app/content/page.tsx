"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Pencil, RefreshCw, Save, Sparkles, XCircle } from "lucide-react";
import { Modal } from "@/components/modal";
import { EmptyState, Field, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { Channel, ContentAsset, ContentObjective, ContentStatus } from "@/lib/types";

const objectives: Array<{ value: ContentObjective; label: string }> = [
  { value: "valor", label: "Valor" },
  { value: "viralidad", label: "Viralidad" },
  { value: "autoridad", label: "Autoridad" },
  { value: "prueba_social", label: "Prueba social" },
  { value: "venta", label: "Venta" },
  { value: "comunidad", label: "Comunidad" }
];

const channels: Array<{ value: Channel; label: string }> = [
  { value: "instagram_post", label: "Instagram post" },
  { value: "instagram_reel", label: "Instagram reel" },
  { value: "instagram_story", label: "Instagram story" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" }
];

const contentStatuses: ContentStatus[] = ["draft", "needs_review", "approved", "scheduled", "published", "rejected", "failed"];

type AssetEditForm = {
  title: string;
  channel: Channel;
  copy: string;
  script: string;
  prompt: string;
  status: ContentStatus;
  qaScore: number;
  qaNotesText: string;
  blockersText: string;
};

export default function ContentPage() {
  const { state, generateWeek, generateContent, updateAsset, updateAssetStatus, renderAsset } = useWorkspace();
  const [productId, setProductId] = useState(state.products[0]?.id ?? "");
  const [objective, setObjective] = useState<ContentObjective>("valor");
  const [channel, setChannel] = useState<Channel>("instagram_post");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState<AssetEditForm>({
    title: "",
    channel: "instagram_post",
    copy: "",
    script: "",
    prompt: "",
    status: "needs_review",
    qaScore: 0,
    qaNotesText: "",
    blockersText: ""
  });
  const assets = state.assets;

  function openAssetEdit(asset: ContentAsset) {
    setEditingAssetId(asset.id);
    setAssetForm({
      title: asset.title,
      channel: asset.channel,
      copy: asset.copy,
      script: asset.script,
      prompt: asset.prompt,
      status: asset.status,
      qaScore: asset.qa.score,
      qaNotesText: asset.qa.qaNotes.join("\n"),
      blockersText: asset.qa.blockers.join("\n")
    });
  }

  function saveAssetEdit() {
    if (!editingAssetId) return;

    updateAsset(editingAssetId, {
      title: assetForm.title,
      channel: assetForm.channel,
      copy: assetForm.copy,
      script: assetForm.script,
      prompt: assetForm.prompt,
      status: assetForm.status,
      qa: {
        score: Math.max(0, Math.min(100, Number(assetForm.qaScore) || 0)),
        qaNotes: assetForm.qaNotesText.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
        blockers: assetForm.blockersText.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
        riskFlags: [],
        needsReview: assetForm.status === "needs_review"
      }
    });
    setEditingAssetId(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId) return;
    generateContent({ productId, objective, channel });
  }

  return (
    <>
      <PageHeader
        title="Content Strategy Engine"
        description="Genera ideas, hooks, copies, guiones y CTAs por objetivo. Cada pieza pasa por QA comercial antes de publicarse."
      >
        <button className="btn-primary" onClick={generateWeek}>
          <Sparkles className="h-4 w-4" />
          Generar matriz semanal
        </button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <PanelHeader title="Crear campaña rápida" description="Producto + objetivo + canal. El motor usa el Business Brain y el catálogo." />
          <form className="grid gap-4 p-4" onSubmit={submit}>
            <Field label="Producto">
              <select className="select" value={productId} onChange={(event) => setProductId(event.target.value)}>
                {state.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Objetivo">
              <select className="select" value={objective} onChange={(event) => setObjective(event.target.value as ContentObjective)}>
                {objectives.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Canal">
              <select className="select" value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>
                {channels.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <button className="btn-primary" type="submit">
              <Sparkles className="h-4 w-4" />
              Generar pieza
            </button>
          </form>
        </Panel>

        <Panel>
          <PanelHeader title="Piezas generadas" description="Ciclo de revisión: borrador, aprobación, diseño, programación y publicación." />
          {assets.length === 0 ? (
            <EmptyState title="Aún no hay assets" description="Genera una campaña o una semana completa para ver piezas aquí." />
          ) : (
            <div className="stagger-list divide-y divide-ink/10">
              {assets.map((asset) => {
                const idea = state.ideas.find((item) => item.id === asset.ideaId);
                const product = state.products.find((item) => item.id === asset.productId);
                return (
                  <article key={asset.id} className="p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <StatusBadge status={asset.status} />
                            <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{idea?.objective}</span>
                            <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{asset.channel.replaceAll("_", " ")}</span>
                            <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">QA {asset.qa.score}/100</span>
                          </div>
                          <h3 className="font-semibold text-ink">{asset.title}</h3>
                          <p className="mt-1 text-sm text-ink/60">{product?.name}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-secondary" type="button" onClick={() => openAssetEdit(asset)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button className="btn-secondary" onClick={() => renderAsset(asset.id)}>
                            <RefreshCw className="h-4 w-4" />
                            Render
                          </button>
                          <button className="btn-secondary" onClick={() => updateAssetStatus(asset.id, "rejected")}>
                            <XCircle className="h-4 w-4" />
                            Rechazar
                          </button>
                          <button className="btn-primary" onClick={() => updateAssetStatus(asset.id, "approved")}>
                            <CheckCircle2 className="h-4 w-4" />
                            Aprobar
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-paper p-3 text-sm leading-6 text-ink/75">
                          {asset.copy || asset.script || asset.prompt}
                        </pre>
                        <div className="rounded-md border border-ink/10 bg-paper p-3">
                          <p className="text-sm font-semibold text-ink">QA</p>
                          <ul className="mt-2 space-y-2 text-sm leading-5 text-ink/65">
                            {asset.qa.qaNotes.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                            {asset.qa.blockers.map((blocker) => (
                              <li key={blocker} className="font-medium text-coral">
                                {blocker}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
      <Modal
        open={editingAssetId !== null}
        onClose={() => setEditingAssetId(null)}
        title="Editar pieza de contenido"
        description="Ajusta copy, canal, QA y estado. El calendario y las publicaciones se sincronizan con este asset."
        size="xl"
        footer={
          <>
            <button className="btn-secondary" type="button" onClick={() => setEditingAssetId(null)}>
              Cancelar
            </button>
            <button className="btn-primary" type="button" onClick={saveAssetEdit}>
              <Save className="h-4 w-4" />
              Guardar pieza
            </button>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <Field label="Titulo">
              <input className="input" value={assetForm.title} onChange={(event) => setAssetForm({ ...assetForm, title: event.target.value })} />
            </Field>
            <Field label="Copy">
              <textarea className="textarea min-h-48" value={assetForm.copy} onChange={(event) => setAssetForm({ ...assetForm, copy: event.target.value })} />
            </Field>
            <Field label="Guion / script">
              <textarea className="textarea" value={assetForm.script} onChange={(event) => setAssetForm({ ...assetForm, script: event.target.value })} />
            </Field>
            <Field label="Prompt visual">
              <textarea className="textarea" value={assetForm.prompt} onChange={(event) => setAssetForm({ ...assetForm, prompt: event.target.value })} />
            </Field>
          </div>
          <div className="grid content-start gap-4">
            <Field label="Canal">
              <select className="select" value={assetForm.channel} onChange={(event) => setAssetForm({ ...assetForm, channel: event.target.value as Channel })}>
                {channels.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select className="select" value={assetForm.status} onChange={(event) => setAssetForm({ ...assetForm, status: event.target.value as ContentStatus })}>
                {contentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="QA score">
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                value={assetForm.qaScore}
                onChange={(event) => setAssetForm({ ...assetForm, qaScore: Number(event.target.value) })}
              />
            </Field>
            <Field label="Notas QA" hint="Una por linea.">
              <textarea className="textarea" value={assetForm.qaNotesText} onChange={(event) => setAssetForm({ ...assetForm, qaNotesText: event.target.value })} />
            </Field>
            <Field label="Bloqueos QA" hint="Si agregas bloqueos, manten la pieza en revision o rechazada.">
              <textarea className="textarea" value={assetForm.blockersText} onChange={(event) => setAssetForm({ ...assetForm, blockersText: event.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>
    </>
  );
}
