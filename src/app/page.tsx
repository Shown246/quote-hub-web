import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Quote-Hub
        </h1>
        <p className="text-lg text-muted-foreground">
          Discover, share, and style your favorite quotes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className={buttonVariants({ variant: "default", size: "lg", className: "w-full sm:w-auto" })}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
          >
            Create Account
          </Link>
          <Link
            href="/feed/for-you"
            className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full sm:w-auto" })}
          >
            Browse Feed
          </Link>
        </div>
      </div>
    </main>
  );
}
