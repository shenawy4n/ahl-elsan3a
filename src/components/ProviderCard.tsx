import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Star, MapPin, BadgeCheck, Award } from "lucide-react";
import { track } from "@/lib/track";
import { isPremiumActive, telHref, whatsappHref, type ProviderWithRefs } from "@/lib/directory";

export function PremiumBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-premium/12 px-2.5 py-1 text-xs font-bold text-premium ring-1 ring-premium/30">
      <Star className="size-3.5 fill-current" /> مميز
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary ring-1 ring-primary/30">
      <BadgeCheck className="size-3.5" /> موثّق
    </span>
  );
}

export function ProviderCard({ provider }: { provider: ProviderWithRefs }) {
  const premium = isPremiumActive(provider);

  return (
    <article className={`surface p-4 ${premium ? "ring-2 ring-premium/40" : ""}`}>
      <Link to="/provider/$id" params={{ id: provider.id }} className="block">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-extrabold text-foreground">{provider.name}</h3>
          <div className="flex flex-wrap justify-end gap-1">
            {provider.is_verified ? <VerifiedBadge /> : null}
            {premium ? <PremiumBadge /> : null}
          </div>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className="font-bold text-primary">{provider.categories?.name}</span>
          <span className="mx-1.5">·</span>
          <MapPin className="inline size-3.5 align-[-2px]" /> {provider.areas?.name}
        </p>
        {provider.experience_options ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <Award className="inline size-3.5 align-[-2px]" /> خبرة: {provider.experience_options.label}
          </p>
        ) : null}
        {provider.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-foreground/75">{provider.description}</p>
        ) : null}
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <a
          href={telHref(provider.phone)}
          onClick={() => track("phone_click", { provider_id: provider.id, category_id: provider.category_id })}
          className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-extrabold text-primary-foreground active:brightness-95"
        >
          <Phone className="size-5" /> اتصال
        </a>
        {provider.whatsapp ? (
          <a
            href={whatsappHref(provider.whatsapp)}
            onClick={() => track("whatsapp_click", { provider_id: provider.id, category_id: provider.category_id })}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-whatsapp py-3.5 text-base font-extrabold text-whatsapp-foreground active:brightness-95"
          >
            <MessageCircle className="size-5" /> واتساب
          </a>
        ) : (
          <Link
            to="/provider/$id"
            params={{ id: provider.id }}
            className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3.5 text-base font-extrabold text-secondary-foreground"
          >
            التفاصيل
          </Link>
        )}
      </div>
    </article>
  );
}
