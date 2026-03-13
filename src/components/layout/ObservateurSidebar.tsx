"use client";

import { useSession, signOut } from "next-auth/react";
import { Eye, BarChart3, TrendingUp, AlertTriangle, Download, Settings, Clock, Activity, Database, FileText, LogOut } from "lucide-react";

export default function ObservateurSidebar() {
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-card text-foreground flex flex-col gap-4 p-6 border-r border-border shadow-2xl transition-colors duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
          <img src="/icon-bluetrace.png" alt="Icon" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-black text-foreground uppercase tracking-tight">BlueTrace</span>
      </div>

      {session && (
        <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border">
          <div className="text-sm font-black text-foreground uppercase tracking-tight">{session.user?.name}</div>
          <div className="text-[10px] font-bold text-cyan-500 mt-1 uppercase tracking-widest flex items-center gap-2">
            <Eye className="w-3 h-3" />
            {session.user?.role || 'Observateur'}
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-2 flex-1">
        {/* Section Surveillance */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-3">
            Surveillance
          </h3>
          <a href="/dashboard" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <Activity className="w-4 h-4" />
            Dashboard
          </a>
          <a href="/historique" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <Clock className="w-4 h-4" />
            Historique
          </a>
          <a href="/alertes" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <AlertTriangle className="w-4 h-4" />
            Alertes
          </a>
        </div>

        {/* Section Analyse */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-3">
            Analyse
          </h3>
          <a href="/rapports" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <BarChart3 className="w-4 h-4" />
            Rapports
          </a>
          <a href="/tendances" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <TrendingUp className="w-4 h-4" />
            Tendances
          </a>
          <a href="/export" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <Download className="w-4 h-4" />
            Export Données
          </a>
        </div>

        {/* Section Données */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-3">
            Données
          </h3>
          <a href="/mesures" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <Database className="w-4 h-4" />
            Mesures
          </a>
          <a href="/bassins" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <span className="text-lg">🐟</span>
            Bassins
          </a>
          <a href="/iot" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <span className="text-lg">📡</span>
            IoT Status
          </a>
        </div>

        {/* Section Documentation */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-3">
            Documentation
          </h3>
          <a href="/guides" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <FileText className="w-4 h-4" />
            Guides
          </a>
          <a href="/parametres" className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium rounded-lg px-3 py-2 transition-colors">
            <Settings className="w-4 h-4" />
            Paramètres
          </a>
        </div>
      </nav>

      {/* Statut système */}
      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mb-4">
        <div className="flex items-center justify-between text-[10px] font-bold text-foreground uppercase tracking-widest">
          <span>Statut système</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-500">Opérationnel</span>
          </div>
        </div>
      </div>

      {session && (
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="mt-auto group flex items-center justify-center gap-3 bg-card border border-border hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive text-muted-foreground px-4 py-3 rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Déconnexion</span>
      </button>
      )}
    </aside>
  );
} 