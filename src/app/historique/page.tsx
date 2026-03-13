"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useState, useRef, useEffect } from "react";
import { Download, RefreshCw, RotateCcw, Calendar, BarChart3, Zap, Activity, History } from "lucide-react";
import React from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Composant réutilisable pour un graphique de paramètre avec données temps réel
function ParametreChart({ title, data, color, unit, seuil }: { title: string, data: any[], color: string, unit?: string, seuil?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            minTickGap={40}
            tickFormatter={(value) => {
              if (!value) return '';
              const date = new Date(value);
              return date.toLocaleTimeString();
            }}
          />
          <YAxis domain={[0, 'auto']} unit={unit} />
          <Tooltip 
            labelFormatter={(value) => {
              if (!value) return '';
              const date = new Date(value);
              return date.toLocaleString();
            }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          {seuil && <ReferenceLine y={seuil} label={`Seuil (${seuil})`} stroke="red" strokeDasharray="3 3" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Historique() {
  const { data: historique, isLoading, error, mutate } = useSWR("/api/historique", fetcher);
  const { data: bassins = [] } = useSWR("/api/bassins", fetcher);
  const [periode, setPeriode] = useState("tout");
  const [bassin, setBassin] = useState("tout");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [realtimeMesures, setRealtimeMesures] = useState<any[]>([]);
  const wsToken = process.env.NEXT_PUBLIC_IOT_WS_TOKEN || '';
  // Utiliser l'URL WebSocket depuis les variables d'environnement ou localhost par défaut
  const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? 
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:4001` : 
    'ws://localhost:4001');
  const wsUrl = `${wsBaseUrl}/?token=${wsToken}&type=web`;
  const wsRef = useRef<WebSocket | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [parametre, setParametre] = useState("tout");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Connexion WebSocket pour mesures temps réel
  useEffect(() => {
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'mesure' || data.mac) {
          // Format direct avec toutes les propriétés nécessaires pour la table
          const formattedData = {
            mac: data.mac,
            date: data.timestamp || data.date || new Date().toISOString(),
            bassinId: data.bassinId || data.bassin,
            temperature: typeof data.temperature !== 'undefined' ? data.temperature : undefined,
            ph: typeof data.ph !== 'undefined' ? data.ph : undefined,
            oxygen: typeof data.oxygen !== 'undefined' ? data.oxygen : undefined,
            salinity: typeof data.salinity !== 'undefined' ? data.salinity : undefined,
            turbidity: typeof data.turbidity !== 'undefined' ? data.turbidity : undefined
          };
          
          setRealtimeMesures(prev => {
            const newMesures = [...prev, formattedData];
            // Garder seulement les 100 dernières mesures
            const limitedMesures = newMesures.slice(-100);
            setLastUpdate(new Date());
            return limitedMesures;
          });
        }
      } catch (error) {
        console.error("Erreur parsing WebSocket:", error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("Erreur WebSocket:", error);
    };

    wsRef.current.onclose = () => {
    };

    return () => { 
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  // Fusionne les mesures REST et temps réel pour la table
  const allMesures = [...(historique || []), ...realtimeMesures];
  const sortedMesures = allMesures.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Applique les filtres de période, de bassin et de paramètre sur les données fusionnées
  const filteredAllMesures = sortedMesures.filter((item: any) => {
    // Filtre période
    if (periode !== "tout") {
      const itemDate = new Date(item.date);
      const now = new Date();
      const diffHours = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
      if (periode === "jour" && diffHours > 24) return false;
      if (periode === "semaine" && diffHours > 168) return false;
      if (periode === "mois" && diffHours > 720) return false;
    }
    
    // Filtre date personnalisée
    if (dateDebut || dateFin) {
      const itemDate = new Date(item.date);
      if (dateDebut) {
        const debut = new Date(dateDebut);
        debut.setHours(0, 0, 0, 0);
        if (itemDate < debut) return false;
      }
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        if (itemDate > fin) return false;
      }
    }
    
    // Filtre bassin par _id
    if (bassin !== "tout") {
      const bassinId = item.bassinId || item.bassin;
      if (bassinId !== bassin) return false;
    }
    // Filtre paramètre
    if (parametre !== "tout") {
      let param = item.param;
      if (!param) {
        if (typeof item.temperature !== 'undefined') param = 'Temperature';
        else if (typeof item.ph !== 'undefined') param = 'pH';
        else if (typeof item.oxygen !== 'undefined') param = 'Oxygen';
        else if (typeof item.salinity !== 'undefined') param = 'Salinity';
        else if (typeof item.turbidity !== 'undefined') param = 'Turbidity';
        else param = '-';
      }
      if (param !== parametre) return false;
    }
    return true;
  });
  const totalPages = Math.ceil(filteredAllMesures.length / itemsPerPage);
  const tableData = filteredAllMesures.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Résumé basé sur toutes les données filtrées
  const nbMesures = filteredAllMesures.filter((item: any) => item.param || typeof item.temperature !== 'undefined').length;
  const nbAlertes = filteredAllMesures.filter((item: any) => item.message).length;
  const periodeLabel = {
    tout: "toute la période",
    jour: "24h",
    semaine: "7 jours",
    mois: "30 jours"
  }[periode];

  // Export CSV - même format que le tableau
  function exportCSV() {
    // Créer les données groupées exactement comme dans le tableau
    const allMesures = [...filteredAllMesures, ...realtimeMesures];
    
    const getBassinName = (bassinId: string) => {
      if (!bassinId) return 'Bassin inconnu';
      if (bassins && Array.isArray(bassins)) {
        const found = bassins.find((b: any) => b._id === bassinId || b.nom === bassinId || b.name === bassinId);
        if (found) return found.nom || found.name || found._id;
      }
      return bassinId;
    };
    
    const groupedMesures = allMesures.reduce((acc: any[], item: any) => {
      if (item.message) return acc;
      
      const dateISO = item.date ? new Date(item.date).toISOString() : "";
      const dateDisplay = item.date ? new Date(item.date).toLocaleString() : "";
      const bassinId = item.bassin || item.bassinId;
      const bassinNom = getBassinName(bassinId);
      
      const key = `${dateISO}_${bassinNom}`;
      const existing = acc.find(row => row.key === key);
      
      if (existing) {
        if (typeof item.temperature !== 'undefined' && item.temperature !== null) {
          existing.temperature = `${item.temperature}°C`;
        }
        if (typeof item.ph !== 'undefined' && item.ph !== null) {
          existing.ph = item.ph.toString();
        }
        if (typeof item.oxygen !== 'undefined' && item.oxygen !== null) {
          existing.oxygen = `${item.oxygen} mg/L`;
        }
        if (typeof item.salinity !== 'undefined' && item.salinity !== null) {
          existing.salinity = `${item.salinity} ppt`;
        }
        if (typeof item.turbidity !== 'undefined' && item.turbidity !== null) {
          existing.turbidity = `${item.turbidity} NTU`;
        }
      } else {
        const newRow: any = {
          key,
          date: dateDisplay,
          bassin: bassinNom,
          temperature: '',
          ph: '',
          oxygen: '',
          salinity: '',
          turbidity: '',
          dateISO
        };
        
        if (typeof item.temperature !== 'undefined' && item.temperature !== null) {
          newRow.temperature = `${item.temperature}°C`;
        }
        if (typeof item.ph !== 'undefined' && item.ph !== null) {
          newRow.ph = item.ph.toString();
        }
        if (typeof item.oxygen !== 'undefined' && item.oxygen !== null) {
          newRow.oxygen = `${item.oxygen} mg/L`;
        }
        if (typeof item.salinity !== 'undefined' && item.salinity !== null) {
          newRow.salinity = `${item.salinity} ppt`;
        }
        if (typeof item.turbidity !== 'undefined' && item.turbidity !== null) {
          newRow.turbidity = `${item.turbidity} NTU`;
        }
        
        acc.push(newRow);
      }
      
      return acc;
    }, []);
    
    const allLines = groupedMesures.sort((a, b) => 
      new Date(b.dateISO || b.date).getTime() - new Date(a.dateISO || a.date).getTime()
    );
    
    const csv = [
      ["Date", "Bassin", "Temperature", "pH", "Oxygen", "Salinity", "Turbidity"],
      ...allLines.map((row: any) => [
        row.date || "",
        row.bassin || "",
        row.temperature || "-",
        row.ph || "-",
        row.oxygen || "-",
        row.salinity || "-",
        row.turbidity || "-"
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historique.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filtrer et formater les données pour chaque paramètre (incluant les données temps réel)
  const temperatureData = [...filteredAllMesures, ...realtimeMesures]
    .filter((item: any) => {
      const param = item.param || '';
      return param.includes('Temperature') || param.includes('temperature') || typeof item.temperature !== 'undefined';
    })
    .map((item: any) => ({
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      value: parseFloat((item.value || item.temperature || "0").toString().replace(/[^\d.\-]/g, "")),
    }))
    .filter(item => !isNaN(item.value) && item.value !== 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const phData = [...filteredAllMesures, ...realtimeMesures]
    .filter((item: any) => {
      const param = item.param || '';
      return param.includes('pH') || param.includes('ph') || typeof item.ph !== 'undefined';
    })
    .map((item: any) => ({
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      value: parseFloat((item.value || item.ph || "0").toString().replace(/[^\d.\-]/g, "")),
    }))
    .filter(item => !isNaN(item.value) && item.value !== 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const oxygenData = [...filteredAllMesures, ...realtimeMesures]
    .filter((item: any) => {
      const param = item.param || '';
      return param.includes('Oxygen') || param.includes('oxygen') || param.includes('Oxygen') || typeof item.oxygen !== 'undefined';
    })
    .map((item: any) => ({
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      value: parseFloat((item.value || item.oxygen || "0").toString().replace(/[^\d.\-]/g, "")),
    }))
    .filter(item => !isNaN(item.value) && item.value !== 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const salinityData = [...filteredAllMesures, ...realtimeMesures]
    .filter((item: any) => {
      const param = item.param || '';
      return param.includes('Salinity') || param.includes('salinity') || typeof item.salinity !== 'undefined';
    })
    .map((item: any) => ({
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      value: parseFloat((item.value || item.salinity || "0").toString().replace(/[^\d.\-]/g, "")),
    }))
    .filter(item => !isNaN(item.value) && item.value !== 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const turbidityData = [...filteredAllMesures, ...realtimeMesures]
    .filter((item: any) => {
      const param = item.param || '';
      return param.includes('Turbidity') || param.includes('turbidity') || typeof item.turbidity !== 'undefined';
    })
    .map((item: any) => ({
      date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
      value: parseFloat((item.value || item.turbidity || "0").toString().replace(/[^\d.\-]/g, "")),
    }))
    .filter(item => !isNaN(item.value) && item.value !== 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5 lg:gap-6">
        {/* Header avec titre et actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Historique
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Données historiques et mesures du système</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-gray-500 block font-medium">Dernière mise à jour</span>
              <span className="text-sm font-bold text-gray-900">{lastUpdate.toLocaleTimeString()}</span>
            </div>
            <button 
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                mutate();
                setLastUpdate(new Date());
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Résumé rapide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Période affichée</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{periodeLabel}</p>
                <p className="text-xs sm:text-sm mt-1 text-green-600 truncate">Période</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Mesures</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{nbMesures}</p>
                <p className="text-xs sm:text-sm mt-1 text-green-600 truncate">Total mesuré</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Mesures temps réel</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{realtimeMesures.length}</p>
                <p className="text-xs sm:text-sm mt-1 text-green-600 truncate">Temps réel</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Dernière mise à jour</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{lastUpdate.toLocaleTimeString()}</p>
                <p className="text-xs sm:text-sm mt-1 text-green-600 truncate">Active</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de filtres moderne */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {/* Période */}
            <div className="w-full sm:w-[160px]">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Période</label>
            <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Tout</SelectItem>
                <SelectItem value="jour">Dernières 24h</SelectItem>
                <SelectItem value="semaine">Dernière semaine</SelectItem>
                <SelectItem value="mois">Dernier mois</SelectItem>
                  <SelectItem value="personnalise">Personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
            {/* Date personnalisée */}
            {periode === "personnalise" && (
              <>
                <div className="w-full sm:w-[160px]">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date début</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="w-full sm:w-[160px]">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date fin</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  />
                </div>
              </>
            )}
            
            {/* Bassin */}
            <div className="w-full sm:w-[160px]">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Bassin</label>
            <Select value={bassin} onValueChange={setBassin}>
                <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Tous</SelectItem>
                {bassins.map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>{b.nom || b.name || b._id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
            
            {/* Paramètre */}
            <div className="w-full sm:w-[180px]">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Paramètre</label>
            <Select value={parametre} onValueChange={setParametre}>
                <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Tous</SelectItem>
                <SelectItem value="Temperature">Temperature</SelectItem>
                <SelectItem value="pH">pH</SelectItem>
                <SelectItem value="Oxygen">Oxygen</SelectItem>
                <SelectItem value="Salinity">Salinity</SelectItem>
                <SelectItem value="Turbidity">Turbidity</SelectItem>
              </SelectContent>
            </Select>
            </div>
            
            {/* Bouton Réinitialiser */}
            <div className="w-full sm:w-auto flex items-end">
              <button 
                className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 h-[42px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                onClick={() => {
                  setPeriode("tout");
                  setBassin("tout");
                  setParametre("tout");
                  setDateDebut("");
                  setDateFin("");
                  setPage(1);
                }}
              >
                <RotateCcw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Graphiques temps réel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ParametreChart title="Temperature" data={temperatureData} color="#06b6d4" unit="°C" seuil={25} />
          <ParametreChart title="pH" data={phData} color="#f59e42" unit="" seuil={8.5} />
          <ParametreChart title="Oxygen" data={oxygenData} color="#10b981" unit="mg/L" seuil={5} />
          <ParametreChart title="Salinity" data={salinityData} color="#8b5cf6" unit="ppt" seuil={20} />
          <ParametreChart title="Turbidity" data={turbidityData} color="#ef4444" unit="NTU" seuil={10} />
        </div>

        {/* Tableau mesures moderne */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" /> 
                <span>Mesures</span>
              </h2>
              <button 
                onClick={exportCSV}
                className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              >
                <Download className="w-4 h-4" /> 
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 sm:p-3 text-left whitespace-nowrap">Date</th>
                <th className="p-2 sm:p-3 text-left whitespace-nowrap hidden sm:table-cell">Bassin</th>
                <th className="p-2 sm:p-3 text-left whitespace-nowrap">Temperature</th>
                <th className="p-2 sm:p-3 text-left whitespace-nowrap">pH</th>
                <th className="p-2 sm:p-3 text-left whitespace-nowrap">Oxygen</th>
                <th className="p-2 sm:p-3 text-left whitespace-nowrap hidden md:table-cell">Salinity</th>
                <th className="p-2 sm:p-3 text-left whitespace-nowrap hidden md:table-cell">Turbidity</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Traiter toutes les mesures
                const allMesures = [...filteredAllMesures, ...realtimeMesures];
                
                // Fonction pour obtenir le nom du bassin
                const getBassinName = (bassinId: string) => {
                  if (!bassinId) return 'Bassin inconnu';
                  if (bassins && Array.isArray(bassins)) {
                    const found = bassins.find((b: any) => b._id === bassinId || b.nom === bassinId || b.name === bassinId);
                    if (found) return found.nom || found.name || found._id;
                  }
                  return bassinId;
                };
                
                // Grouper les mesures par date et bassin
                const groupedMesures = allMesures.reduce((acc: any[], item: any) => {
                  // Ignorer les alertes
                  if (item.message) return acc;
                  
                  // Utiliser l'ISO string pour la clé de tri
                  const dateISO = item.date ? new Date(item.date).toISOString() : "";
                  const dateDisplay = item.date ? new Date(item.date).toLocaleString() : "";
                  const bassinId = item.bassin || item.bassinId;
                  const bassinNom = getBassinName(bassinId);
                  
                  // Clé unique : date (ISO) + bassin
                  const key = `${dateISO}_${bassinNom}`;
                  const existing = acc.find(row => row.key === key);
                  
                  if (existing) {
                    // Mettre à jour avec les nouvelles valeurs si elles existent
                    if (typeof item.temperature !== 'undefined' && item.temperature !== null) {
                      existing.temperature = `${item.temperature}°C`;
                    }
                    if (typeof item.ph !== 'undefined' && item.ph !== null) {
                      existing.ph = item.ph.toString();
                    }
                    if (typeof item.oxygen !== 'undefined' && item.oxygen !== null) {
                      existing.oxygen = `${item.oxygen} mg/L`;
                    }
                    if (typeof item.salinity !== 'undefined' && item.salinity !== null) {
                      existing.salinity = `${item.salinity} ppt`;
                    }
                    if (typeof item.turbidity !== 'undefined' && item.turbidity !== null) {
                      existing.turbidity = `${item.turbidity} NTU`;
                    }
                  } else {
                    // Créer une nouvelle ligne
                    const newRow: any = {
                      key,
                      date: dateDisplay,
                      bassin: bassinNom,
                      temperature: '',
                      ph: '',
                      oxygen: '',
                      salinity: '',
                      turbidity: '',
                      dateISO // Garder l'ISO pour le tri
                    };
                    
                    // Ajouter les valeurs si elles existent
                    if (typeof item.temperature !== 'undefined' && item.temperature !== null) {
                      newRow.temperature = `${item.temperature}°C`;
                    }
                    if (typeof item.ph !== 'undefined' && item.ph !== null) {
                      newRow.ph = item.ph.toString();
                    }
                    if (typeof item.oxygen !== 'undefined' && item.oxygen !== null) {
                      newRow.oxygen = `${item.oxygen} mg/L`;
                    }
                    if (typeof item.salinity !== 'undefined' && item.salinity !== null) {
                      newRow.salinity = `${item.salinity} ppt`;
                    }
                    if (typeof item.turbidity !== 'undefined' && item.turbidity !== null) {
                      newRow.turbidity = `${item.turbidity} NTU`;
                    }
                    
                    acc.push(newRow);
                  }
                  
                  return acc;
                }, []);
                
                // Trier par date décroissante
                const allLines = groupedMesures.sort((a, b) => 
                  new Date(b.dateISO || b.date).getTime() - new Date(a.dateISO || a.date).getTime()
                );
                
                const tableData = allLines.slice((page - 1) * itemsPerPage, page * itemsPerPage);
                
                if (tableData.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <History className="w-12 h-12 text-gray-300" />
                          <span className="text-gray-500 text-lg font-medium">Aucune mesure trouvée</span>
                          <span className="text-gray-400 text-sm">Essayez de modifier vos filtres</span>
                        </div>
                      </td>
                    </tr>
                  );
                }
                
                return tableData.map((row: any, i: number) => (
                  <tr key={row.key || i} className="border-b hover:bg-gray-50">
                    <td className="p-2 sm:p-3 text-xs sm:text-sm whitespace-nowrap">{row.date}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-900 hidden sm:table-cell">{row.bassin}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-cyan-600 font-medium">{row.temperature || '-'}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-orange-500 font-medium">{row.ph || '-'}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-green-600 font-medium">{row.oxygen || '-'}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-purple-600 font-medium hidden md:table-cell">{row.salinity || '-'}</td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-red-500 font-medium hidden md:table-cell">{row.turbidity || '-'}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
          </div>
          {/* Pagination */}
          {(() => {
            const groupedMesures = [...filteredAllMesures, ...realtimeMesures].reduce((acc: any[], item: any) => {
              if (item.message) return acc;
              const date = item.date ? new Date(item.date).toLocaleString() : "";
              const bassinId = item.bassin || item.bassinId;
              let bassinNom = '';
              if (bassinId && bassins && Array.isArray(bassins)) {
                const found = bassins.find((b: any) => b._id === bassinId || b.nom === bassinId || b.name === bassinId);
                if (found) bassinNom = found.nom || found.name || found._id;
                else bassinNom = bassinId;
              }
              const key = `${date}_${bassinNom}`;
              const existing = acc.find(row => row.key === key);
              if (!existing) {
                acc.push({ key, date, bassin: bassinNom });
              }
              return acc;
            }, []);
            const totalPages = Math.ceil(groupedMesures.length / itemsPerPage);
            
            return totalPages > 1 ? (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> sur <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Précédent
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Suivant
                </button>
              </div>
            </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
} 
