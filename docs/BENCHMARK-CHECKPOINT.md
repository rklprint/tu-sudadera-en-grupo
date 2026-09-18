# Benchmark y mejoras — punto de continuación

Base: 028cf51, rama audit/production-foundation. Primera tanda acotada por petición de uso de Work. No es el cierre del prompt completo. No se conoce el porcentaje de cuota restante.

## Evidencia observada

Se abrió realmente https://sudaderasparacolegios.com/ en navegador desktop. Se recorrió el DOM de toda la portada (navegación, formulario, personalizador, proceso, galería, reseñas, preguntas, enlaces y footer), se inspeccionó captura y se pulsó Burdeos: la imagen cambió a esa variante. No se enviaron formularios ni se accedió a pedidos ajenos.
También se abrió /seguimiento y /sudaderas/ampas. El localizador solicita un código; no se verificaron sus áreas privadas. La landing AMPA tiene contenido específico sobre cursos, tallas y escudo.
Fortalezas visibles: formulario inicial corto, material visual abundante, contacto visible y explicación del pedido por grupo. Su personalizador solicita contacto antes de comunicar el precio. No se han verificado sus estadísticas/reseñas ni se han reutilizado textos/assets.
Nuestra Preview final previa se abrió y redirigió a login Vercel. La comparación interactiva lado a lado no pudo completarse. El navegador disponible no expone ajuste de viewport: no hay certificación móvil. No se repite la recuperación fallida de la Preview interna de la fase anterior.

## Matriz provisional para decidir, no clasificación final

| Área | Estado defendible con la evidencia disponible |
|---|---|
| Claridad inicial | Rival con entrada directa; nuestra propuesta se simplifica en esta tanda |
| Diseño/calidad visual | Rival dispone de más material visible; pendiente comparación de nuestra Preview |
| Personalizador | Nuestra lógica ofrece frontal/espalda y extras; superioridad interactiva sin verificar |
| Móvil | Sin clasificar hasta probar ambos a los anchos pedidos |
| Velocidad | Sin mediciones comparables de LCP/CLS/INP |
| Precio | Nuestro cálculo visible sin contacto es una ventaja funcional; importes no comparables |
| Confianza/prueba social | Rival con mayor presencia visible; no certifica autenticidad |
| Presupuesto | Rival tiene menos campos iniciales; conservamos el formulario existente y su integridad |
| Explicación del servicio | Nuestra explicación revisada destaca registro, cierre de precio y panel |
| Organización/participantes/pagos/panel | Nuestras capacidades están probadas con fixtures; no se accedió al flujo privado rival |
| Contenido/SEO | Rival cubre AMPA específicamente; gap a evaluar sin crear páginas repetidas |
| Accesibilidad | Mejoras puntuales; sin certificación WCAG ni comparación completa |

## Cambios realizados

P0:
- La selección de plantilla se deriva del catálogo activo y compatible. No persiste un ID retirado como selección válida.
- Subir diseño / Diseño a medida no muestran ni envían los campos de una plantilla anteriormente seleccionada.
- Cambio de producto o plantilla limpia sus campos. Se impide continuar con campos obligatorios vacíos; validación servidor conservada.
- Un catálogo sin plantillas disponibles dirige a diseño aportado/a medida. La galería de ideas no afirma aplicar una plantilla que ya no existe.

P1:
- Miniaturas de archivos reales del catálogo, selección visible y ampliación nativa con teclado. Error de archivo: texto limpio; sin sustituto inventado.
- Seleccionar una plantilla cambia a la vista indicada en sus metadatos.
- Hero explica producto y grupo privado; CTA Personalizar y enlace secundario a cálculo sin contacto. Retiradas iniciales decorativas que podían parecer prueba social.
- Cómo funciona explica enlace, participantes y panel; no promete activar Bizum antes de su habilitación.
- FAQs específicas sobre recopilación de tallas, bloqueo tras pago y validación de transferencia.

P2:
- Foco visible para selector/ampliación, miniaturas sin recorte, nombres largos ajustables y carga diferida.
- Sin librerías nuevas, modales, animaciones ni nuevas imágenes.

## Conservado

Importes y decisiones comerciales pendientes; formularios y rutas de presupuesto; grupos, paneles y checkout; snapshots; controles servidor y uploads; PostHog/Sentry; SEO/landings, galería y reseñas existentes. No hay cambios de backend en esta tanda. No producción, DNS, credenciales ni merge.

## Verificación y continuación

Ejecutar tests existentes (incluyen seguridad/flujo), lint, TypeScript y builds Vinext/Next antes de publicar. Los resultados finales se incluyen en la entrega/PR.
No se afirma haber probado nuevos diseños con archivos definitivos inexistentes, ni una comparación móvil, ni WCAG AA, ni Core Web Vitals. Las capturas/DOM de la competencia solo permiten evaluar lo observado.

Para mañana, orden:
1. Recuperar acceso legítimo a Preview interactiva y un entorno con viewport ajustable; no debilitar auth/CSP.
2. Probar 320, 360, 375, 390, 412, 430, 768, 1024 y desktop: overflow, tamaño táctil, sticky, teclado y toda la secuencia del personalizador.
3. Probar catálogo con fixtures de diseños compatibles/inactivos/frontal/espalda/campos requeridos y fallo de imagen. No publicar fixtures como diseños reales.
4. Comparar presupuesto y panel con perfiles alumno/AMPA/peña; medir pasos sin enviar solicitudes al competidor.
5. Revisar intención AMPA/universidad en landings existentes, sin multiplicar páginas vacías.
6. Medir rendimiento y accesibilidad; entonces completar matriz final y las 28 respuestas solicitadas.

Dependencias del usuario: assets/diseños reales, reseñas autorizadas, camiseta, decisiones comerciales y Redsys sandbox ya enumerados en PRE-SANDBOX-DELIVERY.md. No son necesarios para las siguientes comprobaciones con fixtures privados.
