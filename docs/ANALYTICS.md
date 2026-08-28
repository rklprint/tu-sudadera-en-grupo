# Analítica de producto

## Privacidad

PostHog se inicializa sin cookies persistentes, autocapture, replay ni perfiles. Se respeta Do Not Track. No se envían nombres, correos, teléfonos, códigos privados, tokens, diseños, archivos, datos bancarios o texto libre.

Solo se aceptan propiedades de bajo riesgo: tipo de producto, modelo, color, cantidad, método, origen, tipo de grupo, ruta, entorno y buckets de importe.

## Eventos

| Embudo | Eventos |
| --- | --- |
| Descubrimiento | `homepage_viewed`, `contact_whatsapp_clicked`, `contact_email_clicked` |
| Personalizador | `personalizador_started`, `producto_selected`, `color_selected`, `talla_selected`, `personalizacion_added`, `archivo_uploaded`, `personalizador_completed` |
| Presupuesto | `presupuesto_started`, `presupuesto_submitted` |
| Grupo | `grupo_created`, `grupo_private_page_viewed`, `participant_started`, `participant_registered`, `participant_edited` |
| Pago | `checkout_started`, `payment_method_selected`, `payment_started`, `payment_completed`, `payment_failed`, `bank_transfer_selected` |
| Operación | `order_completed` |

Los eventos de negocio críticos también se registran desde servidor para no depender del navegador. Los de interfaz permanecen en cliente.

## KPIs recomendados

- Inicio → personalizador.
- Personalizador → presupuesto enviado.
- Presupuesto aceptado → grupo creado.
- Participante iniciado → registrado → pagado.
- Conversión y fallo por método de pago.
- Tiempo de cierre de grupo y porcentaje pendiente.
- Tiempo desde pago completo a envío.

Antes de lanzar, crear dashboards separados para adquisición, personalizador, operación de grupos y pagos. Los importes se agrupan por bucket; no enviar valor exacto si no es necesario.
