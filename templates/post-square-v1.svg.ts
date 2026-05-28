export { renderDesignSvg } from "@/lib/design";

export const postSquareTemplate = {
  id: "post_square_clean_v1",
  format: "1080x1080",
  slots: {
    headline: { max_chars: 55, font_size: 64, required: true },
    subtitle: { max_chars: 95, font_size: 34 },
    cta: { max_chars: 45, font_size: 30 },
    logo: { position: "bottom-right" }
  },
  brand_rules: {
    primary_color: "from_brand_profile",
    secondary_color: "from_brand_profile",
    safe_margin: 70,
    avoid_text_over_face: true
  }
};
