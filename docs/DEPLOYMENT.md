# Despliegue y operación

## Entornos

| Entorno | Uso | Pagos | Indexación |
| --- | --- | --- | --- |
| development | trabajo local | desactivados o sandbox | no público |
| preview/staging | QA por PR | Redsys test | `noindex` global recomendado |
| production | clientes | Redsys real tras aprobación | solo rutas públicas |

## GitHub

1. Crear o conectar un repositorio exclusivo para esta marca.
2. Proteger `main`: PR obligatorio, CI obligatorio y al menos una revisión para pagos/auth.
3. Mantener ramas cortas (`feat/*`, `fix/*`, `security/*`).
4. Activar Dependabot y secret scanning.
5. Nunca subir `.env`, claves del TPV, SMTP, tokens ni exports con clientes.

El workflow de `.github/workflows/ci.yml` valida lint, tipos, tests, build y dependencias de producción.

## Variables

Usar `.env.example` como contrato. Separar valores por entorno. Las claves de servidor nunca deben usar prefijo `NEXT_PUBLIC_`. Rotar cualquier secreto expuesto y registrar quién puede administrarlo.

## Vercel preview

Vercel Preview sirve para validar el build y la UI, pero no es el runtime de
datos para pagos. Antes de usarlo como referencia visual:

- conectar el repositorio y seleccionar la rama principal;
- configurar variables por `Preview`, nunca copiar producción;
- elegir autenticación administrativa portable;
- disponer de DB y almacenamiento de staging en el Worker Cloudflare separado;
- fijar `APP_ENV=preview` y `NEXT_PUBLIC_APP_ENV=preview`;
- proteger previews con acceso de equipo y `noindex`;
- comprobar callbacks externos con la URL HTTPS estable del Worker de staging.

No despliegues este artefacto Vinext como si fuese un build Next `.next`: el artefacto actual es un Worker en `dist/server/index.js`.

## Cloudflare producción

- DNS con proxy, TLS `Full (strict)`, Always Use HTTPS y HSTS después de validar todo el dominio.
- Cachear assets versionados; no cachear `/api/*`, `/admin/*`, `/pedido/*`, `/participante/*` ni `/pago/*`.
- Turnstile en presupuesto y, si el abuso lo exige, en registro.
- WAF/rate limiting gradual sobre POST públicos y login admin. Excluir callback Redsys de challenges, pero validar estrictamente firma y limitar por reglas compatibles con sus IP/documentación bancaria.
- R2 privado, sin listado público. D1 con backups/exportaciones y migraciones previas.
- No crear reglas que reescriban bodies o bloqueen POST de Redsys.

## Sentry

Configurar DSN por entorno, proyecto independiente y releases enlazadas al commit. `SENTRY_AUTH_TOKEN` existe solo en CI para sourcemaps. Verificar con un error sintético en preview y confirmar que headers, cookies, body, email, teléfono, archivos y tokens no aparecen.

## PostHog

Configurar proyecto UE y key pública. La implementación usa memoria, desactiva autocapture, pageviews automáticos, perfiles y replay, y respeta DNT. Validar eventos en preview con datos ficticios antes de producción.

## Promoción y rollback

1. CI verde.
2. Migración probada en copia de staging.
3. QA E2E y seguridad de autorización.
4. Backup.
5. Despliegue canario o ventana controlada.
6. Smoke test de homepage, presupuesto, grupo, admin y pago test.
7. Rollback de código si hay error; las migraciones deben ser compatibles hacia atrás.
