import { insertLeadEvent } from "@/lib/repositories/leads.repo";
import { initialWorkspace } from "@/lib/seed";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export async function trackWhatsappClick(input: {
  businessId?: string;
  campaign: string;
  product: string;
  channel: string;
  phone?: string;
  text?: string;
}) {
  const businessId = input.businessId ?? initialWorkspace.business.id;
  await insertLeadEvent({
    businessId,
    eventType: "whatsapp_click",
    metadata: {
      campaign: input.campaign,
      product: input.product,
      channel: input.channel
    }
  });

  return buildWhatsappUrl(
    input.phone ?? process.env.WHATSAPP_PHONE ?? initialWorkspace.business.whatsappPhone,
    input.text ?? `Hola, quiero informacion sobre ${input.product}`
  );
}
