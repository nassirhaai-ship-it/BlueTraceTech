"use client";

import { Card } from "@/components/ui/card";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Eye, BarChart3, TrendingUp, Download, Filter, Activity, AlertTriangle, Database, Zap, Target } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ObservateurDashboard() {
  const { data: rawMesures, mutate: refreshMesures } = useSWR("/api/mesures", fetcher);
  const { data: rawAlertes, mutate: refreshAlertes } = useSWR("/api/alertes", fetcher);
  const { data: iotStatus } = useSWR("/api/iot/status", fetcher);

  const mesures = Array.isArray(rawMesures) ? rawMesures : [];
  const alertes = Array.isArray(rawAlertes) ? rawAlertes : [];
  
  const [selectedBassin, setSelectedBassin] = useState("all");
  const [selectedParam, setSelectedParam] = useState("temperature");

  const mesuresArray = Array.isArray(mesures) ? mesures : [];
  const alertesArray = Array.isArray(alertes) ? alertes : [];

  const getChartData = (param: string) => {
    return mesuresArray
      .filter((item: any) => {
        const paramMatch = param === 'temperature' ? item.temperature !== undefined :
                          param === 'ph' ? item.ph !== undefined :
                          param === 'oxygen' ? item.oxygen !== undefined :
                          param === 'salinity' ? item.salinity !== undefined :
                          param === 'turbidity' ? item.turbidity !== undefined : false;
        const bassinMatch = selectedBassin === "all" || (item.bassinId || item.bassin) === selectedBassin;
        return paramMatch && bassinMatch;
      })
      .slice(-20)
      .map((item: any) => ({
        date: new Date(item.date).toLocaleTimeString(),
        value: parseFloat(item[param] || "0"),
      }));
  };

  const chartData = getChartData(selectedParam);

  const stats = {
    totalMesures: mesuresArray.length,
    alertesJour: alertesArray.length,
    iotConnectes: iotStatus?.stats?.online || 0,
    totalIoT: iotStatus?.stats?.total || 0,
    qualiteDonnees: "98.7%",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900 relative overflow-hidden">
      <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 md:px-6 py-4 sm:py-6 mb-6 lg:mb-8 sticky top-16 lg:top-0 z-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] rounded-xl flex items-center justify-center">
                <div className="w-full h-full bg-background rounded-[11px] flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Dashboard Observateur</h1>
                <p className="text-xs sm:text-sm text-cyan-700 mt-1 font-semibold font-mono uppercase tracking-wide bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 inline-block shadow-sm">
                  BlueTrace Tech System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Mesures totales", value: stats.totalMesures.toString(), icon: <Database />, color: "from-blue-500 to-indigo-600" },
            { title: "Alertes (24h)", value: stats.alertesJour.toString(), icon: <AlertTriangle />, color: "from-rose-500 to-red-600" },
            { title: "IoT Connectés", value: `${stats.iotConnectes}/${stats.totalIoT}`, icon: <Zap />, color: "from-emerald-500 to-teal-600" },
            { title: "Qualité données", value: stats.qualiteDonnees, icon: <Target />, color: "from-cyan-500 to-blue-600" }
          ].map((kpi, i) => (
            <div key={i} className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Analyse Temporelle</h3>
              <select 
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-sm"
              >
                <option value="temperature">Température</option>
                <option value="ph">pH</option>
                <option value="oxygen">Oxygène</option>
              </select>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" /> Rapports
              </h3>
              <div className="space-y-3">
                {['Quotidien', 'Hebdomadaire', 'Mensuel'].map((rep, i) => (
                  <button key={i} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all text-left flex items-center justify-between group shadow-sm">
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-cyan-700 transition-colors">{rep}</span>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-cyan-600" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-white shadow-md border border-gray-100 rounded-2xl p-4 sm:p-5 lg:p-6 w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Tendances
              </h3>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Stabilité</p>
                <p className="text-2xl font-bold text-gray-900">+2.1% <span className="text-xs font-medium text-gray-500 lowercase">vs hier</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}