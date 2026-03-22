"use client";

import { useState, useEffect } from "react";
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
  AlertCircle
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

export default function VentesPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSale, setNewSale] = useState({
    lotId: "",
    client: "",
    quantite: 0,
    montant: 0
  });
  const [modalError, setModalError] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, lotsRes] = await Promise.all([
        fetch("/api/ventes"),
        fetch("/api/lots")
      ]);
      
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }
      
      if (lotsRes.ok) {
        const lotsData = await lotsRes.json();
        setLots(lotsData);
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
            { label: "Ventes totales", value: formatCurrency(sales.reduce((acc, s) => acc + s.montant, 0)), icon: <Tag className="w-6 h-6" />, color: "from-cyan-500 to-blue-500", trend: "+12.5%" },
            { label: "Certificats émis", value: sales.filter(s => s.certificatGenere).length.toString(), icon: <BadgeCheck className="w-6 h-6" />, color: "from-green-500 to-emerald-500", trend: "+8.2%" },
            { label: "Volume vendu", value: `${sales.reduce((acc, s) => acc + s.quantite, 0)} kg`, icon: <Layers className="w-6 h-6" />, color: "from-purple-500 to-indigo-500", trend: "+5.1%" },
            { label: "Clients actifs", value: new Set(sales.map(s => s.client)).size.toString(), icon: <CheckCircle2 className="w-6 h-6" />, color: "from-blue-500 to-cyan-500", trend: "+2" },
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

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Client</label>
              <input 
                type="text"
                placeholder="Nom du client..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                value={newSale.client}
                onChange={(e) => setNewSale({...newSale, client: e.target.value})}
                required
              />
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
