# Staging y preparación del TPV

## Decisión de persistencia

El runtime productivo es un Worker de Cloudflare y usa las bindings `DB` (D1)
y `BUCKET` (R2) definidas en `.openai/hosting.json`. El Preview de Vercel
compila la aplicación, pero no recibe esas bindings; por tanto no se debe usar
como staging E2E ni conectarlo a SQLite efímero para pagos.

Para un staging operativo se necesita una base D1 y un bucket R2 separados de
producción, con las mismas migraciones y nombres de binding (`DB` y `BUCKET`).
La URL de ese Worker debe ser HTTPS, privada/no indexable y estable durante la
prueba, porque Redsys necesita llamar a `POST /api/pagos/redsys/notificacion`.

## Variables que ya están preparadas

Copiar `.env.example` solo al gestor de secretos del entorno. Los nombres que
consume el código son:

```text
REDSYS_ENVIRONMENT=test|production
REDSYS_MERCHANT_CODE=          # FUC/merchant code asignado por el banco
REDSYS_TERMINAL=001            # terminal asignado por el banco
REDSYS_SIGNING_KEY=            # clave de firma asignada por el banco
REDSYS_BIZUM_ENABLED=false     # true solo tras confirmación del banco
```

La moneda está fijada a EUR (`978`) en el generador y se vuelve a validar en
cada notificación. Las URLs no se aceptan desde el navegador ni desde una
variable mutable: se derivan del origen HTTPS de la petición de inicio y se
firman dentro de `Ds_MerchantParameters`:

- `POST /api/pagos/redsys/notificacion` (servidor a servidor, fuente de verdad)
- `/pago/resultado?...estado=pendiente` (retorno OK informativo)
- `/pago/resultado?...estado=cancelado&token=...` (retorno KO/cancelación)

La página de resultado nunca marca una operación como pagada.

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
   valores de producción después de reconciliar un pago real controlado.

## Firma y controles

Redsys usa `HMAC_SHA512_V2` (diversificación AES de la clave + HMAC-SHA-512),
que es la firma oficial de la redirección y de la notificación. El proyecto
incluye el vector oficial y compara la firma en tiempo constante. HMAC-SHA-256
se usa únicamente para el token interno de cancelación del navegador; no
sustituye la firma Redsys.

Antes de aceptar una notificación se validan firma, versión, pedido, importe,
moneda, merchant code, terminal y `Ds_MerchantData`. El cambio de estado se
condiciona a `processing`; callbacks repetidos son idempotentes y nunca crean
otro pago, factura, recibo ni cobro.

