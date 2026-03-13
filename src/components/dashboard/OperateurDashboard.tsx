"use client";

import { Card } from "@/components/ui/card";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, Activity, Settings, Zap, Eye, TrendingUp, RefreshCw } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OperateurDashboard() {
  const { data: rawMesures, isLoading: mesuresLoading } = useSWR("/api/mesures", fetcher);
  const { data: rawAlertes, isLoading: alertesLoading } = useSWR("/api/alertes", fetcher);
  const { data: rawBassins = [], isLoading: bassinsLoading } = useSWR("/api/bassins", fetcher);

  const mesures = Array.isArray(rawMesures) ? rawMesures : [];
  const alertes = Array.isArray(rawAlertes) ? rawAlertes : [];
  const bassins = Array.isArray(rawBassins) ? rawBassins : [];
  const [selectedBassin, setSelectedBassin] = useState<string>("");

  // Initialiser selectedBassin avec le premier bassin disponible
  useEffect(() => {
    if (bassins.length > 0 && selectedBassin === "") {
      const firstBassin = bassins[0];
      const initialValue = firstBassin._id || firstBassin.nom || firstBassin.name || "";
      setSelectedBassin(initialValue);
    }
  }, [bassins]);

  const mesuresArray = Array.isArray(mesures) ? mesures : [];
  const alertesArray = Array.isArray(alertes) ? alertes : [];

  const filteredMesures = selectedBassin 
    ? mesuresArray.filter((item: any) => (item.bassinId || item.bassin || item.nomBassin) === selectedBassin)
    : mesuresArray;

  const filteredAlertes = selectedBassin
    ? alertesArray.filter((item: any) => (item.bassinId || item.bassin || item.nomBassin) === selectedBassin)
    : alertesArray;

  const temperatureData = filteredMesures
    .filter((item: any) => item.param === "Température")
    .slice(-10)
    .map((item: any) => ({
      date: new Date(item.date).toLocaleTimeString(),
      value: parseFloat((item.value || "").replace(/[^\d.\-]/g, "")),
    }));

  const alertesParType = [
    { name: "Avertissements", value: filteredAlertes.filter((a: any) => a.type === "warning").length, color: "#f59e0b" },
    { name: "Erreurs", value: filteredAlertes.filter((a: any) => a.type === "error").length, color: "#ef4444" },
    { name: "Info", value: filteredAlertes.filter((a: any) => !a.type).length, color: "#3b82f6" },
  ];

  const derniereMesures = filteredMesures.slice(0, 5);

  const tachesEnCours = [
    { id: 1, titre: "Vérification pH Bassin 2", statut: "en_cours", priorite: "haute", temps: "15 min" },
    { id: 2, titre: "Maintenance capteur O2", statut: "planifie", priorite: "moyenne", temps: "30 min" },
    { id: 3, titre: "Contrôle température", statut: "termine", priorite: "basse", temps: "5 min" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900 relative overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 md:px-6 py-4 sm:py-6 mb-6 lg:mb-8 sticky top-16 lg:top-0 z-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white p-[1px] rounded-xl flex items-center justify-center shadow-md border border-cyan-100">
                <Activity className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">Dashboard Opérateur</h1>
                <p className="text-xs sm:text-sm text-cyan-700 mt-1 font-semibold font-mono uppercase tracking-wide bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 inline-block">
                  BlueTrace Tech System
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedBassin} 
              onChange={(e) => setSelectedBassin(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-sm cursor-pointer hover:bg-gray-50"
            >
              {bassinsLoading ? (
                <option>Chargement...</option>
              ) : (
                bassins.map((b: any) => (
                  <option key={b._id} value={b._id || b.nom || b.name}>
                    {b.nom || b.name || b._id}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 lg:p-8 relative z-10 w-full max-w-full overflow-x-hidden pt-24 lg:pt-6">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 lg:mb-10">
          {[
            { title: "Alertes actives", value: alertesArray.filter((a: any) => a.type === "error").length.toString(), icon: <AlertTriangle />, trend: "À traiter", color: "from-rose-500 to-red-600", colorShadow: "shadow-rose-500/20" },
            { title: "Tâches en cours", value: tachesEnCours.filter(t => t.statut === "en_cours").length.toString(), icon: <Clock />, trend: "3 planifiées", color: "from-blue-500 to-indigo-600", colorShadow: "shadow-blue-500/20" },
            { title: "Systèmes OK", value: "11/12", icon: <CheckCircle />, trend: "1 en maintenance", color: "from-emerald-500 to-teal-600", colorShadow: "shadow-emerald-500/20" },
            { title: "Efficacité", value: "94.2%", icon: <TrendingUp />, trend: "+1.8%", color: "from-cyan-500 to-blue-600", colorShadow: "shadow-cyan-500/20" }
          ].map((kpi, index) => (
            <div key={index} className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full group hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{kpi.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <p className="text-xs font-bold text-cyan-600 mt-1 uppercase tracking-wider">{kpi.trend}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} ${kpi.colorShadow} flex items-center justify-center text-white shadow-md`}>
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks and Interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 lg:mb-10">
          <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-600" /> Tâches en cours
            </h3>
            <div className="space-y-4">
              {tachesEnCours.map((tache) => (
                <div key={tache.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-800">{tache.titre}</p>
                      <p className="text-xs font-semibold text-gray-500 font-mono mt-1 uppercase tracking-tight">{tache.temps}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      tache.priorite === 'haute' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      tache.priorite === 'moyenne' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {tache.priorite}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" /> Actions Rapides
            </h3>
            <div className="space-y-4">
              <button className="w-full p-4 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all text-left shadow-sm">
                <p className="font-bold text-rose-600 text-sm uppercase tracking-wider mb-1">Alerte Critique</p>
                <p className="text-sm text-gray-600">pH Bassin 2 trop bas</p>
              </button>
              <button className="w-full p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all text-left shadow-sm">
                <p className="font-bold text-amber-600 text-sm uppercase tracking-wider mb-1">Maintenance</p>
                <p className="text-sm text-gray-600">Capteur O2 à vérifier</p>
              </button>
            </div>
          </div>

          <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" /> Équipements
            </h3>
            <div className="space-y-4">
              {[
                { label: "Capteurs température", status: "OK", color: "text-emerald-600" },
                { label: "Capteur O2 Bassin 2", status: "MAINT", color: "text-amber-600" },
                { label: "Système filtration", status: "OK", color: "text-emerald-600" },
                { label: "Pompes aération", status: "OK", color: "text-emerald-600" }
              ].map((eq, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-sm font-semibold text-gray-600">{eq.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${eq.color} px-2 py-0.5 rounded bg-white shadow-sm border border-gray-100`}>{eq.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-tight">Température (°C)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} unit="°" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: '#0f172a' }}
                    itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: '#0ea5e9', r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} shadow-sm />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-tight">Répartition Alertes</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={alertesParType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                    {alertesParType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}