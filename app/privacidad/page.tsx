import type { Metadata } from "next";
import { LegalPage } from "@/app/_components/legal-page";

export const metadata: Metadata = { title: "Política de privacidad | Tu Sudadera en Grupo", robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <LegalPage eyebrow="Privacidad" title="Política de privacidad" notice="Antes de publicar la web deben incorporarse la identidad, NIF y domicilio del responsable legal. Esta página permanece fuera del índice hasta entonces." sections={[
    { title: "Responsable y contacto", paragraphs: ["La marca comercial es Tu Sudadera en Grupo. La identidad fiscal del responsable del tratamiento está pendiente de incorporación. Para cuestiones de privacidad puede escribirse a pedidos@tusudaderaengrupo.es."] },
    { title: "Datos y finalidades", paragraphs: ["Tratamos los datos facilitados para responder solicitudes, preparar diseños y presupuestos, organizar pedidos privados, gestionar participantes, cobrar, emitir justificantes y preparar el envío conjunto."], items: ["Organizadores: nombre, correo, teléfono, grupo, localidad y datos del pedido.", "Participantes: nombre de contacto, correo, talla, nombre a imprimir, prendas y extras.", "Operaciones: referencia, método, importe y estado. Nunca almacenamos datos completos de tarjeta.", "Archivos: diseños o referencias enviados voluntariamente para preparar el trabajo."] },
    { title: "Base jurídica y conservación", paragraphs: ["La solicitud se trata para aplicar medidas precontractuales y el pedido para ejecutar el contrato. Las obligaciones contables, fiscales y de prevención del fraude se atienden conforme a la normativa aplicable. Los datos se conservan durante la gestión y los plazos legales exigibles; los enlaces y archivos se revocan o eliminan cuando dejan de ser necesarios."] },
    { title: "Proveedores y transferencias", paragraphs: ["Pueden intervenir proveedores de alojamiento, correo transaccional, almacenamiento, seguridad, analítica y pagos bajo las garantías contractuales correspondientes. La configuración analítica excluye nombres, correos, teléfonos, archivos, diseños, credenciales y datos bancarios."] },
    { title: "Derechos", paragraphs: ["Puede solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo al correo indicado. También puede reclamar ante la Agencia Española de Protección de Datos. No se realizan decisiones automatizadas con efectos jurídicos ni perfiles de marketing."] },
  ]} />;
}
