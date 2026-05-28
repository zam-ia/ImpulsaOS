"use client";

import { FormEvent, useState } from "react";
import { PackagePlus, Pencil, Save } from "lucide-react";
import { Modal } from "@/components/modal";
import { Field, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import { cleanList, formatMoney } from "@/lib/utils";

const emptyProduct: {
  name: string;
  category: string;
  description: string;
  benefitsText: string;
  targetAudience: string;
  guarantee: string;
  availability: string;
  status: "active" | "paused" | "archived";
  currency: string;
  regularPrice: number;
  promoPrice: string;
} = {
  name: "",
  category: "",
  description: "",
  benefitsText: "",
  targetAudience: "",
  guarantee: "",
  availability: "Disponible",
  status: "active",
  currency: "PEN",
  regularPrice: 0,
  promoPrice: ""
};

export default function ProductsPage() {
  const { state, addProduct, updateProduct } = useWorkspace();
  const [form, setForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyProduct);

  function openEdit(productId: string) {
    const product = state.products.find((item) => item.id === productId);
    const price = state.pricePlans.find((plan) => plan.productId === productId);
    if (!product) return;

    setEditingProductId(productId);
    setEditForm({
      name: product.name,
      category: product.category,
      description: product.description,
      benefitsText: product.benefits.join("\n"),
      targetAudience: product.targetAudience,
      guarantee: product.guarantee,
      availability: product.availability,
      status: product.status,
      currency: price?.currency ?? "PEN",
      regularPrice: price?.regularPrice ?? 0,
      promoPrice: price?.promoPrice ? String(price.promoPrice) : ""
    });
  }

  function saveEdit() {
    if (!editingProductId || !editForm.name.trim()) return;

    updateProduct(
      editingProductId,
      {
        name: editForm.name,
        category: editForm.category,
        description: editForm.description,
        benefits: cleanList(editForm.benefitsText),
        targetAudience: editForm.targetAudience,
        guarantee: editForm.guarantee,
        availability: editForm.availability,
        status: editForm.status
      },
      {
        currency: editForm.currency,
        regularPrice: Number(editForm.regularPrice) || 0,
        promoPrice: editForm.promoPrice ? Number(editForm.promoPrice) : null
      }
    );
    setEditingProductId(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;

    addProduct(
      {
        name: form.name,
        category: form.category,
        description: form.description,
        benefits: cleanList(form.benefitsText),
        targetAudience: form.targetAudience,
        guarantee: form.guarantee,
        availability: form.availability,
        status: form.status
      },
      {
        currency: form.currency,
        regularPrice: Number(form.regularPrice) || 0,
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        promoStart: null,
        promoEnd: null,
        terms: "Condiciones configurables desde el catálogo."
      }
    );
    setForm(emptyProduct);
  }

  return (
    <>
      <PageHeader
        title="Product & Offer Manager"
        description="Catálogo con precios vigentes, promociones, beneficios y condiciones. El QA bloquea copies que inventen precios o claims no registrados."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel>
          <PanelHeader title="Productos activos" description="Cada producto puede alimentar ideas, copies, flyers y respuestas sugeridas." />
          <div className="stagger-list divide-y divide-ink/10">
            {state.products.map((product) => {
              const price = state.pricePlans.find((plan) => plan.productId === product.id);
              return (
                <article key={product.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={product.status} />
                        <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{product.category}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-ink">{product.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-ink/65">{product.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.benefits.map((benefit) => (
                          <span key={benefit} className="rounded bg-moss/10 px-2 py-1 text-xs font-semibold text-moss">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="min-w-40 rounded-md bg-paper p-3 text-sm">
                      <p className="text-ink/55">Precio vigente</p>
                      <p className="mt-1 text-xl font-semibold text-ink">
                        {formatMoney(price?.promoPrice ?? price?.regularPrice, price?.currency ?? "PEN")}
                      </p>
                      <button className="btn-secondary mt-3 w-full" type="button" onClick={() => openEdit(product.id)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        className="pressable mt-2 w-full rounded-xl border border-ink/10 bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold"
                        onClick={() =>
                          updateProduct(product.id, {
                            status: product.status === "active" ? "paused" : "active"
                          })
                        }
                      >
                        {product.status === "active" ? "Pausar" : "Activar"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Agregar oferta" description="Registra solo datos confirmados para reducir alucinaciones de IA." />
          <form className="grid gap-4 p-4" onSubmit={submit}>
            <Field label="Nombre">
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Categoría">
              <input className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </Field>
            <Field label="Descripción">
              <textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <Field label="Beneficios" hint="Uno por línea o separados por coma.">
              <textarea className="textarea" value={form.benefitsText} onChange={(event) => setForm({ ...form, benefitsText: event.target.value })} />
            </Field>
            <Field label="Cliente ideal">
              <input className="input" value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Moneda">
                <select className="select" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                  <option value="PEN">PEN</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
              <Field label="Precio regular">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.regularPrice}
                  onChange={(event) => setForm({ ...form, regularPrice: Number(event.target.value) })}
                />
              </Field>
              <Field label="Promo">
                <input className="input" type="number" min="0" value={form.promoPrice} onChange={(event) => setForm({ ...form, promoPrice: event.target.value })} />
              </Field>
            </div>
            <Field label="Disponibilidad">
              <input className="input" value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })} />
            </Field>
            <button className="btn-primary" type="submit">
              <PackagePlus className="h-4 w-4" />
              Agregar producto
            </button>
          </form>
        </Panel>
      </div>
      <Modal
        open={editingProductId !== null}
        onClose={() => setEditingProductId(null)}
        title="Editar producto"
        description="Estos datos alimentan generacion de contenido, QA, automatizaciones y respuestas sugeridas."
        size="lg"
        footer={
          <>
            <button className="btn-secondary" type="button" onClick={() => setEditingProductId(null)}>
              Cancelar
            </button>
            <button className="btn-primary" type="button" onClick={saveEdit}>
              <Save className="h-4 w-4" />
              Guardar cambios
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre">
            <input className="input" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
          </Field>
          <Field label="Categoria">
            <input className="input" value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} />
          </Field>
          <Field label="Descripcion">
            <textarea className="textarea" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
          </Field>
          <Field label="Beneficios" hint="Uno por linea o separados por coma.">
            <textarea className="textarea" value={editForm.benefitsText} onChange={(event) => setEditForm({ ...editForm, benefitsText: event.target.value })} />
          </Field>
          <Field label="Cliente ideal">
            <input className="input" value={editForm.targetAudience} onChange={(event) => setEditForm({ ...editForm, targetAudience: event.target.value })} />
          </Field>
          <Field label="Garantia / condiciones">
            <input className="input" value={editForm.guarantee} onChange={(event) => setEditForm({ ...editForm, guarantee: event.target.value })} />
          </Field>
          <Field label="Disponibilidad">
            <input className="input" value={editForm.availability} onChange={(event) => setEditForm({ ...editForm, availability: event.target.value })} />
          </Field>
          <Field label="Estado">
            <select className="select" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as typeof editForm.status })}>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="archived">Archivado</option>
            </select>
          </Field>
          <Field label="Moneda">
            <select className="select" value={editForm.currency} onChange={(event) => setEditForm({ ...editForm, currency: event.target.value })}>
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </select>
          </Field>
          <Field label="Precio regular">
            <input className="input" type="number" min="0" value={editForm.regularPrice} onChange={(event) => setEditForm({ ...editForm, regularPrice: Number(event.target.value) })} />
          </Field>
          <Field label="Precio promo">
            <input className="input" type="number" min="0" value={editForm.promoPrice} onChange={(event) => setEditForm({ ...editForm, promoPrice: event.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
