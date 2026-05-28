"use client";

import { useState } from "react";
import { CalendarDays, Check, Pencil, Save, Send } from "lucide-react";
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
  const { state, updatePublication, updateAssetStatus } = useWorkspace();
  const [editingPublicationId, setEditingPublicationId] = useState<string | null>(null);
  const [publicationForm, setPublicationForm] = useState({
    scheduledAt: "",
    channel: "instagram_post" as Channel,
    status: "scheduled" as ContentStatus,
    platformPostId: ""
  });
  const publications = [...state.publications].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  function openPublicationEdit(publication: Publication) {
    setEditingPublicationId(publication.id);
    setPublicationForm({
      scheduledAt: toDatetimeLocal(publication.scheduledAt),
      channel: publication.channel,
      status: publication.status,
      platformPostId: publication.platformPostId ?? ""
    });
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
        description="Calendario editorial con modo publicación asistida. Meta API queda lista para usar cuando existan tokens y permisos."
      />

      <Panel>
        <PanelHeader title="Calendario de publicaciones" description="Aprueba y marca como programado o publicado según el flujo real." />
        {publications.length === 0 ? (
          <EmptyState title="Sin publicaciones" description="Genera contenido para crear una cola de publicaciones sugeridas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-paper text-left text-xs font-semibold uppercase tracking-normal text-ink/55">
                  <th className="table-cell">Fecha</th>
                  <th className="table-cell">Pieza</th>
                  <th className="table-cell">Canal</th>
                  <th className="table-cell">Estado</th>
                  <th className="table-cell">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {publications.map((publication) => {
                  const asset = state.assets.find((item) => item.id === publication.assetId);
                  return (
                    <tr key={publication.id}>
                      <td className="table-cell font-medium text-ink">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-moss" />
                          {shortDate(publication.scheduledAt)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-ink">{asset?.title ?? "Pieza sin título"}</p>
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
      <Modal
        open={editingPublicationId !== null}
        onClose={() => setEditingPublicationId(null)}
        title="Editar publicacion"
        description="Ajusta la programacion y el estado. El asset queda sincronizado con esta publicacion."
        size="md"
        footer={
          <>
            <button className="btn-secondary" type="button" onClick={() => setEditingPublicationId(null)}>
              Cancelar
            </button>
            <button className="btn-primary" type="button" onClick={savePublicationEdit}>
              <Save className="h-4 w-4" />
              Guardar publicacion
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Fecha y hora">
            <input className="input" type="datetime-local" value={publicationForm.scheduledAt} onChange={(event) => setPublicationForm({ ...publicationForm, scheduledAt: event.target.value })} />
          </Field>
          <Field label="Canal">
            <select className="select" value={publicationForm.channel} onChange={(event) => setPublicationForm({ ...publicationForm, channel: event.target.value as Channel })}>
              {channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select className="select" value={publicationForm.status} onChange={(event) => setPublicationForm({ ...publicationForm, status: event.target.value as ContentStatus })}>
              {publicationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ID de plataforma">
            <input className="input" value={publicationForm.platformPostId} onChange={(event) => setPublicationForm({ ...publicationForm, platformPostId: event.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
