"use client";

import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { EmptyState, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { designTemplates, svgDataUri } from "@/lib/design";
import { useWorkspace } from "@/lib/store";

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
  const { state, renderAsset } = useWorkspace();
  const designable = state.assets.filter((asset) => asset.copy || asset.designSvg);

  return (
    <>
      <PageHeader
        title="Design Engine"
        description="Renderizador propio por plantillas: posts 1080x1080 y stories 1080x1920 con colores, CTA y QA visibles."
      />

      <Panel>
        <PanelHeader title="Piezas visuales" description="Renderiza, revisa y descarga sin depender de APIs de imagen pagadas." />
        {designable.length === 0 ? (
          <EmptyState title="Sin piezas para diseñar" description="Genera contenido primero y luego convierte los copies en flyers." />
        ) : (
          <div className="stagger-list grid gap-5 p-4 lg:grid-cols-2 2xl:grid-cols-3">
            {designable.map((asset) => {
              const svg = asset.designSvg;
              const template = designTemplates.find((item) => item.id === asset.designTemplateId);
              return (
                <article key={asset.id} className="rounded-md border border-ink/10 bg-paper p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <StatusBadge status={asset.status} />
                        <span className="rounded bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-ink/60">
                          {template?.format ?? "template"}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold leading-5 text-ink">{asset.title}</h3>
                    </div>
                    <ImageIcon className="h-5 w-5 shrink-0 text-moss" />
                  </div>

                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-ink/10 bg-[var(--color-surface)]">
                    {svg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={svgDataUri(svg)} alt={asset.title} className="h-full w-full object-contain" />
                    ) : (
                      <div className="px-6 text-center text-sm text-ink/55">Render pendiente</div>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button className="btn-secondary" onClick={() => renderAsset(asset.id, "post_square_clean_v1")}>
                        <RefreshCw className="h-4 w-4" />
                        Post
                      </button>
                      <button className="btn-secondary" onClick={() => renderAsset(asset.id, "story_v1")}>
                        <RefreshCw className="h-4 w-4" />
                        Story
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="btn-secondary" disabled={!svg} onClick={() => svg && downloadSvg(`${asset.id}.svg`, svg)}>
                        <Download className="h-4 w-4" />
                        SVG
                      </button>
                      <button className="btn-primary" disabled={!svg} onClick={() => svg && downloadPng(`${asset.id}.png`, svg)}>
                        <Download className="h-4 w-4" />
                        PNG
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
