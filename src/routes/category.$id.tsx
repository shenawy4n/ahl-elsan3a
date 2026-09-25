import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { areasQuery, categoriesQuery, providersQuery } from "@/lib/directory";
import { ProviderCard } from "@/components/ProviderCard";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/category/$id")({
  head: () => ({
    meta: [
      { title: "خدمة — أهل الصنعة" },
      { name: "description", content: "قائمة الصنايعية المتاحين في هذه الخدمة داخل قريتك." },
      { property: "og:title", content: "خدمة — أهل الصنعة" },
      { property: "og:description", content: "قائمة الصنايعية المتاحين في هذه الخدمة." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { id } = Route.useParams();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");

  const categories = useQuery(categoriesQuery);
  const areas = useQuery(areasQuery);
  const results = useQuery(
    providersQuery({ categoryId: id, search: q || undefined, areaId: area || undefined }),
  );
  const category = (categories.data ?? []).find((c) => c.id === id);

  return (
    <div className="min-h-screen bg-background pb-12">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pt-5">
        <Link to="/" className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
          <ArrowRight className="size-4" /> الرئيسية
        </Link>

        <h1 className="text-2xl font-extrabold">{category?.name ?? "الخدمة"}</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {results.data ? `${results.data.length} صنايعي متاح` : "جاري التحميل…"}
        </p>

        <div className="surface mb-3 flex items-center gap-3 px-4 py-3.5">
          <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={60}
            className="w-full bg-transparent text-base outline-none"
            placeholder="ابحث داخل الخدمة"
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

        {(results.data?.length ?? 0) === 0 && !results.isLoading ? (
          <p className="surface p-6 text-center text-muted-foreground">
            مفيش صنايعية مسجلين في الخدمة دي لحد دلوقتي.
          </p>
        ) : (
          <div className="space-y-3">
            {(results.data ?? []).map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
