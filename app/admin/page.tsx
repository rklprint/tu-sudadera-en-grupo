import { desc } from "drizzle-orm";
import Link from "next/link";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants, payments, quoteRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { requireAdminPage } from "@/lib/admin-auth";
import { AdminDashboard } from "@/app/admin/admin-dashboard";
import { readCatalog } from "@/lib/catalog-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdminPage();
  if (!user) return <main className="admin-denied"><div><span>⌁</span><p>Acceso restringido</p><h1>Esta cuenta no tiene permiso.</h1><p>El panel solo admite el correo definido como administrador. La política es de denegación por defecto.</p><Link href="/">Volver a la web</Link></div></main>;

  await ensureQuoteSchema();
  const db = getDb();
  const [quotes, groups, paymentRows, items, catalog] = await Promise.all([
    db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt)).limit(100),
    db.select().from(groupOrders).orderBy(desc(groupOrders.createdAt)).limit(100),
    db.select().from(payments).orderBy(desc(payments.createdAt)).limit(100),
    db.select({
      id: orderItems.id,
      groupId: participants.groupId,
      contactName: participants.contactName,
      email: participants.email,
      paymentStatus: participants.paymentStatus,
      printName: orderItems.printName,
      size: orderItems.size,
      frontExtra: orderItems.frontExtra,
      frontDetail: orderItems.frontDetail,
      sleeveExtra: orderItems.sleeveExtra,
      sleeveDetail: orderItems.sleeveDetail,
      extrasCents: orderItems.extrasCents,
      unitPriceCents: orderItems.unitPriceCents,
    }).from(orderItems).innerJoin(participants, eq(orderItems.participantId, participants.id)).orderBy(desc(orderItems.createdAt)).limit(500),
    readCatalog(true),
  ]);

  return <AdminDashboard user={{ name: user.displayName, email: user.email }} signOutUrl={chatGPTSignOutPath("/")} initialQuotes={quotes} initialGroups={groups} initialPayments={paymentRows} initialItems={items} initialCatalog={catalog} />;
}
