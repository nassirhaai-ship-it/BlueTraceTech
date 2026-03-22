"use client";

import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { useSession } from "next-auth/react";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ArrowUpRight, 
  BadgeCheck, 
  Download, 
  Clock, 
  MoreHorizontal,
  ChevronRight,
  QrCode,
  Tag,
  Calendar,
  Layers,
  CheckCircle2,
  X,
  Plus,
  Trash,
  Loader2,
  AlertCircle,
  Printer,
  ChevronDown,
  Users
} from "lucide-react";
import Link from "next/link";

interface Sale {
  _id: string;
  lotId: string;
  lotName: string;
  client: string;
  date: string;
  quantite: number;
  montant: number;
  statut: "termine" | "en_attente" | "annule";
  certificatGenere: boolean;
}

interface Lot {
  _id: string;
  nom: string;
  quantite: number;
  statut: string;
}

interface Client {
  _id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  fiscal?: {
    rc: string;
    nif: string;
    nis: string;
    ai: string;
  };
}

export default function VentesPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSale, setNewSale] = useState({
    lotId: "",
    client: "",
    quantite: 0,
    montant: 0
  });
  const [modalError, setModalError] = useState<string | null>(null);
  
  const [clientSearch, setClientSearch] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const filteredClients = clients.filter(c => (c.nom || "").toLowerCase().includes((clientSearch || "").toLowerCase()));
  
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);
  const [printingClient, setPrintingClient] = useState<Client | null>(null);

  const handlePrintInvoice = async (sale: Sale) => {
    setPrintingSale(sale);
    const foundClient = clients.find(c => c.nom === sale.client) || null;
    setPrintingClient(foundClient);

    // Allow the DOM to render the selected sale into the hidden invoice template
    setTimeout(async () => {
      if (!invoiceRef.current) {
        setPrintingSale(null);
        setPrintingClient(null);
        return;
      }
      try {
        const dataUrl = await toPng(invoiceRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (invoiceRef.current.offsetHeight * pdfWidth) / invoiceRef.current.offsetWidth;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        window.open(pdf.output('bloburl'), '_blank');
      } catch (error) {
        console.error("Error generating invoice PDF:", error);
        setToast({ type: "error", message: "Erreur lors de l'impression de la facture." });
      } finally {
        setPrintingSale(null);
        setPrintingClient(null);
      }
    }, 300);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, lotsRes, clientsRes] = await Promise.all([
        fetch("/api/ventes"),
        fetch("/api/lots"),
        fetch("/api/clients")
      ]);
      
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }
      
      if (lotsRes.ok) {
        const lotsData = await lotsRes.json();
        setLots(lotsData);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setToast({ type: "error", message: "Impossible de charger les données" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null); // Clear previous errors
    if (!newSale.lotId || !newSale.client || newSale.quantite <= 0 || newSale.montant <= 0) {
      setModalError("Veuillez remplir tous les champs correctement");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedLot = lots.find(l => l._id === newSale.lotId);
      const res = await fetch("/api/ventes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSale,
          lotName: selectedLot?.nom || "Lot inconnu"
        })
      });

      if (res.ok) {
        setToast({ type: "success", message: "Vente enregistrée avec succès" });
        setShowAddModal(false);
        setNewSale({ lotId: "", client: "", quantite: 0, montant: 0 });
        fetchData();
      } else {
        const error = await res.json();
        setModalError(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      setToast({ type: "error", message: "Erreur serveur" });
      setModalError("Erreur serveur lors de l'enregistrement de la vente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQR = async (lotId: string, saleId: string) => {
    setQrLoadingId(saleId);
    try {
      const res = await fetch(`/api/lots/${lotId}/qrcode?saleId=${saleId}`);
      if (res.ok) {
        setToast({ type: "success", message: "Certificat généré avec succès" });
        fetchData();
      } else {
        setToast({ type: "error", message: "Erreur lors de la génération" });
      }
    } catch (error) {
      setToast({ type: "error", message: "Erreur serveur" });
    } finally {
      setQrLoadingId(null);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette vente ?")) return;
    
    try {
      const res = await fetch(`/api/ventes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: "Vente supprimée" });
        fetchData();
      }
    } catch (error) {
      setToast({ type: "error", message: "Erreur lors de la suppression" });
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + ' DZ';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredSales = sales.filter(s => 
    s.lotName?.toLowerCase().includes(search.toLowerCase()) ||
    s.client?.toLowerCase().includes(search.toLowerCase())
  );

  // Mathématiques réelles pour les tendances (Mois par rapport au mois précédent)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthSales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const previousMonthSales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && 
           d.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
  });

  const calculateTrend = (current: number, previous: number, format: 'percent' | 'absolute' = 'percent') => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = current - previous;
    if (format === 'absolute') return diff > 0 ? `+${diff}` : `${diff}`;
    const percent = (diff / previous) * 100;
    return percent > 0 ? `+${percent.toFixed(1)}%` : `${percent.toFixed(1)}%`;
  };

  const trendVentes = calculateTrend(
    currentMonthSales.reduce((acc, s) => acc + s.montant, 0),
    previousMonthSales.reduce((acc, s) => acc + s.montant, 0)
  );

  const trendCertificats = calculateTrend(
    currentMonthSales.filter(s => s.certificatGenere).length,
    previousMonthSales.filter(s => s.certificatGenere).length
  );

  const trendVolume = calculateTrend(
    currentMonthSales.reduce((acc, s) => acc + s.quantite, 0),
    previousMonthSales.reduce((acc, s) => acc + s.quantite, 0)
  );

  const trendClients = calculateTrend(
    new Set(currentMonthSales.map(s => s.client)).size,
    new Set(previousMonthSales.map(s => s.client)).size,
    'absolute'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 lg:p-12 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-gray-900 font-medium">{toast.message}</span>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-tight">
              Gestion des Ventes & Certificats
            </h1>
            <p className="text-gray-600 mt-1">Suivi commercial et traçabilité des ventes</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setModalError(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Nouvelle Vente
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Ventes totales", value: formatCurrency(sales.reduce((acc, s) => acc + s.montant, 0)), icon: <Tag className="w-6 h-6" />, color: "from-cyan-500 to-blue-500", trend: trendVentes },
            { label: "Certificats émis", value: sales.filter(s => s.certificatGenere).length.toString(), icon: <BadgeCheck className="w-6 h-6" />, color: "from-green-500 to-emerald-500", trend: trendCertificats },
            { label: "Volume vendu", value: `${sales.reduce((acc, s) => acc + s.quantite, 0)} kg`, icon: <Layers className="w-6 h-6" />, color: "from-purple-500 to-indigo-500", trend: trendVolume },
            { label: "Clients enregistrés", value: clients.length.toString(), icon: <Users className="w-6 h-6" />, color: "from-blue-500 to-cyan-500", trend: trendClients },
          ].map((stat, i) => (
            <div key={i} className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs font-bold text-green-600 mt-1 uppercase tracking-wider">{stat.trend}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Rechercher une vente, un client or un lot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
              />
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Réf. Vente</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Lot / Produit</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Client</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Date</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Montant</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 h-16 bg-gray-50"></td>
                    </tr>
                  ))
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50 transition-colors border-b">
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono font-bold text-gray-500">#{sale._id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{sale.lotName}</span>
                          <span className="text-[10px] font-bold text-gray-500 font-mono">{sale.quantite}kg</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-gray-900">{sale.client}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} className="text-cyan-600" />
                          <span className="text-xs">{formatDate(sale.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-cyan-700">{formatCurrency(sale.montant)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {sale.certificatGenere ? (
                            <Link 
                              href={`/public/tracabilite/${sale.lotId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Voir le certificat"
                            >
                              <BadgeCheck size={16} /> Certificat
                            </Link>
                          ) : (
                            <button 
                              onClick={() => handleGenerateQR(sale.lotId, sale._id)}
                              disabled={qrLoadingId === sale._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Générer certificat"
                            >
                              {qrLoadingId === sale._id ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={16} />} Certifier
                            </button>
                          )}
                          <button 
                            onClick={() => handlePrintInvoice(sale)}
                            disabled={printingSale?._id === sale._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Imprimer Facture"
                          >
                            {printingSale?._id === sale._id ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                          </button>
                          <button 
                            onClick={() => handleDeleteSale(sale._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingCart className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500 text-lg font-medium">Aucune vente trouvée</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Nouvelle Vente Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-cyan-600" size={24} /> Nouvelle Vente
            </h2>

            <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowAddModal(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleCreateSale} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Sélection du Lot</label>
              <select 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                value={newSale.lotId}
                onChange={(e) => setNewSale({...newSale, lotId: e.target.value})}
                required
              >
                <option value="">Choisir un lot...</option>
                {lots
                  .filter(lot => lot.statut === "actif" && lot.quantite > 0)
                  .map(lot => (
                    <option key={lot._id} value={lot._id}>{lot.nom} ({lot.quantite} kg dispos)</option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 relative">
              <label className="text-sm font-medium text-gray-700">Client</label>
              <div 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer bg-white flex justify-between items-center hover:border-gray-400 transition-colors"
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              >
                <span className={`font-medium ${newSale.client ? 'text-black' : 'text-gray-500'}`}>
                  {newSale.client || "Sélectionner un client..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isClientDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsClientDropdownOpen(false)}></div>
                  <div className="absolute top-[100%] mt-2 left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 flex flex-col py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="px-2 pb-2 pt-2 border-b border-gray-100 flex-shrink-0 relative z-50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="text"
                          placeholder="Rechercher un client..."
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:outline-none"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1.5 relative z-50">
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <div 
                            key={client._id}
                            className="px-3 py-2.5 hover:bg-cyan-50 cursor-pointer rounded-lg text-sm font-medium text-black transition-colors flex items-center justify-between"
                            onClick={() => {
                              setNewSale({...newSale, client: client.nom});
                              setIsClientDropdownOpen(false);
                              setClientSearch("");
                            }}
                          >
                            <span>{client.nom}</span>
                            {newSale.client === client.nom && <CheckCircle2 size={16} className="text-cyan-600" />}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-6 text-center text-sm text-gray-500">Aucun client trouvé</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Quantité (kg)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                  value={newSale.quantite}
                  onChange={(e) => setNewSale({...newSale, quantite: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Montant (DZ)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                  value={newSale.montant}
                  onChange={(e) => setNewSale({...newSale, montant: Number(e.target.value)})}
                  required
                />
              </div>
            </div>

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="shrink-0" size={18} /> 
                <span>{modalError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Enregistrer la vente"}
            </button>
          </form>
        </Modal>
      )}

      {/* Hidden Invoice Template */}
      {printingSale && (
        <div 
          className="absolute w-[800px] font-sans pointer-events-none" 
          style={{ left: '-9999px', top: 0, backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          <div ref={invoiceRef} className="p-12 w-[800px] h-[1131px] relative flex flex-col" style={{ backgroundColor: '#ffffff' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b-2 pb-8" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none" style={{ color: '#0f172a' }}>BlueTrace Tech</h1>
                <span className="font-bold tracking-[0.3em] uppercase text-xs block mt-1" style={{ color: '#0891b2' }}>Écosystème d'Intelligence</span>
                <div className="mt-4 text-sm font-medium" style={{ color: '#64748b' }}>
                  Zone Industrielle Aquacole, Lot 42<br />
                  Alger, Algérie<br />
                  contact@bluetrace.tech
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black uppercase mb-2" style={{ color: '#0891b2' }}>FACTURE</h2>
                <div className="inline-block px-3 py-1 rounded font-mono font-bold text-sm mb-2" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                  N° INV-{printingSale._id.slice(-6).toUpperCase()}
                </div>
                <p className="text-sm font-medium" style={{ color: '#64748b' }}>Date: {new Date(printingSale.date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-12 p-6 rounded-xl border grid grid-cols-2 gap-6" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Facturé à</p>
                <p className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>{printingSale.client}</p>
                {printingClient && printingClient.adresse && (
                  <p className="text-sm font-medium mb-1 line-clamp-2" style={{ color: '#64748b' }}>{printingClient.adresse}</p>
                )}
                {printingClient && printingClient.telephone && (
                  <p className="text-sm font-medium" style={{ color: '#64748b' }}>Tél: {printingClient.telephone}</p>
                )}
              </div>
              {printingClient && printingClient.fiscal && (
                <div className="text-right flex flex-col items-end justify-center">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-left" style={{ color: '#475569' }}>
                    {printingClient.fiscal.nif && <><span className="font-bold text-right uppercase tracking-widest">NIF:</span><span className="font-mono">{printingClient.fiscal.nif}</span></>}
                    {printingClient.fiscal.nis && <><span className="font-bold text-right uppercase tracking-widest">NIS:</span><span className="font-mono">{printingClient.fiscal.nis}</span></>}
                    {printingClient.fiscal.rc && <><span className="font-bold text-right uppercase tracking-widest">RC:</span><span className="font-mono">{printingClient.fiscal.rc}</span></>}
                    {printingClient.fiscal.ai && <><span className="font-bold text-right uppercase tracking-widest">AI:</span><span className="font-mono">{printingClient.fiscal.ai}</span></>}
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="mb-12 border rounded-xl overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-widest" style={{ color: '#64748b' }}>Description</th>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-widest text-center" style={{ color: '#64748b' }}>Quantité</th>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-widest text-right" style={{ color: '#64748b' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t" style={{ borderColor: '#e2e8f0' }}>
                    <td className="py-6 px-6">
                      <p className="font-bold text-base mb-1" style={{ color: '#0f172a' }}>Lot Aquacole: {printingSale.lotName}</p>
                      <p className="text-xs font-mono" style={{ color: '#64748b' }}>Réf Lot: {printingSale.lotId}</p>
                    </td>
                    <td className="py-6 px-6 text-center font-bold" style={{ color: '#0891b2' }}>
                      {printingSale.quantite} kg
                    </td>
                    <td className="py-6 px-6 text-right font-black text-lg" style={{ color: '#0f172a' }}>
                      {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(printingSale.montant)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-16">
              <div className="w-1/2 rounded-xl p-6" style={{ backgroundColor: '#f8fafc' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold" style={{ color: '#64748b' }}>Sous-total</span>
                  <span className="font-bold" style={{ color: '#0f172a' }}>{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(printingSale.montant)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b" style={{ borderColor: '#e2e8f0' }}>
                  <span className="text-sm font-bold" style={{ color: '#64748b' }}>TVA (0%)</span>
                  <span className="font-bold" style={{ color: '#0f172a' }}>0,00 DZD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black uppercase tracking-widest" style={{ color: '#0891b2' }}>Total TTC</span>
                  <span className="text-2xl font-black" style={{ color: '#0f172a' }}>{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(printingSale.montant)}</span>
                </div>
              </div>
            </div>

            {/* Footer / Stamp */}
            <div className="mt-auto pt-8 border-t flex justify-between items-end relative" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: '#64748b' }}>Merci de votre confiance.</p>
                <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>Pour toute question, contactez le support BlueTrace Tech.</p>
              </div>
              <div className="text-center relative">
                {/* Stamp */}
                <div className="absolute right-12 bottom-4 transform rotate-12 opacity-80 pointer-events-none">
                  <div className="border-[4px] rounded-full w-32 h-32 flex items-center justify-center flex-col" style={{ borderColor: '#10b981', color: '#10b981' }}>
                    <span className="text-xl font-black uppercase tracking-widest mt-2">PAYÉ</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest mt-1">BlueTrace Tech</span>
                  </div>
                </div>
                <p className="text-xs font-black uppercase tracking-widest mb-8 text-transparent">Signature</p>
                <p className="font-bold uppercase tracking-widest text-xs" style={{ color: '#0f172a' }}>Direction Financière</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>BlueTrace Tech</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
