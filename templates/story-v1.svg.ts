export { renderDesignSvg } from "@/lib/design";

export const storyTemplate = {
  id: "story_v1",
  format: "1080x1920",
  slots: {
    headline: { max_chars: 70, font_size: 82, required: true },
    subtitle: { max_chars: 110, font_size: 36 },
    cta: { max_chars: 55, font_size: 34 },
    logo: { position: "bottom-right" }
  },
  brand_rules: {
    primary_color: "from_brand_profile",
    secondary_color: "from_brand_profile",
    safe_margin: 92,
    avoid_text_over_face: true
  }
};
