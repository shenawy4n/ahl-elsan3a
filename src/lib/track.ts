import { supabase } from "@/integrations/supabase/client";

type EventType = "profile_view" | "phone_click" | "whatsapp_click" | "search" | "category_view";

let adminCheck: Promise<boolean> | null = null;
function isAdmin() {
  adminCheck ??= (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return false;
    const { data: r } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
    return Boolean(r);
  })();
  return adminCheck;
}
supabase.auth.onAuthStateChange(() => {
  adminCheck = null;
});

/** Lightweight, anonymous event logging. Admin activity is never counted. */
export function track(
  event_type: EventType,
  extra: { provider_id?: string; category_id?: string; query?: string } = {},
) {
  if (typeof window === "undefined") return;
  void isAdmin().then((admin) => {
    if (admin) return;
    void supabase
      .from("analytics_events")
      .insert({ event_type, ...extra, query: extra.query?.slice(0, 80) })
      .then(() => undefined);
  });
}
