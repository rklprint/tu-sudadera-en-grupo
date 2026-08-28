# Matriz Redsys de staging

Todas las pruebas se ejecutan contra el Worker de staging, D1/R2 de staging y
`REDSYS_ENVIRONMENT=test`. No se usan credenciales reales ni la base de
producción.

| Caso | Preparación | Resultado esperado |
| --- | --- | --- |
| Aprobado | `pending/processing` + callback firmado con respuesta `0000` | `confirmed`, una factura placeholder, un recibo y totales incrementados una vez |
| Rechazado | callback firmado con respuesta no aprobada | `failed`, sin incremento de cobrado, reintento permitido |
| Cancelado | retorno KO/token o cancelación del TPV | `cancelled` mientras no exista confirmación; nunca `confirmed` por la página |
| Callback duplicado | repetir exactamente la misma notificación | una transición, un evento, un invoice, un recibo |
| Firma incorrecta | alterar `Ds_Signature` | HTTP 400, sin cambios |
| Importe alterado | firmar/mandar importe distinto al esperado | HTTP 409, sin cambios |
| Pedido alterado | usar `Ds_Order` inexistente o de otro pago | HTTP 404/409, sin cambios |
| OK manual | abrir `/pago/resultado?...estado=pendiente` sin callback | el pago permanece `processing/pending` |
| Callback antes del retorno | entregar callback y no abrir la página | el pago queda confirmado igualmente |
| Sin retorno del cliente | Redsys confirma y el usuario cierra el navegador | el panel y la exportación reflejan el pago |
| Concurrencia | dos participantes y/o organizador en paralelo | no hay sobrecobro ni pagos activos incompatibles |

Cada caso debe comprobar estado del pago, participante, grupo, importe cobrado,
panel y exportación. Los callbacks inválidos no envían recibos ni ejecutan
acciones postpago.

## Checklist operativa del banco

- FUC/Merchant Code.
- Terminal.
- Clave de firma.
- Algoritmo/configuración de firma.
- Endpoint HTTPS de notificación.
- Necesidad de registrar OK/KO.
- Tarjetas, fechas y CVV de prueba.
- Códigos de aprobado, rechazo y cancelación.
- Bizum habilitado o no.
- Métodos de pago, 3DS y restricciones.
- Rangos IP oficiales, si existen.
- Reglas WAF/whitelist necesarias.
- Endpoint de test.
- Procedimiento de paso a producción.
- Diferencias entre credenciales test y producción.
- Pruebas exigidas y contacto técnico.
