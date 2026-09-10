# Auditoría técnica y de producto

Fecha de corte: 26 de agosto de 2026. Rama: `audit/production-foundation`.

## Resumen ejecutivo

El proyecto partía de una landing avanzada sobre un starter Vinext/Sites, con buen concepto visual y varias rutas operativas, pero sin una frontera de producción completa. La revisión confirmó deuda en autenticación portable, pagos, uploads, observabilidad, catálogo, privacidad, exportación, pruebas y operación. Se ha reforzado la base sin cambiar la identidad visual.

Estado: **apto para preview controlada; no apto aún para cobrar en producción**. Los bloqueos externos y de decisión están en `LAUNCH-CHECKLIST.md`.

## Inventario verificado

| Área | Estado actual | Evidencia / decisión |
| --- | --- | --- |
| Framework | Next 16.3.1, React 19.2.8, Vinext 0.0.50, Vite 8.2.2 | lockfile y build verificado |
| Datos | D1 + Drizzle, migraciones `0000`–`0008` | catálogo, presupuestos, grupos, pagos, facturas, auditoría y bloqueos de concurrencia |
| Archivos | R2 privado | validación por extensión, MIME, firma y límite 15 MB |
| Catálogo | Administrable | producto, slug, categoría, modelo, estados, colores, tallas, tramos y SEO |
| Presupuestos | Operativo | contacto obligatorio, configuración, archivo, privacidad, email |
| Grupos | Operativo | código aleatorio no secuencial, revocación y `noindex` |
| Participantes | Operativo | prendas independientes, edición previa al pago, tokens nuevos con hash y caducidad |
| Pagos | Integración preparada | Redsys test, Bizum condicionado, transferencia manual, idempotencia y callback seguro |
| Administración | Operativa en runtime Sites | autorización portable aún pendiente para Vercel |
| Emails | Operativos con proveedor configurado | confirmaciones y justificantes; falta cola duradera |
| Analítica | Preparada | PostHog cookieless, eventos tipados y sin PII |
| Errores | Preparada | Sentry por entorno, filtros de PII |
| SEO | Base sólida | canonical, robots, sitemap, schemas, landings, 404 y redirects |
| Accesibilidad | Mejorada | foco visible, targets táctiles, labels, reduced motion |

## Hallazgos corregidos

1. La autenticación administrativa confiaba en cabeceras de identidad que podrían falsificarse fuera del proxy original. Ahora solo se aceptan con `TRUST_OPENAI_IDENTITY_HEADERS=true`; en cualquier otro entorno falla de forma cerrada.
2. La subida aceptaba formatos activos y se procesaba antes de aplicar límites. SVG quedó prohibido; PNG/JPEG/PDF/AI se comprueban por MIME y magic bytes, con tamaño máximo y almacenamiento privado.
3. No existía confirmación bancaria real. Redsys usa firma `HMAC_SHA512_V2`, valida comercio, terminal, moneda, importe, referencia, respuesta e idempotencia. La vuelta del navegador jamás confirma el pago.
4. Los tokens personales nuevos se almacenaban en claro. Ahora se guarda SHA-256, fecha de caducidad y posibilidad de revocación, manteniendo compatibilidad temporal con registros anteriores.
5. Faltaban controles transversales de mutación. Se añadieron verificación de origen, límites de body, rate limit de aplicación y Turnstile opcional.
6. La exportación era CSV vulnerable a fórmulas y no se presentaba como libro de producción. Ahora se genera SpreadsheetML compatible con Excel, valores literales, todas las columnas operativas y una fila de totales.
7. Productos, variantes y precios estaban duplicados. Se centralizaron en catálogo administrable y los pedidos guardan snapshots.
8. Faltaban Sentry y analítica de producto. Ambos quedan preparados por entorno y sin capturar datos personales.
9. Había una mutación del DOM que podía provocar error de hidratación. Las transiciones usan Web Animations, respetan `prefers-reduced-motion` y no alteran el DOM que React hidrata.
10. Se eliminaron contenido de starter y marcadores internos de preview del HTML público.

## Riesgos pendientes

| Prioridad | Riesgo | Condición de cierre |
| --- | --- | --- |
| Bloqueante | No hay proveedor de identidad administrativo portable | implantar sesión segura con MFA y RBAC antes de Vercel/producción |
| Bloqueante | Credenciales reales/test de Redsys y URL de notificación no verificadas por el banco | prueba E2E aprobada con operación aceptada, rechazada y repetida |
| Bloqueante | Datos fiscales y textos legales definitivos pendientes | revisión jurídica y publicación antes de venta |
| Alta | Rate limit en memoria no coordina varios isolates | Cloudflare WAF/Turnstile y limitador distribuido en endpoints sensibles |
| Alta | Emails no usan outbox/cola duradera | outbox transaccional con reintentos, deduplicación y estado observable |
| Alta | Falta análisis antimalware real para archivos vectoriales/PDF | integrar escaneo o revisión aislada antes de abrir descargas |
| Alta | Las tablas de extras son administrables, pero el editor privado aún conserva campos heredados de pecho/manga | migrar la selección a `order_item_extras` y servir todas las opciones compatibles desde catálogo |
| Media | Vinext mantiene 2 vulnerabilidades altas solo en herramienta de build (`image-size`) y Drizzle 4 moderadas de desarrollo | migrar a runtime Next/OpenNext estable o actualizar cuando upstream lo resuelva |
| Media | La suite E2E usa SQLite compatible con D1 y las migraciones reales, no datos remotos del entorno privado | añadir Playwright con fixtures aisladas y limpieza controlada cuando exista un namespace QA automatizable |
| Media | No existen fotografías/reseñas reales publicables | cargar pruebas sociales con consentimiento y optimización |

`npm audit --omit=dev` devuelve 0 vulnerabilidades. El audit completo informa 6 incidencias en herramientas de desarrollo/build; no forman parte del runtime productivo y los uploads nunca se procesan con `image-size`, pero se mantienen registradas como deuda.

## UX, CRO y contenido

Fortalezas: propuesta diferencial clara, precios visibles, explicación de proceso, calculadora contextual, estética propia, estructura orientada a colegios y grupos.

Pendiente antes de campaña: fotografías reales, video corto de proceso, muestras por color, guía de tallas real del proveedor, WhatsApp, redes verificadas, pruebas sociales autorizadas y una tarifa/modelo definitivo de camiseta. No se han inventado estos contenidos.

## SEO e indexación

Páginas públicas actuales: homepage y landings completas para sudaderas personalizadas, colegios/institutos, fin de curso, peñas, equipos/clubes, viajes de estudios y camisetas personalizadas. Existen canonical, metadatos sociales, Organization/WebSite/Service/FAQ/Breadcrumb schema, sitemap, robots y 404.

Admin, pedidos, participantes, pago y páginas legales provisionales están fuera del índice. Search Console queda pendiente únicamente de la verificación de propiedad y el envío del sitemap.

## Criterio de finalización

Una funcionalidad se considera terminada solo si pasa lint, TypeScript, unit/integration tests, build, navegador real en los breakpoints definidos, seguridad de autorización, estados de error/vacío/carga y prueba en preview desplegada. Compilar por sí solo no es aceptación.
