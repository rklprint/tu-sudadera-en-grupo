# Tu Sudadera en Grupo

Aplicación web para diseñar, presupuestar y coordinar pedidos colectivos de sudaderas y camisetas personalizadas. La sudadera es el producto principal; el catálogo, los tramos y las variantes se administran desde base de datos.

## Estado

La rama `audit/production-foundation` contiene la base endurecida y preparada para integración. La aplicación compila y dispone de catálogo, presupuesto con archivos, grupos privados, participantes con prendas independientes, administración, pagos Redsys/transferencia, emails, exportación Excel, SEO, analítica y observabilidad. Sigue siendo **preproducción** hasta cerrar los elementos de `docs/LAUNCH-CHECKLIST.md`.

## Stack actual

- Next.js 16 y React 19 sobre Vinext/Vite.
- Cloudflare Worker, D1 y R2.
- Drizzle ORM y migraciones SQL.
- Redsys `HMAC_SHA512_V2`; transferencia manual.
- Resend para correo, PostHog cookieless y Sentry sin PII.

## Desarrollo

Requisitos: Node.js 22.13 o superior, npm y utilidades GNU (`timeout`, `flock`).

```bash
npm ci
npm run dev
```

No copies secretos en el repositorio. Parte de `.env.example` y configura los valores en cada entorno.

## Verificación

```bash
npm run lint
npx tsc --noEmit
npm test
npm audit --omit=dev
```

`npm test` ejecuta reglas de negocio, vector oficial de firma Redsys, seguridad de uploads, build y comprobaciones sobre el HTML renderizado.

## Documentación

- [Auditoría](docs/AUDIT.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Seguridad](SECURITY.md)
- [Analítica](docs/ANALYTICS.md)
- [Redsys](docs/REDSYS.md)
- [Staging y preparación del TPV](docs/STAGING.md)
- [Checklist de lanzamiento](docs/LAUNCH-CHECKLIST.md)

## Datos y precios

Los productos, variantes y tramos viven en tablas de catálogo. Los valores confirmados se usan únicamente como semilla segura para un entorno nuevo. Los pedidos conservan una instantánea de producto, modelo, color y precio para que una modificación futura del catálogo no cambie pedidos ya aprobados.

## Despliegues

GitHub será la fuente de verdad. Vercel genera previews de compilación; el
E2E con datos persistentes y callbacks Redsys requiere un Worker de staging con
D1/R2 separados, tal como se detalla en [Staging y preparación del TPV](docs/STAGING.md).
No promociones un despliegue hasta que CI, QA de navegador y checklist de
lanzamiento estén en verde.
