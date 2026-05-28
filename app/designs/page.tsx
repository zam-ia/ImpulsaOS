"use client";

import { FormEvent, useMemo, useState } from "react";
import { Download, Image as ImageIcon, Plus, RefreshCw, Save, WandSparkles } from "lucide-react";
import { Modal } from "@/components/modal";
import { EmptyState, Field, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { designTemplates, svgDataUri } from "@/lib/design";
import { useWorkspace } from "@/lib/store";
import type { Channel } from "@/lib/types";

const channels: Array<{ value: Channel; label: string }> = [
  { value: "instagram_post", label: "Instagram post" },
  { value: "instagram_story", label: "Instagram story" },
  { value: "instagram_reel", label: "Instagram reel" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" }
];

function downloadSvg(filename: string, svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadPng(filename: string, svg: string) {
  const img = new Image();
  const url = svgDataUri(svg);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.drawImage(img, 0, 0);
  const png = canvas.toDataURL("image/png");
  const anchor = document.createElement("a");
  anchor.href = png;
  anchor.download = filename;
  anchor.click();
}

export default function DesignsPage() {
  const { state, addDesignAsset, renderAsset } = useWorkspace();
  const designable = state.assets.filter((asset) => asset.copy || asset.designSvg || asset.prompt);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: "Nueva pieza visual",
    productId: state.products[0]?.id ?? "",
    channel: "instagram_post" as Channel,
    templateId: "post_square_clean_v1",
    prompt: "Diseño limpio estilo Apple, alto contraste, CTA claro y logo visible.",
    copy: "Escríbeme INFO por WhatsApp y te paso los detalles."
  });
  const selectedAsset = useMemo(
    () => designable.find((asset) => asset.id === selectedAssetId) ?? designable[0] ?? null,
    [designable, selectedAssetId]
  );
  const selectedProduct = selectedAsset ? state.products.find((product) => product.id === selectedAsset.productId) : null;
  const selectedTemplate = selectedAsset ? designTemplates.find((item) => item.id === selectedAsset.designTemplateId) : null;
  const selectedSvg = selectedAsset?.designSvg ?? "";

  function createDesign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const assetId = addDesignAsset({
      title: form.title,
      productId: form.productId || null,
      channel: form.channel,
      templateId: form.templateId,
      prompt: form.prompt,
      copy: form.copy
    });
    setSelectedAssetId(assetId);
    setShowAddModal(false);
  }

  return (
    <>
      <PageHeader
        title="Design Engine"
        description="Crea piezas visuales desde prompt, plantilla o render automático. La vista previa muestra el diseño final, no una conversación."
      >
        <button className="btn-primary" type="button" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Agregar diseño
        </button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel>
          <PanelHeader title="Piezas visuales" description="Selecciona una pieza para verla en tamaño grande y ajustar su render." />
          {designable.length === 0 ? (
            <EmptyState title="Sin piezas para diseñar" description="Agrega un diseño o genera contenido primero para crear piezas visuales." />
          ) : (
            <div className="stagger-list grid gap-4 p-4 lg:grid-cols-2">
              {designable.map((asset) => {
                const svg = asset.designSvg;
                const template = designTemplates.find((item) => item.id === asset.designTemplateId);
                const active = selectedAsset?.id === asset.id;

                return (
                  <article
                    key={asset.id}
                    className={`pressable rounded-3xl border p-3 ${
                      active ? "border-[var(--color-accent)] bg-[var(--color-surface)] shadow-[var(--glow-violet)]" : "border-ink/10 bg-paper"
                    }`}
                    onClick={() => setSelectedAssetId(asset.id)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <StatusBadge status={asset.status} />
                          <span className="rounded-full bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-ink/60">
                            {template?.format ?? "template"}
                          </span>
                        </div>
                        <h3 className="line-clamp-2 text-sm font-medium leading-5 text-ink">{asset.title}</h3>
                      </div>
                      <ImageIcon className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                    </div>

                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-ink/10 bg-[var(--color-surface)]">
                      {svg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={svgDataUri(svg)} alt={asset.title} className="h-full w-full object-contain" />
                      ) : (
                        <div className="px-6 text-center text-sm text-ink/55">Render pendiente</div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Vista previa del diseño"
              description="Así va quedando la pieza visual con tu logo, colores, texto y CTA."
              action={selectedTemplate ? <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-medium text-violet">{selectedTemplate.format}</span> : null}
            />
            <div className="p-4">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
                <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-ink/10 bg-paper p-4">
                  {selectedSvg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={svgDataUri(selectedSvg)} alt={selectedAsset?.title ?? "Diseño"} className="max-h-[680px] w-full rounded-3xl object-contain shadow-xl" />
                  ) : (
                    <div className="max-w-sm text-center">
                      <WandSparkles className="mx-auto h-10 w-10 text-[var(--color-accent)]" />
                      <p className="mt-4 text-base font-medium text-ink">Selecciona o agrega un diseño</p>
                      <p className="mt-2 text-sm leading-6 text-ink/60">El render aparecerá aquí en tamaño grande para revisar composición y CTA.</p>
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-4">
                  <div className="rounded-3xl border border-ink/10 bg-paper p-4">
                    <p className="text-xs font-medium uppercase tracking-normal text-ink/45">Pieza</p>
                    <h3 className="mt-2 text-xl font-medium text-ink">{selectedAsset?.title ?? "Sin selección"}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/60">{selectedProduct?.name ?? "Sin producto asociado"}</p>
                  </div>
                  <div className="rounded-3xl border border-ink/10 bg-paper p-4">
                    <p className="text-xs font-medium uppercase tracking-normal text-ink/45">Prompt</p>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{selectedAsset?.prompt || "Sin prompt configurado."}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-secondary" disabled={!selectedAsset} onClick={() => selectedAsset && renderAsset(selectedAsset.id, "post_square_clean_v1")}>
                      <RefreshCw className="h-4 w-4" />
                      Post
                    </button>
                    <button className="btn-secondary" disabled={!selectedAsset} onClick={() => selectedAsset && renderAsset(selectedAsset.id, "story_v1")}>
                      <RefreshCw className="h-4 w-4" />
                      Story
                    </button>
                    <button className="btn-secondary" disabled={!selectedSvg || !selectedAsset} onClick={() => selectedSvg && selectedAsset && downloadSvg(`${selectedAsset.id}.svg`, selectedSvg)}>
                      <Download className="h-4 w-4" />
                      SVG
                    </button>
                    <button className="btn-primary" disabled={!selectedSvg || !selectedAsset} onClick={() => selectedSvg && selectedAsset && downloadPng(`${selectedAsset.id}.png`, selectedSvg)}>
                      <Download className="h-4 w-4" />
                      PNG
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar diseño"
        description="Crea una pieza visual desde prompt y plantilla. Se renderiza automáticamente con tu Brand Kit."
        size="lg"
      >
        <form className="grid gap-4" onSubmit={createDesign}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título">
              <input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="Producto">
              <select className="select" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
                {state.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Canal">
              <select className="select" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as Channel })}>
                {channels.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plantilla">
              <select className="select" value={form.templateId} onChange={(event) => setForm({ ...form, templateId: event.target.value })}>
                {designTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Prompt visual">
            <textarea className="textarea" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} />
          </Field>
          <Field label="Copy / CTA">
            <textarea className="textarea" value={form.copy} onChange={(event) => setForm({ ...form, copy: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setShowAddModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit">
              <Save className="h-4 w-4" />
              Crear diseño
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
