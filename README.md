# vecindata-web

Landing pública + panel del operador de VecinData (Colombia).

## Setup

```bash
npm install
```

## Configuración

Por defecto apunta a `http://localhost:8000` (report-api corriendo localmente). Para
usar otra URL, copia `.env.example` a `.env` y ajusta `VITE_REPORT_API_URL`.

## Desarrollo

```bash
npm run dev
```

## Tests

```bash
npm test
```

## Typecheck

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

## Despliegue (Cloudflare Worker)

Producción (`https://vecindata.dcarloabad.workers.dev`) corre como un
Cloudflare Worker con assets estáticos (ver `wrangler.toml`), no como
Cloudflare Pages.

⚠️ **No hagas `npm run build && wrangler deploy` a mano desde una máquina
cualquiera.** `VITE_GOOGLE_PLACES_API_KEY` vive *solo* en el build-time
config de Cloudflare (Worker → Settings → Build → "Build variables and
secrets") — nunca en git, nunca en `.env.production`, nunca en ninguna
variable de shell local. Un build hecho en una máquina sin esa clave
compila igual (sin error) pero deja el buscador de direcciones roto en
producción ("No se pudo cargar el buscador de direcciones") porque
`loadPlacesLibrary()` rechaza de inmediato con la clave vacía — así se
rompió el 2026-09-03/04.

- Si el repo tiene conectado Cloudflare Workers Builds (git integration),
  un `git push` a `master` ya dispara el build+deploy correcto — confirmar
  en el dashboard de Cloudflare, sección Builds, antes de asumir que hace
  falta un paso manual.
- Si de verdad hay que desplegar a mano, primero conseguí el valor real de
  `VITE_GOOGLE_PLACES_API_KEY` desde el dashboard de Cloudflare y expórtalo
  en el shell antes de `npm run build`; `CLOUDFLARE_API_TOKEN`
  (`Workers Scripts: Edit`, cuenta dueña de `dcarloabad.workers.dev`) solo
  alcanza para el `wrangler deploy`, no reemplaza la clave de Places.

`VITE_REPORT_API_URL` (la URL de Cloud Run del backend) se configura en
`.env.production`, no como variable de entorno de Cloudflare.
