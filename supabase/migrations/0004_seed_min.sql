-- Seed opcional. Reemplaza owner_id por auth.uid() real si lo ejecutas manualmente.
insert into businesses (owner_id, name, niche, description, timezone, whatsapp_phone)
values (
  '00000000-0000-0000-0000-000000000001',
  'GrowthBrain Demo',
  'Servicios y ventas por WhatsApp',
  'Demo local para generar contenido, piezas y leads.',
  'America/Lima',
  '51999999999'
)
on conflict do nothing;
