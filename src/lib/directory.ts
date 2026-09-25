import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  status: string;
};

export type Area = {
  id: string;
  name: string;
  status: string;
};

export type Provider = {
  id: string;
  name: string;
  category_id: string;
  area_id: string;
  phone: string;
  secondary_phone: string | null;
  whatsapp: string | null;
  description: string | null;
  services: string | null;
  price_description: string | null;
  working_hours: string | null;
  photo_url: string | null;
  status: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProviderWithRefs = Provider & {
  categories: { id: string; name: string } | null;
  areas: { id: string; name: string } | null;
};

const PROVIDER_SELECT = "*, categories(id,name), areas(id,name)";

export function isPremiumActive(p: Pick<Provider, "is_premium" | "premium_expires_at">) {
  if (!p.is_premium) return false;
  if (!p.premium_expires_at) return true;
  return new Date(p.premium_expires_at).getTime() > Date.now();
}

export const categoriesQuery = {
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,icon,sort_order,status")
      .eq("status", "active")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
};

export const areasQuery = {
  queryKey: ["areas"],
  queryFn: async (): Promise<Area[]> => {
    const { data, error } = await supabase
      .from("areas")
      .select("id,name,status")
      .eq("status", "active")
      .order("name");
    if (error) throw error;
    return (data ?? []) as Area[];
  },
};

export function providersQuery(opts: {
  categoryId?: string | undefined;
  areaId?: string | undefined;
  search?: string | undefined;
  premiumOnly?: boolean | undefined;
  limit?: number | undefined;
  includeHidden?: boolean | undefined;
}) {
  return {
    queryKey: ["providers", opts],
    queryFn: async (): Promise<ProviderWithRefs[]> => {
      let q = supabase.from("providers").select(PROVIDER_SELECT).eq("status", "active");
      if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
      if (opts.areaId) q = q.eq("area_id", opts.areaId);
      if (opts.premiumOnly) q = q.eq("is_premium", true);
      if (opts.search && opts.search.trim()) {
        const s = opts.search.trim().replace(/[%,]/g, "");
        q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%,services.ilike.%${s}%`);
      }
      q = q.order("is_premium", { ascending: false }).order("created_at", { ascending: false });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ProviderWithRefs[];
    },
  };
}

export function providerQuery(id: string) {
  return {
    queryKey: ["provider", id],
    queryFn: async (): Promise<ProviderWithRefs | null> => {
      const { data, error } = await supabase
        .from("providers")
        .select(PROVIDER_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ProviderWithRefs | null;
    },
  };
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(phone: string) {
  let n = phone.replace(/[^\d]/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "20" + n.slice(1);
  return `https://wa.me/${n}`;
}
