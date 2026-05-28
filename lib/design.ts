import type { BrandProfile, Business, ContentAsset, ContentIdea, Product } from "@/lib/types";

export const designTemplates = [
  {
    id: "post_square_clean_v1",
    name: "Post cuadrado limpio",
    width: 1080,
    height: 1080,
    format: "1080x1080"
  },
  {
    id: "story_v1",
    name: "Story vertical",
    width: 1080,
    height: 1920,
    format: "1080x1920"
  }
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function textBlock(lines: string[], x: number, y: number, size: number, color: string, weight = 700): string {
  return lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : size * 1.18 * index;
      return `<text x="${x}" y="${y + dy}" fill="${color}" font-size="${size}" font-family="Aptos, Segoe UI, sans-serif" font-weight="${weight}">${escapeXml(line)}</text>`;
    })
    .join("");
}

export function renderDesignSvg(input: {
  business: Business;
  brand: BrandProfile;
  asset: ContentAsset;
  idea?: ContentIdea | null;
  product?: Product | null;
  templateId?: string;
}): string {
  const template = designTemplates.find((item) => item.id === (input.templateId ?? input.asset.designTemplateId)) ?? designTemplates[0];
  const isStory = template.height > template.width;
  const width = template.width;
  const height = template.height;
  const headline = input.asset.title || input.idea?.title || "Contenido listo para revisar";
  const hook = input.idea?.hook || input.asset.copy.split("\n")[0] || "";
  const cta = input.asset.copy.match(/(Escr[ií]beme|Responde|Comenta|Agenda|Guarda).*/i)?.[0] ?? "Escríbeme por WhatsApp";
  const productName = input.product?.name ?? input.business.niche;
  const headlineLines = splitLines(headline, isStory ? 17 : 20, isStory ? 5 : 4);
  const hookLines = splitLines(hook, isStory ? 28 : 34, 3);
  const ctaLines = splitLines(cta, isStory ? 30 : 34, 2);
  const bg = input.brand.neutralColor || "oklch(96% 0.012 82)";
  const primary = input.brand.primaryColor || "#2f6f5f";
  const secondary = input.brand.secondaryColor || "#17212b";
  const accent = input.brand.accentColor || "#de6b48";
  const surface = "oklch(98% 0.006 82)";
  const safe = isStory ? 92 : 70;
  const headlineSize = isStory ? 82 : 68;
  const hookSize = isStory ? 36 : 32;
  const ctaSize = isStory ? 34 : 30;
  const topBand = isStory ? 290 : 210;
  const productY = isStory ? height - 270 : height - 178;
  const ctaY = isStory ? height - 190 : height - 112;
  const logoSize = isStory ? 76 : 62;
  const logoMarkup = input.brand.logoUrl
    ? `<clipPath id="logoClip"><rect x="${safe}" y="${isStory ? 74 : 52}" width="${logoSize}" height="${logoSize}" rx="14"/></clipPath>
  <image href="${escapeXml(input.brand.logoUrl)}" x="${safe}" y="${isStory ? 74 : 52}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)"/>`
    : "";
  const brandTextX = input.brand.logoUrl ? safe + logoSize + 20 : safe;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(headline)}">
  <defs>
    <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(primary)}"/>
      <stop offset="100%" stop-color="${escapeXml(secondary)}"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#17212b" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${escapeXml(bg)}"/>
  <rect x="0" y="0" width="${width}" height="${topBand}" fill="url(#brandGradient)"/>
  <rect x="${safe}" y="${isStory ? 210 : 148}" width="${width - safe * 2}" height="${isStory ? 980 : 580}" rx="8" fill="${surface}" filter="url(#softShadow)"/>
  <rect x="${safe}" y="${isStory ? 210 : 148}" width="16" height="${isStory ? 980 : 580}" fill="${escapeXml(accent)}"/>
  ${logoMarkup}
  <text x="${brandTextX}" y="${isStory ? 132 : 92}" fill="${surface}" font-size="${isStory ? 28 : 24}" font-family="Aptos, Segoe UI, sans-serif" font-weight="700" letter-spacing="0">${escapeXml(input.business.name)}</text>
  <text x="${width - safe}" y="${isStory ? 132 : 92}" text-anchor="end" fill="${surface}" font-size="${isStory ? 24 : 22}" font-family="Aptos, Segoe UI, sans-serif">${escapeXml(input.asset.channel.replaceAll("_", " "))}</text>
  ${textBlock(headlineLines, safe + 56, isStory ? 360 : 270, headlineSize, secondary, 800)}
  ${textBlock(hookLines, safe + 56, isStory ? 820 : 620, hookSize, "oklch(42% 0.018 70)", 500)}
  <rect x="${safe + 56}" y="${productY - 56}" width="${width - safe * 2 - 112}" height="${isStory ? 92 : 78}" rx="8" fill="${escapeXml(primary)}" opacity="0.11"/>
  <text x="${safe + 88}" y="${productY}" fill="${escapeXml(primary)}" font-size="${isStory ? 34 : 28}" font-family="Aptos, Segoe UI, sans-serif" font-weight="700">${escapeXml(productName)}</text>
  <rect x="${safe + 56}" y="${ctaY - 54}" width="${width - safe * 2 - 112}" height="${isStory ? 132 : 104}" rx="8" fill="${escapeXml(accent)}"/>
  ${textBlock(ctaLines, safe + 88, ctaY, ctaSize, surface, 800)}
  <text x="${width - safe}" y="${height - 58}" text-anchor="end" fill="${escapeXml(secondary)}" opacity="0.68" font-size="24" font-family="Aptos, Segoe UI, sans-serif">QA ${input.asset.qa.score}/100</text>
</svg>`;
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
