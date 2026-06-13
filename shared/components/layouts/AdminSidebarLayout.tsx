"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/shared/context/UserContext";
import { cx } from "@/shared/lib/utils";
import {
  LayoutDashboard,
  Users,
  Sprout,
  Package,
  ShoppingBag,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
  Leaf,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/farmers", label: "Farmers", icon: Sprout },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground rounded-xl"
          : "text-foreground-muted hover:bg-secondary-subtle rounded-xl",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user } = useUser();

  return (
    <aside className="flex h-full w-64 flex-col bg-surface-card border-r border-border">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Leaf className="h-5 w-5 text-brand" />
        <span className="text-base font-bold text-brand">FR3SH Admin</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-foreground-muted hover:bg-secondary-subtle lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} onClick={onClose} />
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4 space-y-2">
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground-heading">
                {user.name ?? user.email}
              </p>
              <p className="truncate text-xs text-foreground-muted">Admin</p>
            </div>
          </div>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground-muted hover:bg-secondary-subtle transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>
      </div>
    </aside>
  );
}

export default function AdminSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40">
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground-heading/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cx(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-surface-card px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-foreground-muted hover:bg-secondary-subtle"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-brand" />
            <span className="text-sm font-bold text-brand">FR3SH Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
