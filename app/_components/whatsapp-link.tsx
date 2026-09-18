"use client";

import { trackProductEvent } from "@/lib/analytics";
import { whatsappUrl, type WhatsAppConfiguration } from "@/lib/contact";
import styles from "./whatsapp-link.module.css";

export function WhatsAppLink({ source, configuration }: { source: string; configuration?: WhatsAppConfiguration }) {
  return <a className={styles.link} href={whatsappUrl(configuration)} target="_blank" rel="noopener noreferrer" onClick={() => void trackProductEvent("contact_whatsapp_clicked", { source })}>Consultar por WhatsApp <span aria-hidden="true">↗</span></a>;
}
