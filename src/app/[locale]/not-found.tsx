import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-foreground">404</h1>
      <p className="mt-3 text-muted-foreground">This page could not be found.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Home
      </Link>
    </div>
  );
}
