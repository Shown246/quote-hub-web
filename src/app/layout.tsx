import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quote-Hub",
  description: "A quote-focused social network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster theme="dark" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
