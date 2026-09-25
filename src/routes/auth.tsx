import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "دخول المسؤول — دليل البلد" },
      { name: "description", content: "تسجيل دخول مسؤول دليل البلد." },
      { property: "og:title", content: "دخول المسؤول — دليل البلد" },
      { property: "og:description", content: "تسجيل دخول مسؤول دليل البلد." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("البريد أو كلمة السر غلط"); return; }
      navigate({ to: "/admin" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (data.session) navigate({ to: "/admin" });
      else toast.success("افتح بريدك وأكّد الحساب، وبعدين سجّل دخول");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 pt-8">
        <form onSubmit={submit} className="surface grid gap-3 p-6">
          <h1 className="text-2xl font-extrabold">{mode === "in" ? "دخول المسؤول" : "إنشاء حساب مسؤول"}</h1>
          <input type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="rounded-xl border border-border bg-card px-4 py-3 text-base" />
          <input type="password" required minLength={8} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة السر" className="rounded-xl border border-border bg-card px-4 py-3 text-base" />
          <button disabled={busy} className="rounded-xl bg-primary py-3.5 text-lg font-extrabold text-primary-foreground disabled:opacity-60">
            {mode === "in" ? "دخول" : "إنشاء الحساب"}
          </button>
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="py-2 text-sm font-bold text-primary">
            {mode === "in" ? "أول مرة؟ أنشئ حساب" : "عندك حساب؟ سجّل دخول"}
          </button>
          <p className="text-xs text-muted-foreground">أول حساب يدخل بيبقى هو المسؤول. أي حساب بعده مش هيقدر يدخل لوحة التحكم.</p>
        </form>
      </main>
    </div>
  );
}
