"use client";

import { useState } from "react";
import { CalendarDays, Check, Pencil, Plus, Save, Send } from "lucide-react";
import { Modal } from "@/components/modal";
import { EmptyState, Field, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { Channel, ContentStatus, Publication } from "@/lib/types";
import { shortDate } from "@/lib/utils";

const publicationStatuses: ContentStatus[] = ["needs_review", "approved", "scheduled", "published", "failed"];
const channels: Channel[] = ["facebook", "instagram_post", "instagram_reel", "instagram_story", "tiktok", "whatsapp"];

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function CalendarPage() {
  const { state, addPublication, updatePublication, updateAssetStatus } = useWorkspace();
  const [editingPublicationId, setEditingPublicationId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [publicationForm, setPublicationForm] = useState({
    assetId: state.assets[0]?.id ?? "",
    scheduledAt: "",
    channel: "instagram_post" as Channel,
    status: "scheduled" as ContentStatus,
    platformPostId: ""
  });
  const publications = [...state.publications].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  function openAddPublication() {
    setPublicationForm({
      assetId: state.assets[0]?.id ?? "",
      scheduledAt: toDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
      channel: "instagram_post",
      status: "scheduled",
      platformPostId: ""
    });
    setShowAddModal(true);
  }

  function openPublicationEdit(publication: Publication) {
    setEditingPublicationId(publication.id);
    setPublicationForm({
      assetId: publication.assetId,
      scheduledAt: toDatetimeLocal(publication.scheduledAt),
      channel: publication.channel,
      status: publication.status,
      platformPostId: publication.platformPostId ?? ""
    });
  }

  function saveNewPublication() {
    if (!publicationForm.assetId || !publicationForm.scheduledAt) return;
    addPublication({
      assetId: publicationForm.assetId,
      channel: publicationForm.channel,
      scheduledAt: new Date(publicationForm.scheduledAt).toISOString(),
      publishedAt: publicationForm.status === "published" ? new Date().toISOString() : null,
      platformPostId: publicationForm.platformPostId || null,
      status: publicationForm.status
    });
    setShowAddModal(false);
  }

  function savePublicationEdit() {
    if (!editingPublicationId) return;
    const publication = state.publications.find((item) => item.id === editingPublicationId);
    const scheduledAt = publicationForm.scheduledAt ? new Date(publicationForm.scheduledAt).toISOString() : publication?.scheduledAt;
    updatePublication(editingPublicationId, {
      scheduledAt,
      channel: publicationForm.channel,
      status: publicationForm.status,
      platformPostId: publicationForm.platformPostId || null,
      publishedAt: publicationForm.status === "published" ? publication?.publishedAt ?? new Date().toISOString() : publication?.publishedAt ?? null
    });
    if (publication) updateAssetStatus(publication.assetId, publicationForm.status);
    setEditingPublicationId(null);
  }

  return (
    <>
      <PageHeader
        title="Scheduler & Publisher"
        description="Calendario editorial con modo publicacion asistida. Meta API queda lista para usar cuando existan tokens y permisos."
      >
        <button className="btn-primary" type="button" onClick={openAddPublication} disabled={state.assets.length === 0}>
          <Plus className="h-4 w-4" />
          Agregar publicacion
        </button>
      </PageHeader>

      <Panel>
        <PanelHeader title="Calendario de publicaciones" description="Aprueba, programa o marca publicado segun el flujo real." />
        {publications.length === 0 ? (
          <EmptyState title="Sin publicaciones" description="Genera o agrega una pieza para crear la cola de publicaciones." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs font-medium uppercase tracking-normal text-ink/55">
                  <th className="table-cell">Fecha</th>
                  <th className="table-cell">Pieza</th>
                  <th className="table-cell">Canal</th>
                  <th className="table-cell">Estado</th>
                  <th className="table-cell">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {publications.map((publication) => {
                  const asset = state.assets.find((item) => item.id === publication.assetId);
                  return (
                    <tr key={publication.id}>
                      <td className="table-cell font-medium text-ink">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-[var(--color-accent)]" />
                          {shortDate(publication.scheduledAt)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-ink">{asset?.title ?? "Pieza sin titulo"}</p>
                        <p className="mt-1 line-clamp-2 text-ink/60">{asset?.copy.split("\n")[0]}</p>
                      </td>
                      <td className="table-cell text-ink/70">{publication.channel.replaceAll("_", " ")}</td>
                      <td className="table-cell">
                        <StatusBadge status={publication.status} />
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-secondary" type="button" onClick={() => openPublicationEdit(publication)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => {
                              updatePublication(publication.id, { status: "scheduled" });
                              if (asset) updateAssetStatus(asset.id, "scheduled");
                            }}
                          >
                            <Check className="h-4 w-4" />
                            Programar
                          </button>
                          <button
                            className="btn-primary"
                            type="button"
                            onClick={() => {
                              updatePublication(publication.id, {
                                status: "published",
                                publishedAt: new Date().toISOString(),
                                platformPostId: `manual_${Date.now()}`,
                                metrics: {
                                  ...publication.metrics,
                                  reach: publication.metrics.reach || 320,
                                  impressions: publication.metrics.impressions || 410,
                                  clicks: publication.metrics.clicks || 12
                                }
                              });
                              if (asset) updateAssetStatus(asset.id, "published");
                            }}
                          >
                            <Send className="h-4 w-4" />
                            Publicado
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <PublicationModal
        open={showAddModal}
        title="Agregar publicacion"
        description="Programa una pieza existente en el calendario y sincroniza su estado."
        assets={state.assets}
        form={publicationForm}
        onFormChange={setPublicationForm}
        onClose={() => setShowAddModal(false)}
        onSave={saveNewPublication}
      />

      <PublicationModal
        open={editingPublicationId !== null}
        title="Editar publicacion"
        description="Ajusta programacion, canal, estado e ID de plataforma."
        assets={state.assets}
        form={publicationForm}
        onFormChange={setPublicationForm}
        onClose={() => setEditingPublicationId(null)}
        onSave={savePublicationEdit}
      />
    </>
  );
}

function PublicationModal({
  open,
  title,
  description,
  assets,
  form,
  onFormChange,
  onClose,
  onSave
}: {
  open: boolean;
  title: string;
  description: string;
  assets: Array<{ id: string; title: string }>;
  form: {
    assetId: string;
    scheduledAt: string;
    channel: Channel;
    status: ContentStatus;
    platformPostId: string;
  };
  onFormChange: (form: {
    assetId: string;
    scheduledAt: string;
    channel: Channel;
    status: ContentStatus;
    platformPostId: string;
  }) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      footer={
        <>
          <button className="btn-secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" type="button" onClick={onSave} disabled={!form.assetId || !form.scheduledAt}>
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Pieza">
          <select className="select" value={form.assetId} onChange={(event) => onFormChange({ ...form, assetId: event.target.value })}>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha y hora">
          <input className="input" type="datetime-local" value={form.scheduledAt} onChange={(event) => onFormChange({ ...form, scheduledAt: event.target.value })} />
        </Field>
        <Field label="Canal">
          <select className="select" value={form.channel} onChange={(event) => onFormChange({ ...form, channel: event.target.value as Channel })}>
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select className="select" value={form.status} onChange={(event) => onFormChange({ ...form, status: event.target.value as ContentStatus })}>
            {publicationStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ID de plataforma">
          <input className="input" value={form.platformPostId} onChange={(event) => onFormChange({ ...form, platformPostId: event.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
