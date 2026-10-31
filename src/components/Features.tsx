import { Gift, MousePointerClick, Smartphone, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function Features() {
  const t = await getTranslations("features");
  const items = [
    { key: "free", icon: Gift, title: t("free_title"), body: t("free_body") },
    { key: "no_signup", icon: MousePointerClick, title: t("no_signup_title"), body: t("no_signup_body") },
    { key: "instant", icon: Zap, title: t("instant_title"), body: t("instant_body") },
    { key: "mobile", icon: Smartphone, title: t("mobile_title"), body: t("mobile_body") },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid grid-cols-1 gap-4 rounded-card border border-line bg-white p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
        {items.map(({ key, icon: Icon, title, body }) => (
          <div key={key} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink">
              <Icon size={18} />
            </span>
            <div>
              <h3 className="font-semibold text-ink">{title}</h3>
              <p className="mt-0.5 text-sm text-subtle">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
