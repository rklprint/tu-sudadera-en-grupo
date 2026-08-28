import type { Metadata } from "next";
import { LegalPage } from "@/app/_components/legal-page";

export const metadata: Metadata = { title: "Condiciones de contratación | Tu Sudadera en Grupo", robots: { index: false, follow: false } };

export default function TermsPage() {
  return <LegalPage eyebrow="Contratación" title="Condiciones del servicio" notice="Faltan la identidad fiscal, dirección, datos registrales y el procedimiento definitivo de reclamaciones. No debe activarse el cobro real hasta completarlos y validarlos legalmente." sections={[
    { title: "Presupuesto y aprobación", paragraphs: ["El personalizador es orientativo. El contrato se basa en el presupuesto aceptado y en la maqueta, cantidades, tallas, acabados, precio y fecha aprobados. El grupo registra primero sus prendas; después se cierra la cantidad y se abre el pago."] },
    { title: "Precios y pagos", paragraphs: ["Los precios publicados indican IVA incluido. Los pagos por tarjeta o Bizum se procesan mediante Redsys y solo se consideran confirmados tras validar su notificación firmada. Las transferencias quedan pendientes hasta validación manual. Pueden combinarse pagos individuales y un pago final del organizador."] },
    { title: "Producción y cambios", paragraphs: ["La producción comienza cuando el pedido está completamente pagado. Después del pago, los cambios no son automáticos y deben revisarse según el estado del trabajo. El plazo habitual es de 10 a 15 días laborables desde la aprobación completa, salvo fecha distinta acordada por escrito."] },
    { title: "Envío", paragraphs: ["El envío gratuito a Península corresponde a una única entrega del pedido completo en la dirección del organizador. Canarias, Baleares, destinos internacionales y entregas múltiples se cotizan aparte. El seguimiento se facilita al organizador."] },
    { title: "Productos personalizados", paragraphs: ["La normativa de consumo contempla una excepción al derecho de desistimiento para bienes confeccionados según las especificaciones del consumidor o claramente personalizados. Esto no limita los derechos legales cuando exista falta de conformidad, defecto o error imputable al vendedor."] },
  ]} />;
}
