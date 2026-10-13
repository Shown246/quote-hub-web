import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In - Quote-Hub",
  description: "Sign in to your Quote-Hub account",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-foreground hover:opacity-90">
            Quote-Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to share and explore quotes
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading form...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
