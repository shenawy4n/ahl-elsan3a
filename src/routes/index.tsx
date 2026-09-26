import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, ShieldCheck, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, areasQuery, providersQuery } from "@/lib/directory";
import { ProviderCard } from "@/components/ProviderCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أهل الصنعة — صنايعية وخدمات قريتك" },
      {
        name: "description",
        content:
          "دليل بسيط لأرقام الصنايعية وأصحاب الخدمات في القرية: كهربائي، سباك، نجار وغيرهم. اتصل أو كلّمهم على واتساب مباشرة.",
      },
      { property: "og:title", content: "أهل الصنعة — صنايعية وخدمات قريتك" },
      {
        property: "og:description",
        content: "ابحث عن صنايعي قريب منك واتصل بيه على طول.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [areaId, setAreaId] = useState("");

  const categories = useQuery(categoriesQuery);
  const areas = useQuery(areasQuery);
  const featured = useQuery(providersQuery({ premiumOnly: true, areaId: areaId || undefined, limit: 6 }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: search || undefined, area: areaId || undefined } });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-4">
        <section className="pt-6">
          <h1 className="text-3xl font-extrabold text-foreground">محتاج صنايعي؟</h1>
          <p className="mt-1 text-muted-foreground">
            كل أرقام الصنايعية في مكان واحد. اتصل أو كلّمه واتساب على طول.
          </p>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="surface flex items-center gap-3 px-4 py-3.5">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={60}
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                placeholder="ابحث باسم الصنايعي أو الخدمة"
              />
            </div>
            <div className="surface flex items-center gap-3 px-4 py-2.5">
              <MapPin className="size-5 shrink-0 text-primary" />
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full bg-transparent py-1 text-base outline-none"
              >
                <option value="">كل القرى والمناطق</option>
                {(areas.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="min-h-14 w-full rounded-xl bg-accent text-lg font-extrabold text-accent-foreground active:brightness-95"
            >
              ابحث عن صنايعي
            </button>
          </form>
        </section>

        <section className="pt-8">
          <h2 className="mb-3 text-xl font-extrabold">الخدمات</h2>
          {categories.isLoading ? (
            <div className="grid grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="surface h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {(categories.data ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/category/$id"
                  params={{ id: c.id }}
                  className="surface flex flex-col items-center justify-center gap-2 px-2 py-4 text-center active:brightness-95"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CategoryIcon name={c.icon} className="size-6" />
                  </span>
                  <span className="text-sm font-bold leading-tight">{c.name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {(featured.data?.length ?? 0) > 0 ? (
          <section className="pt-8">
            <h2 className="mb-3 text-xl font-extrabold">صنايعية مميزين</h2>
            <div className="space-y-3">
              {featured.data!.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </section>
        ) : null}

        <SuggestService />

        <footer className="mt-10 flex items-center justify-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" />
          <Link to="/auth" className="font-bold">
            دخول المسؤول
          </Link>
        </footer>
      </main>
    </div>
  );
}

function SuggestService() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (v.length < 2) return;
    setBusy(true);
    const res = await submitPublicForm({ data: { form: "service_suggestion", name: v.slice(0, 60), website: hp } }).catch(() => ({ ok: false as const, code: "error" as const }));
    setBusy(false);
    if (!res.ok) { toast.error(publicFormError(res.code)); return; }
    toast.success("شكراً! وصلنا اقتراحك");
    setName("");
    setOpen(false);
  }
  return (
    <section className="surface mt-8 p-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 py-2 font-bold text-primary">
          <Lightbulb className="size-5" /> مش لاقي الخدمة؟ اقترح خدمة
        </button>
      ) : (
        <form onSubmit={send} className="grid gap-2">
          <p className="font-extrabold">اقترح خدمة مش موجودة</p>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="مثال: تصليح موبايلات" className="rounded-xl border border-border bg-card px-3 py-3 text-base" />
          <div className="grid grid-cols-2 gap-2">
            <button disabled={busy} className="rounded-xl bg-primary py-3 font-extrabold text-primary-foreground disabled:opacity-60">إرسال</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border py-3 font-bold">إلغاء</button>
          </div>
        </form>
      )}
    </section>
  );
}
