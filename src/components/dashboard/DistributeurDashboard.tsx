"use client";

import { Card } from "@/components/ui/card";
import useSWR from "swr";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, BarChart, Bar, Cell, PieChart, Pie 
} from "recharts";
import { 
  ShoppingCart, BadgeCheck, Package, TrendingUp, 
  CheckCircle, ArrowRight, Wallet, History, Search, QrCode
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DistributeurDashboard() {
  const { data: ventes = [], isLoading: ventesLoading } = useSWR("/api/ventes", fetcher);
  const { data: lots = [], isLoading: lotsLoading } = useSWR("/api/lots", fetcher);

  const salesData = Array.isArray(ventes) ? ventes : [];
  const lotsData = Array.isArray(lots) ? lots : [];

  // Statistiques
  const totalSales = salesData.reduce((acc: number, v: any) => acc + (v.montant || 0), 0);
  const totalWeight = salesData.reduce((acc: number, v: any) => acc + (v.quantite || 0), 0);
  const pendingCerts = salesData.filter((v: any) => !v.certificatGenere).length;
  const activeLotsCount = lotsData.filter((l: any) => l.statut === "actif" && l.quantite > 0).length;

  // Préparation des données pour le graphique des ventes (7 derniers jours)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const daySales = salesData.filter((v: any) => new Date(v.date || v.createdAt).toISOString().split('T')[0] === date);
    return {
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      ventes: daySales.reduce((acc: number, v: any) => acc + (v.montant || 0), 0),
      quantite: daySales.reduce((acc: number, v: any) => acc + (v.quantite || 0), 0)
    };
  });

  // Récupérer les 5 dernières ventes
  const recentSales = salesData.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-6 sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white p-[1px] rounded-xl flex items-center justify-center shadow-md border border-cyan-100">
              <ShoppingCart className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">Dashboard Distributeur</h1>
              <p className="text-sm text-cyan-700 mt-1 font-semibold font-mono uppercase tracking-wide bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 inline-block">
                Gestion Commerciale & Traçabilité
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Link href="/ventes" className="px-6 py-2 bg-cyan-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                <ShoppingCart size={18} /> Nouvelle Vente
             </Link>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-10 space-y-10">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Chiffre d'Affaires", value: `${totalSales.toLocaleString()} DZ`, icon: <Wallet />, color: "from-cyan-500 to-blue-600" },
            { title: "Volume Vendu", value: `${totalWeight.toLocaleString()} kg`, icon: <TrendingUp />, color: "from-purple-500 to-indigo-600" },
            { title: "Lots Disponibles", value: activeLotsCount.toString(), icon: <Package />, color: "from-emerald-500 to-teal-600" },
            { title: "Certificats à émettre", value: pendingCerts.toString(), icon: <BadgeCheck />, color: "from-amber-500 to-orange-600" }
          ].map((kpi, i) => (
            <div key={i} className="bg-white shadow-sm border border-gray-100 rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all border-b-4 border-b-cyan-500/20">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
                  <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-lg`}>
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white shadow-sm border border-gray-100 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <History className="text-cyan-600" size={20} /> Tendances des Ventes
               </h3>
               <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Ventes (DZ)</span>
               </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ventes" 
                    stroke="#0891b2" 
                    strokeWidth={4} 
                    dot={{ fill: '#0891b2', r: 4 }} 
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Available Stock Summary */}
          <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-2">
               <Package className="text-emerald-600" size={20} /> Stock Disponible
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {lotsData.filter(l => l.statut === "actif").slice(0, 6).map((lot: any) => (
                 <div key={lot._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                    <div>
                       <p className="font-bold text-slate-800 text-sm">{lot.nom}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lot.espece}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-emerald-600 text-sm">{lot.quantite} kg</p>
                    </div>
                 </div>
               ))}
               {lotsData.length === 0 && (
                 <div className="text-center py-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Aucun lot disponible
                 </div>
               )}
            </div>
            <Link href="/lots" className="mt-8 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-cyan-200 hover:text-cyan-600 transition-all">
               Voir tout l'inventaire <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-3xl overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                 <History className="text-cyan-600" size={20} /> Dernières Ventes effectueés
              </h3>
              <Link href="/ventes" className="text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:underline">Voir l'historique complet</Link>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50">
                    <tr>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lot</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantité</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {recentSales.map((vente: any) => (
                       <tr key={vente._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                             <p className="font-bold text-slate-800">{vente.client}</p>
                             <p className="text-[10px] text-slate-400 font-mono">{new Date(vente.date || vente.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                <span className="font-bold text-slate-700">{vente.lotName}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 font-black text-slate-600">{vente.quantite} kg</td>
                          <td className="px-8 py-5 font-black text-cyan-600">{vente.montant.toLocaleString()} DZ</td>
                          <td className="px-8 py-5 text-right">
                             <Link href={`/public/tracabilite/${vente.lotId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-cyan-600 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest">
                                <QrCode size={14} /> Certificat
                             </Link>
                          </td>
                       </tr>
                    ))}
                    {recentSales.length === 0 && (
                       <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                             Aucune vente enregistrée
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
