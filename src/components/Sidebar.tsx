"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  History,
  Bell,
  Users,
  Settings,
  BarChart3,
  Fish,
  LogOut,
  Menu,
  X,
  Activity,
  Database,
  Shield,
  ShoppingCart
} from "lucide-react";
import Loader, { LoaderIcon } from "@/components/ui/Loader";
import { useSidebar } from "@/components/contexts/SidebarContext";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Déterminer le rôle de l'utilisateur
  const userRole = session?.user?.role || '';
  const isAdmin = userRole === "admin";
  const isOperateur = userRole === "operateur";
  const isDistributeur = userRole === "distributeur";

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Vue d'ensemble",
      roles: ["admin", "operateur", "distributeur"]
    },
    {
      name: "Historique",
      href: "/historique",
      icon: History,
      description: "Données historiques",
      roles: ["admin", "operateur"]
    },
    {
      name: "Alertes",
      href: "/alertes",
      icon: Bell,
      description: "Notifications",
      roles: ["admin", "operateur"]
    },
    {
      name: "Gestion ferme",
      href: "/ferme",
      icon: Fish,
      description: "Gestion des lots",
      roles: ["admin", "operateur"]
    },
    {
      name: "Lots",
      href: "/lots",
      icon: Database,
      description: "Traçabilité des lots",
      roles: ["admin", "operateur", "distributeur"]
    },
    {
      name: "Ventes",
      href: "/ventes",
      icon: ShoppingCart,
      description: "Ventes et certificats",
      roles: ["admin", "distributeur"]
    },
    {
      name: "Utilisateurs",
      href: "/utilisateurs",
      icon: Users,
      description: "Gestion des accès",
      roles: ["admin"]
    },
    {
      name: "Rapports",
      href: "/rapports",
      icon: BarChart3,
      description: "Analyses et rapports",
      roles: ["admin", "operateur"]
    },
    {
      name: "IoT",
      href: "/iot",
      icon: Activity,
      description: "Connectivité IoT",
      roles: ["admin", "operateur"]
    },
    {
      name: "Paramètres",
      href: "/parametres",
      icon: Settings,
      description: "Configuration",
      roles: ["admin"]
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'operateur': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'distributeur': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'operateur': return 'Opérateur';
      case 'distributeur': return 'Distributeur';
      default: return role;
    }
  };

  return (
    <>
      {/* Bouton menu mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-sidebar rounded-lg shadow-md border border-sidebar-border hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {mobileOpen ? <X size={20} className="text-foreground" /> : <Menu size={20} className="text-foreground" />}
        </button>
      </div>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-sidebar
          border-r border-sidebar-border transition-all duration-300 z-50
          ${isCollapsed ? 'w-16' : 'w-64'}
          flex flex-col justify-between
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        tabIndex={-1}
        aria-label="Navigation principale"
      >
        {/* Logo Section */}
        <div className={`flex items-center h-20 border-b border-border ${isCollapsed ? 'px-2 justify-center' : 'px-4 justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 transition-transform duration-300 hover:scale-105">
              <img src="/logo-bluetrace.png" alt="BlueTrace Tech" className="w-10 h-10 object-contain rounded-full" />
              <span className="text-lg font-black tracking-tight uppercase">
                <span className="text-blue-500">Blue</span><span className="text-foreground">Trace Tech</span>
              </span>
            </div>
          )}
          {/* Bouton toggle collapse - Desktop uniquement */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
            title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
            aria-label={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-1 overflow-y-auto no-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navigation
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)} // Fermer le menu mobile après clic
                  className={`
                    group relative flex items-center ${isCollapsed ? 'px-0 justify-center h-12 w-12 mx-auto' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-300
                  ${isActive
                      ? 'bg-gradient-to-r from-primary/20 to-blue-600/20 text-primary border border-primary/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                `}
                >
                  <item.icon
                    size={isActive ? 22 : 20}
                    className={`
                    flex-shrink-0 transition-all duration-300
                    ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-500 group-hover:text-cyan-400'}
                  `}
                  />
                  {!isCollapsed && (
                    <div className="ml-4 flex-1">
                      <span className={`block transition-colors ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>{item.name}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest font-bold font-mono">{item.description}</p>
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 bg-popover text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* User Profile Footer */}
        {session?.user && (
          <div className={`mt-auto border-t border-border bg-muted/30 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              {!isCollapsed && (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/40">
                    <span className="text-white font-black text-sm">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate uppercase tracking-tight">
                      {session.user.name}
                    </p>
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-black rounded border uppercase tracking-widest mt-1 ${getRoleColor(session.user.role || '')}`}>
                      {getRoleLabel(session.user.role || '')}
                    </span>
                  </div>
                </>
              )}
              <button
                onClick={() => {
                  setLoggingOut(true);
                  setTimeout(() => signOut({ callbackUrl: '/' }), 1000);
                }}
                className={`p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all ${isCollapsed ? 'mx-auto' : ''}`}
                title="Déconnexion"
              >
                {loggingOut ? (
                    <LoaderIcon size={18} />
                ) : (
                  <LogOut size={18} />
                )}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}