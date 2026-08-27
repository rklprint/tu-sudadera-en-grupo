# Staging y preparación del TPV

## Decisión de persistencia

El runtime de la aplicación es un Worker de Cloudflare generado por Vinext. Usa
las bindings `DB` (D1) y `BUCKET` (R2) definidas en `.openai/hosting.json`.
Vercel compila el artefacto y genera Preview, pero sus funciones Next no reciben
esas bindings; por tanto el Preview de Vercel no es un staging E2E persistente y
no se conecta a SQLite efímero para pagos.

El entorno persistente y aislado disponible es el Site privado del proyecto:

`https://tu-sudadera-en-grupo.rklprint22.chatgpt.site`

Ejecuta el Worker Vinext con bindings de proyecto `DB` (D1) y `BUCKET` (R2),
acceso limitado al propietario y `APP_ENV=staging`. No utiliza el dominio
principal ni requiere modificar sus nameservers. Vercel se conserva como
Preview visual/build, pero no como entorno E2E porque no recibe estos bindings.
El origen fijo anterior será el que Redsys use para el callback servidor a
servidor.

La separación prevista es:

| Entorno | `APP_ENV` | Datos | Pagos | Indexación |
| --- | --- | --- | --- | --- |
| Desarrollo | `development` | D1/R2 local o fixture | desactivados/test | noindex |
| Staging | `staging` | D1/R2 exclusivos de QA | Redsys test | noindex |
| Producción | `production` | D1/R2 productivos | Redsys real | pública |

No se debe compartir la base de producción con Preview ni reutilizar una base
efímera entre despliegues. En esta fase no se crea ni se activa ningún recurso
de producción.

### Estado de recursos

- D1 persistente ligado como `DB`, exclusivo del proyecto privado.
- R2 privado ligado como `BUCKET`, exclusivo del proyecto privado.
- Migraciones `drizzle/0000`–`drizzle/0008` como única fuente del esquema;
  ninguna petición crea o altera tablas en runtime.
- `APP_ORIGIN` fijado al origen HTTPS anterior, demos desactivadas, Redsys en
  `test` y Bizum desactivado.
- FUC, terminal, clave Redsys, IBAN, claves de observabilidad y email siguen
  ausentes hasta recibir valores reales y autorizados.

No se deben cambiar nameservers ni activar el dominio principal para completar
este procedimiento.

## Variables que ya están preparadas

Copiar `.env.example` solo al gestor de secretos del entorno. Los nombres que
consume el código son:

```text
APP_ENV=staging
APP_ORIGIN=https://tu-sudadera-en-grupo.rklprint22.chatgpt.site
APP_ALLOWED_ORIGINS=
REDSYS_ENVIRONMENT=test
REDSYS_MERCHANT_CODE=          # FUC/merchant code asignado por el banco
REDSYS_TERMINAL=               # terminal asignado por el banco
REDSYS_SIGNING_KEY=            # clave de firma asignada por el banco
REDSYS_BIZUM_ENABLED=false     # true solo tras confirmación del banco
```

### Orígenes permitidos por entorno

| Entorno | `APP_ORIGIN` canónico | Orígenes adicionales |
| --- | --- | --- |
| development | `http://localhost:3000` | solo localhost si se necesita desarrollo local |
| test | el origen HTTPS de la fixture | ninguno |
| staging | `https://tu-sudadera-en-grupo.rklprint22.chatgpt.site` | ninguno |
| production | `https://tusudaderaengrupo.es` | únicamente aliases HTTPS aprobados explícitamente |

`APP_ALLOWED_ORIGINS` es una lista separada por comas para validar solicitudes
entrantes conocidas. Nunca sustituye a `APP_ORIGIN` al crear enlaces ni URLs de
Redsys. En staging y producción no se permite HTTP.

La moneda está fijada a EUR (`978`) en el generador y se vuelve a validar en
cada notificación. Las URLs no se aceptan desde el navegador, `Host`, `Origin`,
`Referer` ni parámetros del cliente. Se derivan exclusivamente de `APP_ORIGIN`,
validado en servidor, y se firman dentro de `Ds_MerchantParameters`:

- `POST /api/pagos/redsys/notificacion` (servidor a servidor, fuente de verdad)
- `/pago/resultado?...estado=pendiente` (retorno OK informativo)
- `/pago/resultado?...estado=cancelado&token=...` (retorno KO informativo y
  solicitud de cancelación ligada a la referencia)

La página de resultado nunca marca una operación como pagada.

## Estado actual de las capacidades críticas

- **Persistencia:** el Worker privado usa D1 + R2 mediante `DB` y `BUCKET`.
  Vercel Preview no tiene esas bindings; no se usa como base de datos ni se
  conecta a SQLite efímero.
- **Administración:** el panel valida en servidor la identidad confiable del
  host privado de Sites y una allowlist `ADMIN_EMAIL` separable por comas. En
  Vercel genérico `TRUST_OPENAI_IDENTITY_HEADERS` permanece desactivado. No se
  ha añadido una contraseña propia ni se publicará el panel sin un proveedor
  de identidad portable con sesiones seguras y MFA.
- **Datos privados:** los códigos de grupo y tokens personales son aleatorios,
  se comparan mediante hash, expiran/revocan y se excluyen de sitemap,
  analítica y logs. Las rutas de demostración están desactivadas por defecto;
  solo se habilitan con `ENABLE_DEMO_ROUTES=true` en development/test.
- **Email:** Resend se ejecuta fuera de la transacción de datos y nunca decide
  si un pago está confirmado. Sin `RESEND_API_KEY` el estado queda pendiente;
  no se inventan credenciales ni se afirma entrega real. Las solicitudes usan
  claves `Idempotency-Key` estables para que los reintentos de red no dupliquen
  los mensajes; una cola durable sigue siendo recomendable antes de producción
  si el volumen hace necesario reintentar envíos fallidos.
- **Observabilidad:** Sentry filtra cookies, cuerpos, headers, query strings y
  usuarios; PostHog solo recibe propiedades allowlisted sin PII y mantiene
  Session Replay desactivado.
- **Archivos:** PNG, JPG/JPEG, PDF y AI se validan por MIME y firma binaria,
  con límite de 15 MB y clave privada aleatoria en R2. No hay un motor
  antimalware conectado todavía; los archivos no se ejecutan ni se sirven
  públicamente. Antes de producción conviene añadir un escáner aislado para
  PDF/AI (por ejemplo ClamAV gestionado o un servicio especializado).

## WAF y callback Redsys

El callback exacto es `POST /api/pagos/redsys/notificacion`. No debe pasar por
Turnstile, challenge interactivo, protección bot ni una regla que reescriba o
comprima el body. Puede llevar rate limit de volumen alto y observación de
errores, pero no se debe confiar solo en IP: la firma `HMAC_SHA512_V2` y las
validaciones comerciales son obligatorias. Si el banco entrega rangos oficiales
de Redsys, se pueden añadir como capa adicional de allowlist; si no los entrega,
no se inventan.

## Qué falta el lunes

1. Introducir en el secreto del entorno de test el FUC, terminal y clave que
   entregue Redsys; no reutilizar valores de este repositorio ni de producción.
2. Registrar en Redsys la URL HTTPS pública del callback y confirmar que acepta
   `POST` sin redirección, challenge WAF ni reescritura del body.
3. Pedir los códigos de respuesta y tarjetas de prueba oficiales del comercio.
4. Confirmar si el terminal tiene Bizum habilitado; solo entonces cambiar
   `REDSYS_BIZUM_ENABLED=true`.
5. Ejecutar aprobada, rechazada y cancelada, y comprobar que cada una llega al
   callback firmado y actualiza una sola vez el pago.
6. Para producción, cambiar únicamente el entorno y los tres secretos por los
   valores de producción después de reconciliar un pago real controlado. Esto
   será una operación posterior y no forma parte de esta fase.

## Firma y controles

Redsys usa `HMAC_SHA512_V2` (diversificación AES de la clave + HMAC-SHA-512),
que es la firma oficial de la redirección y de la notificación. El proyecto
incluye el vector oficial y compara la firma en tiempo constante. HMAC-SHA-256
se usa únicamente para el token interno de cancelación del navegador; no
sustituye la firma Redsys.

Antes de aceptar una notificación se validan firma, versión, pedido, importe,
moneda, merchant code, terminal y `Ds_MerchantData`. El callback actualiza de
forma idempotente una operación `processing`; una cancelación de navegador ya
registrada no puede ser reabierta por una notificación posterior. Callbacks
repetidos nunca crean otro pago, factura, recibo ni cobro. La URL OK solo
consulta el estado persistido y abrirla manualmente no cambia el pago.

## Información que pedir al banco

Solicitar exactamente:

1. FUC/Merchant Code.
2. Número de terminal.
3. Clave de firma.
4. Algoritmo y configuración de firma aplicables.
5. URL HTTPS de notificación a registrar.
6. Si deben registrar también OK/KO.
7. Tarjetas de prueba, fechas y CVV oficiales.
8. Códigos para aprobado, rechazado y cancelado.
9. Confirmación de Bizum y su habilitación en el comercio.
10. Métodos de pago habilitados y requisitos 3DS.
11. Restricciones de tarjeta, whitelist/IPs y requisitos WAF.
12. Endpoint de test y procedimiento exacto para pasar a producción.
13. Confirmación de si FUC, terminal o clave cambian entre test y producción.
14. Pruebas obligatorias antes de activar producción.
15. Contacto técnico para incidencias.

Lo que ya sabemos: el proyecto usa `HMAC_SHA512_V2`, EUR (`978`), callback
servidor-servidor y separación `REDSYS_ENVIRONMENT=test|production`. Todo lo
demás anterior queda pendiente del banco.
