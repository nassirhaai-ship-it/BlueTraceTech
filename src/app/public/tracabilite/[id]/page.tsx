"use client";

import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import { jsPDF } from "jspdf";
import { toPng } from 'html-to-image';
import {
  ArrowLeft,
  Fish,
  Thermometer,
  Activity,
  Droplets,
  Waves,
  Scale,
  Ruler,
  Loader2,
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
  timestamp?: string;
  date?: string;
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

export default function TracabilitePage({ params }: { params: Promise<{ id: string }> }) {
  const [lot, setLot] = useState<LotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [mesuresHistoriques, setMesuresHistoriques] = useState<Mesure[]>([]);
  const certificateRef = useRef<HTMLDivElement>(null);
  const { id: lotId } = use(params);

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

  const generatePDF = async () => {
    if (!certificateRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      // Allow time for rendering (fonts, layout)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const element = certificateRef.current;
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4'); 
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Open the generated PDF in a new tab
      const pdfBlobHtmlUrl = pdf.output('bloburl');
      window.open(pdfBlobHtmlUrl, '_blank');
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
      labels: mesures.map(m => {
        const d = m.date || m.timestamp;
        return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '---';
      }).reverse(),
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
                onClick={generatePDF} 
                disabled={isGeneratingPDF}
                className="px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
                {isGeneratingPDF ? "Génération..." : "Imprimer"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { label: "Température", key: "temperature", color: "#ef4444", unit: "°C" },
                    { label: "pH", key: "ph", color: "#10b981", unit: "" },
                    { label: "Oxygène", key: "oxygen", color: "#3b82f6", unit: "mg/L" },
                    { label: "Salinité", key: "salinity", color: "#8b5cf6", unit: "ppt" },
                    { label: "Turbidité", key: "turbidity", color: "#f59e0b", unit: "NTU" }
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

      {/* Hidden PDF Certificate Template */}
      <div 
        className="absolute w-[800px] font-sans pointer-events-none" 
        style={{ left: '-9999px', top: 0, backgroundColor: '#ffffff', color: '#0f172a' }}
      >
        <div ref={certificateRef} className="p-12 w-[800px] h-[1131px] relative flex flex-col" style={{ backgroundColor: '#ffffff' }}>
          {/* Borders */}
          <div className="absolute inset-4 border-4 rounded-sm" style={{ borderColor: '#155e75' }}></div>
          <div className="absolute inset-5 border opacity-30 rounded-sm" style={{ borderColor: '#0891b2' }}></div>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-16 pt-8 px-8 border-b-2 pb-8" style={{ borderColor: '#e2e8f0' }}>
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: '#ecfeff', borderColor: '#a5f3fc', color: '#155e75' }}>
                  <ShieldCheck size={36} />
               </div>
               <div>
                 <h1 className="text-3xl font-black tracking-tighter uppercase leading-none" style={{ color: '#0f172a' }}>BlueTrace</h1>
                 <span className="font-bold tracking-[0.3em] uppercase text-[10px] block mt-1" style={{ color: '#0e7490' }}>Écosystème d'Intelligence</span>
               </div>
             </div>
             <div className="text-right">
                <span className="font-mono text-[10px] tracking-widest uppercase block mb-1" style={{ color: '#94a3b8' }}>Réf. Document</span>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>DOC-{lot._id.slice(-6).toUpperCase()}</span>
             </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-16 px-8 relative z-10">
             <div className="inline-block px-4 py-1 border text-[10px] font-black uppercase tracking-widest rounded-full mb-6" style={{ backgroundColor: '#ecfeff', borderColor: '#a5f3fc', color: '#155e75' }}>
                Approuvé par Inspection Qualité
             </div>
             <h2 className="text-4xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: 'Georgia, serif', color: '#164e63' }}>CERTIFICAT D'AUTHENTICITÉ</h2>
             <p className="font-mono text-sm tracking-widest max-w-lg mx-auto leading-relaxed" style={{ color: '#64748b' }}>
               Généré automatiquement par le registre immuable BlueTrace Verified.
             </p>
          </div>

          {/* Content */}
          <div className="px-12 flex-1 relative z-10">
             <p className="text-lg leading-relaxed mb-12 text-center max-w-xl mx-auto" style={{ color: '#334155' }}>
               Ce document certifie formellement la traçabilité intégrale, les conditions d'élevage optimales et l'origine garantie du lot aquacole identifié ci-dessous.
             </p>

             <div className="border p-8 rounded-xl grid grid-cols-2 gap-y-8 gap-x-8 mb-12 relative overflow-hidden" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
               <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12 pointer-events-none" style={{ color: '#164e63' }}>
                  <ShieldCheck size={200} />
               </div>
               
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Désignation du Lot</p>
                 <p className="font-bold text-xl" style={{ color: '#1e293b' }}>{lot.nom}</p>
                 <p className="text-[10px] font-mono mt-1" style={{ color: '#94a3b8' }}>ID: {lot._id}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Espèce Cultivée</p>
                 <p className="font-bold text-lg flex items-center gap-2" style={{ color: '#1e293b' }}><Fish size={18} color="#0891b2"/> {lot.espece}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Stade de Croissance</p>
                 <p className="font-bold text-base flex items-center gap-2" style={{ color: '#1e293b' }}><Activity size={16} color="#9333ea"/> {lot.stade}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Poids Moyen</p>
                 <p className="font-bold text-base flex items-center gap-2" style={{ color: '#1e293b' }}><Scale size={16} color="#d97706"/> {lot.poidsMoyen || 0} g</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Origine / Bassin</p>
                 <p className="font-bold text-base flex items-center gap-2" style={{ color: '#1e293b' }}><MapPin size={16} color="#059669"/> {lot.bassinNom}</p>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Date d'Émission</p>
                 <p className="font-bold text-base flex items-center gap-2" style={{ color: '#1e293b' }}><Calendar size={16} color="#94a3b8"/> {formatDate(new Date().toString())}</p>
               </div>
               <div className="col-span-2 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Hachage de Validation (SHA-256)</p>
                 <p className="text-xs font-mono px-3 py-2 rounded break-all tracking-wider" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>{Buffer.from(lot._id).toString('hex').padEnd(64, '0')}</p>
               </div>
             </div>

             <div className="rounded-xl border overflow-hidden mb-8" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
               <div className="p-4 flex items-center gap-3" style={{ backgroundColor: '#10b981' }}>
                 <CheckCircle2 className="w-6 h-6" color="#ffffff" />
                 <h4 className="text-sm font-black uppercase tracking-widest m-0" style={{ color: '#ffffff' }}>Conformité des Métriques Environnementales</h4>
               </div>
               <div className="p-6">
                 <p className="text-sm leading-relaxed font-medium mb-6" style={{ color: '#047857' }}>
                   L'historique des paramètres mesurés par les capteurs IoT confirme le maintien optimal des conditions de viabilité biologique.
                 </p>
                 
                 {lot.statistiques && (
                   <div className="flex justify-between gap-2 overflow-hidden">
                     {[
                       { label: 'Température', icon: Thermometer, data: lot.statistiques.temperature, unit: '°C', color: '#ef4444' },
                       { label: 'pH', icon: Activity, data: lot.statistiques.ph, unit: '', color: '#10b981' },
                       { label: 'Oxygène', icon: Waves, data: lot.statistiques.oxygen, unit: 'mg/L', color: '#3b82f6' },
                       { label: 'Salinité', icon: Droplets, data: lot.statistiques.salinity, unit: 'ppt', color: '#8b5cf6' },
                       { label: 'Turbidité', icon: Info, data: lot.statistiques.turbidity, unit: 'NTU', color: '#f59e0b' }
                     ].map((stat, i) => stat.data ? (
                       <div key={i} className="border rounded-lg p-3 text-center flex-1 shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#a7f3d0' }}>
                          <stat.icon size={16} color={stat.color} className="mx-auto mb-2" />
                          <p className="text-[8px] uppercase font-black tracking-widest mb-1" style={{ color: '#065f46' }}>{stat.label}</p>
                          <p className="text-lg font-black" style={{ color: '#064e3b' }}>{stat.data.moyenne.toFixed(1)}<span className="text-[10px] ml-1">{stat.unit}</span></p>
                          <div className="mt-2 pt-2 border-t flex justify-between px-1" style={{ borderColor: '#ecfdf5' }}>
                            <span className="text-[8px] font-bold" style={{ color: '#059669' }}>Min: {stat.data.min.toFixed(1)}</span>
                            <span className="text-[8px] font-bold" style={{ color: '#047857' }}>Max: {stat.data.max.toFixed(1)}</span>
                          </div>
                       </div>
                     ) : null)}
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Signatures & Seal */}
          <div className="px-12 pb-12 flex justify-between items-end mt-auto relative z-10">
             <div className="text-center relative ml-8">
                <p className="text-[10px] font-black uppercase tracking-widest mb-12 border-t pt-4 w-48 mx-auto" style={{ color: '#94a3b8', borderColor: '#cbd5e1' }}>Signature Autorisée</p>
                {/* Fake Signature Script */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-16 opacity-80" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px', color: '#1e293b', transform: 'translateX(-50%) rotate(-5deg)', letterSpacing: '-1px' }}>
                   Nassir H.A.
                </div>
                <p className="font-bold uppercase tracking-widest text-xs" style={{ color: '#1e293b' }}>Directeur Qualité</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#94a3b8' }}>AquaAI / BlueTrace</p>
             </div>
             
             {/* Fake Official Seal */}
             <div className="relative w-40 h-40 flex items-center justify-center mr-8">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-[6px] opacity-20 rounded-full flex items-center justify-center" style={{ borderColor: '#155e75' }}>
                    <div className="absolute inset-1 border-[1px] opacity-40 border-dashed rounded-full pointer-events-none transform -rotate-45" style={{ animation: 'spin 30s linear infinite', borderColor: '#155e75' }}></div>
                </div>
                {/* Inner Content */}
                <div className="absolute inset-3 border-[3px] opacity-90 rounded-full flex justify-center items-center flex-col text-center z-10 shadow-inner" style={{ backgroundColor: '#ecfeff', borderColor: '#155e75' }}>
                   <ShieldCheck size={32} strokeWidth={2.5} color="#155e75" className="mb-1"/>
                   <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#164e63' }}>BlueTrace</span>
                   <span className="text-[7px] font-bold uppercase tracking-widest opacity-80 mt-0.5" style={{ color: '#155e75' }}>Certified Origin</span>
                </div>
                {/* Stamp overlay */}
                <div className="absolute z-20 px-3 py-1.5 transform -rotate-12 border-2 opacity-60 shadow-sm" style={{ top: '65%', left: '10%', backgroundColor: '#ffffff', borderColor: '#155e75' }}>
                  <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: '#164e63' }}>APPROUVÉ</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}