import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { normalizeCode } from "@/lib/group-orders";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!await getAdminApiUser()) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const code = normalizeCode((await context.params).code);

  try {
    await ensureQuoteSchema();
    const db = getDb();
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.accessCode, code)).limit(1);
    if (!group) return Response.json({ error: "No existe ese grupo." }, { status: 404 });
    const rows = await db.select({
      contactName: participants.contactName,
      email: participants.email,
      paymentStatus: participants.paymentStatus,
      paymentMethod: participants.paymentMethod,
      productName: orderItems.productName,
      model: orderItems.model,
      color: orderItems.color,
      quantity: orderItems.quantity,
      printName: orderItems.printName,
      size: orderItems.size,
      namePlacement: orderItems.namePlacement,
      frontExtra: orderItems.frontExtra,
      frontDetail: orderItems.frontDetail,
      sleeveExtra: orderItems.sleeveExtra,
      sleeveDetail: orderItems.sleeveDetail,
      extrasCents: orderItems.extrasCents,
      unitPriceCents: orderItems.unitPriceCents,
    }).from(orderItems).innerJoin(participants, eq(orderItems.participantId, participants.id)).where(eq(participants.groupId, group.id));

    const headers = ["Grupo", "Participante", "Correo", "Producto", "Modelo", "Color", "Talla", "Cantidad", "Nombre personalizado", "Nombre en", "Extra pecho", "Detalle pecho", "Extra manga", "Detalle manga", "Precio base", "Extras", "Total prenda", "Método de pago", "Estado de pago"];
    const dataRows = rows.map(row => [
      group.groupName,
      row.contactName,
      row.email,
      row.productName,
      row.model || group.garment,
      row.color || group.color,
      row.size,
      row.quantity,
      row.printName,
      row.namePlacement,
      row.frontExtra,
      row.frontDetail,
      row.sleeveExtra,
      row.sleeveDetail,
      row.unitPriceCents / 100,
      row.extrasCents / 100,
      (row.unitPriceCents + row.extrasCents) / 100,
      row.paymentMethod,
      row.paymentStatus,
    ]);
    const totalUnits = rows.reduce((total, row) => total + row.quantity, 0);
    const totalCents = rows.reduce((total, row) => total + ((row.unitPriceCents + row.extrasCents) * row.quantity), 0);
    const totals = ["TOTALES", "", "", "", "", "", "", totalUnits, "", "", "", "", "", "", "", "", totalCents / 100, "", ""];
    const workbook = spreadsheetXml("Pedido", [headers, ...dataRows, totals], new Set([7, 14, 15, 16]));
    return new Response(workbook, { headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename="${code}-pedido.xls"`, "Cache-Control": "no-store, private" } });
  } catch {
    return Response.json({ error: "No hemos podido exportar el pedido." }, { status: 500 });
  }
}

function spreadsheetXml(sheetName: string, rows: unknown[][], numericColumns: Set<number>): string {
  const body = rows.map((row, rowIndex) => `<Row>${row.map((value, columnIndex) => {
    const numeric = rowIndex > 0 && numericColumns.has(columnIndex) && typeof value === "number";
    const style = rowIndex === 0 || rowIndex === rows.length - 1 ? ' ss:StyleID="header"' : "";
    return `<Cell${style}><Data ss:Type="${numeric ? "Number" : "String"}">${xmlCell(value)}</Data></Cell>`;
  }).join("")}</Row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Default"><Alignment ss:Vertical="Bottom"/></Style><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#DDEBF7" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="${xmlCell(sheetName)}"><Table>${body}</Table></Worksheet></Workbook>`;
}

function xmlCell(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] || character));
}
