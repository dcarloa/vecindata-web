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

## Despliegue (Cloudflare Worker, manual)

Producción (`https://vecindata.dcarloabad.workers.dev`) corre como un
Cloudflare Worker con assets estáticos (ver `wrangler.toml`), **no** como
Cloudflare Pages, y **no** se despliega automático al hacer `git push` —
hay que publicarlo a mano desde la cuenta de Cloudflare dueña de ese
subdominio:

```bash
npm run build
npx wrangler deploy
```

`wrangler deploy` necesita credenciales de esa cuenta específica de
Cloudflare (`CLOUDFLARE_API_TOKEN` con permiso `Workers Scripts: Edit`,
guardado en `~/.config/vecindata/deploy.env` en la máquina que hace los
despliegues). Un token de otra cuenta no publica en `dcarloabad.workers.dev`
— crea un Worker nuevo en un subdominio distinto.

`VITE_REPORT_API_URL` (la URL de Cloud Run del backend) se configura en
`.env.production`, no como variable de entorno de Cloudflare.
