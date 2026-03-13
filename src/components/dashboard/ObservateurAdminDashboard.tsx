"use client";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ObservateurAdminDashboard() {
  const [mesures, setMesures] = useState<any[]>([]);
  const [alertes, setAlertes] = useState<any[]>([]);
  const [bassins, setBassins] = useState<any[]>([]);
  const [selectedParam, setSelectedParam] = useState("temperature");
  const [selectedBassin, setSelectedBassin] = useState("all");

  useEffect(() => {
    fetch("/api/mesures").then(r => r.json()).then(setMesures);
    fetch("/api/alertes").then(r => r.json()).then(setAlertes);
    fetch("/api/bassins").then(r => r.json()).then(setBassins);
  }, []);

  // Préparation des données pour le graphique
  const chartData = (Array.isArray(mesures) ? mesures : [])
    .filter(m => (selectedBassin === "all" || m.bassinId === selectedBassin))
    .map(m => ({
      date: new Date(m.date).toLocaleTimeString(),
      value: m[selectedParam],
    }))
    .slice(-30);

  // Dernières mesures
  const lastMesures = (Array.isArray(mesures) ? mesures : []).slice(0, 15);

  // Dernières alertes
  const lastAlertes = (Array.isArray(alertes) ? alertes : []).slice(0, 15);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-[30%] h-[30%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      {/* Header */}
      <div className="flex items-center justify-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-background rounded-[7px] flex items-center justify-center">
              <span className="text-primary text-xl font-bold">🐟</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">Tableau de bord Observateur (Avancé)</h1>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10">
        <div className="p-6 bg-card border border-border rounded-xl shadow-lg hover:scale-[1.02] transition-all text-center">
          <div className="text-3xl font-black text-primary">{mesures.length}</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Mesures totales</div>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl shadow-lg hover:scale-[1.02] transition-all text-center">
          <div className="text-3xl font-black text-rose-500">{alertes.length}</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Alertes (24h)</div>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl shadow-lg hover:scale-[1.02] transition-all text-center">
          <div className="text-3xl font-black text-cyan-500">{bassins.length}</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Bassins surveillés</div>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl shadow-lg hover:scale-[1.02] transition-all text-center">
          <div className="text-3xl font-black text-emerald-500">98.7%</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Qualité données</div>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 mb-8 relative z-10">
        <div className="flex gap-4 mb-6">
          <select value={selectedParam} onChange={e => setSelectedParam(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary">
            <option value="temperature">Température</option>
            <option value="ph">pH</option>
            <option value="oxygen">Oxygène</option>
            <option value="salinity">Salinité</option>
            <option value="turbidity">Turbidité</option>
          </select>
          <select value={selectedBassin} onChange={e => setSelectedBassin(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Tous les bassins</option>
            {bassins.map(b => (
              <option key={b._id} value={b._id}>{b.nom || b.name || b._id}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" vertical={false} />
            <XAxis dataKey="date" stroke="oklch(1 0 0 / 30%)" fontSize={10} />
            <YAxis stroke="oklch(1 0 0 / 30%)" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau des mesures */}
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 mb-8 relative z-10">
        <h2 className="text-lg font-black text-foreground mb-4 uppercase tracking-tight">Dernières mesures</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Bassin</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Température</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">pH</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Oxygène</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Salinité</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Turbidité</th>
              </tr>
            </thead>
            <tbody>
              {lastMesures.map((m, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">{new Date(m.date).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{m.bassinId || m.bassin || "?"}</td>
                  <td className="px-4 py-3">{m.temperature ?? "-"}</td>
                  <td className="px-4 py-3">{m.ph ?? "-"}</td>
                  <td className="px-4 py-3">{m.oxygen ?? "-"}</td>
                  <td className="px-4 py-3">{m.salinity ?? "-"}</td>
                  <td className="px-4 py-3">{m.turbidity ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tableau des alertes */}
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 relative z-10">
        <h2 className="text-lg font-black text-foreground mb-4 uppercase tracking-tight">Alertes récentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Bassin</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Message</th>
              </tr>
            </thead>
            <tbody>
              {lastAlertes.map((a, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">{new Date(a.date).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{a.bassinId || a.bassin || "?"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      a.type === 'error' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20' :
                      a.type === 'warning' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                      'bg-primary/20 text-primary border border-primary/20'
                    }`}>
                      {a.type || 'info'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 