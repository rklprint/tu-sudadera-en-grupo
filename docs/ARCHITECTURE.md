# Arquitectura

## Dominios

- **Catálogo:** productos, modelos, colores, tallas, tramos, extras y SEO.
- **Presupuesto:** intención de compra, configuración, contacto y archivos.
- **Grupo:** propuesta aceptada, diseño, registro, pagos, producción y envío.
- **Participación:** datos de contacto y una o más prendas independientes.
- **Pago:** operación inmutable, proveedor, eventos, confirmación e invoice placeholder.
- **Administración:** comandos autorizados, exportación y audit log.

## Flujo principal

```text
Catálogo → personalizador → presupuesto → revisión/aprobación
        → grupo privado → registro → cierre/reprecio → pagos
        → producción → envío conjunto → entrega
```

El catálogo define precios futuros. Al aprobar un presupuesto, el grupo y sus prendas guardan un snapshot de modelo, color y precio. Así una edición del catálogo no altera un compromiso existente.

## Estados

- Diseño: `review`, `approved`.
- Registro: `open`, `closed`.
- Pago del grupo: `locked`, `open`, `complete`.
- Participante: `unpaid`, `paid`.
- Operación: `pending`, `processing`, `confirmed`, `failed`, `rejected`, `cancelled`.
- Producción: `planning`, `production`, `shipped`, `delivered`.

Las transiciones críticas se validan en servidor. Un pedido no pasa a completo por una URL de navegador y no puede marcarse entregado antes de enviarse.

## Persistencia

D1 almacena datos estructurados. R2 almacena diseños privados bajo claves aleatorias; la descarga pasa por un endpoint administrativo. Las migraciones Drizzle son la única fuente de esquema. `ensureQuoteSchema()` solo verifica el binding y ejecuta una semilla idempotente del catálogo; no contiene DDL ni conserva I/O en estado global del Worker.

## Fronteras de confianza

- Público: homepage, landings, catálogo activo y solicitud.
- Bearer privado: código aleatorio de grupo; muestra solo agregados.
- Bearer personal: token aleatorio, hash en reposo, caducidad y bloqueo de edición tras pago.
- Admin: identidad verificada y allowlist; pendiente proveedor portable con MFA/RBAC.
- Banco: notificación servidor a servidor firmada; la redirección del navegador no es una fuente de verdad.

## Runtime y evolución

El código actual produce un Worker compatible con Cloudflare mediante Vinext.
Vercel Preview no puede compartir D1/R2 de forma nativa sin un adaptador o una
segunda capa de datos. La decisión adoptada para staging es ejecutar el mismo
Worker en Cloudflare con D1/R2 exclusivos, dejando Vercel para build/Preview
visual y CI. La plantilla no destructiva está en
[`wrangler.staging.example.jsonc`](../wrangler.staging.example.jsonc).

1. Mantener el Worker de staging en Cloudflare y usar Vercel para previews de build/visual.
2. No migrar a Next.js/Postgres en esta fase: rompería el runtime Vinext y no es
   necesario para persistencia.
3. No exponer D1/R2 directamente a Vercel; los callbacks Redsys deben llegar al
   Worker estable de staging.

No se debe crear una base distinta por cada preview si se pretenden probar callbacks de pago y flujos de grupo estables.
