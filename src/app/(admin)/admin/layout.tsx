"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/admin-guard";
import { 
  LayoutDashboard, 
  Users, 
  Quote, 
  ScrollText, 
  ArrowLeft,
  ShieldAlert
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Quotes", href: "/admin/quotes", icon: Quote },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  ];

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background">
        {/* Admin Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
          <div className="p-6 border-b border-border flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">Admin Console</h1>
          </div>

          <nav className="p-4 flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Link
              href="/"
              className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Application</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
