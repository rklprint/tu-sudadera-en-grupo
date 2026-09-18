# Política y arquitectura de seguridad

## Reporte

No publiques vulnerabilidades con datos de clientes en issues públicas. Cuando se habilite el dominio, se añadirá un correo específico de seguridad y `/.well-known/security.txt`.

## Controles implementados

- Autorización administrativa con denegación por defecto fuera del proxy de confianza.
- Códigos privados criptográficamente aleatorios, no secuenciales y revocables.
- Tokens personales de 192 bits; nuevos tokens con SHA-256 en reposo, caducidad y revocación.
- Edición bloqueada tras el pago o cierre del registro.
- Verificación de origen en mutaciones, límites de body y rate limit de aplicación.
- Turnstile opcional y validado en servidor.
- Upload privado con allowlist, máximo 15 MB, nombre normalizado, MIME y magic bytes; SVG prohibido.
- Consultas parametrizadas; no se interpolan entradas del usuario en SQL.
- Redsys firmado y validado en callback servidor-servidor, con idempotencia y registro de eventos.
- CSP, HSTS, `nosniff`, `frame-ancestors 'none'`, política de permisos y no-cache/noindex privado.
- Sentry y PostHog con listas permitidas de propiedades y filtrado de PII.
- Exportación Excel con texto literal, sin ejecución de fórmulas.

## Reglas de pago

- La vuelta `OK/KO` del navegador solo informa; no cambia el estado.
- Solo una notificación Redsys con firma, comercio, terminal, moneda, orden, referencia e importe correctos confirma.
- Callbacks duplicados son idempotentes.
- Transferencias permanecen pendientes hasta validación manual.
- No se almacenan PAN, CVV ni datos completos de tarjeta.

## Pendiente antes de producción

- Autenticación admin portable, MFA, recuperación segura y aplicación real de roles.
- Rate limiting distribuido/WAF y alertas por abuso.
- Escaneo antimalware o cuarentena/revisión aislada de PDFs y AI.
- Outbox para email, backups, retención/borrado y plan de respuesta a incidentes.
- DAST/E2E de IDOR, CSRF, XSS, uploads y callbacks en staging.
- Prueba del TPV test con la configuración exacta aprobada por el banco.

## Dependencias

Se exige `npm audit --omit=dev` sin vulnerabilidades altas/críticas. Las incidencias de herramientas de build se documentan y se eliminan al actualizar/migrar upstream; no deben exponerse como servicios de desarrollo públicos.
