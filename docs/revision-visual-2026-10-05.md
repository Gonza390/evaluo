# Revisión visual y de textos — 5 de octubre de 2026

## Resultado

**LISTO CON RIESGOS para revisar los cambios locales.** La pasada unifica estilos compartidos y textos visibles, y corrige un recorte del modal de procesamiento. No equivale a una certificación de todas las rutas y estados con una cuenta real. No se publicó ni se desplegó esta revisión.

## Criterio común

- Inter como tipografía principal, siguiendo el layout y los tokens reales de `app/globals.css`.
- Azul primario para las acciones principales; acciones secundarias con fondo neutro y menor énfasis.
- Títulos claros y textos de apoyo legibles; conservar la jerarquía propia de portada, lectura académica y páginas informativas.
- Voseo argentino en acciones, ayudas y mensajes de error.
- Nombres estables: **Mi espacio**, **Calendario**, **Mis errores**, **Flashcards** y **Práctica**. Las claves internas, rutas y datos conservan sus nombres.

## Correcciones

1. Botones compartidos, enlaces, estados activos de navegación y cabeceras usan los tokens del sistema. Las acciones secundarias ya no cambian a un fondo de acción principal al pasar el cursor.
2. Se unificaron nombres entre navegación de escritorio/celular, PDF, demos, retorno de pago, perfil y avisos de límite.
3. Se corrigieron imperativos, tildes y textos que mezclaban «vos» con «tú». «Checkout», «dashboard» y «feedback» se reemplazaron en mensajes del producto por compra/pago, Mi espacio y opinión, según el contexto.
4. La pestaña Práctica mantiene ese nombre al empezar y terminar sus preguntas. No cambia el funcionamiento de los ejercicios.
5. El formulario de acceso reserva espacio para el control de mostrar contraseña. El calendario utiliza un subtítulo para el mes, sin competir con el título principal.
6. Los botones de los recorridos Premium comparten el azul principal y pierden el relieve diferente. Los titulares con porcentajes de mejora sin respaldo encontrado en el repositorio se reemplazaron por beneficios concretos.
7. Se corrigió el modal real de procesamiento: `DialogContent` y su CSS aplicaban dos desplazamientos de centrado. Se anuló el desplazamiento duplicado y la transición heredada para evitar recortes al cambiar el tamaño.

## Verificación

- `npm run lint`: pasó.
- `npm test`: pasó; se ejecutó la cadena actual de 16 archivos smoke definida en `package.json`.
- `npm run build`: pasó, incluyendo TypeScript y generación de rutas.
- `git diff --check`: pasó.
- Navegador sobre la aplicación principal en `http://localhost:3001`, con capturas y lectura del DOM. No se limitó la revisión al servidor auxiliar de previews.
- 23 mediciones guardadas sobre páginas de funciones, contenido público, catálogo, Premium, acceso, páginas informativas, material de muestra y chat. Ninguna mostró desborde horizontal de la página.
- Comprobaciones adicionales de portada, precios, registro desplegado, materia pública, primer PDF y modal final.
- Mis errores/chat: 320, 390, 768 y 1366 px; historial con scroll interno y acciones dentro del contenedor, sin desborde horizontal.
- Modal final: 320×568, 390×844, 768×1024, 1366×900 y 844×390. Se confirmó que el rectángulo completo queda dentro del viewport.

La evidencia local está en `tmp/visual-audit/`: lista de PDFs en escritorio, chat en celular, modal final en celular/escritorio y `mediciones.json`. Es material de QA ignorado por Git.

## Límites y pendientes

- Mi espacio, perfil, calendario con datos reales, progreso guardado y estados administrativos requieren una sesión activa para cerrar la comprobación visual en vivo. Se inspeccionaron sus componentes, navegación y textos; no se simularon permisos ni se eludió el acceso.
- El navegador registró un refresh token local inválido. No se modificó autenticación para resolverlo.
- No se hicieron compras, altas de cuenta, cargas reales de PDF ni consultas nuevas a IA. No cambian precios, cupos, permisos, esquema, proveedores o contenido académico/legal.
- La compilación conserva avisos sobre Edge Runtime y la descarga de una fuente dinámica para el símbolo ✓. No impiden el build; queda pendiente una revisión separada de esa generación de imágenes.
- La pasada comprueba familias principales y componentes compartidos. No verifica todas las combinaciones de datos, dispositivos físicos, navegadores ni variantes de cada ruta.
