import { LegalPage } from "@/components/LegalPage";
import { SITE } from "@/data/site";
import { HUB_SHARE_IMAGE, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/terms",
  shareImage: HUB_SHARE_IMAGE,
  title: "Terms of Use — PuzzleSolver",
  description:
    "The terms for using PuzzleSolver's free online puzzle solvers: free to use, provided as is, and not affiliated with LinkedIn or any puzzle publisher.",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="29 September 2026">
      <h2>Using the site</h2>
      <p>
        {SITE.name} ({SITE.domain}) is a free collection of logic puzzle solvers. You can use it without
        an account and without paying. By using the site you agree to these terms.
      </p>

      <h2>Provided as is</h2>
      <p>
        The solvers are provided &ldquo;as is&rdquo;, without warranties of any kind. They may return no
        solution, only part of a solution, or a result you didn&apos;t expect, and the site may change or
        be unavailable at any time. Please double-check anything that matters to you.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, {SITE.author} is not liable for any loss or damage arising from
        your use of the site or its results.
      </p>

      <h2>Fair use</h2>
      <p>
        Please don&apos;t try to disrupt the site, for example by overloading it with automated requests
        or interfering with its hosting.
      </p>

      <h2>Not affiliated with puzzle publishers</h2>
      <p>
        {SITE.name} is an independent project. It is not affiliated with, endorsed by or sponsored by
        LinkedIn or any other puzzle publisher. Puzzle names such as Tango are used only to describe which
        puzzle a solver works with, and any trademarks belong to their owners.
      </p>

      <h2>Other sites</h2>
      <p>
        Links to LinkedIn, GitHub and Buy Me a Coffee lead to services run by others, under their own
        terms.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated from time to time. The current version always lives on this page with
        its &ldquo;Last updated&rdquo; date.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Reach {SITE.author} on{" "}
        <a href={SITE.links.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>{" "}
        or{" "}
        <a href={SITE.links.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    </LegalPage>
  );
}
