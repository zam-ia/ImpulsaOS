"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Link2, MessageCircle, PlugZap, Plus, RadioTower, Save, ShieldCheck, Video } from "lucide-react";
import { Modal } from "@/components/modal";
import { Field, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { SocialConnection, SocialPlatform } from "@/lib/types";
import { buildTrackedWhatsappUrl, buildWhatsappMessage } from "@/lib/whatsapp";

const platformMeta: Record<SocialPlatform, { name: string; description: string; icon: typeof PlugZap }> = {
  facebook: {
    name: "Facebook Page",
    description: "Publicacion automatica por Meta Graph API cuando tengas Page ID y token.",
    icon: RadioTower
  },
  instagram: {
    name: "Instagram Business",
    description: "Publicacion por Instagram Graph API para feed, stories/reels por flujo aprobado.",
    icon: PlugZap
  },
  tiktok: {
    name: "TikTok",
    description: "MVP en modo export/checklist. OAuth + Content Posting API entra como siguiente fase.",
    icon: Video
  },
  whatsapp: {
    name: "WhatsApp Business",
    description: "Links wa.me trackeados, leads y respuestas sugeridas. No usa WhatsApp Web no oficial.",
    icon: MessageCircle
  }
};

function envFor(platform: SocialPlatform) {
  if (platform === "facebook") return ["META_PAGE_ID", "META_PAGE_ACCESS_TOKEN"];
  if (platform === "instagram") return ["META_IG_USER_ID", "META_PAGE_ACCESS_TOKEN"];
  if (platform === "tiktok") return ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_ACCESS_TOKEN"];
  return ["WHATSAPP_PHONE"];
}

function autonomyText(connection: SocialConnection) {
  if (!connection.isActive) return "Inactivo: no se usara en automatizaciones.";
  if (connection.publishMode === "api" && connection.tokenStatus === "configured") return "Autonomo: puede entrar al flujo de publicacion API.";
  if (connection.publishMode === "handoff") return "Handoff: registra lead y abre conversacion en WhatsApp.";
  return "Asistido: genera pieza, copy y checklist manual.";
}

export default function ConnectionsPage() {
  const { state, addConnection, updateConnection } = useWorkspace();
  const [drafts, setDrafts] = useState<Record<string, SocialConnection>>(
    Object.fromEntries(state.connections.map((connection) => [connection.id, connection]))
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConnection, setNewConnection] = useState({
    platform: "facebook" as SocialPlatform,
    label: "Nueva fan page",
    handle: "",
    profileUrl: "",
    externalId: "",
    publishMode: "manual" as SocialConnection["publishMode"],
    tokenStatus: "missing" as SocialConnection["tokenStatus"],
    isActive: false,
    notes: "",
    pageSlot: "Pagina nueva",
    contentRole: "prueba" as NonNullable<SocialConnection["contentRole"]>
  });
  const [campaign, setCampaign] = useState("semana_01");
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id ?? "");
  const selectedProduct = state.products.find((product) => product.id === selectedProductId);
  const whatsapp = drafts.conn_whatsapp ?? state.connections.find((item) => item.platform === "whatsapp");

  const trackedWhatsappUrl = useMemo(() => {
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
      productId: selectedProductId || "producto",
      channel: "instagram",
      phone: whatsapp?.externalId || state.business.whatsappPhone,
      text: message
    });
  }, [campaign, selectedProduct?.name, selectedProductId, state.business.name, state.business.whatsappPhone, whatsapp?.externalId]);

  function submit(event: FormEvent<HTMLFormElement>, connectionId: string) {
    event.preventDefault();
    updateConnection(connectionId, drafts[connectionId]);
  }

  function createConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addConnection(newConnection);
    setShowAddModal(false);
    setNewConnection({
      platform: "facebook",
      label: "Nueva fan page",
      handle: "",
      profileUrl: "",
      externalId: "",
      publishMode: "manual",
      tokenStatus: "missing",
      isActive: false,
      notes: "",
      pageSlot: "Pagina nueva",
      contentRole: "prueba"
    });
  }

  return (
    <>
      <PageHeader
        title="Conexiones"
        description="Aqui se configuran los enlaces y credenciales de Facebook, Instagram, TikTok y WhatsApp. El flujo autonomo decide por canal: publicar por API, dejar checklist manual o hacer handoff a WhatsApp."
      >
        <button className="btn-primary" type="button" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Agregar pagina
        </button>
      </PageHeader>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-moss/12 text-moss">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Regla de autonomia</p>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                Si no hay token valido, el sistema no simula publicado: crea pieza, copy y checklist.
              </p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-peacock/12 text-peacock">
              <PlugZap className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Donde van tus paginas</p>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                Pega URLs, handles e IDs aqui. Las claves secretas van en `.env.local`, no en pantalla.
              </p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral/12 text-coral">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">WhatsApp vende</p>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                Cada CTA puede usar link trackeado para medir origen antes de abrir `wa.me`.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="stagger-list grid gap-5">
          {state.connections.map((connection) => {
            const draft = drafts[connection.id] ?? connection;
            const meta = platformMeta[connection.platform];
            const Icon = meta.icon;
            return (
              <Panel key={connection.id}>
                <PanelHeader
                  title={meta.name}
                  description={meta.description}
                  action={<StatusBadge status={draft.isActive ? "approved" : "draft"} />}
                />
                <form className="grid gap-4 p-4" onSubmit={(event) => submit(event, connection.id)}>
                  <div className="flex items-start gap-3 rounded-2xl bg-paper p-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-moss">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{autonomyText(draft)}</p>
                      <p className="mt-1 break-words text-xs leading-5 text-ink/55">
                        Variables: {envFor(connection.platform).map((item) => `\`${item}\``).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="URL de pagina/perfil">
                      <input
                        className="input"
                        value={draft.profileUrl}
                        placeholder="https://..."
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, profileUrl: event.target.value }
                          }))
                        }
                      />
                    </Field>
                    <Field label="Handle">
                      <input
                        className="input"
                        value={draft.handle}
                        placeholder="@tu_marca"
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, handle: event.target.value }
                          }))
                        }
                      />
                    </Field>
                    <Field label="ID externo">
                      <input
                        className="input"
                        value={draft.externalId}
                        placeholder={connection.platform === "whatsapp" ? "51999999999" : "page/user/account id"}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, externalId: event.target.value }
                          }))
                        }
                      />
                    </Field>
                    <Field label="Modo de publicacion">
                      <select
                        className="select"
                        value={draft.publishMode}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, publishMode: event.target.value as SocialConnection["publishMode"] }
                          }))
                        }
                      >
                        <option value="api">API automatica</option>
                        <option value="manual">Checklist manual</option>
                        <option value="handoff">Handoff WhatsApp</option>
                      </select>
                    </Field>
                    <Field label="Estado token">
                      <select
                        className="select"
                        value={draft.tokenStatus}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, tokenStatus: event.target.value as SocialConnection["tokenStatus"] }
                          }))
                        }
                      >
                        <option value="missing">Falta token</option>
                        <option value="configured">Configurado</option>
                        <option value="expired">Expirado</option>
                        <option value="manual">No aplica/manual</option>
                      </select>
                    </Field>
                    <Field label="Activo en automatizaciones">
                      <select
                        className="select"
                        value={draft.isActive ? "true" : "false"}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, isActive: event.target.value === "true" }
                          }))
                        }
                      >
                        <option value="true">Si</option>
                        <option value="false">No</option>
                      </select>
                    </Field>
                    <Field label="Rol de contenido">
                      <select
                        className="select"
                        value={draft.contentRole ?? "principal"}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, contentRole: event.target.value as SocialConnection["contentRole"] }
                          }))
                        }
                      >
                        <option value="principal">Principal</option>
                        <option value="prueba">Pruebas</option>
                        <option value="nicho">Nicho</option>
                        <option value="soporte">Soporte</option>
                      </select>
                    </Field>
                    <Field label="Slot / pagina">
                      <input
                        className="input"
                        value={draft.pageSlot ?? ""}
                        placeholder="Pagina 1, Pagina 2..."
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [connection.id]: { ...draft, pageSlot: event.target.value }
                          }))
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Notas operativas">
                    <textarea
                      className="textarea"
                      value={draft.notes}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [connection.id]: { ...draft, notes: event.target.value }
                        }))
                      }
                    />
                  </Field>

                  <div className="flex flex-wrap gap-2">
                    <button className="btn-primary" type="submit">
                      <Save className="h-4 w-4" />
                      Guardar conexion
                    </button>
                    {draft.profileUrl ? (
                      <a className="btn-secondary" href={draft.profileUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Abrir perfil
                      </a>
                    ) : null}
                  </div>
                </form>
              </Panel>
            );
          })}
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Link WhatsApp trackeado" description="Este es el enlace que va en posts, stories, bio o CTAs." />
            <div className="grid gap-4 p-4">
              <Field label="Producto">
                <select className="select" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                  {state.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Campana">
                <input className="input" value={campaign} onChange={(event) => setCampaign(event.target.value)} />
              </Field>
              <div className="rounded-2xl border border-ink/10 bg-paper p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Link2 className="h-4 w-4" />
                  URL publica
                </div>
                <p className="break-all text-sm leading-6 text-ink/65">{trackedWhatsappUrl}</p>
              </div>
              <a className="btn-primary" href={trackedWhatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                Probar redirect a WhatsApp
              </a>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Flujo autonomo real" description="Como se comporta hoy por canal." />
            <div className="divide-y divide-ink/10 p-4">
              {state.connections.map((connection) => (
                <div key={connection.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 ${connection.isActive ? "text-moss" : "text-ink/30"}`} />
                  <div>
                    <p className="text-sm font-semibold">{platformMeta[connection.platform].name}</p>
                    <p className="mt-1 text-sm leading-5 text-ink/60">{autonomyText(connection)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar pagina o canal"
        description="Registra fan pages, cuentas o canales que el motor usara para publicar, medir o dejar checklist manual."
        size="lg"
      >
        <form className="grid gap-4" onSubmit={createConnection}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Plataforma">
              <select
                className="select"
                value={newConnection.platform}
                onChange={(event) => setNewConnection({ ...newConnection, platform: event.target.value as SocialPlatform })}
              >
                <option value="facebook">Facebook fan page</option>
                <option value="instagram">Instagram Business</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </Field>
            <Field label="Nombre visible">
              <input className="input" value={newConnection.label} onChange={(event) => setNewConnection({ ...newConnection, label: event.target.value })} />
            </Field>
            <Field label="URL">
              <input className="input" value={newConnection.profileUrl} onChange={(event) => setNewConnection({ ...newConnection, profileUrl: event.target.value })} />
            </Field>
            <Field label="Handle">
              <input className="input" value={newConnection.handle} onChange={(event) => setNewConnection({ ...newConnection, handle: event.target.value })} />
            </Field>
            <Field label="ID externo">
              <input className="input" value={newConnection.externalId} onChange={(event) => setNewConnection({ ...newConnection, externalId: event.target.value })} />
            </Field>
            <Field label="Modo">
              <select
                className="select"
                value={newConnection.publishMode}
                onChange={(event) => setNewConnection({ ...newConnection, publishMode: event.target.value as SocialConnection["publishMode"] })}
              >
                <option value="manual">Checklist manual</option>
                <option value="api">API automatica</option>
                <option value="handoff">Handoff WhatsApp</option>
              </select>
            </Field>
            <Field label="Slot">
              <input className="input" value={newConnection.pageSlot} onChange={(event) => setNewConnection({ ...newConnection, pageSlot: event.target.value })} />
            </Field>
            <Field label="Rol">
              <select
                className="select"
                value={newConnection.contentRole}
                onChange={(event) => setNewConnection({ ...newConnection, contentRole: event.target.value as NonNullable<SocialConnection["contentRole"]> })}
              >
                <option value="principal">Principal</option>
                <option value="prueba">Prueba</option>
                <option value="nicho">Nicho</option>
                <option value="soporte">Soporte</option>
              </select>
            </Field>
          </div>
          <Field label="Notas">
            <textarea className="textarea" value={newConnection.notes} onChange={(event) => setNewConnection({ ...newConnection, notes: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setShowAddModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit">
              <Save className="h-4 w-4" />
              Guardar canal
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
