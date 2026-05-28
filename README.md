# GrowthBrain Local

Motor de marketing autónomo para captación orgánica, piezas visuales, leads y handoff a WhatsApp. Implementa el MVP descrito en `arquitectura_software_marketing_autonomo.docx` con modo demo local y rutas listas para Supabase, Gemini y Meta.

## Qué incluye

- Panel operativo con revisión, calendario, leads calientes y métricas.
- Business Brain y Brand Kit.
- Conexiones para Facebook, Instagram, TikTok y WhatsApp en `/connections`.
- Catálogo de productos, precios, promociones y beneficios.
- Generador de semana de contenido y campañas puntuales.
- QA comercial para CTA, claims, precios y restricciones de marca.
- Renderizador propio de diseños SVG y descarga PNG desde el navegador.
- Scheduler/Publisher con fallback manual para Meta.
- Links trackeados a WhatsApp y respuestas sugeridas.
- Automation Builder tipo n8n en formato JSON con logs.
- Migración Supabase con RLS.
- Dirección de producto y diseño en `PRODUCT.md` y `DESIGN.md`.

## Diseño

La UI sigue una línea de dashboard operativo: papel cálido, graphite en acciones primarias, superficies planas en reposo, elevación solo en estado, motion corto y accesible. Las reglas de implementación están documentadas en `DESIGN.md`.

## Ejecutar local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

La app funciona sin credenciales usando `localStorage`. Para integrar servicios reales, copia `.env.example` a `.env.local` y completa las claves.

## Rutas API principales

- `POST /api/ai/generate`
- `POST /api/ai/qa`
- `POST /api/design/render`
- `POST /api/publish/meta`
- `GET /api/cron/daily`
- `GET /api/cron/weekly`
- `GET /api/leads/track`
- `GET|POST /api/webhooks/meta`
- `POST /api/assets/approve`
- `GET /api/connections/status`

## Donde se conectan tus paginas

Usa `/connections` para pegar URLs, handles e IDs de Facebook, Instagram, TikTok y WhatsApp. Las claves secretas van en `.env.local`, nunca en el navegador.

- Facebook: `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`
- Instagram: `META_IG_USER_ID`, `META_PAGE_ACCESS_TOKEN`
- TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ACCESS_TOKEN`
- WhatsApp: `WHATSAPP_PHONE`

## Supabase

Aplica `supabase/migrations/001_initial_schema.sql` en el SQL editor o con Supabase CLI. La app actual corre en modo demo local; la migración deja preparado el modelo para persistencia real con Auth y RLS.

## Seguridad operativa

- No uses `service_role` en frontend.
- Mantén aprobación humana para piezas con QA bajo, precios o claims sensibles.
- No automatices WhatsApp Web ni envíos masivos sin consentimiento.
- Usa Meta Graph API oficial cuando tengas permisos y tokens.
