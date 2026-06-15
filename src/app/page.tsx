import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SolverGrid } from "@/components/SolverGrid";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SolverGrid />
        <Features />
      </main>
      <Footer />
    </>
  );
}
