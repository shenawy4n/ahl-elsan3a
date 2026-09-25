import { supabase } from "@/integrations/supabase/client";
import { telHref, whatsappHref } from "@/lib/directory";

export type ContactKind = "phone_click" | "whatsapp_click" | "phone_reveal";
type Numbers = { phone: string | null; secondary_phone: string | null; whatsapp: string | null };

const last = new Map<string, number>();

/** Logs the event on the server (before navigating) and returns the needed number. */
async function contact(providerId: string, kind: ContactKind): Promise<Numbers | null> {
  const key = `${providerId}:${kind}`;
  const now = Date.now();
  if (now - (last.get(key) ?? 0) < 2000) return null; // ignore rapid double taps
  last.set(key, now);
  const { data, error } = await supabase.rpc("contact_provider" as never, { _provider_id: providerId, _kind: kind } as never);
  if (error) { last.delete(key); throw error; }
  const rows = data as unknown as Numbers[] | null;
  return rows?.[0] ?? null;
}

export async function callProvider(providerId: string) {
  const r = await contact(providerId, "phone_click");
  if (r?.phone) window.location.href = telHref(r.phone);
}

export async function whatsappProvider(providerId: string) {
  const r = await contact(providerId, "whatsapp_click");
  if (r?.whatsapp) window.location.href = whatsappHref(r.whatsapp);
}

export async function revealProvider(providerId: string) {
  return contact(providerId, "phone_reveal");
}
