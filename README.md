# EL JARDIN DE LUNA Frontend

Frontend en React + Vite preparado para desplegarse en Vercel.

## Local

```bash
npm install
npm run dev
```

Por defecto espera el backend en `http://localhost:3001/api`.

## Variables de entorno

Debes configurar estas variables en Vercel:

- `VITE_API_URL`
- `VITE_MP_CHECKOUT_MODE`

Valor esperado en produccion para la API:

```bash
VITE_API_URL=https://tu-backend.onrender.com/api
```

## Vercel

Configuracion recomendada:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

El archivo `vercel.json` agrega un rewrite para que las rutas del frontend no fallen al refrescar una pagina como `/productos`, `/admin` o `/carrito`.

## Verificacion rapida

- Frontend local: `http://localhost:5173`
- Backend esperado en produccion: `https://tu-backend.onrender.com/api`
