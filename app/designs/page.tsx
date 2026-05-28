"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Image as ImageIcon, Plus, RefreshCw, Save, Upload, WandSparkles } from "lucide-react";
import { ImageCropModal } from "@/components/image-crop-modal";
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
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = filename;
  anchor.click();
}

export default function DesignsPage() {
  const { state, addDesignAsset, renderAsset, updateAsset, updateBrand } = useWorkspace();
  const designable = state.assets.filter((asset) => asset.copy || asset.designSvg || asset.prompt);
  const pageTargets = state.connections.filter((connection) => connection.platform !== "whatsapp");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [form, setForm] = useState({
    title: "Nueva pieza visual",
    productId: state.products[0]?.id ?? "",
    channel: "instagram_post" as Channel,
    templateId: "post_square_clean_v1",
    prompt: "Diseno limpio estilo Apple, alto contraste, CTA claro y logo visible.",
    copy: "Escribeme INFO por WhatsApp y te paso los detalles.",
    targetConnectionIds: [] as string[],
    referenceImageUrls: [] as string[]
  });
  const [editForm, setEditForm] = useState({
    title: "",
    copy: "",
    prompt: "",
    channel: "instagram_post" as Channel,
    templateId: "post_square_clean_v1",
    targetConnectionIds: [] as string[],
    referenceImageUrls: [] as string[]
  });
  const selectedAsset = useMemo(
    () => designable.find((asset) => asset.id === selectedAssetId) ?? designable[0] ?? null,
    [designable, selectedAssetId]
  );
  const selectedProduct = selectedAsset ? state.products.find((product) => product.id === selectedAsset.productId) : null;
  const selectedTemplate = selectedAsset ? designTemplates.find((item) => item.id === selectedAsset.designTemplateId) : null;
  const selectedSvg = selectedAsset?.designSvg ?? "";

  useEffect(() => {
    if (!selectedAsset) return;
    setEditForm({
      title: selectedAsset.title,
      copy: selectedAsset.copy,
      prompt: selectedAsset.prompt,
      channel: selectedAsset.channel,
      templateId: selectedAsset.designTemplateId,
      targetConnectionIds: selectedAsset.targetConnectionIds ?? [],
      referenceImageUrls: selectedAsset.referenceImageUrls ?? []
    });
  }, [selectedAsset]);

  function toggleTarget(targetId: string, mode: "create" | "edit") {
    if (mode === "create") {
      const exists = form.targetConnectionIds.includes(targetId);
      setForm({
        ...form,
        targetConnectionIds: exists ? form.targetConnectionIds.filter((item) => item !== targetId) : [...form.targetConnectionIds, targetId]
      });
      return;
    }

    const exists = editForm.targetConnectionIds.includes(targetId);
    setEditForm({
      ...editForm,
      targetConnectionIds: exists
        ? editForm.targetConnectionIds.filter((item) => item !== targetId)
        : [...editForm.targetConnectionIds, targetId]
    });
  }

  function createDesign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const assetId = addDesignAsset({
      title: form.title,
      productId: form.productId || null,
      channel: form.channel,
      templateId: form.templateId,
      prompt: form.prompt,
      copy: form.copy,
      targetConnectionIds: form.targetConnectionIds,
      referenceImageUrls: form.referenceImageUrls.length > 0 ? form.referenceImageUrls : state.brand.referenceAssets.slice(0, 3)
    });
    setSelectedAssetId(assetId);
    setShowAddModal(false);
  }

  function saveSelectedDesign() {
    if (!selectedAsset) return;
    updateAsset(selectedAsset.id, {
      title: editForm.title,
      copy: editForm.copy,
      prompt: editForm.prompt,
      channel: editForm.channel,
      designTemplateId: editForm.templateId,
      targetConnectionIds: editForm.targetConnectionIds,
      referenceImageUrls: editForm.referenceImageUrls
    });
    window.setTimeout(() => renderAsset(selectedAsset.id, editForm.templateId), 0);
  }

  function saveReferenceImage(dataUrl: string) {
    updateBrand({ referenceAssets: [dataUrl, ...state.brand.referenceAssets].slice(0, 10) });
    if (selectedAsset) {
      setEditForm((current) => ({
        ...current,
        referenceImageUrls: [dataUrl, ...current.referenceImageUrls].slice(0, 5)
      }));
    } else {
      setForm((current) => ({
        ...current,
        referenceImageUrls: [dataUrl, ...current.referenceImageUrls].slice(0, 5)
      }));
    }
  }

  return (
    <>
      <PageHeader
        title="Design Engine"
        description="Crea piezas visuales desde prompt, plantilla, texto editable e imagenes de referencia. El render usa tu Brand Kit y paginas destino."
      >
        <button className="btn-secondary" type="button" onClick={() => setShowReferenceModal(true)}>
          <Upload className="h-4 w-4" />
          Referencia
        </button>
        <button className="btn-primary" type="button" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Agregar diseno
        </button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Panel>
          <PanelHeader title="Piezas visuales" description="Selecciona una pieza para editar texto, prompt, plantilla, referencias y paginas destino." />
          {designable.length === 0 ? (
            <EmptyState title="Sin piezas para disenar" description="Agrega un diseno o genera contenido primero para crear piezas visuales." />
          ) : (
            <div className="stagger-list grid gap-4 p-4 lg:grid-cols-2">
              {designable.map((asset) => {
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
                      {asset.designSvg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={svgDataUri(asset.designSvg)} alt={asset.title} className="h-full w-full object-contain" />
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
              title="Vista previa del diseno"
              description="Aqui se revisa la pieza visual real antes de publicarla."
              action={selectedTemplate ? <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-medium text-violet">{selectedTemplate.format}</span> : null}
            />
            <div className="grid gap-5 p-4 lg:grid-cols-[1fr_0.72fr]">
              <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-ink/10 bg-paper p-4">
                {selectedSvg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={svgDataUri(selectedSvg)} alt={selectedAsset?.title ?? "Diseno"} className="max-h-[680px] w-full rounded-3xl object-contain shadow-xl" />
                ) : (
                  <div className="max-w-sm text-center">
                    <WandSparkles className="mx-auto h-10 w-10 text-[var(--color-accent)]" />
                    <p className="mt-4 text-base font-medium text-ink">Selecciona o agrega un diseno</p>
                    <p className="mt-2 text-sm leading-6 text-ink/60">El render aparecera aqui en tamano grande para revisar composicion y CTA.</p>
                  </div>
                )}
              </div>

              <div className="grid content-start gap-4">
                <div className="rounded-3xl border border-ink/10 bg-paper p-4">
                  <p className="text-xs font-medium uppercase tracking-normal text-ink/45">Pieza</p>
                  <h3 className="mt-2 text-xl font-medium text-ink">{selectedAsset?.title ?? "Sin seleccion"}</h3>
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
          </Panel>

          <Panel>
            <PanelHeader title="Editor de texto y referencias" description="Ajusta copy, prompt, plantilla y paginas antes de regenerar el render." />
            {selectedAsset ? (
              <div className="grid gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Titulo">
                    <input className="input" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} />
                  </Field>
                  <Field label="Canal">
                    <select className="select" value={editForm.channel} onChange={(event) => setEditForm({ ...editForm, channel: event.target.value as Channel })}>
                      {channels.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Plantilla">
                    <select className="select" value={editForm.templateId} onChange={(event) => setEditForm({ ...editForm, templateId: event.target.value })}>
                      {designTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Paginas destino">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-paper p-2">
                      {pageTargets.map((connection) => {
                        const active = editForm.targetConnectionIds.includes(connection.id);
                        return (
                          <button
                            key={connection.id}
                            type="button"
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-moss text-white" : "bg-[var(--color-surface)] text-ink/65"}`}
                            onClick={() => toggleTarget(connection.id, "edit")}
                          >
                            {connection.label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
                <Field label="Texto / CTA">
                  <textarea className="textarea" value={editForm.copy} onChange={(event) => setEditForm({ ...editForm, copy: event.target.value })} />
                </Field>
                <Field label="Prompt visual">
                  <textarea className="textarea" value={editForm.prompt} onChange={(event) => setEditForm({ ...editForm, prompt: event.target.value })} />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  {editForm.referenceImageUrls.map((image, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={`${image.slice(0, 32)}-${index}`} src={image} alt="Referencia" className="h-14 w-14 rounded-2xl border border-ink/10 object-cover" />
                  ))}
                  <button className="btn-secondary" type="button" onClick={() => setShowReferenceModal(true)}>
                    <Upload className="h-4 w-4" />
                    Subir referencia
                  </button>
                  <button className="btn-primary" type="button" onClick={saveSelectedDesign}>
                    <Save className="h-4 w-4" />
                    Guardar y renderizar
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState title="Sin pieza seleccionada" description="Agrega una pieza para editar textos, referencias y paginas destino." />
            )}
          </Panel>
        </div>
      </div>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar diseno"
        description="Crea una pieza visual desde prompt y plantilla. Se renderiza automaticamente con tu Brand Kit."
        size="lg"
      >
        <form className="grid gap-4" onSubmit={createDesign}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulo">
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
          <Field label="Paginas destino">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-paper p-2">
              {pageTargets.map((connection) => {
                const active = form.targetConnectionIds.includes(connection.id);
                return (
                  <button
                    key={connection.id}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-moss text-white" : "bg-[var(--color-surface)] text-ink/65"}`}
                    onClick={() => toggleTarget(connection.id, "create")}
                  >
                    {connection.label}
                  </button>
                );
              })}
            </div>
          </Field>
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
              Crear diseno
            </button>
          </div>
        </form>
      </Modal>

      <ImageCropModal
        open={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
        title="Subir imagen de referencia"
        description="Recorta una referencia para que el prompt visual tenga guia de estilo, producto o composicion."
        aspect="square"
        onSave={saveReferenceImage}
      />
    </>
  );
}
