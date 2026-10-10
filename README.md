# HFA · Habbo Fútbol Asociación

Web estática (HTML + JS) con una API serverless en `api/db.js` pensada para Vercel.

## Estructura
- `afh-liga.html` – página de inicio
- `seccion.html` – secciones (estadísticas, partidos, comunidad, torneos, equipos, jugadores, cuenta, buzón, admin)
- `hfa-extras.js` – temas, guía, pie de página, mantenimiento, copia de seguridad, ajustes móviles
- `hfa-i18n.js` – selector de idioma (Español, English, Português Brasil/Portugal)
- `api/db.js` – API (MongoDB o Upstash Redis)

## Variables de entorno (Vercel)
- `MONGODB_URI`, `MONGODB_DATABASE` (por defecto `hfa`)
- opcional Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `YOUTUBE_API_KEY` para los datos reales del vídeo del resumen del partido

## Archivos que NO están en este paquete (cópialos de tu repositorio actual)
`clasificacion.html`, `loading.js`, `chat.js`, `flags.js`, `roles.json` y `image.png` (si lo usas).

## Idiomas
El botón 🌐 abajo a la izquierda cambia el idioma y lo recuerda en el navegador.
Para corregir o añadir traducciones edita la lista `DICT` de `hfa-i18n.js` (formato `español|inglés|portugués`).
