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
- `VITE_MP_CHECKOUT_MODE=production` o `sandbox`

Valor esperado en produccion para la API:

```bash
VITE_API_URL=https://el-jardin-de-luna-backend.onrender.com/api
VITE_MP_CHECKOUT_MODE=production
```

No configures Access Token ni Client Secret en el frontend.
El checkout abre la URL que devuelve el backend. No hace falta configurar Public Key ni cargar scripts de Mercado Pago en React para Checkout Pro por redireccion.
Tampoco configures `VITE_ADMIN_PASSWORD`: la contraseña admin pertenece solo al backend.
Para probar Mercado Pago en produccion, limpia `localStorage` y `sessionStorage`, crea una compra nueva desde cero y usa una cuenta compradora real distinta de la cuenta vendedora.

## Vercel

Configuracion recomendada:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

El archivo `vercel.json` agrega un rewrite para que las rutas del frontend no fallen al refrescar una pagina como `/productos`, `/admin` o `/carrito`.

## Verificacion rapida

- Frontend local: `http://localhost:5173`
- Backend esperado en produccion: `https://tu-backend.onrender.com/api`
