-- Seed mínimo recomendado después de crear un usuario con Supabase Auth.
-- Reemplaza :owner_id con auth.uid() del usuario propietario.

insert into businesses (owner_id, name, niche, description, timezone, whatsapp_phone)
values (
  ':owner_id',
  'GrowthBrain Local',
  'Servicios y ventas por WhatsApp',
  'Negocio local que quiere atraer prospectos con contenido orgánico y cerrar por WhatsApp.',
  'America/Lima',
  '51999999999'
);
