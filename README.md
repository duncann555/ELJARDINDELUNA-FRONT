# El Jardín de Luna — Frontend

Tienda online de botánica artesanal construida con React 19, Vite y Bootstrap.
La compra es pública y no requiere registro: el carrito vive en el navegador,
el backend valida stock y totales, y Mercado Pago procesa el pago.

## Tecnologías

- React 19, React Router y Context API.
- Vite.
- React-Bootstrap, Bootstrap y Bootstrap Icons.
- React Hook Form.
- API REST propia; no contiene SDK ni credenciales de Mercado Pago.

## Requisitos

- Node.js 20.19 o superior (también 22.12+).
- npm 10 o superior.
- API de El Jardín de Luna disponible.

## Instalación y configuración

Instalá las dependencias, copiá `.env.example` como `.env` y configurá:

```dotenv
VITE_API_URL=http://localhost:3001/api
```

En desarrollo existe ese mismo fallback local. En producción `VITE_API_URL` es
obligatoria y el build no inicia silenciosamente sin ella. Los costos de entrega,
las credenciales y toda configuración sensible pertenecen al backend.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Estructura principal

- `src/components/pages`: tienda, checkout, legales y administración.
- `src/components/shared`: navegación, pie, tarjetas y estados reutilizables.
- `src/components/admin`: productos y pedidos del panel protegido.
- `src/context`: única implementación del carrito y sesión administrativa.
- `src/helpers`: cliente HTTP, normalización, validación e idempotencia.
- `src/content`: contenido informativo y legal centralizado.
- `src/styles`: estilos globales de la tienda, legales y administración.
- `test`: pruebas esenciales de carrito, checkout, pedidos y productos.

## Flujo de compra

1. El catálogo público se obtiene de `GET /productos`.
2. El carrito anónimo conserva solo datos mínimos de productos en
   `localStorage` y respeta el stock informado.
3. Carrito y checkout consultan `GET /checkout/configuracion` para mostrar
   envío y total antes del pago.
4. Antes de crear el pedido se reconcilian precio, disponibilidad y stock.
5. `POST /checkout/mercadopago` usa una `Idempotency-Key` persistida por intento.
6. El total definitivo se presenta para confirmación antes de abrir Mercado
   Pago.
7. Las rutas `/pago/success`, `/pago/failure` y `/pago/pending` consultan
   `GET /pedidos/:numero/estado` con `X-Order-Token`. Nunca confían en el estado
   de la URL y solo vacían el carrito si el backend confirma `approved`.

## Mercado Pago

El frontend no recibe el Access Token ni crea preferencias. Envía IDs y
cantidades al backend, muestra el total recalculado para una confirmación final
y sólo abre una URL HTTPS oficial de Mercado Pago. La acreditación depende del
webhook y de la consulta segura al backend.

## Administración

`/admin` carga el panel de forma diferida. El JWT administrativo se guarda
únicamente en `sessionStorage`; los datos del administrador se mantienen en
memoria. El panel permite administrar productos, imágenes y el estado operativo
de pedidos, pero no usuarios ni estados de pago.

## Rutas públicas

- `/`, `/productos`, `/producto/:identifier`
- `/carrito`, `/checkout`
- `/pago/success`, `/pago/failure`, `/pago/pending`
- `/nosotros`, `/contacto`, `/preguntas-frecuentes`
- `/terminos-y-condiciones`, `/privacidad`
- `/cambios-y-devoluciones`, `/envios`, `/arrepentimiento`

La página principal y el pie muestran acceso destacado al Botón de
Arrepentimiento conforme a la Disposición 954/2025.

## Persistencia y privacidad

- `localStorage`: carrito anónimo. Como contingencia, puede guardar la referencia
  mínima del último pedido si `sessionStorage` no está disponible.
- `sessionStorage`: JWT administrativo, clave idempotente del intento de checkout
  y referencia mínima del último pedido (`numero`, `orderToken`,
  `externalReference`).
- No se almacenan datos personales del checkout ni datos de tarjetas.

## Despliegue

El proyecto genera una SPA en `dist/`. `vercel.json` redirige rutas del navegador
a `index.html`. Antes de desplegar ejecutá lint, tests, build y configurá
`VITE_API_URL` con la URL HTTPS de producción.

## Límites y pasos externos

- El pago real o sandbox requiere credenciales y webhook configurados en el
  backend; no puede validarse sólo desde este repositorio.
- La carga de imágenes depende de la configuración de Cloudinary del backend.
- Los textos legales y datos comerciales deben revisarse si cambian el domicilio,
  canales de atención o condiciones de venta.
