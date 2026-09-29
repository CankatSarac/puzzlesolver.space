import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, solverJsonLd } from "@/lib/seo";
import TangoSolver from "@/solvers/tango/TangoSolver";

const title = "Tango Puzzle Solver — Free Online LinkedIn Tango Solver";
const description =
  "Solve LinkedIn's Tango puzzle instantly. Fill the grid with suns and moons under the balance, no-three-in-a-row, and =/≠ constraints — solved automatically in your browser.";

export const metadata = pageMetadata({ path: "/tango", title, description });

export default function TangoPage() {
  return (
    <>
      <JsonLd data={solverJsonLd("tango", description)} />
      <Header />
      <main>
        <TangoSolver />
      </main>
      <Footer className="mt-0" />
    </>
  );
}
