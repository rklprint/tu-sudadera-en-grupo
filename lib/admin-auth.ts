import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";

function allowedAdminEmails(): string[] {
  return String(getSiteRuntimeEnv().ADMIN_EMAIL || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const allowlist = allowedAdminEmails();
  return allowlist.length > 0 && allowlist.includes(email.trim().toLowerCase());
}

export async function requireAdminPage(returnTo = "/admin"): Promise<ChatGPTUser | null> {
  const user = await requireChatGPTUser(returnTo);
  return isAdminEmail(user.email) ? user : null;
}

export async function getAdminApiUser(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  return user && isAdminEmail(user.email) ? user : null;
}
