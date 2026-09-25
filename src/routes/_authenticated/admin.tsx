import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Plus, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isPremiumActive, type Area, type Category, type ProviderWithRefs } from "@/lib/directory";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — أهل الصنعة" },
      { name: "description", content: "إدارة الصنايعية والأقسام والقرى." },
      { property: "og:title", content: "لوحة التحكم — أهل الصنعة" },
      { property: "og:description", content: "إدارة أهل الصنعة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const input = "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base";

function AdminPage() {
  const navigate = useNavigate();
  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin" as never);
      if (error) throw error;
      return Boolean(data);
    },
  });
  const [tab, setTab] = useState<"stats" | "providers" | "categories" | "areas" | "reports">("stats");

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (role.isLoading) return <p className="p-8 text-center">جاري التحقق...</p>;
  if (!role.data)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-bold">الحساب ده مش مسموح له بدخول لوحة التحكم.</p>
        <button onClick={logout} className="mt-4 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">تسجيل خروج</button>
      </div>
    );

  const tabs = [
    ["stats", "الإحصائيات"],
    ["providers", "الصنايعية"],
    ["categories", "الأقسام"],
    ["areas", "القرى"],
    ["reports", "البلاغات"],
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-extrabold">لوحة التحكم</Link>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground"><LogOut className="size-4" /> خروج</button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{l}</button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-5">
        {tab === "stats" && <Stats />}
        {tab === "providers" && <Providers />}
        {tab === "categories" && <SimpleList table="categories" title="قسم" />}
        {tab === "areas" && <SimpleList table="areas" title="قرية / منطقة" />}
        {tab === "reports" && <Reports />}
      </main>
    </div>
  );
}

function useAll() {
  const providers = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("*, categories(id,name), areas(id,name)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProviderWithRefs[];
    },
  });
  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
  const areas = useQuery({
    queryKey: ["admin", "areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("areas").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Area[];
    },
  });
  return { providers, categories, areas };
}

function Stats() {
  const { providers, categories, areas } = useAll();
  const reports = useQuery({
    queryKey: ["admin", "reports-count"],
    queryFn: async () => {
      const { count } = await supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "new");
      return count ?? 0;
    },
  });
  const p = providers.data ?? [];
  const items = [
    ["إجمالي الصنايعية", p.length],
    ["ظاهرين", p.filter((x) => x.status === "active").length],
    ["مخفيين", p.filter((x) => x.status !== "active").length],
    ["مميزين", p.filter(isPremiumActive).length],
    ["الأقسام", categories.data?.length ?? 0],
    ["القرى", areas.data?.length ?? 0],
    ["بلاغات جديدة", reports.data ?? 0],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([l, v]) => (
        <div key={l} className="surface p-4">
          <p className="text-sm text-muted-foreground">{l}</p>
          <p className="text-3xl font-extrabold">{v}</p>
        </div>
      ))}
    </div>
  );
}

type Form = {
  id?: string;
  name: string; category_id: string; area_id: string; phone: string; secondary_phone: string; whatsapp: string;
  description: string; services: string; price_description: string; working_hours: string; photo_url: string;
  status: string; is_premium: boolean; premium_expires_at: string;
};
const empty: Form = { name: "", category_id: "", area_id: "", phone: "", secondary_phone: "", whatsapp: "", description: "", services: "", price_description: "", working_hours: "", photo_url: "", status: "active", is_premium: false, premium_expires_at: "" };

function Providers() {
  const qc = useQueryClient();
  const { providers, categories, areas } = useAll();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<Form | null>(null);

  const refresh = () => qc.invalidateQueries();
  const list = (providers.data ?? []).filter((p) =>
    (!q || p.name.includes(q) || p.phone.includes(q)) &&
    (!cat || p.category_id === cat) &&
    (!area || p.area_id === area) &&
    (!status || (status === "premium" ? isPremiumActive(p) : p.status === status)),
  );

  async function toggle(p: ProviderWithRefs) {
    const { error } = await supabase.from("providers").update({ status: p.status === "active" ? "hidden" : "active" }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function remove(p: ProviderWithRefs) {
    if (!confirm(`حذف ${p.name} نهائياً؟`)) return;
    const { error } = await supabase.from("providers").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("اتحذف");
    refresh();
  }

  if (form) return <ProviderForm form={form} categories={categories.data ?? []} areas={areas.data ?? []} onDone={() => { setForm(null); refresh(); }} />;

  return (
    <div className="grid gap-3">
      <button onClick={() => setForm({ ...empty })} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-extrabold text-primary-foreground"><Plus className="size-5" /> إضافة صنايعي</button>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الرقم" className={input} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={input}><option value="">كل الأقسام</option>{(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={area} onChange={(e) => setArea(e.target.value)} className={input}><option value="">كل القرى</option>{(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}><option value="">كل الحالات</option><option value="active">ظاهر</option><option value="hidden">مخفي</option><option value="premium">مميز</option></select>
      </div>
      {list.length === 0 ? <p className="p-6 text-center text-muted-foreground">مفيش نتائج</p> : null}
      {list.map((p) => (
        <div key={p.id} className="surface flex items-center justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="font-extrabold">{p.name} {isPremiumActive(p) ? <Star className="inline size-4 fill-premium text-premium" /> : null} {p.status !== "active" ? <span className="text-xs text-destructive">(مخفي)</span> : null}</p>
            <p className="truncate text-sm text-muted-foreground">{p.categories?.name} · {p.areas?.name} · <span dir="ltr">{p.phone}</span></p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button aria-label="تعديل" onClick={() => setForm({ id: p.id, name: p.name, category_id: p.category_id, area_id: p.area_id, phone: p.phone, secondary_phone: p.secondary_phone ?? "", whatsapp: p.whatsapp ?? "", description: p.description ?? "", services: p.services ?? "", price_description: p.price_description ?? "", working_hours: p.working_hours ?? "", photo_url: p.photo_url ?? "", status: p.status, is_premium: p.is_premium, premium_expires_at: p.premium_expires_at ? p.premium_expires_at.slice(0, 10) : "" })} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="size-5" /></button>
            <button aria-label="إخفاء/إظهار" onClick={() => toggle(p)} className="rounded-lg p-2 hover:bg-secondary">{p.status === "active" ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
            <button aria-label="حذف" onClick={() => remove(p)} className="rounded-lg p-2 text-destructive hover:bg-secondary"><Trash2 className="size-5" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProviderForm({ form, categories, areas, onDone }: { form: Form; categories: Category[]; areas: Area[]; onDone: () => void }) {
  const [f, setF] = useState(form);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const n = (v: string) => (v.trim() ? v.trim() : null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.category_id || !f.area_id || !f.phone.trim()) { toast.error("الاسم والقسم والقرية والتليفون مطلوبين"); return; }
    setBusy(true);
    const row = {
      name: f.name.trim(), category_id: f.category_id, area_id: f.area_id, phone: f.phone.trim(),
      secondary_phone: n(f.secondary_phone), whatsapp: n(f.whatsapp), description: n(f.description), services: n(f.services),
      price_description: n(f.price_description), working_hours: n(f.working_hours), photo_url: n(f.photo_url),
      status: f.status, is_premium: f.is_premium,
      premium_expires_at: f.is_premium && f.premium_expires_at ? new Date(f.premium_expires_at + "T23:59:59").toISOString() : null,
    };
    const { error } = f.id ? await supabase.from("providers").update(row).eq("id", f.id) : await supabase.from("providers").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("اتحفظ");
    onDone();
  }

  const field = (k: keyof Form, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="grid gap-1 text-sm font-bold">{label}<input value={f[k] as string} onChange={set(k)} className={input} {...extra} /></label>
  );
  const area = (k: keyof Form, label: string) => (
    <label className="grid gap-1 text-sm font-bold">{label}<textarea value={f[k] as string} onChange={set(k)} rows={3} className={input} /></label>
  );

  return (
    <form onSubmit={save} className="surface grid gap-3 p-5">
      <h2 className="text-xl font-extrabold">{f.id ? "تعديل صنايعي" : "إضافة صنايعي"}</h2>
      {field("name", "الاسم *", { required: true, maxLength: 100 })}
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-sm font-bold">القسم *<select value={f.category_id} onChange={set("category_id")} className={input} required><option value="">اختار</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-bold">القرية *<select value={f.area_id} onChange={set("area_id")} className={input} required><option value="">اختار</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {field("phone", "التليفون *", { required: true, dir: "ltr", inputMode: "tel", maxLength: 20 })}
        {field("whatsapp", "واتساب", { dir: "ltr", inputMode: "tel", maxLength: 20 })}
      </div>
      {field("secondary_phone", "رقم تاني", { dir: "ltr", inputMode: "tel", maxLength: 20 })}
      {area("description", "وصف")}
      {area("services", "تفاصيل الخدمات")}
      {field("price_description", "الأسعار")}
      {field("working_hours", "مواعيد الشغل")}
      {field("photo_url", "رابط الصورة", { dir: "ltr", type: "url" })}
      <label className="grid gap-1 text-sm font-bold">الحالة<select value={f.status} onChange={set("status")} className={input}><option value="active">ظاهر</option><option value="hidden">مخفي</option></select></label>
      <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={f.is_premium} onChange={(e) => setF({ ...f, is_premium: e.target.checked })} className="size-5" /> مميز</label>
      {f.is_premium ? field("premium_expires_at", "ينتهي التمييز في (فاضي = بدون انتهاء)", { type: "date" }) : null}
      <div className="grid grid-cols-2 gap-2">
        <button disabled={busy} className="rounded-xl bg-primary py-3 font-extrabold text-primary-foreground disabled:opacity-60">حفظ</button>
        <button type="button" onClick={onDone} className="rounded-xl border border-border py-3 font-bold">إلغاء</button>
      </div>
    </form>
  );
}

function SimpleList({ table, title }: { table: "categories" | "areas"; title: string }) {
  const qc = useQueryClient();
  const { categories, areas } = useAll();
  const rows = (table === "categories" ? categories.data : areas.data) ?? [];
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    const row = table === "categories" ? { name: name.trim(), icon: "Wrench", sort_order: rows.length + 1 } : { name: name.trim() };
    const { error } = await supabase.from(table).insert(row as never);
    if (error) { toast.error(error.message.includes("duplicate") ? "الاسم موجود بالفعل" : error.message); return; }
    setName("");
    qc.invalidateQueries();
  }
  async function rename(id: string, old: string) {
    const v = prompt("الاسم الجديد", old);
    if (!v?.trim()) return;
    const { error } = await supabase.from(table).update({ name: v.trim() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
  }
  async function toggle(id: string, status: string) {
    const { error } = await supabase.from(table).update({ status: status === "active" ? "hidden" : "active" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`اسم ${title} جديد`} maxLength={60} className={input} />
        <button onClick={add} className="shrink-0 rounded-xl bg-primary px-4 font-extrabold text-primary-foreground">إضافة</button>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="surface flex items-center justify-between p-3">
          <p className="font-bold">{r.name} {r.status !== "active" ? <span className="text-xs text-destructive">(مخفي)</span> : null}</p>
          <div className="flex gap-1">
            <button aria-label="تعديل" onClick={() => rename(r.id, r.name)} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="size-5" /></button>
            <button aria-label="إخفاء/إظهار" onClick={() => toggle(r.id, r.status)} className="rounded-lg p-2 hover:bg-secondary">{r.status === "active" ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

type Report = { id: string; reason: string; details: string | null; status: string; created_at: string; provider_id: string; providers: { name: string } | null };

function Reports() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*, providers(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Report[];
    },
  });
  async function resolve(id: string) {
    const { error } = await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
  }
  if (!data.length) return <p className="p-6 text-center text-muted-foreground">مفيش بلاغات</p>;
  return (
    <div className="grid gap-3">
      {data.map((r) => (
        <div key={r.id} className={`surface p-4 ${r.status !== "new" ? "opacity-60" : ""}`}>
          <p className="font-extrabold">{r.providers?.name ?? "—"}: {r.reason}</p>
          {r.details ? <p className="mt-1 text-sm">{r.details}</p> : null}
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
            {r.status === "new" ? <button onClick={() => resolve(r.id)} className="rounded-lg bg-secondary px-3 py-1.5 font-bold text-foreground">تم الحل</button> : <span>تم الحل</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
