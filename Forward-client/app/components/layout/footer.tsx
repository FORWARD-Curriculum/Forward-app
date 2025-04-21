import { Link } from "react-router";

export default function Footer() {
  return (
    <>
      <div className="bg-muted **:!text-muted-foreground right-0 bottom-0 left-0 box-border flex min-h-25 w-full flex-col items-center gap-3 px-12 py-4 no-underline lg:gap-0.5">
        <Link prefetch="intent"
          to="/"
          className="w-full text-center text-2xl font-medium lg:text-left lg:text-xl"
        >
          FORWARD
        </Link>
        <ul className="flex list-none flex-col items-center gap-1 *:hover:underline lg:flex-row">
          <li>
            <Link prefetch="intent" to="/Linkccessibility">Accessibility</Link>
          </li>
          <li className="hidden lg:block">|</li>
          <li>
            <Link prefetch="intent" to="/technical-help">Technical Help</Link>
          </li>
          <li className="hidden lg:block">|</li>
          <li>
            <Link prefetch="intent" to="/feedback">Feedback</Link>
          </li>
          <li className="hidden lg:block">|</li>
          <li>
            <Link prefetch="intent" to="/privacy-policy">Privacy Policy</Link>
          </li>
          <li className="hidden lg:block">|</li>
          <li>
            <Link prefetch="intent" to="/cookie-settings">Cookie Settings</Link>
          </li>
          <li className="hidden lg:block">|</li>
          <li className="mt-4 !no-underline lg:mt-0">©2025 Annee Grayson</li>
        </ul>
      </div>
    </>
  );
}
