# Integración Redsys

## Principios

La implementación usa el formulario alojado por Redsys. El navegador envía los campos firmados al TPV y vuelve a una pantalla informativa. La confirmación real llega a `/api/pagos/redsys/notificacion` y se valida en servidor.

## Variables

- `APP_ENV=staging|production`
- `APP_ORIGIN` (origen canónico HTTPS de servidor; obligatorio para pagos)
- `APP_ALLOWED_ORIGINS` (opcional, alias entrantes conocidos; nunca se usa
  para generar URLs)
- `REDSYS_ENVIRONMENT=test|production`
- `REDSYS_MERCHANT_CODE`
- `REDSYS_TERMINAL`
- `REDSYS_SIGNING_KEY`
- `REDSYS_BIZUM_ENABLED=true|false`

La clave se almacena solo como secreto del entorno. Nunca se registra ni llega
al navegador. Bizum permanece desactivado hasta que el banco lo habilite para
el comercio/terminal.

`MerchantURL`, OK y KO se generan en servidor a partir de `APP_ORIGIN`. No se
usan `request.url`, `Host`, `Origin`, `Referer` ni valores del formulario para
construirlas. La URL OK solo consulta el estado persistido; no confirma pagos.

## Validaciones

- versión de firma `HMAC_SHA512_V2`;
- firma constante;
- merchant code y terminal;
- moneda EUR (978);
- orden y referencia internas;
- importe exacto almacenado;
- código de respuesta aceptado;
- evento y operación idempotentes.

La suite contiene el vector oficial de firma. Eso no sustituye una prueba E2E del TPV.

## Matriz mínima de pruebas

1. Tarjeta aceptada: callback confirma, correo se envía una vez y participante queda pagado.
2. Tarjeta rechazada: queda fallida y se permite reintentar.
3. Cancelación desde TPV: la pantalla no confirma nada.
4. Callback duplicado: no duplica cobro, invoice ni correo.
5. Firma/importe/comercio alterado: HTTP 400 y ningún cambio.
6. Bizum aceptado y rechazado, si está habilitado.
7. Pago individual más pago restante del organizador: suma exacta sin sobrecobro.
8. Transferencia: pendiente hasta confirmación manual; rechazo/cancelación trazable.

La matriz completa está en [`REDSYS-MATRIX.md`](./REDSYS-MATRIX.md).

## Paso a producción

Solicitar al banco FUC/merchant code, terminal, clave de firma, descriptor
comercial, URL HTTPS estable y métodos habilitados. La preparación de D1/R2 de
staging y el checklist exacto están en [`STAGING.md`](./STAGING.md). Ejecutar
la matriz en test, obtener conformidad, cargar secretos de producción y hacer
una operación real de importe pequeño con reconciliación bancaria. Nunca
reutilizar claves de test.
