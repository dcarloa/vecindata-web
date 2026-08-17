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

## Despliegue (Cloudflare Pages)

1. Ve a https://dash.cloudflare.com → Workers & Pages → Create → Pages →
   Connect to Git.
2. Selecciona el repo `vecindata-web` en GitHub (autoriza a Cloudflare si es la
   primera vez).
3. Configuración de build:
   - Framework preset: `Vite` (o "None" si no aparece — el comando/directorio
     abajo son lo que realmente importa)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Antes de desplegar, agrega la variable de entorno (sección "Environment
   variables" del mismo formulario):
   - `VITE_REPORT_API_URL` = la URL de Cloud Run del paso 3 de
     `vecindata-report-api` arriba (ej. `https://vecindata-report-api-xxxxx-uc.a.run.app`)
5. Guarda y despliega. Cloudflare te da una URL permanente tipo
   `https://vecindata-web-xxx.pages.dev`.
6. Copia esa URL y vuelve al paso 4 de `vecindata-report-api` arriba para
   agregarla a `allow_origins` y redesplegar el backend con el CORS correcto.

Desde este punto, **cada `git push` a `master` despliega automático** — no hay
que repetir estos pasos, solo el primero.
