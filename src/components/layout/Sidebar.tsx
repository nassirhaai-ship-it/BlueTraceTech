"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Home,
  Users,
  Settings,
  LogOut,
  Bell,
  History,
  Cpu,
  FileText,
  Database,
  BarChart3,
  ShoppingCart
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const isAdmin = session?.user?.role === "admin";
  const isOperateur = session?.user?.role === "operateur";
  const isDistributeur = session?.user?.role === "distributeur";

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="h-full bg-card text-foreground p-4 flex flex-col border-r border-border shadow-2xl transition-colors duration-300">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <img src="/logo-bluetrace.png" alt="BlueTrace Tech" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight">BlueTrace</h1>
        </div>
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 inline-block">System v2.0</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {/* Dashboard - Tous les rôles */}
          <li>
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/dashboard")
                  ? "bg-accent text-accent-foreground font-bold"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                }`}
            >
              <Home size={20} />
              <span>Tableau de bord</span>
            </Link>
          </li>

          {/* Gestion ferme - Admin et Opérateur uniquement */}
          {(isAdmin || isOperateur) && (
            <li>
              <Link
                href="/ferme"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/ferme")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Database size={20} />
                <span>Gestion ferme</span>
              </Link>
            </li>
          )}

          {/* Lots - Admin, Opérateur et Distributeur */}
          {(isAdmin || isOperateur || isDistributeur) && (
            <li>
              <Link
                href="/lots"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/lots")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <FileText size={20} />
                <span>Lots</span>
              </Link>
            </li>
          )}

          {/* Ventes - Admin et Distributeur */}
          {(isAdmin || isDistributeur) && (
            <li>
              <Link
                href="/ventes"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/ventes")
                    ? "bg-accent text-accent-foreground font-bold"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
              >
                <ShoppingCart size={20} />
                <span>Ventes</span>
              </Link>
            </li>
          )}

          {/* Utilisateurs - Admin uniquement */}
          {isAdmin && (
            <li>
              <Link
                href="/utilisateurs"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/utilisateurs")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Users size={20} />
                <span>Utilisateurs</span>
              </Link>
            </li>
          )}

          {/* Alertes - Admin et Opérateur uniquement (alertes techniques) */}
          {(isAdmin || isOperateur) && (
            <li>
              <Link
                href="/alertes"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/alertes")
                    ? "bg-accent text-accent-foreground font-bold"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
              >
                <Bell size={20} />
                <span>Alertes</span>
              </Link>
            </li>
          )}

          {/* Historique - Tous les rôles */}
          <li>
            <Link
              href="/historique"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/historique")
                  ? "bg-accent text-accent-foreground font-bold"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                }`}
            >
              <History size={20} />
              <span>Historique</span>
            </Link>
          </li>

          {/* IoT - Admin et Opérateur uniquement */}
          {(isAdmin || isOperateur) && (
            <li>
              <Link
                href="/iot"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/iot")
                    ? "bg-accent text-accent-foreground font-bold"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
              >
                <Cpu size={20} />
                <span>Appareils IoT</span>
              </Link>
            </li>
          )}

          {/* Rapports - Tous les rôles */}
          <li>
            <Link
              href="/rapports"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/rapports")
                  ? "bg-accent text-accent-foreground font-bold"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                }`}
            >
              <BarChart3 size={20} />
              <span>Rapports</span>
            </Link>
          </li>

          {/* Paramètres - Admin uniquement */}
          {isAdmin && (
            <li>
              <Link
                href="/parametres"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive("/parametres")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Settings size={20} />
                <span>Paramètres</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <Link
          href="/profil"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive("/profil")
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black shadow-md">
            {session?.user?.name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{session?.user?.name || "Utilisateur"}</p>
            <p className="text-[10px] font-medium text-muted-foreground truncate uppercase tracking-wider">
              {session?.user?.role || "Membre"}
            </p>
          </div>
        </Link>

        <Link
          href="/api/auth/signout"
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-2 transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </Link>
      </div>
    </div>
  );
} 