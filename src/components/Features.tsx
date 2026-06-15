import { Gift, MousePointerClick, Smartphone, Zap } from "lucide-react";

const FEATURES = [
  { icon: Gift, title: "Completely free", body: "No paywalls, no premium tiers." },
  { icon: MousePointerClick, title: "No signup", body: "Open a solver and start — that's it." },
  { icon: Zap, title: "Instant results", body: "Fast solvers that find every solution." },
  { icon: Smartphone, title: "Works on mobile", body: "Responsive on phones and tablets." },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid grid-cols-1 gap-4 rounded-card border border-line bg-white p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3">
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
