"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { Modal } from "@/components/modal";
import { Field } from "@/components/ui";

type ImageCropModalProps = {
  open: boolean;
  title: string;
  description?: string;
  initialImage?: string;
  aspect?: "square" | "wide";
  onClose: () => void;
  onSave: (dataUrl: string) => void;
};

export function ImageCropModal({
  open,
  title,
  description,
  initialImage,
  aspect = "square",
  onClose,
  onSave
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState(initialImage ?? "");
  const [zoom, setZoom] = useState(1.15);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const output = useMemo(() => (aspect === "wide" ? { width: 1200, height: 630 } : { width: 800, height: 800 }), [aspect]);

  useEffect(() => {
    if (!open) return;
    setImageSrc(initialImage ?? "");
    setZoom(1.15);
    setX(50);
    setY(50);
  }, [initialImage, open]);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImageSrc(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function crop() {
    const image = imageRef.current;
    if (!image || !imageSrc) return;

    const canvas = document.createElement("canvas");
    canvas.width = output.width;
    canvas.height = output.height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const scale = Math.max(output.width / naturalWidth, output.height / naturalHeight) * zoom;
    const drawWidth = naturalWidth * scale;
    const drawHeight = naturalHeight * scale;
    const offsetX = (output.width - drawWidth) * (x / 100);
    const offsetY = (output.height - drawHeight) * (y / 100);

    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    onSave(canvas.toDataURL("image/png", 0.95));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" type="button" onClick={crop} disabled={!imageSrc}>
            <Save className="h-4 w-4" />
            Guardar imagen
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_0.82fr]">
        <div>
          <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-ink/20 bg-paper p-6 text-center">
            <ImagePlus className="h-8 w-8 text-moss" />
            <span className="mt-3 text-sm font-semibold text-ink">Subir imagen</span>
            <span className="mt-1 text-xs leading-5 text-ink/55">PNG, JPG o WEBP. Luego ajusta zoom y posicion.</span>
            <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
          </label>

          <div className="mt-4 grid gap-4">
            <Field label="Zoom">
              <input className="w-full accent-moss" type="range" min="1" max="2.6" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </Field>
            <Field label="Mover horizontal">
              <input className="w-full accent-moss" type="range" min="0" max="100" value={x} onChange={(event) => setX(Number(event.target.value))} />
            </Field>
            <Field label="Mover vertical">
              <input className="w-full accent-moss" type="range" min="0" max="100" value={y} onChange={(event) => setY(Number(event.target.value))} />
            </Field>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Vista previa</p>
          <div className={`${aspect === "wide" ? "aspect-[1.91/1]" : "aspect-square"} overflow-hidden rounded-3xl border border-ink/10 bg-paper`}>
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Preview de recorte"
                className="h-full w-full"
                style={{
                  objectFit: "cover",
                  transform: `scale(${zoom})`,
                  transformOrigin: `${x}% ${y}%`,
                  objectPosition: `${x}% ${y}%`
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink/50">Sube una imagen para previsualizar el recorte.</div>
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-ink/50">
            El recorte se guarda como imagen optimizada local en el Brand Kit. En Supabase se puede mover luego a Storage.
          </p>
        </div>
      </div>
    </Modal>
  );
}
