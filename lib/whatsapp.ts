export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsappMessage(input: {
  businessName: string;
  productName?: string;
  campaign?: string;
  channel?: string;
}): string {
  const product = input.productName ? ` sobre ${input.productName}` : "";
  const source = input.campaign ? ` Vi la campaña ${input.campaign}.` : "";
  const channel = input.channel ? ` Canal: ${input.channel}.` : "";
  return `Hola, quiero información${product}.${source}${channel}`;
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const cleanPhone = normalizePhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildTrackedWhatsappUrl(input: {
  baseUrl: string;
  campaign: string;
  productId: string;
  channel: string;
  phone: string;
  text: string;
}): string {
  const url = new URL("/api/leads/track", input.baseUrl);
  url.searchParams.set("campaign", input.campaign);
  url.searchParams.set("product", input.productId);
  url.searchParams.set("channel", input.channel);
  url.searchParams.set("phone", normalizePhone(input.phone));
  url.searchParams.set("text", input.text);
  return url.toString();
}

export function suggestedReply(input: {
  leadName?: string;
  productName?: string;
  stage: string;
  objection?: string;
}): string {
  const name = input.leadName?.trim() || "Hola";
  const product = input.productName ? ` sobre ${input.productName}` : "";

  if (input.stage === "new") {
    return `${name}, gracias por escribirme${product}. Para orientarte mejor: ¿qué objetivo quieres lograr y para cuándo lo necesitas?`;
  }

  if (input.stage === "qualified") {
    return `${name}, por lo que me cuentas, esta opción encaja bien. Te puedo enviar condiciones, precio vigente y próximos pasos para reservar.`;
  }

  if (input.objection) {
    return `${name}, entiendo tu duda sobre ${input.objection}. Te explico con claridad para que decidas sin presión.`;
  }

  return `${name}, quedo atenta para ayudarte con la información y resolver cualquier duda antes de avanzar.`;
}
