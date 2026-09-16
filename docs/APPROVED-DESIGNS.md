# Diseños aportados por el titular · 16/09/2026

Se incorporan seis PNG aprobados: X con nombres, Número 27, Número 10, Los colegas del pueblo, Torredonjimeno en fiestas y Tarragona en festa.

- Originales conservados sin cambios en la carpeta del titular. `approved-designs-provenance.json` documenta nombre original, SHA-256, dimensiones, límites transparentes y pesos web.
- La web usa WebP: X/10/27 sin pérdida a su tamaño original recortado; las tres ilustraciones a un máximo de 1600 px, calidad 92 y alfa 100. Miniaturas de 400 px. Solo se eliminó margen completamente transparente; no se redibujó, recoloreó ni alteró la composición. Las versiones web no sustituyen los originales de producción.
- Selector, ampliación, montaje de espalda y galería usan estos archivos reales. Las seis referencias corresponden a Gildan 18500; no se asignan a otros modelos automáticamente.
- Los seis diseños cambian de color en directo mediante su canal alfa: amarillo fosforito, rosa fosforito, negro, blanco y azul claro. Se conservan también blanco roto y rojo de la paleta anterior. El color se aplica al montaje, al selector y a la ampliación, sin modificar los archivos originales. Las miniaturas negras usan fondo claro.
- X, 10 y 27 incorporan un nombre superior editable de hasta 18 caracteres, independiente de los nombres integrados en el dibujo. Estos últimos siguen siendo una referencia que se adapta en maqueta. Nombre y color se conservan al pasar al presupuesto y volver a editar; el nombre aparece también en el resumen del presupuesto.
- La caja máxima del estampado pasa de 34 × 45 % a 28 × 34 % del lienzo y se centra bajo la capucha. El nombre se sitúa encima de X/10/27. Se ha comparado visualmente con el montaje de [Sudaderas para Colegios](https://sudaderasparacolegios.com/); son proporciones de previsualización, no medidas físicas de producción.
- Un catálogo administrado existente tiene prioridad, incluso si sus diseños están inactivos. El catálogo predeterminado solo se utiliza para Gildan 18500 cuando no hay entradas administradas. Para retirar un diseño predeterminado, guardar el catálogo completo con esa entrada `active: false`; vaciar la lista recupera las seis referencias predeterminadas. No hay migraciones ni escrituras sobre bases remotas.
- Tarifas, aprobación de presupuesto y pagos conservan su comportamiento.

## Validación

- 47 tests unitarios + 9 integración/HTML: 56 correctos. Lint, TypeScript y build Vinext correctos.
- Navegador sobre build compilado con D1/R2 simulados: seis selecciones de diseño, transparencia sobre Gildan, cambio de color, ampliación con archivo grande y traslado de Tarragona al presupuesto conservando color y precio.
- Revisión móvil de 390 px y escritorio de 1366 px. Comprobación de anchura a 320/360/375/390/412/430/768/1024/1366 px sin desbordamiento horizontal ni imágenes rotas detectadas.
- 12 archivos web (seis montajes y seis miniaturas), 3,23 MB en conjunto frente a 20,35 MB de originales. Se cargan según la selección y visibilidad, sin incorporar dependencias nuevas.
- CI y Preview del commit final se registran en la PR #1. No se generan pedidos, correos ni cobros reales durante esta revisión.

### Revisión de color, tamaño y nombre

- Navegador: 30 combinaciones (seis archivos × cinco colores), con máscara del archivo correspondiente y color CSS correcto; sin sustitución de diseños.
- Montaje del 10 amarillo, 27 blanco con nombre largo y Tarragona rosa revisados visualmente. Conservación del nombre al cambiar de plantilla y de lado.
- Revisión a 390 px y escritorio; nombre de 15 caracteres dentro del ancho, transparencia y márgenes conservados. Originales y precios intactos.
- La configuración conserva `designFields.name` y `printColor` al ir al presupuesto y volver a editar. La vista de archivos administrados con campos no representables sigue pendiente de maqueta.
