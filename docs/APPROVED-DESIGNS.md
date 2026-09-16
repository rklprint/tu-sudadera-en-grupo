# Diseños aportados por el titular · 16/09/2026

Se incorporan seis PNG aprobados: X con nombres, Número 27, Número 10, Los colegas del pueblo, Torredonjimeno en fiestas y Tarragona en festa.

- Originales conservados sin cambios en la carpeta del titular. `approved-designs-provenance.json` documenta nombre original, SHA-256, dimensiones, límites transparentes y pesos web.
- La web usa WebP: X/10/27 sin pérdida a su tamaño original recortado; las tres ilustraciones a un máximo de 1600 px, calidad 92 y alfa 100. Miniaturas de 400 px. Solo se eliminó margen completamente transparente; no se redibujó, recoloreó ni alteró la composición. Las versiones web no sustituyen los originales de producción.
- Selector, ampliación, montaje de espalda y galería usan estos archivos reales. Las seis referencias corresponden a Gildan 18500; no se asignan a otros modelos automáticamente.
- Los PNG tienen textos y nombres integrados. La imagen conserva esos textos y colores; las preferencias del cliente se guardan para la maqueta. No se simula edición tipográfica sobre un raster ni se presentan los ejemplos como pedidos entregados.
- Un catálogo administrado existente tiene prioridad, incluso si sus diseños están inactivos. El catálogo predeterminado solo se utiliza para Gildan 18500 cuando no hay entradas administradas. Para retirar un diseño predeterminado, guardar el catálogo completo con esa entrada `active: false`; vaciar la lista recupera las seis referencias predeterminadas. No hay migraciones ni escrituras sobre bases remotas.
- Tarifas, aprobación de presupuesto y pagos conservan su comportamiento.

## Validación

- 46 tests unitarios + 9 integración/HTML: 55 correctos. Lint, TypeScript y build Vinext correctos.
- Navegador sobre build compilado con D1/R2 simulados: seis selecciones de diseño, transparencia sobre Gildan, cambio de color, ampliación con archivo grande y traslado de Tarragona al presupuesto conservando color y precio.
- Revisión móvil de 390 px y escritorio de 1366 px. Comprobación de anchura a 320/360/375/390/412/430/768/1024/1366 px sin desbordamiento horizontal ni imágenes rotas detectadas.
- 12 archivos web (seis montajes y seis miniaturas), 3,23 MB en conjunto frente a 20,35 MB de originales. Se cargan según la selección y visibilidad, sin incorporar dependencias nuevas.
- CI y Preview del commit final se registran en la PR #1. No se generan pedidos, correos ni cobros reales durante esta revisión.
