export const CONTACT_EMAIL = "info@tusudaderaengrupo.es";
export const CONTACT_PHONE = "+34 641 228 861";
export const CONTACT_PHONE_HREF = "tel:+34641228861";

export type WhatsAppConfiguration = {
  product: string;
  model: string;
  color: string;
  quantity: number;
  design: string;
  printColor: string;
  front: string;
  sleeve: string;
};

/** Explicit fields only: never include form contact data or private order links. */
export function whatsappUrl(configuration?: WhatsAppConfiguration) {
  const clean = (value: string) => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 180);
  const message = [
    "Hola, me gustaría consultar un pedido de Tu Sudadera en Grupo.",
    ...(configuration ? [
      `Prenda: ${clean(configuration.product)} · ${clean(configuration.model)}`,
      `Color: ${clean(configuration.color)}`,
      `Cantidad: ${Number.isInteger(configuration.quantity) && configuration.quantity > 0 ? Math.min(500, configuration.quantity) : "Por confirmar"}`,
      `Espalda: ${clean(configuration.design)}`,
      `Color del diseño: ${clean(configuration.printColor)}`,
      `Delante: ${clean(configuration.front)}`,
      `Manga: ${clean(configuration.sleeve)}`,
    ] : []),
  ].join("\n");
  return `https://wa.me/34641228861?text=${encodeURIComponent(message)}`;
}
