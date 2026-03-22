"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Fish,
  Thermometer,
  Activity,
  Droplets,
  Waves,
  Scale,
  Ruler,
  Calendar,
  Info,
  Award,
  CheckCircle2,
  LineChart,
  Download,
  Clipboard,
  Share2,
  ShieldCheck,
  QrCode,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Mesure {
  _id: string;
  timestamp: string;
  temperature: number;
  ph: number;
  oxygen: number;
  salinity: number;
  turbidity: number;
}

interface LotData {
  _id: string;
  nom: string;
  espece: string;
  quantite: number;
  dateCreation: string;
  stade: string;
  statut: string;
  poidsMoyen: number;
  tailleMoyenne: number;
  bassinId?: string;
  bassinNom: string;
  bassinType?: string;
  bassinVolume?: number;
  dateRecolteEstimee?: string;
  mesures?: Mesure[];
  statistiques?: {
    temperature?: { min: number; max: number; moyenne: number };
    ph?: { min: number; max: number; moyenne: number };
    oxygen?: { min: number; max: number; moyenne: number };
    salinity?: { min: number; max: number; moyenne: number };
    turbidity?: { min: number; max: number; moyenne: number };
  };
}

export default function TracabilitePage({ params }: { params: { id: string } }) {
  const [lot, setLot] = useState<LotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [mesuresHistoriques, setMesuresHistoriques] = useState<Mesure[]>([]);
  const certificateRef = useRef<HTMLDivElement>(null);
  const lotId = params.id;

  useEffect(() => {
    const fetchLotData = async () => {
      try {
        const response = await fetch(`/api/lots/public/${lotId}`);
        if (!response.ok) throw new Error("Lot non trouvé");
        const data = await response.json();
        setLot(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Erreur serveur");
        setLoading(false);
      }
    };
    fetchLotData();
  }, [lotId]);

  const formatDate = (d: string | undefined) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "---";

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: 'rgba(0, 0, 0, 0.4)' } },
      x: { grid: { display: false }, ticks: { color: 'rgba(0, 0, 0, 0.4)' } }
    }
  };

  const getChartData = (mesures: Mesure[] | undefined, metrique: string, color: string) => {
    if (!mesures || mesures.length === 0) return null;
    return {
      labels: mesures.map(m => new Date(m.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })).reverse(),
      datasets: [{
        label: metrique,
        data: mesures.map(m => m[metrique as keyof Mesure] as number).reverse(),
        borderColor: color,
        backgroundColor: `${color}10`,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      }]
    };
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-cyan-600 uppercase tracking-widest animate-pulse">Chargement Traçabilité...</div>;

  if (error || !lot) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="text-rose-500 mb-6 flex justify-center"><ShieldCheck size={64} /></div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{error || "Lot introuvable"}</h1>
        <Link href="/" className="inline-block px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Retour Accueil</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500/30">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-100/50 to-transparent pointer-events-none"></div>

      <header className="relative pt-16 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center text-cyan-600 backdrop-blur-xl">
                  <ShieldCheck size={28} />
                </div>
                <h1 className="text-sm font-black text-cyan-600 uppercase tracking-[0.3em]">Certificat d'Authenticité Digital</h1>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                BlueTrace <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700">Verified.</span>
              </h2>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => window.print()} 
                className="px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:shadow-md transition-all flex items-center gap-2"
              >
                <Download size={16} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="premium-card !bg-white !p-8 !border-slate-200 shadow-xl rounded-3xl">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-10">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">{lot.nom}</h3>
                   <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                      <QrCode size={14} className="text-cyan-600" />
                      ID: {lot._id}
                   </div>
                </div>
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                  Statut: {lot.statut || "Actif"}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {[
                  { label: "Espèce", value: lot.espece, icon: <Fish className="text-blue-600" /> },
                  { label: "Phase", value: lot.stade, icon: <Activity className="text-purple-600" /> },
                  { label: "Poids Moy.", value: `${lot.poidsMoyen || 0}g`, icon: <Scale className="text-amber-600" /> },
                  { label: "Taille Moy.", value: `${lot.tailleMoyenne || 0}cm`, icon: <Ruler className="text-emerald-600" /> }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400">
                      {item.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Milieu de culture</h4>
                <div className="flex items-center gap-4 p-4 bg-cyan-50 border border-cyan-100 rounded-2xl">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-cyan-700 uppercase tracking-widest">Bassin Source</p>
                    <p className="font-bold text-slate-700">{lot.bassinNom}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental History */}
            {lot.mesures && lot.mesures.length > 0 && (
              <div className="premium-card !bg-white !border-slate-200 shadow-xl rounded-3xl p-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Historique Environnemental</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: "Température", key: "temperature", color: "#ef4444", unit: "°C" },
                    { label: "Oxygène", key: "oxygen", color: "#3b82f6", unit: "mg/L" }
                  ].map(m => (
                    <div key={m.key} className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
                        <span className="text-sm font-bold text-slate-800">{lot.statistiques?.[m.key as keyof typeof lot.statistiques]?.moyenne || 0}{m.unit} <span className="text-[10px] text-slate-400">(moy)</span></span>
                      </div>
                      <div className="h-40">
                         <Line data={getChartData(lot.mesures, m.key, m.color)!} options={chartOptions} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="premium-card !border-cyan-200 !bg-gradient-to-br !from-cyan-50 !to-blue-50 shadow-xl rounded-3xl p-8">
              <Award className="text-cyan-600 mb-6" size={48} />
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-none">Technologie BlueTrace.</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">Ce lot est monitoré par le système autonomique de BlueTrace Tech, garantissant une intégrité absolue des données de traçabilité.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-emerald-600">
                  <CheckCircle2 size={16} /> DONNÉES INALTÉRABLES
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-emerald-600">
                  <CheckCircle2 size={16} /> ORIGINE CERTIFIÉE
                </div>
              </div>
            </div>

            <div className="premium-card !bg-white !border-slate-200 shadow-lg rounded-2xl p-6">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Validation Blockchain</h4>
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[10px] break-all text-slate-500">
                  HASH: {Buffer.from(lot._id).toString('hex').padEnd(64, '0').slice(0, 64)}
               </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
           <div className="flex justify-center items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-cyan-600">
                <ShieldCheck size={18} />
              </div>
              <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">BlueTrace Tech</span>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">© 2026 BlueTrace Tech — Ecosystem of Intelligence</p>
        </div>
      </footer>
    </div>
  );
}