"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, Save, RotateCcw, Trash2 } from "lucide-react";
import { ImageCropModal } from "@/components/image-crop-modal";
import { Field, PageHeader, Panel, PanelHeader } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { ModuleKey, ThemePreference } from "@/lib/types";
import { cleanList } from "@/lib/utils";

const moduleOrder: ModuleKey[] = [
  "dashboard",
  "business",
  "products",
  "content",
  "calendar",
  "designs",
  "leads",
  "connections",
  "analytics",
  "automations"
];

export default function BusinessPage() {
  const { state, updateBusiness, updateBrand, updateSettings, resetDemo } = useWorkspace();
  const [business, setBusiness] = useState(state.business);
  const [brand, setBrand] = useState({
    ...state.brand,
    forbiddenWordsText: state.brand.forbiddenWords.join("\n")
  });
  const [cropTarget, setCropTarget] = useState<"logo" | "reference" | null>(null);
  const colors = useMemo(
    () => [brand.primaryColor, brand.secondaryColor, brand.accentColor, brand.neutralColor],
    [brand.primaryColor, brand.secondaryColor, brand.accentColor, brand.neutralColor]
  );

  useEffect(() => {
    setBusiness(state.business);
    setBrand({
      ...state.brand,
      forbiddenWordsText: state.brand.forbiddenWords.join("\n")
    });
  }, [state.business, state.brand]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { forbiddenWordsText, ...brandProfile } = brand;
    updateBusiness(business);
    updateBrand({
      ...brandProfile,
      forbiddenWords: cleanList(brand.forbiddenWordsText)
    });
  }

  function saveCroppedImage(dataUrl: string) {
    if (cropTarget === "logo") {
      setBrand((current) => ({ ...current, logoUrl: dataUrl }));
      updateBrand({ logoUrl: dataUrl });
    }

    if (cropTarget === "reference") {
      const referenceAssets = [...brand.referenceAssets, dataUrl];
      setBrand((current) => ({ ...current, referenceAssets }));
      updateBrand({ referenceAssets });
    }
  }

  return (
    <>
      <PageHeader
        title="Business Brain"
        description="Base viva del negocio: promesa, oferta, tono, restricciones, WhatsApp y reglas de marca que alimentan todo el motor."
      >
        <button className="btn-secondary" onClick={resetDemo}>
          <RotateCcw className="h-4 w-4" />
          Restaurar demo
        </button>
      </PageHeader>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader title="Información comercial" description="Datos que se inyectan en prompts, copies y handoff a WhatsApp." />
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <Field label="Nombre del negocio">
              <input className="input" value={business.name} onChange={(event) => setBusiness({ ...business, name: event.target.value })} />
            </Field>
            <Field label="Rubro">
              <input className="input" value={business.niche} onChange={(event) => setBusiness({ ...business, niche: event.target.value })} />
            </Field>
            <Field label="WhatsApp" hint="Formato internacional, sin signos. Ejemplo: 51999999999.">
              <input className="input" value={business.whatsappPhone} onChange={(event) => setBusiness({ ...business, whatsappPhone: event.target.value })} />
            </Field>
            <Field label="Zona horaria">
              <input className="input" value={business.timezone} onChange={(event) => setBusiness({ ...business, timezone: event.target.value })} />
            </Field>
            <Field label="Zonas de atención">
              <input className="input" value={business.serviceZones} onChange={(event) => setBusiness({ ...business, serviceZones: event.target.value })} />
            </Field>
            <Field label="Horario">
              <input className="input" value={business.openingHours} onChange={(event) => setBusiness({ ...business, openingHours: event.target.value })} />
            </Field>
            <Field label="Descripción">
              <textarea className="textarea" value={business.description} onChange={(event) => setBusiness({ ...business, description: event.target.value })} />
            </Field>
            <Field label="Promesa">
              <textarea className="textarea" value={business.promise} onChange={(event) => setBusiness({ ...business, promise: event.target.value })} />
            </Field>
            <Field label="Diferenciador">
              <textarea className="textarea" value={business.differentiator} onChange={(event) => setBusiness({ ...business, differentiator: event.target.value })} />
            </Field>
            <Field label="Website">
              <input className="input" value={business.website} onChange={(event) => setBusiness({ ...business, website: event.target.value })} />
            </Field>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Brand Kit" description="Colores, tipografías, estilo y restricciones visuales." />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <div className="rounded-3xl border border-ink/10 bg-paper p-3">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-surface)]">
                      {brand.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={brand.logoUrl} alt="Logo de marca" className="h-full w-full object-cover" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-ink/35" />
                      )}
                    </div>
                    <button className="btn-secondary mt-3 w-full" type="button" onClick={() => setCropTarget("logo")}>
                      <ImagePlus className="h-4 w-4" />
                      {brand.logoUrl ? "Editar logo" : "Subir logo"}
                    </button>
                  </div>

                  <div className="rounded-3xl border border-ink/10 bg-paper p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">Referencias visuales</p>
                        <p className="mt-1 text-xs leading-5 text-ink/55">
                          Sube fotos de marca, empaques o estilos para que disenos y prompts mantengan coherencia.
                        </p>
                      </div>
                      <button className="btn-secondary shrink-0" type="button" onClick={() => setCropTarget("reference")}>
                        <ImagePlus className="h-4 w-4" />
                        Agregar
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {brand.referenceAssets.length === 0 ? (
                        <div className="col-span-3 rounded-2xl border border-dashed border-ink/15 p-5 text-center text-xs text-ink/50">
                          Aun no hay referencias.
                        </div>
                      ) : (
                        brand.referenceAssets.map((assetUrl, index) => (
                          <div key={`${assetUrl}-${index}`} className="group relative aspect-square overflow-hidden rounded-2xl border border-ink/10 bg-[var(--color-surface)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={assetUrl} alt={`Referencia visual ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                              className="pressable absolute right-2 top-2 rounded-full bg-white/90 p-2 text-coral opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                              type="button"
                              aria-label="Eliminar referencia"
                              onClick={() => {
                                const referenceAssets = brand.referenceAssets.filter((_, itemIndex) => itemIndex !== index);
                                setBrand({ ...brand, referenceAssets });
                                updateBrand({ referenceAssets });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Field label="Color primario">
                <input className="input h-11" type="color" value={brand.primaryColor} onChange={(event) => setBrand({ ...brand, primaryColor: event.target.value })} />
              </Field>
              <Field label="Color secundario">
                <input className="input h-11" type="color" value={brand.secondaryColor} onChange={(event) => setBrand({ ...brand, secondaryColor: event.target.value })} />
              </Field>
              <Field label="Color acento">
                <input className="input h-11" type="color" value={brand.accentColor} onChange={(event) => setBrand({ ...brand, accentColor: event.target.value })} />
              </Field>
              <Field label="Color neutro">
                <input className="input h-11" type="color" value={brand.neutralColor} onChange={(event) => setBrand({ ...brand, neutralColor: event.target.value })} />
              </Field>
              <div className="flex gap-2 sm:col-span-2">
                {colors.map((color) => (
                  <span key={color} className="h-10 flex-1 rounded-md border border-ink/10" style={{ background: color }} />
                ))}
              </div>
              <Field label="Tono verbal">
                <textarea className="textarea" value={brand.tone} onChange={(event) => setBrand({ ...brand, tone: event.target.value })} />
              </Field>
              <Field label="Estilo visual">
                <textarea className="textarea" value={brand.visualStyle} onChange={(event) => setBrand({ ...brand, visualStyle: event.target.value })} />
              </Field>
              <Field label="Palabras prohibidas" hint="Una por línea o separadas por coma.">
                <textarea
                  className="textarea"
                  value={brand.forbiddenWordsText}
                  onChange={(event) => setBrand({ ...brand, forbiddenWordsText: event.target.value })}
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Interfaz y modulos" description="Personaliza tema, sidebar y nombres visibles sin tocar codigo." />
            <div className="grid gap-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tema">
                  <select className="select" value={state.settings.theme} onChange={(event) => updateSettings({ theme: event.target.value as ThemePreference })}>
                    <option value="system">Sistema</option>
                    <option value="light">Dia</option>
                    <option value="dark">Noche</option>
                  </select>
                </Field>
                <Field label="Sidebar">
                  <select
                    className="select"
                    value={state.settings.sidebarCollapsed ? "collapsed" : "expanded"}
                    onChange={(event) => updateSettings({ sidebarCollapsed: event.target.value === "collapsed" })}
                  >
                    <option value="expanded">Expandido 240px</option>
                    <option value="collapsed">Contraido 64px</option>
                  </select>
                </Field>
              </div>

              <div className="rounded-3xl border border-ink/10 bg-paper p-3">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-ink">Nombres de modulos</p>
                  <p className="mt-1 text-xs leading-5 text-ink/55">
                    Puedes dejar "Automatizaciones" o renombrar cualquier modulo desde aqui.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {moduleOrder.map((moduleKey) => (
                    <Field key={moduleKey} label={moduleKey}>
                      <input
                        className="input"
                        value={state.settings.moduleLabels[moduleKey]}
                        onChange={(event) =>
                          updateSettings({
                            moduleLabels: {
                              ...state.settings.moduleLabels,
                              [moduleKey]: event.target.value
                            }
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <button className="btn-primary w-full" type="submit">
              <Save className="h-4 w-4" />
              Guardar Business Brain
            </button>
          </Panel>
        </div>
      </form>
      <ImageCropModal
        open={cropTarget !== null}
        title={cropTarget === "logo" ? "Recortar logo de marca" : "Agregar referencia visual"}
        description="Ajusta zoom y posicion antes de guardar. El resultado se usa en el Brand Kit y en los disenos."
        initialImage={cropTarget === "logo" ? brand.logoUrl : undefined}
        onClose={() => setCropTarget(null)}
        onSave={saveCroppedImage}
      />
    </>
  );
}
