# Checklist de lanzamiento

## Bloqueantes externos

- [ ] Repositorio GitHub independiente conectado y rama subida mediante PR.
- [ ] Proyecto/preview de Vercel y estrategia de datos de staging decidida.
- [ ] Dominio definitivo, DNS y correo del dominio verificados.
- [ ] WhatsApp de la marca y enlaces de Instagram/TikTok definitivos.
- [ ] Modelo, proveedor, coste, tallas y tramos de la camiseta confirmados.
- [ ] Fotografías/vídeos reales optimizados y permisos de reseñas/imágenes.
- [ ] Datos fiscales, aviso legal, contratación, devoluciones y privacidad revisados.
- [ ] Descriptor/TPV Redsys de la marca, test de banco y Bizum confirmado.
- [ ] IBAN y titular de transferencia configurados como secretos.

## Ingeniería

- [ ] Autenticación admin con MFA/RBAC y recuperación segura.
- [ ] Migraciones ejecutadas en pipeline, sin DDL en petición.
- [ ] Outbox/cola de email con reintentos y alertas.
- [ ] Editor de participante migrado a extras compatibles totalmente administrables.
- [ ] Rate limit distribuido, WAF y Turnstile comprobados.
- [ ] Escaneo o cuarentena de archivos PDF/AI.
- [ ] Backup/restore de DB y retención/borrado de datos probados.
- [ ] Sentry, PostHog y alertas verificadas en preview.
- [ ] Redsys E2E completo e idempotencia verificada.
- [ ] Exportación Excel contrastada contra totales del panel.

## Contenido y UX

- [ ] Guía de tallas Gildan oficial y mediciones verificadas.
- [ ] Estado vacío, carga y error comprobados en catálogo/admin/grupo.
- [ ] Navegación teclado y lector de pantalla en flujos clave.
- [ ] 320, 375, 390, 430, tablet, laptop, desktop y ultrawide sin overflow.
- [ ] Safari iOS, Chrome Android, Chrome/Edge/Firefox desktop.
- [ ] Formularios con errores reales, red lenta y reintentos.
- [ ] Copy final de camisetas, WhatsApp, redes y prueba social.

## SEO y rendimiento

- [ ] Dominio y canonical definitivos en preview de producción.
- [ ] Search Console verificada y sitemap enviado.
- [ ] `noindex` en staging, admin, grupos, participantes, checkout y pagos.
- [ ] Imágenes AVIF/WebP con dimensiones, `srcset`, lazy load y alt.
- [ ] Lighthouse móvil y WebPageTest con imágenes reales.
- [ ] Objetivo: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 en p75.
- [ ] 404, redirects, sitemap, robots y schemas validados.

## Go/no-go

- [ ] CI y pruebas E2E verdes.
- [ ] Auditoría de autorización/IDOR sin hallazgos altos.
- [ ] Ningún secreto en Git ni sourcemaps públicos.
- [ ] Operación de compra de prueba reconciliada de extremo a extremo.
- [ ] Responsable de soporte y procedimiento de incidencia definidos.
