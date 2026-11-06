-- Límites a nivel de bucket para `biblioteca` (defensa en profundidad).
-- La validación de la app sigue siendo la principal: 20 MB, PDF/DOCX
-- (lib/student-materials/validation.ts). El bucket corta antes cualquier subida
-- que la eluda (p. ej. llamadas directas a Storage con un token de usuario).
--
-- Tamaño: 25 MB (> 20 MB de la app; el archivo más grande hoy es de 18,7 MB).
-- Tipos: los presentes hoy en el bucket + application/octet-stream, que algunos
-- navegadores envían para .docx y que la app acepta explícitamente.
update storage.buckets
set
  file_size_limit = 25 * 1024 * 1024,
  allowed_mime_types = array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
where id = 'biblioteca';
