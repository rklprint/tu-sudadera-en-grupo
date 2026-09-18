import type { Metadata } from "next";
import { LegalPage } from "@/app/_components/legal-page";

export const metadata: Metadata = { title: "Política de cookies | Tu Sudadera en Grupo", robots: { index: false, follow: false } };

export default function CookiesPage() {
  return <LegalPage eyebrow="Cookies" title="Política de cookies" notice="Se revisará contra la configuración final de dominio, proveedores y consentimiento antes del lanzamiento." sections={[
    { title: "Configuración inicial", paragraphs: ["La web se ha preparado para evitar cookies de marketing. PostHog se inicializa con persistencia en memoria, autocaptura desactivada, sin grabación de sesiones y sin perfiles identificados. No recibe nombres, correos, teléfonos, diseños ni enlaces privados."] },
    { title: "Tecnologías necesarias", paragraphs: ["El alojamiento, la protección antiabuso y la pasarela de pago pueden utilizar almacenamiento o cookies estrictamente necesarios para seguridad, continuidad de sesión o ejecución del servicio solicitado. Cloudflare Turnstile se carga únicamente cuando la protección del formulario está configurada."] },
    { title: "Preferencias", paragraphs: ["Si antes del lanzamiento se activa una tecnología no necesaria o cambia la finalidad de la analítica, se incorporará un mecanismo de consentimiento que permita aceptar, rechazar y modificar preferencias con la misma facilidad."] },
  ]} />;
}
