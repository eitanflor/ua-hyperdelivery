import { Link } from "react-router";
import { Artwork } from "../components/art/Artwork";
import { AsciiBot } from "../components/art/AsciiBot";

/** A bad link used to drop people on the landing page as if the app had forgotten them.
 * This says what happened and offers the two ways forward. */
export function NotFound() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md text-center">
        <Artwork
          id="e-missing-platform"
          fallback={<AsciiBot className="mx-auto w-fit text-left text-showroom" />}
          className="mx-auto block h-40 w-auto"
        />
        <h1 className="stencil mt-5 text-xl text-fg">Not on the line</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Host looked everywhere. This link points at a page that does not exist - it may have
          been deleted, or the address is mistyped.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-medium text-fg-on-accent shadow-raised transition-colors hover:bg-accent-hover"
          >
            Go to Home
          </Link>
          <Link
            to="/start"
            className="inline-flex h-9 items-center rounded-sm border border-line bg-surface px-4 text-xs font-medium text-fg transition-colors hover:border-line-strong hover:bg-sunken"
          >
            Start a project
          </Link>
        </div>
      </div>
    </div>
  );
}
