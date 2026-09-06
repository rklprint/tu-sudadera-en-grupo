# Preparación de assets y Redsys — 6 septiembre 2026

## Estado real y alcance

Base inspeccionada: rama `audit/production-foundation`, commit `b209c6b1db3f5f3f45a4d92af797fbbf7ba13172`.
PR #1 abierto como borrador contra main. Vercel tenía una Preview READY del mismo SHA.
Se conserva la implementación Vinext/Next, D1/R2, paneles, SEO, observabilidad y checkout; no se reconstruye la web.
No se han configurado secretos, activado producción, cambiado DNS ni fusionado main.

## Cambios

- Imágenes por producto/modelo/color/vista desde el catálogo. Editor admin conserva y guarda sus rutas públicas.
- Preview utiliza el lienzo completo con object-fit contain. Una variante ausente o fallida muestra un mensaje; nunca sustituye otro modelo/color.
- Camiseta pendiente sin dibujo sintético ni fotos heredadas de sudadera.
- Diseños administrables mediante JSON validado: id, nombre, archivo, vista, posición/tamaño relativos, productos, personalización, campos, activo y orden.
- Los archivos personalizados que todavía no pueden representarse fielmente se describen en texto; no se simula su resultado impreso.
- Campos de diseños preservados en presupuesto y snapshot del diseño seleccionado. SVG públicos solo como imagen, nunca HTML inline.
- Registro central de cinco extras existentes. Lectura de importes y compatibilidad desde extras/product_extras, cálculo común y snapshot de extras/tallas para participantes.
- Se rechazan extras incompatibles al registrar/editar. Los formularios usan los importes y tallas congelados del grupo.
- El seed del catálogo deja de reinsertar variantes eliminadas en cada petición.
- Presupuestos a consultar exigen precio manual; ya no heredan accidentalmente una tarifa base de sudadera.
- No se permite recalcular el grupo con pagos abiertos.
- Retorno KO del navegador solo registra un evento informativo, mantiene el bloqueo del intento y permite una confirmación S2S posterior. Evita liberar un nuevo intento mientras el resultado bancario es incierto.
- Mejora puntual de legibilidad/táctil móvil, colores en cuadrícula sin desplazamiento horizontal y retirada de overlays sobre la prenda.
- Ticker decorativo sin rotación que causaba desbordamiento global.

## Conservado y límites

El selector de producto arriba, frontal/espalda, calculadora y resumen textual ya estaban implementados. Se conservan.
Una fila de payments con referencia única y active_scope_key representa cada intento; payment_events guarda eventos. No se añade una segunda tabla redundante PaymentAttempt.
Transferencia sigue pending hasta validación admin, con confirmación/rechazo/cancelación separados.
Se mantienen validaciones de firma Redsys, importe, EUR, comercio, terminal, referencia e idempotencia. OK nunca confirma pagos.
Los importes de pedido/exportación siguen procediendo de las filas congeladas del servidor.
Uploads privados PNG/JPG/PDF/AI: firma binaria, MIME, extensión, 15 MB, clave aleatoria R2 y descarga admin. SVG de cliente sigue rechazado. Los SVG de catálogo requieren revisión previa antes de añadirlos a /designs; este trabajo no habilita un upload público de SVG.
No se ha añadido un escáner antimalware de PDF/AI.
El presupuesto conserva el upload privado en su etapa final. El selector de logo delantero informa de que debe adjuntarse en el presupuesto; no hay persistencia automática de ese File al recargar.
Los cinco extras actuales usan adaptadores de sus opciones existentes. Un tipo de extra totalmente nuevo requiere conectar su selección/validación; no basta con inventar un ID. Segunda impresión y nombre incluido NO reciben nuevos cargos.

## Precios y discrepancias que requieren decisión

Implementación vigente: `2026-08-20-front-back-name-v1`, «Sudadera + impresión en pecho + espalda + nombre».
El nombre individual se registra por prenda. Las coordenadas delanteras DTF están incluidas; bordadas añaden 1 €.
Manga DTF +1 €, bandera bordada +2 €, logos bordados a consultar. No se han cambiado estos importes.
Tramos actuales: 5–10 30 €, 11–20 28 €, 21–30 26 €, 31–40 25 €, 41–50 24 €, 51–75 23 €, 76–100 22 €, 101+ consultar.
Pendiente confirmar:
1. Qué incluye exactamente la base; no se ha resuelto la discrepancia comercial.
2. Si 100 unidades mantienen 22 € (código actual) o pasan a consulta (criterio anterior).
3. Si un extra común del presupuesto sustituye al equivalente individual o ambos se acumulan. Se conserva la suma vigente, sin deducir descuentos ni suprimir cargos por cuenta propia.
4. Paleta final: los nueve colores del código difieren de la lista comercial inicial de siete.
5. Camiseta: las tallas/colores actuales son provisionales; no constituyen catálogo definitivo ni tarifa confirmada.

## Imágenes existentes y entrega necesaria ahora

Ya hay 18 WebP de 2000×2000: frontal y espalda para Granate, Azul cielo, Rosa, Azul petróleo, Azul marino, Gris, Verde oliva, Verde botella y Negro.
La correspondencia front/back original se conserva: algunos números de carpeta distintos pertenecen al mismo color. No renombrarlos por inferencia.
Las pruebas comprueban existencia/dimensiones/unicidad; no certifican por sí solas el color ni encuadre fotográfico. Falta aprobación visual final de los pares.

Proporcionar ahora:
- Confirmación de los cinco puntos comerciales anteriores.
- Confirmación de si estas 18 imágenes son definitivas. Si se mantienen Blanco y Rojo de la lista inicial, faltan sus dos vistas: cuatro imágenes.
- Los reemplazos que correspondan a la paleta final, 2000×2000, 1:1, sRGB, escala/encuadre/frontal/espalda alineados.
- PNG transparentes o SVG limpios de los diseños reales. Ideas existentes sin archivo definitivo: X con nombres, 27, 26, College, Nuestro pueblo, Ilustración grupo, Sello + frase, Collage local y Mascota. Confirmar cuáles se publican.
- Por diseño: nombre, vista, posición/tamaño, productos compatibles, campos editables, límites, activo/orden. Posición/tamaño se guardan como porcentajes del lienzo.
- Por camiseta: marca/modelo/referencia, tallas, colores, composición/gramaje/ficha, precio por tramo, técnica/área incluida, extras compatibles y fotos de ambas vistas por color. No se inventa ninguno.
- Fotografías y vídeos reales, con su destino (producto/proceso/grupos), y autorización para publicarlos. Reseñas solo si se aportan reales y autorizadas.
- Cuando se quiera completar contacto/facturación: WhatsApp específico, contacto público, datos fiscales y condiciones finales de envío. No se han inventado.

## Introducir cuando llegue Redsys sandbox

En el gestor de secretos de staging, nunca en Git ni mediante texto público:
- REDSYS_MERCHANT_CODE: FUC del banco.
- REDSYS_TERMINAL: terminal del banco.
- REDSYS_SIGNING_KEY: clave de firma del banco.
- REDSYS_ENVIRONMENT=test.
- REDSYS_BIZUM_ENABLED=true solo si el banco confirma su habilitación; mientras tanto false.
- APP_ENV=staging y APP_ORIGIN HTTPS fijo del staging persistente.

Obtener del banco algoritmo/versión de firma y endpoint de test, métodos habilitados/3DS, tarjetas/fechas/CVV de prueba, códigos de respuesta, requisitos de OK/KO/notificación, restricciones WAF/IP, pruebas obligatorias y contacto técnico.
El código existente usa HMAC_SHA512_V2 y EUR 978. Verificar su correspondencia con el terminal asignado.
Callback: POST /api/pagos/redsys/notificacion. Retornos derivados del servidor: /pago/resultado.
El banco no debe encontrarse una pantalla de login, redirección o challenge en el callback. La exposición S2S del staging privado sigue siendo una comprobación obligatoria, no se ha declarado resuelta.
No configurar BANK_TRANSFER_IBAN/ACCOUNT_HOLDER hasta recibir datos reales autorizados por un canal seguro.

## Infraestructura y verificación

Vercel Preview compila Next y no aporta las bindings D1/R2. No es un staging de pagos persistente.
El Site previo usa Cloudflare/D1/R2 y acceso privado. No se ha desplegado una nueva versión del Site ni cambiado su acceso en esta fase.
La migración nueva `0009_mighty_crystal.sql` añade designs_json sin cambiar datos históricos. Debe aplicarse antes del Worker nuevo en staging persistente.

Pruebas: 36 unitarias + 7 de integración/renderizado, incluidos el flujo de 25 prendas, varios participantes, edición aislada, cierre/snapshot, pagos concurrentes, firma manipulada, callback repetido, KO navegador seguido de S2S aprobado, transferencia manual, producción/exportación, catálogo administrado y rutas privadas.
Lint y TypeScript sin errores. Build Vinext con validación de Worker y build Next correctos.
Son pruebas con fixtures de banco preexistentes, sin transacciones reales ni credenciales sandbox del comercio.

QA visual: se abrió la página renderizada. Se detectó y corrigió el overflow del ticker. La hidratación de la Preview interna falla al cargar un módulo virtual Vite, incluso tras un reinicio; no se han debilitado CSP ni protecciones para sortearlo. La herramienta no ofrece redimensionamiento de ventana.
Por tanto NO están certificados los anchos 320, 360, 375, 390, 412, 430, 768, 1024 y desktop interactivo. No se afirma «móvil terminado» ni «listo para producción».
Quedan pruebas visuales interactivas y transacciones reales de sandbox, además de resolver las decisiones comerciales. El PR se mantiene como borrador, sin merge.
