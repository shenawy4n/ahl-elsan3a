import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, ShieldCheck } from "lucide-react";
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
