import { useState } from "react";
import { toast } from "sonner";
import { callProvider, revealProvider, whatsappProvider } from "@/lib/contact";

export function ContactButtons({ providerId, hasWhatsapp, big = false }: { providerId: string; hasWhatsapp: boolean; big?: boolean }) {
  const [revealed, setRevealed] = useState<{ phone: string | null; secondary_phone: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [noPhone, setNoPhone] = useState(false);
  const h = big ? "min-h-14 text-lg" : "min-h-13 text-base";

  async function run(fn: () => Promise<unknown>, isPhone = true) {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch {
      if (isPhone) setNoPhone(true);
      toast.error(isPhone ? "رقم الهاتف غير متاح حالياً" : "واتساب غير متاح حالياً");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-2">
      <div className={`grid gap-2.5 ${hasWhatsapp ? "grid-cols-2" : "grid-cols-1"}`}>
        <button type="button" disabled={busy || noPhone} onClick={() => run(() => callProvider(providerId))} className={`flex ${h} items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-extrabold text-primary-foreground active:brightness-95 disabled:opacity-60`}>
          {busy ? "جاري الاتصال..." : "📞 اتصال"}
        </button>
        {hasWhatsapp ? (
          <button type="button" disabled={busy} onClick={() => run(() => whatsappProvider(providerId), false)} className={`flex ${h} items-center justify-center gap-2 rounded-xl bg-whatsapp py-3.5 font-extrabold text-whatsapp-foreground active:brightness-95 disabled:opacity-60`}>
            💬 WhatsApp
          </button>
        ) : null}
      </div>
      {noPhone ? (
        <p className="text-center text-sm font-bold text-destructive">رقم الهاتف غير متاح حالياً</p>
      ) : revealed ? (
        <p dir="ltr" className="select-all rounded-xl border border-border bg-secondary py-2.5 text-center text-lg font-extrabold text-secondary-foreground">
          {revealed.phone}{revealed.secondary_phone ? ` · ${revealed.secondary_phone}` : ""}
        </p>
      ) : (
        <button type="button" disabled={busy} onClick={() => run(async () => { setRevealed(await revealProvider(providerId)); })} className="min-h-11 py-1.5 text-sm font-bold text-primary underline-offset-4 hover:underline">
          إظهار الرقم
        </button>
      )}
    </div>
  );
}
