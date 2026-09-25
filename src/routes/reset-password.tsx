import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور — أهل الصنعة" },
      { name: "description", content: "تعيين كلمة مرور جديدة لحساب المسؤول." },
      { property: "og:title", content: "إعادة تعيين كلمة المرور — أهل الصنعة" },
      { property: "og:description", content: "تعيين كلمة مرور جديدة لحساب المسؤول." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("كلمة المرور لازم تكون 8 حروف على الأقل"); return; }
    if (pw !== conf) { toast.error("كلمتين المرور مش متطابقين"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setBusy(false); toast.error("الرابط منتهي أو كلمة المرور ضعيفة، اطلب رابط جديد"); return; }
    await supabase.auth.signOut();
    setBusy(false);
    toast.success("تم تعيين كلمة المرور. سجّل دخولك بيها دلوقتي");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 pt-8">
        <form onSubmit={submit} className="surface grid gap-3 p-6">
          <h1 className="text-2xl font-extrabold">كلمة مرور جديدة</h1>
          {!ready ? (
            <p className="text-muted-foreground">جاري التحقق من الرابط... لو فضلت الرسالة دي، اطلب رابط جديد من صفحة الدخول.</p>
          ) : (
            <>
              <input type="password" autoComplete="new-password" required minLength={8} dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="كلمة المرور الجديدة" className="rounded-xl border border-border bg-card px-4 py-3 text-base" />
              <input type="password" autoComplete="new-password" required minLength={8} dir="ltr" value={conf} onChange={(e) => setConf(e.target.value)} placeholder="تأكيد كلمة المرور" className="rounded-xl border border-border bg-card px-4 py-3 text-base" />
              <button disabled={busy} className="rounded-xl bg-primary py-3.5 text-lg font-extrabold text-primary-foreground disabled:opacity-60">{busy ? "جاري الحفظ..." : "حفظ"}</button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
