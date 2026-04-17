"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquare,
  LogOut,
  Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Subscribers", href: "/admin/subscribers", icon: Users },
  { label: "Email Campaigns", href: "/admin/emails", icon: Mail },
  { label: "Pop-ups", href: "/admin/popups", icon: MessageSquare },
] as const;

function AdminSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ccdef0]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-[#2a2a2a] bg-[#111111]">
        <div className="border-b border-[#2a2a2a] px-6 py-5">
          <h1 className="text-lg font-bold text-[#f7f7f7]">IFA Admin</h1>
          <p className="mt-0.5 text-xs text-[#888]">{session.user?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1" role="navigation" aria-label="Admin navigation">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-[#ccdef0]/10 text-[#ccdef0]"
                        : "text-[#999] hover:bg-[#1e1e1e] hover:text-[#f7f7f7]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#2a2a2a] px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#999] transition-colors hover:bg-[#1e1e1e] hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#161616]" />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SessionProvider>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ccdef0]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-[#2a2a2a] bg-[#111111]">
        <div className="border-b border-[#2a2a2a] px-6 py-5">
          <h1 className="text-lg font-bold text-[#f7f7f7]">IFA Admin</h1>
          <p className="mt-0.5 text-xs text-[#888]">{session.user?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul role="list" aria-label="Admin navigation">
            <li className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-[#ccdef0]/10 text-[#ccdef0]"
                        : "text-[#999] hover:bg-[#1e1e1e] hover:text-[#f7f7f7]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </li>
          </ul>
        </nav>

        <div className="border-t border-[#2a2a2a] px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#999] transition-colors hover:bg-[#1e1e1e] hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#161616] p-8">
        {children}
      </main>
    </div>
  );
}
