import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function AuthBackButton() {
  return (
    <Link
      to="/"
      className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
    >
      <span className="size-8 rounded-lg border border-border bg-card flex items-center justify-center group-hover:bg-secondary transition-colors">
        <ArrowLeft className="size-4" />
      </span>
      <span className="hidden sm:inline font-medium">Back to home</span>
    </Link>
  );
}
