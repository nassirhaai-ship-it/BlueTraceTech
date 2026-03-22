"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, FileText, Edit, Trash, QrCode, X, Fish, Tag, Loader2, Info, Save, AlertCircle, Search, CheckCircle } from "lucide-react";

interface Lot {
  _id: string;
  nom: string;
  espece: string;
  quantite: number;
  dateCreation: string;
  bassinNom: string;
  stade: string;
  statut: string;
  qrCodeGenere: boolean;
  poidsMoyen?: number;
  tailleMoyenne?: number;
  bassinId?: string;
  dateRecolte?: string;
  notes?: string;
}

interface Bassin {
  _id: string;
  nom: string;
}

export default function LotsPage() {
  const { data: session } = useSession();
  
  // Protection accès : seuls admin, opérateur et distributeur peuvent accéder
  if (session && !["admin", "operateur", "distributeur"].includes(session.user?.role || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h1>
          <p className="text-gray-600">Cette page est réservée aux administrateurs et opérateurs.</p>
        </div>
      </div>
    );
  }

  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ qrCodeImage: string; qrCodeUrl: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLot, setDetailLot] = useState<Lot | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // État pour la modal d'édition de lot
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLot, setEditLot] = useState<Lot | null>(null);
  const [editFormData, setEditFormData] = useState({
    nom: "",
    espece: "",
    quantite: 0,
    bassinId: "",
    stade: "alevin",
    poidsMoyen: 0,
    tailleMoyenne: 0,
    notes: ""
  });
  const [editingLot, setEditingLot] = useState(false);
  const [bassins, setBassins] = useState<Bassin[]>([]);
  const [loadingBassins, setLoadingBassins] = useState(false);
  
  // État pour la modal d'ajout de lot
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDelete, setShowDelete] = useState<Lot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingLot, setAddingLot] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: "",
    espece: "",
    quantite: 0,
    bassinId: "",
    stade: "alevin",
    poidsMoyen: 0,
    tailleMoyenne: 0
  });
  
  const router = useRouter();
  
  // Récupérer tous les lots
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await fetch("/api/lots");
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les lots");
        }
        
        const data = await response.json();
        setLots(data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des lots");
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchLots();
  }, []);
  
  // Récupérer la liste des bassins quand la modal est ouverte
  useEffect(() => {
    if (showAddModal || showEditModal) {
      const fetchBassins = async () => {
        setLoadingBassins(true);
        try {
          const response = await fetch("/api/bassins");
          
          if (!response.ok) {
            throw new Error("Impossible de récupérer les bassins");
          }
          
          const data = await response.json();
          setBassins(data);
        } catch (err) {
          console.error("Erreur lors du chargement des bassins:", err);
        } finally {
          setLoadingBassins(false);
        }
      };
      
      fetchBassins();
    }
  }, [showAddModal, showEditModal]);
  
  // Toast auto-disparition
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  
  // Générer un QR code pour un lot
  const generateQRCode = async (lotId: string) => {
    setQrLoading(true);
    setSelectedLot(lotId);
    setShowQRModal(true);
    
    try {
      const response = await fetch(`/api/lots/${lotId}/qrcode`);
      
      if (!response.ok) {
        throw new Error("Impossible de générer le QR code");
      }
      
      const data = await response.json();
      setQrCodeData(data);
      
      // Mettre à jour l'état du lot dans la liste
      setLots(lots.map(lot => {
        if (lot._id === lotId) {
          return { ...lot, qrCodeGenere: true };
        }
        return lot;
      }));
      
      setToast({ type: "success", message: "QR Code généré avec succès" });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Erreur lors de la génération du QR Code" });
    } finally {
      setQrLoading(false);
    }
  };
  
  // Charger les détails d'un lot
  const loadLotDetail = async (lotId: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/lots/${lotId}`);
      
      if (!response.ok) {
        throw new Error("Impossible de récupérer les détails du lot");
      }
      
      const data = await response.json();
      setDetailLot(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Erreur lors du chargement des détails" });
    } finally {
      setLoadingDetail(false);
    }
  };
  
  // Charger les détails d'un lot pour l'édition
  const loadLotForEdit = async (lotId: string) => {
    setLoadingDetail(true);
    setSelectedLot(lotId);
    
    try {
      const response = await fetch(`/api/lots/${lotId}`);
      
      if (!response.ok) {
        throw new Error("Impossible de récupérer les détails du lot");
      }
      
      const data = await response.json();
      setEditLot(data);
      
      // Initialiser le formulaire d'édition avec les données du lot
      setEditFormData({
        nom: data.nom || "",
        espece: data.espece || "",
        quantite: data.quantite || 0,
        bassinId: data.bassinId || "",
        stade: data.stade || "alevin",
        poidsMoyen: data.poidsMoyen || 0,
        tailleMoyenne: data.tailleMoyenne || 0,
        notes: data.notes || ""
      });
      
      setShowEditModal(true);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Erreur lors du chargement des détails" });
    } finally {
      setLoadingDetail(false);
    }
  };
  
  // Gérer les changements dans le formulaire d'édition
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === "quantite" || name === "poidsMoyen" || name === "tailleMoyenne" 
        ? parseFloat(value) || 0 
        : value
    });
  };
  
  // Soumettre le formulaire d'édition
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editLot?._id) return;
    
    setEditingLot(true);
    
    try {
      const response = await fetch(`/api/lots/${editLot._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification du lot");
      }
      
      const updatedLot = await response.json();
      
      // Mettre à jour la liste des lots
      setLots(lots.map(lot => 
        lot._id === updatedLot._id ? updatedLot : lot
      ));
      
      setShowEditModal(false);
      setToast({ type: "success", message: "Lot modifié avec succès" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Une erreur est survenue lors de la modification du lot" });
    } finally {
      setEditingLot(false);
    }
  };
  
  // Soumettre le formulaire d'ajout de lot
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingLot(true);
    
    try {
      const response = await fetch("/api/lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création du lot");
      }
      
      const newLot = await response.json();
      
      // Ajouter le nouveau lot à la liste
      setLots([newLot, ...lots]);
      
      // Réinitialiser le formulaire et fermer la modal
      setFormData({
        nom: "",
        espece: "",
        quantite: 0,
        bassinId: "",
        stade: "alevin",
        poidsMoyen: 0,
        tailleMoyenne: 0
      });
      
      setShowAddModal(false);
      setToast({ type: "success", message: "Lot ajouté avec succès" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Une erreur est survenue lors de la création du lot" });
    } finally {
      setAddingLot(false);
    }
  };
  
  // Supprimer un lot
  async function handleDeleteLotConfirmed(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: "Lot supprimé" });
      setLots(lots.filter(lot => lot._id !== id));
    } catch {
      setToast({ type: "error", message: "Erreur lors de la suppression" });
    } finally {
      setDeletingId(null);
      setShowDelete(null);
    }
  }
  
  // Formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  // Pour badge de stade
  const stageBadge = (stade: string) => {
    switch (stade) {
      case "alevin": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Alevin</span>;
      case "juvenile": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Juvénile</span>;
      case "adulte": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Adulte</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{stade}</span>;
    }
  };
  
  // Pour badge de statut
  const statutBadge = (statut: string) => {
    switch (statut) {
      case "actif": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "recolte": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Récolté</span>;
      case "archive": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Archivé</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{statut}</span>;
    }
  };
  
  // Filtrer les lots
  const filteredLots = lots.filter((lot) =>
    lot.nom.toLowerCase().includes(search.toLowerCase()) ||
    lot.espece.toLowerCase().includes(search.toLowerCase()) ||
    lot.bassinNom.toLowerCase().includes(search.toLowerCase())
  );
  
  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredLots.length / itemsPerPage);
  const paginatedLots = filteredLots.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header avec titre */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Gestion des Lots
            </h1>
            <p className="text-gray-600 mt-1">Suivi et gestion des lots de poissons</p>
          </div>
        </div>
        
        {/* Cartes statistiques modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lots</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{lots.length}</p>
                <p className="text-sm mt-1 text-green-600">En production</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                <Fish className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lots Actifs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{lots.filter(l => l.statut === "actif").length}</p>
                <p className="text-sm mt-1 text-green-600">En cours</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Poissons</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{lots.reduce((sum, l) => sum + l.quantite, 0)}</p>
                <p className="text-sm mt-1 text-green-600">Stock total</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                <Tag className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Espèces uniques</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{new Set(lots.map(l => l.espece)).size}</p>
                <p className="text-sm mt-1 text-green-600">Diversité</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <Tag className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Toast moderne */}
        {toast && (
          <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5`}>
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-gray-900 font-medium">{toast.message}</span>
            <button 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setToast(null)}
            >
              <span className="sr-only">Fermer</span>
              ×
            </button>
            </div>
        )}
        
        {/* Lots */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Fish className="w-6 h-6 text-cyan-600" /> Lots
              </h2>
            <div className="flex gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                    placeholder="Rechercher un lot..." 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
                value={search} 
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(1);
                    }} 
              />
                </div>
              {session?.user?.role !== "distributeur" && (
                <button 
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                  onClick={() => setShowAddModal(true)}
                >
                    <Plus className="w-4 h-4" /> Ajouter un lot
                </button>
              )}
            </div>
          </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2 text-left">Espèce</th>
                  <th className="p-2 text-left">Bassin</th>
                  <th className="p-2 text-left">Quantité</th>
                  <th className="p-2 text-left">Stade</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        <span className="text-gray-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-red-600">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedLots.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Fish className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500 text-lg font-medium">Aucun lot trouvé</span>
                        <span className="text-gray-400 text-sm">Essayez de modifier votre recherche</span>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedLots.map((lot) => (
                  <tr key={lot._id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-cyan-600" />
                        <span className="font-semibold text-gray-900">{lot.nom}</span>
                      </div>
                    </td>
                    <td className="p-2 text-gray-600">{lot.espece}</td>
                    <td className="p-2 text-gray-900">{lot.bassinNom}</td>
                    <td className="p-2 text-gray-600">{lot.quantite}</td>
                    <td className="p-2">{stageBadge(lot.stade)}</td>
                    <td className="p-2 text-gray-600">{formatDate(lot.dateCreation)}</td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                      {session?.user?.role !== "distributeur" && (
                        <button 
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                          onClick={() => loadLotForEdit(lot._id)}
                          disabled={loadingDetail && selectedLot === lot._id}
                        >
                          <Edit className="w-4 h-4" /> Modifier
                        </button>
                      )}
                      <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                        onClick={() => generateQRCode(lot._id)}
                      >
                          <QrCode className="w-4 h-4" /> Certificat
                      </button>
                      {session?.user?.role !== "distributeur" && (
                        <button 
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => setShowDelete(lot)}
                          disabled={deletingId === lot._id}
                        >
                            <Trash className="w-4 h-4" /> {deletingId === lot._id ? "..." : "Supprimer"}
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </div>
        
        {/* Modal ajout lot moderne */}
        {showAddModal && (
          <Modal onClose={() => setShowAddModal(false)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 p-3 rounded-full">
                <Fish className="w-6 h-6 text-cyan-600" />
              </div>
                <h2 className="text-xl font-bold text-gray-900">Ajouter un lot</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="nom" className="text-sm font-medium text-gray-700">Nom du lot</label>
                <input
                  id="nom"
                  type="text"
                  name="nom"
                  placeholder="Nom du lot"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="espece" className="text-sm font-medium text-gray-700">Espèce</label>
                <input
                  id="espece"
                  type="text"
                  name="espece"
                  placeholder="Espèce"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.espece}
                  onChange={e => setFormData({ ...formData, espece: e.target.value })}
                  required
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="quantite" className="text-sm font-medium text-gray-700">Quantité</label>
                <input
                  id="quantite"
                  type="number"
                  name="quantite"
                  placeholder="Quantité"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.quantite}
                  onChange={e => setFormData({ ...formData, quantite: parseFloat(e.target.value) || 0 })}
                  required
                  min="1"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="bassinId" className="text-sm font-medium text-gray-700">Bassin</label>
                <select
                  id="bassinId"
                  name="bassinId"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.bassinId}
                  onChange={e => setFormData({ ...formData, bassinId: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un bassin</option>
                  {loadingBassins ? (
                    <option disabled>Chargement des bassins...</option>
                  ) : (
                    bassins.map(bassin => (
                      <option key={bassin._id} value={bassin._id}>
                        {bassin.nom}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="stade" className="text-sm font-medium text-gray-700">Stade de développement</label>
                <select
                  id="stade"
                  name="stade"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.stade}
                  onChange={e => setFormData({ ...formData, stade: e.target.value })}
                >
                  <option value="alevin">Alevin</option>
                  <option value="juvenile">Juvénile</option>
                  <option value="adulte">Adulte</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="poidsMoyen" className="text-sm font-medium text-gray-700">Poids moyen (g)</label>
                  <input
                    id="poidsMoyen"
                    type="number"
                    name="poidsMoyen"
                    placeholder="Poids moyen (g)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={formData.poidsMoyen}
                    onChange={e => setFormData({ ...formData, poidsMoyen: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="tailleMoyenne" className="text-sm font-medium text-gray-700">Taille moyenne (cm)</label>
                  <input
                    id="tailleMoyenne"
                    type="number"
                    name="tailleMoyenne"
                    placeholder="Taille moyenne (cm)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={formData.tailleMoyenne}
                    onChange={e => setFormData({ ...formData, tailleMoyenne: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4"
                disabled={addingLot}
              >
                {addingLot ? "Ajout..." : "Ajouter le lot"}
              </button>
            </form>
          </Modal>
        )}
        
        {/* Modal QR Code moderne */}
        {showQRModal && (
          <Modal onClose={() => setShowQRModal(false)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 p-3 rounded-full">
                <QrCode className="w-6 h-6 text-cyan-600" />
              </div>
                <h2 className="text-xl font-bold text-gray-900">QR Code du lot</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowQRModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {qrLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
              </div>
            ) : qrCodeData ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200">
                  <img src={qrCodeData.qrCodeImage} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-gray-600 text-center">Scannez ce QR code pour accéder aux informations de traçabilité</p>
                <div className="flex gap-3 w-full mt-2">
                  <a
                    href={qrCodeData.qrCodeImage}
                    download="qrcode.png"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 text-center font-medium"
                  >
                    Télécharger
                  </a>
                  <a
                    href={qrCodeData.qrCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 text-center font-medium"
                  >
                    Voir la page
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-red-600">Erreur lors de la génération du QR code</p>
            )}
          </Modal>
        )}
        
        {/* Modal confirmation suppression moderne */}
        {showDelete && (
          <Modal onClose={() => setShowDelete(null)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
                <h2 className="text-xl font-bold text-gray-900">Confirmer la suppression</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowDelete(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6 text-gray-700">
              Êtes-vous sûr de vouloir supprimer le lot <span className="font-semibold text-gray-900">{showDelete.nom}</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex-1 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteLotConfirmed(showDelete._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex-1 font-medium transition-colors"
                disabled={deletingId === showDelete._id}
              >
                {deletingId === showDelete._id ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </Modal>
        )}
        
        {/* Modal édition moderne */}
        {showEditModal && editLot && (
          <Modal onClose={() => setShowEditModal(false)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 p-3 rounded-full">
                <Edit className="w-6 h-6 text-cyan-600" />
              </div>
                <h2 className="text-xl font-bold text-gray-900">Modifier le lot</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowEditModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="edit-nom" className="text-sm font-medium text-gray-700">Nom du lot</label>
                  <input
                    id="edit-nom"
                    type="text"
                    name="nom"
                    placeholder="Nom du lot"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={editFormData.nom}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label htmlFor="edit-espece" className="text-sm font-medium text-gray-700">Espèce</label>
                  <input
                    id="edit-espece"
                    type="text"
                    name="espece"
                    placeholder="Espèce"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={editFormData.espece}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="edit-quantite" className="text-sm font-medium text-gray-700">Quantité</label>
                  <input
                    id="edit-quantite"
                    type="number"
                    name="quantite"
                    placeholder="Quantité"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={editFormData.quantite}
                    onChange={handleEditChange}
                    required
                    min="1"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label htmlFor="edit-bassinId" className="text-sm font-medium text-gray-700">Bassin</label>
                  <select
                    id="edit-bassinId"
                    name="bassinId"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={editFormData.bassinId}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {loadingBassins ? (
                      <option disabled>Chargement...</option>
                    ) : (
                      bassins.map(bassin => (
                        <option key={bassin._id} value={bassin._id}>
                          {bassin.nom}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="edit-stade" className="text-sm font-medium text-gray-700">Stade</label>
                  <select
                    id="edit-stade"
                    name="stade"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={editFormData.stade}
                    onChange={handleEditChange}
                  >
                    <option value="alevin">Alevin</option>
                    <option value="juvenile">Juvénile</option>
                    <option value="adulte">Adulte</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label htmlFor="edit-poidsMoyen" className="text-sm font-medium text-gray-700">Poids (g)</label>
                  <input
                    id="edit-poidsMoyen"
                    type="number"
                    name="poidsMoyen"
                    placeholder="Poids moyen"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={editFormData.poidsMoyen}
                    onChange={handleEditChange}
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label htmlFor="edit-tailleMoyenne" className="text-sm font-medium text-gray-700">Taille (cm)</label>
                  <input
                    id="edit-tailleMoyenne"
                    type="number"
                    name="tailleMoyenne"
                    placeholder="Taille moyenne"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={editFormData.tailleMoyenne}
                    onChange={handleEditChange}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="edit-notes" className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  placeholder="Notes sur ce lot"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-h-[60px] resize-none"
                  value={editFormData.notes}
                  onChange={handleEditChange}
                />
              </div>
              
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-3"
                disabled={editingLot}
              >
                {editingLot ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-6">
        {children}
        </div>
      </div>
    </div>
  );
} 
