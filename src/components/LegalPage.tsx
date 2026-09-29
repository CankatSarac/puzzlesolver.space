import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/** Shared shell for the Privacy and Terms pages: hub header, readable prose column, footer. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-subtle">Last updated: {updated}</p>
        <div className="mt-8 rounded-card border border-line bg-white p-6 sm:p-10 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&>h2:first-child]:mt-0 [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink/80 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:leading-relaxed [&_ul]:text-ink/80">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
