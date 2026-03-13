"use client";

import type { Metadata } from "next";

// Polyfill for localStorage during SSR to prevent crash in Next.js 15
// Polyfill for localStorage during SSR to prevent crash in Next.js 15
if (typeof window === "undefined" || !global.localStorage) {
  const mockStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    length: 0,
    key: () => null,
  };
  
  if (typeof global !== "undefined") {
    (global as any).localStorage = mockStorage;
  }
  
  if (typeof globalThis !== "undefined") {
    (globalThis as any).localStorage = mockStorage;
  }
}

import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SessionProvider from "@/components/providers/SessionProvider";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { SidebarProvider, useSidebar } from "@/components/contexts/SidebarContext";
import { usePathname } from "next/navigation";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRef, useState, useEffect } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });
// ... existing AppContent and AppHeader components ...

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const isPublicOrAuthPage = pathname === "/" ||
    pathname.startsWith("/auth/signin") ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/public/");

  return (
    <>
      <AppHeader />
      <div className="flex min-h-screen bg-background text-foreground">
        {!isPublicOrAuthPage && <Sidebar />}
        <div className={`
          flex-1 transition-all duration-300 w-full
          ${!isPublicOrAuthPage ? (isCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}
          pt-16 lg:pt-0
        `}>
          <main className="w-full overflow-x-hidden min-h-screen relative bg-background">
            {/* Background ambient glow inside the app */}
            {!isPublicOrAuthPage && (
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[120px] pointer-events-none -z-10" />
            )}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (pathname === "/" ||
    pathname.startsWith("/auth/signin") ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/public/")) return null;

  return (
    <header className="fixed lg:sticky top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border shadow-md lg:relative transition-colors duration-300">
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8 flex items-center h-16 justify-between">
        <div className="flex items-center gap-1 group cursor-pointer transition-transform duration-300 hover:scale-105">
          <span className="hidden sm:block text-xl font-black tracking-tight uppercase">
            <span className="text-blue-500">Blue</span><span className="text-foreground">Trace Tech</span>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 justify-end ml-auto">
          <button className="relative p-2 rounded-full hover:bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-cyan-400">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-white flex items-center justify-center font-bold text-sm sm:text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-lg shadow-cyan-900/50"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu utilisateur"
            >
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card backdrop-blur-xl rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-border z-50 py-2 animate-in fade-in zoom-in duration-200">
                <a href="/profil" className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-primary/10 hover:text-primary text-sm sm:text-base transition-colors">
                  <User className="w-4 h-4" /> Profil
                </a>
                <a href="/parametres" className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-primary/10 hover:text-primary text-sm sm:text-base transition-colors">
                  <Settings className="w-4 h-4" /> Paramètres
                </a>
                <div className="my-2 border-t border-border" />
                <button
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm sm:text-base"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider>
            <SidebarProvider>
              <AppContent>{children}</AppContent>
            </SidebarProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
