import type {
  AiRun,
  BrandProfile,
  Business,
  Channel,
  ContentAsset,
  ContentIdea,
  ContentObjective,
  ContentPillar,
  PricePlan,
  Product,
  Publication,
  WeeklyPlanResult
} from "@/lib/types";
import { evaluateAsset } from "@/lib/qa";
import { addDaysIso, formatMoney, makeId, todayIso } from "@/lib/utils";

const weeklyMatrix: Array<{
  day: string;
  objective: ContentObjective;
  format: string;
  channel: Channel;
  angle: string;
}> = [
  {
    day: "Lunes",
    objective: "valor",
    format: "Carrusel",
    channel: "instagram_post",
    angle: "Errores que frenan resultados"
  },
  {
    day: "Martes",
    objective: "viralidad",
    format: "Reel",
    channel: "instagram_reel",
    angle: "Hook negativo con aprendizaje rápido"
  },
  {
    day: "Miércoles",
    objective: "autoridad",
    format: "Post educativo",
    channel: "facebook",
    angle: "Mito o tendencia explicada con criterio"
  },
  {
    day: "Jueves",
    objective: "prueba_social",
    format: "Historia de caso",
    channel: "instagram_story",
    angle: "Antes, bloqueo, decisión y avance"
  },
  {
    day: "Viernes",
    objective: "venta",
    format: "Flyer oferta",
    channel: "instagram_post",
    angle: "Oferta clara con CTA a WhatsApp"
  },
  {
    day: "Sábado",
    objective: "comunidad",
    format: "Story encuesta",
    channel: "instagram_story",
    angle: "Pregunta para conversación"
  },
  {
    day: "Domingo",
    objective: "reciclaje",
    format: "Recordatorio",
    channel: "facebook",
    angle: "Reciclar el contenido con mejor gancho"
  }
];

function objectiveTitle(objective: ContentObjective, product: Product): string {
  const titles: Record<ContentObjective, string> = {
    valor: `5 errores que impiden aprovechar ${product.name}`,
    viralidad: `Si haces esto, tu contenido seguirá sin atraer clientes`,
    autoridad: `El mito que confunde a muchos negocios sobre ${product.category}`,
    prueba_social: `Cómo se ve avanzar con ${product.name} sin improvisar`,
    venta: `${product.name}: qué incluye y para quién sí conviene`,
    comunidad: `¿Qué parte de vender por contenido te cuesta más?`,
    reciclaje: `Lo que funcionó esta semana y cómo aplicarlo hoy`
  };

  return titles[objective];
}

function objectiveHook(objective: ContentObjective, product: Product): string {
  const hooks: Record<ContentObjective, string> = {
    valor: `Antes de publicar otra vez, revisa si estás cometiendo estos errores.`,
    viralidad: `Publicar todos los días no sirve si el mensaje no abre una conversación.`,
    autoridad: `No necesitas sonar experta: necesitas mostrar criterio con ejemplos claros.`,
    prueba_social: `El cambio empieza cuando dejas de improvisar cada pieza.`,
    venta: `Si quieres ordenar tu contenido y llevar leads a WhatsApp, esto puede ayudarte.`,
    comunidad: `Quiero leerte: ¿qué te frena más al vender ${product.name.toLowerCase()}?`,
    reciclaje: `Una buena idea puede convertirse en post, story, reel y conversación.`
  };

  return hooks[objective];
}

function ctaFor(channel: Channel, product: Product): string {
  if (channel === "whatsapp") {
    return `Escríbeme "INFO ${product.name.toUpperCase().slice(0, 16)}" y te paso detalles.`;
  }

  if (channel === "instagram_story") {
    return "Responde esta historia y te oriento con el siguiente paso.";
  }

  return `Escríbeme por WhatsApp y te paso la información de ${product.name}.`;
}

function buildCopy(input: {
  business: Business;
  brand: BrandProfile;
  product: Product;
  price?: PricePlan;
  objective: ContentObjective;
  channel: Channel;
  hook: string;
}): string {
  const priceText = input.price
    ? formatMoney(input.price.promoPrice ?? input.price.regularPrice, input.price.currency)
    : "precio por confirmar";
  const benefits = input.product.benefits.slice(0, 3).join(", ");
  const cta = ctaFor(input.channel, input.product);

  const blocks: Record<ContentObjective, string> = {
    valor: `${input.hook}\n\n3 señales para revisar hoy:\n1. Tu post habla de ti, no del problema del cliente.\n2. No hay una acción clara después del contenido.\n3. El beneficio queda escondido entre frases genéricas.\n\nCon ${input.product.name}, trabajamos ${benefits} para convertir ideas en próximos pasos concretos.\n\n${cta}`,
    viralidad: `${input.hook}\n\nLa mayoría intenta vender antes de crear contexto. Primero muestra el problema, luego el costo de no resolverlo y recién después presenta el camino.\n\nGuarda esta idea si quieres contenido que abra conversación, no solo likes.\n\n${cta}`,
    autoridad: `${input.hook}\n\nEn ${input.business.name}, la regla es simple: no se inventan beneficios, no se inflan promesas y cada CTA debe tener sentido comercial.\n\n${input.product.name} existe para ordenar: ${benefits}.\n\n${cta}`,
    prueba_social: `${input.hook}\n\nAntes: publicaciones sueltas y poca claridad.\nDurante: oferta, objeciones, beneficios y CTA en una sola línea estratégica.\nDespués: una ruta semanal para publicar con intención.\n\n${cta}`,
    venta: `${input.hook}\n\nIncluye: ${benefits}.\nPrecio vigente: ${priceText}.\nCondición: ${input.product.availability}.\n\nNo es para publicar por publicar. Es para transformar una oferta real en contenido que lleve a una conversación.\n\n${cta}`,
    comunidad: `${input.hook}\n\nOpciones:\nA. No sé qué publicar.\nB. Tengo ideas, pero no vendo.\nC. Me cuesta mostrar mi oferta.\nD. No tengo tiempo.\n\nResponde con la letra y te digo por dónde empezar.`,
    reciclaje: `${input.hook}\n\nConvierte tu mejor idea en:\n- Un carrusel con errores.\n- Un reel con una frase fuerte.\n- Una story con encuesta.\n- Un CTA directo a WhatsApp.\n\n${cta}`
  };

  return blocks[input.objective];
}

export function generateWeeklyPlan(input: {
  business: Business;
  brand: BrandProfile;
  products: Product[];
  pricePlans: PricePlan[];
  pillars: ContentPillar[];
}): WeeklyPlanResult {
  const activeProducts = input.products.filter((product) => product.status === "active");
  const products = activeProducts.length > 0 ? activeProducts : input.products;
  const ideas: ContentIdea[] = [];
  const assets: ContentAsset[] = [];
  const publications: Publication[] = [];
  const aiRuns: AiRun[] = [];

  weeklyMatrix.forEach((item, index) => {
    const product = products[index % Math.max(products.length, 1)];
    if (!product) return;

    const price = input.pricePlans.find((plan) => plan.productId === product.id);
    const pillar = input.pillars.find((candidate) => candidate.objective === item.objective) ?? input.pillars[index % input.pillars.length] ?? null;
    const hook = objectiveHook(item.objective, product);
    const idea: ContentIdea = {
      id: makeId("idea"),
      businessId: input.business.id,
      productId: product.id,
      pillarId: pillar?.id ?? null,
      title: objectiveTitle(item.objective, product),
      angle: item.angle,
      hook,
      format: item.format,
      objective: item.objective,
      viralScore: Math.min(96, 74 + index * 3 + (item.objective === "viralidad" ? 9 : 0)),
      status: "needs_review",
      scheduledDay: addDaysIso(index + 1, index < 5 ? 10 + index : 18),
      createdAt: todayIso()
    };

    const copy = buildCopy({
      business: input.business,
      brand: input.brand,
      product,
      price,
      objective: item.objective,
      channel: item.channel,
      hook
    });
    const qa = evaluateAsset({
      copy,
      hook,
      cta: ctaFor(item.channel, product),
      product,
      priceText: price ? formatMoney(price.promoPrice ?? price.regularPrice, price.currency) : undefined,
      brand: input.brand
    });

    const asset: ContentAsset = {
      id: makeId("asset"),
      ideaId: idea.id,
      productId: product.id,
      assetType: item.format.toLowerCase().includes("flyer") ? "design" : "copy",
      channel: item.channel,
      title: idea.title,
      copy,
      script:
        item.channel === "instagram_reel"
          ? `Hook: ${hook}\nProblema: mostrar el error principal.\nValor: explicar un cambio concreto.\nCTA: ${ctaFor(item.channel, product)}`
          : "",
      designTemplateId: item.channel === "instagram_story" ? "story_v1" : "post_square_clean_v1",
      designSvg: "",
      prompt: `Diseño ${item.format} para ${product.name}. Estilo: ${input.brand.visualStyle}. Usar colores de marca y evitar promesas no verificadas.`,
      qa,
      status: qa.needsReview ? "needs_review" : "approved",
      createdAt: todayIso()
    };

    const publication: Publication = {
      id: makeId("pub"),
      assetId: asset.id,
      channel: item.channel,
      scheduledAt: idea.scheduledDay,
      publishedAt: null,
      platformPostId: null,
      status: "needs_review",
      metrics: {
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0
      }
    };

    ideas.push(idea);
    assets.push(asset);
    publications.push(publication);
  });

  aiRuns.push({
    id: makeId("ai"),
    businessId: input.business.id,
    provider: "mock",
    model: "local-deterministic",
    promptType: "content-plan",
    inputHash: `${input.business.id}:${todayIso().slice(0, 10)}`,
    output: { ideas: ideas.length, assets: assets.length },
    costEstimate: 0,
    qualityScore: 86,
    createdAt: todayIso()
  });

  return { ideas, assets, publications, aiRuns };
}

export function generateSingleCopy(input: {
  business: Business;
  brand: BrandProfile;
  product: Product;
  price?: PricePlan;
  objective: ContentObjective;
  channel: Channel;
}): { idea: Partial<ContentIdea>; asset: Partial<ContentAsset> } {
  const hook = objectiveHook(input.objective, input.product);
  const copy = buildCopy({ ...input, hook });

  return {
    idea: {
      title: objectiveTitle(input.objective, input.product),
      angle: "Generación puntual desde motor local",
      hook,
      format: input.channel === "instagram_reel" ? "Reel" : "Post",
      objective: input.objective,
      viralScore: 82,
      status: "needs_review"
    },
    asset: {
      copy,
      channel: input.channel,
      prompt: `Prompt visual para ${input.product.name}: ${input.brand.visualStyle}`,
      qa: evaluateAsset({
        copy,
        hook,
        product: input.product,
        priceText: input.price ? formatMoney(input.price.promoPrice ?? input.price.regularPrice, input.price.currency) : undefined,
        brand: input.brand
      })
    }
  };
}
