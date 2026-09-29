import { LegalPage } from "@/components/LegalPage";
import { SITE } from "@/data/site";
import { HUB_SHARE_IMAGE, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/privacy",
  shareImage: HUB_SHARE_IMAGE,
  title: "Privacy Policy — PuzzleSolver",
  description:
    "How PuzzleSolver handles your data: no accounts, no cookies, no analytics. Puzzles are solved in your browser and never sent to a server.",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="29 September 2026">
      <h2>The short version</h2>
      <p>
        {SITE.name} ({SITE.domain}) is a free collection of logic puzzle solvers built by {SITE.author}.
        There are no accounts, no cookies, no analytics or tracking scripts and no ads. The puzzles you
        enter are solved in your own browser and are never sent to us.
      </p>

      <h2>What we collect</h2>
      <p>We don&apos;t collect personal information. Specifically, the site does not:</p>
      <ul>
        <li>ask you to sign up, log in or give an email address;</li>
        <li>set cookies or store anything in your browser&apos;s local storage;</li>
        <li>load analytics, advertising or tracking scripts.</li>
      </ul>

      <h2>Your puzzles</h2>
      <p>
        The clues you type and the solutions the solvers find are computed with JavaScript on your device.
        They are not uploaded, saved or shared, and they are gone when you reload or close the page. The
        &ldquo;Copy Grid&rdquo; buttons only place text on your own clipboard.
      </p>

      <h2>Hosting</h2>
      <p>
        The site is hosted on Vercel. Like any web host, Vercel receives standard technical information
        when your browser requests a page (such as your IP address, browser type, the page requested and
        the time) so it can deliver the site and keep it secure, and it may keep this in server logs for a
        limited period. See{" "}
        <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">
          Vercel&apos;s privacy notice
        </a>{" "}
        for details. Fonts and images are served from this site, so your browser doesn&apos;t contact other
        font or image providers.
      </p>

      <h2>Links to other sites</h2>
      <p>
        The site links to LinkedIn, GitHub and Buy Me a Coffee. If you follow those links, the other
        site&apos;s own privacy policy applies.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the new version will be posted on this page with a new &ldquo;Last
        updated&rdquo; date.
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
