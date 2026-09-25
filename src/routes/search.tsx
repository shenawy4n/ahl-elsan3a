import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { areasQuery, providersQuery } from "@/lib/directory";
import { ProviderCard } from "@/components/ProviderCard";
import { SiteHeader } from "@/components/SiteHeader";

type SearchParams = { q?: string | undefined; area?: string | undefined };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    ...(typeof s['q'] === "string" && s['q'] ? { q: s['q'] } : {}),
    ...(typeof s['area'] === "string" && s['area'] ? { area: s['area'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "نتائج البحث — أهل الصنعة" },
      { name: "description", content: "ابحث عن صنايعي أو خدمة في قريتك واتصل به مباشرة." },
      { property: "og:title", content: "نتائج البحث — أهل الصنعة" },
      { property: "og:description", content: "ابحث عن صنايعي أو خدمة في قريتك." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const params = Route.useSearch();
  const [q, setQ] = useState(params.q ?? "");
  const [area, setArea] = useState(params.area ?? "");

  const areas = useQuery(areasQuery);
  const results = useQuery(providersQuery({ search: q || undefined, areaId: area || undefined }));

  return (
    <div className="min-h-screen bg-background pb-12">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pt-5">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
          <ArrowRight className="size-4" /> الرئيسية
        </Link>

        <div className="surface mb-3 flex items-center gap-3 px-4 py-3.5">
          <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={60}
            className="w-full bg-transparent text-base outline-none"
            placeholder="ابحث باسم الصنايعي أو الخدمة"
          />
        </div>
        <div className="surface mb-5 px-4 py-2.5">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
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

        {results.isLoading ? (
          <p className="text-muted-foreground">جاري التحميل…</p>
        ) : (results.data?.length ?? 0) === 0 ? (
          <p className="surface p-6 text-center text-muted-foreground">
            مفيش نتائج. جرّب كلمة تانية أو غيّر المنطقة.
          </p>
        ) : (
          <div className="space-y-3">
            {results.data!.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
