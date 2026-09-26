import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

// Public Form Gateway: every anonymous form goes through here.
// Order: honeypot -> validation/sanitization -> DB rate limit -> insert with server credentials.
// Future forms (provider applications, reviews) add a schema + handler below.

const clean = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001F\u007F<>]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max));

const REPORT_REASONS = [
  "رقم الهاتف لا يعمل",
  "البيانات غير صحيحة",
  "الصنايعي لا يعمل بهذه الصنعة",
  "البيانات قديمة",
  "سبب آخر",
] as const;

const schema = z.discriminatedUnion("form", [
  z.object({
    form: z.literal("service_suggestion"),
    website: z.string().optional(),
    name: clean(60).pipe(z.string().min(2)),
  }),
  z.object({
    form: z.literal("report"),
    website: z.string().optional(),
    provider_id: z.string().uuid(),
    reason: z.enum(REPORT_REASONS),
    details: z
      .string()
      .optional()
      .transform((s) => (s ?? "").replace(/[\u0000-\u0009\u000B-\u001F\u007F<>]/g, " ").trim().slice(0, 500) || null),
  }),
]);

type Result = { ok: true } | { ok: false; code: "invalid" | "rate_limited" | "error" };

export const submitPublicForm = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d)
  .handler(async ({ data: raw }): Promise<Result> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ok: false, code: "invalid" };
    const data = parsed.data;
    // Honeypot: bots fill the hidden field; pretend success, store nothing.
    if (data.website) return { ok: true };

    const { checkRateLimit, getClientIp } = await import("./rate-limit.server");
    const allowed = await checkRateLimit(getClientIp(getRequest()), data.form);
    if (!allowed) return { ok: false, code: "rate_limited" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.form === "service_suggestion") {
      const { error } = await supabaseAdmin.from("service_suggestions").insert({ name: data.name });
      return error ? { ok: false, code: "error" } : { ok: true };
    }
    const { data: prov } = await supabaseAdmin
      .from("providers").select("id").eq("id", data.provider_id).eq("status", "active").maybeSingle();
    if (!prov) return { ok: false, code: "invalid" };
    const { error } = await supabaseAdmin
      .from("reports").insert({ provider_id: data.provider_id, reason: data.reason, details: data.details });
    return error ? { ok: false, code: "error" } : { ok: true };
  });

export function publicFormError(code: string) {
  return code === "rate_limited" ? "طلبات كتير في وقت قصير، حاول بعد شوية" : code === "invalid" ? "البيانات مش صحيحة" : "حصلت مشكلة، حاول تاني";
}
