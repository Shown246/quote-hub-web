import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account - Quote-Hub",
  description: "Create your Quote-Hub account",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-foreground hover:opacity-90">
            Quote-Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Join Quote-Hub to discover, curate, and share memorable quotes
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <RegisterForm />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
