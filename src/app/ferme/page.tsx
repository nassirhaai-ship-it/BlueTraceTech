"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, X, Edit2, Info, Droplets, Fish, CheckCircle, AlertCircle, UserCircle, BadgeCheck, KeyRound, Search, Power } from "lucide-react";

const mockFerme = { nom: "Ferme AquaAI", localisation: "Bretagne" };

export default function Ferme() {
  const { data: session } = useSession();
  
  // Protection accès : seuls admin et opérateur peuvent accéder
  if (session && session.user?.role !== "admin" && session.user?.role !== "operateur") {
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
  const [ferme, setFerme] = useState(mockFerme);
  const [showEditFerme, setShowEditFerme] = useState(false);
  const [editFerme, setEditFerme] = useState(ferme);
  // Bassins
  const [bassins, setBassins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddBassin, setShowAddBassin] = useState(false);
  const [showEditBassin, setShowEditBassin] = useState<any | null>(null);
  const [newBassin, setNewBassin] = useState({ nom: "", capacite: 0, especes: "", statut: "actif", stade: "" });
  const [editBassin, setEditBassin] = useState({ _id: "", nom: "", capacite: 0, especes: "", statut: "actif", stade: "" });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const [showDeleteBassin, setShowDeleteBassin] = useState<any | null>(null);

  // Charger les bassins depuis MongoDB
  async function loadBassins() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bassins");
      const data = await res.json();
      setBassins(data);
    } catch {
      setToast({ type: "error", message: "Erreur de chargement des bassins" });
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => { loadBassins(); }, []);

  // Charger la ferme depuis MongoDB
  async function loadFerme() {
    try {
      const res = await fetch("/api/ferme");
      const data = await res.json();
      if (data && data.nom) {
        setFerme(data);
        setEditFerme(data);
      }
    } catch {
      // fallback mock
    }
  }
  useEffect(() => { loadFerme(); }, []);

  // Résumé visuel
  const capaciteTotale = bassins.reduce((acc, b) => acc + Number(b.capacite), 0);

  // Recherche filtrée
  const filteredBassins = bassins.filter(b => b.nom.toLowerCase().includes(search.toLowerCase()));
  
  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredBassins.length / itemsPerPage);
  const paginatedBassins = filteredBassins.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Ajout bassin
  async function handleAddBassin(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/bassins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: newBassin.nom,
          capacite: Number(newBassin.capacite),
          especes: newBassin.especes.split(",").map(s => s.trim()),
          statut: newBassin.statut,
          stade: newBassin.stade
        })
      });
      if (!res.ok) throw new Error();
      setShowAddBassin(false);
      setNewBassin({ nom: "", capacite: 0, especes: "", statut: "actif", stade: "" });
      setToast({ type: "success", message: "Bassin ajouté" });
      loadBassins();
    } catch {
      setToast({ type: "error", message: "Erreur lors de l'ajout" });
    } finally {
      setAdding(false);
    }
  }

  // Suppression bassin
  async function handleDeleteBassinConfirmed(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bassins/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: "Bassin supprimé" });
      loadBassins();
    } catch {
      setToast({ type: "error", message: "Erreur lors de la suppression" });
    } finally {
      setDeletingId(null);
      setShowDeleteBassin(null);
    }
  }

  // Toggle statut bassin
  async function handleToggleStatut(bassin: any) {
    const newStatut = bassin.statut === "actif" ? "inactif" : "actif";
    try {
      const res = await fetch(`/api/bassins/${bassin._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: bassin.nom,
          capacite: Number(bassin.capacite),
          especes: bassin.especes,
          statut: newStatut,
          stade: bassin.stade
        })
      });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: `Bassin ${newStatut === "actif" ? "activé" : "désactivé"}` });
      loadBassins();
    } catch {
      setToast({ type: "error", message: "Erreur lors du changement de statut" });
    }
  }

  // Edition bassin
  function openEditBassin(bassin: any) {
    const especesStr = bassin.especes && Array.isArray(bassin.especes) ? bassin.especes.join(", ") : "";
    setEditBassin({ ...bassin, especes: especesStr, stade: bassin.stade || "" });
    setShowEditBassin(bassin._id);
  }
  async function handleEditBassin(e: React.FormEvent) {
    e.preventDefault();
    setEditing(true);
    try {
      const res = await fetch(`/api/bassins/${editBassin._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: editBassin.nom,
          capacite: Number(editBassin.capacite),
          especes: editBassin.especes.split(",").map((s: string) => s.trim()),
          statut: editBassin.statut,
          stade: editBassin.stade
        })
      });
      if (!res.ok) throw new Error();
      setShowEditBassin(null);
      setToast({ type: "success", message: "Bassin modifié" });
      loadBassins();
    } catch {
      setToast({ type: "error", message: "Erreur lors de la modification" });
    } finally {
      setEditing(false);
    }
  }

  // Edition ferme (sauvegarde MongoDB)
  async function handleEditFerme(e: React.FormEvent) {
    e.preventDefault();
    setShowEditFerme(false);
    try {
      await fetch("/api/ferme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFerme)
      });
      setFerme(editFerme);
      setToast({ type: "success", message: "Ferme modifiée" });
    } catch {
      setToast({ type: "error", message: "Erreur lors de la modification" });
    }
  }

  // Toast auto-disparition
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header avec titre */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Gestion de la Ferme
            </h1>
            <p className="text-gray-600 mt-1">Configuration et suivi des bassins</p>
          </div>
        </div>
        
        {/* Cartes statistiques modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bassins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{bassins.length}</p>
                <p className="text-sm mt-1 text-green-600">En service</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                <Fish className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Capacité totale</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{capaciteTotale} L</p>
                <p className="text-sm mt-1 text-green-600">Volume disponible</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                <Droplets className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nom ferme</p>
                <p className="text-lg font-bold text-gray-900 mt-1 truncate">{ferme.nom}</p>
                <p className="text-sm mt-1 text-green-600">Installation</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <Info className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Statut</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">Actif</p>
                <p className="text-sm mt-1 text-green-600">Opérationnel</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Infos ferme modernes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-cyan-600" /> Ma Ferme
              </h2>
              <div className="text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Nom :</span>
                  <span className="text-sm">{ferme.nom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Localisation :</span>
                  <span className="text-sm">{ferme.localisation}</span>
                </div>
              </div>
            </div>
            <button 
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              onClick={() => { setEditFerme(ferme); setShowEditFerme(true); }}
            >
              <Edit2 className="w-4 h-4" /> Modifier
            </button>
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
        {/* Bassins */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Fish className="w-6 h-6 text-cyan-600" /> Bassins
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un bassin..." 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
                    value={search} 
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(1);
                    }} 
                  />
                </div>
                <button 
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                  onClick={() => setShowAddBassin(true)}
                >
                  <Plus className="w-4 h-4" /> Ajouter un bassin
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2 text-left">Capacité</th>
                  <th className="p-2 text-left">Espèces</th>
                  <th className="p-2 text-left">Stade</th>
                  <th className="p-2 text-left">Statut</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        <span className="text-gray-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedBassins.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Fish className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500 text-lg font-medium">Aucun bassin trouvé</span>
                        <span className="text-gray-400 text-sm">Essayez de modifier votre recherche</span>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedBassins.map((bassin) => (
                  <tr key={bassin._id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Fish className="w-5 h-5 text-cyan-600" />
                        <span className="font-semibold text-gray-900">{bassin.nom}</span>
                      </div>
                    </td>
                    <td className="p-2">{bassin.capacite} L</td>
                    <td className="p-2">{bassin.especes && Array.isArray(bassin.especes) ? bassin.especes.join(", ") : "-"}</td>
                    <td className="p-2">{bassin.stade || "-"}</td>
                    <td className="p-2">
                      <button 
                        onClick={() => handleToggleStatut(bassin)}
                        className={bassin.statut === "actif" ? 
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer" : 
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
                        }
                      >
                      {bassin.statut === "actif" ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Actif
                          </>
                      ) : (
                          <>
                            <AlertCircle className="w-3 h-3" /> Inactif
                          </>
                      )}
                      </button>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                          onClick={() => openEditBassin(bassin)}
                        >
                          <Edit2 className="w-4 h-4" /> Modifier
                        </button>
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => setShowDeleteBassin(bassin)} 
                          disabled={deletingId === bassin._id}
                        >
                          <Trash2 className="w-4 h-4" /> {deletingId === bassin._id ? "..." : "Supprimer"}
                        </button>
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
        
        {/* Modal édition ferme moderne */}
        {showEditFerme && (
          <Modal onClose={() => setShowEditFerme(false)}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-cyan-100 p-3 rounded-full">
                <Info className="w-6 h-6 text-cyan-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Modifier la ferme</h2>
            </div>
            <form onSubmit={handleEditFerme} className="flex flex-col gap-4">
              <input type="text" placeholder="Nom" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" value={editFerme.nom} onChange={e => setEditFerme({ ...editFerme, nom: e.target.value })} required />
              <input type="text" placeholder="Localisation" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" value={editFerme.localisation} onChange={e => setEditFerme({ ...editFerme, localisation: e.target.value })} required />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">Valider</button>
            </form>
          </Modal>
        )}
        {/* Modal confirmation suppression moderne */}
        {showDeleteBassin && (
          <Modal onClose={() => setShowDeleteBassin(null)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Confirmer la suppression</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowDeleteBassin(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6 text-gray-700">
              Êtes-vous sûr de vouloir supprimer le bassin <span className="font-semibold text-gray-900">{showDeleteBassin.nom}</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowDeleteBassin(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex-1 font-medium transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleDeleteBassinConfirmed(showDeleteBassin._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex-1 font-medium transition-colors"
                disabled={deletingId === showDeleteBassin._id}
              >
                {deletingId === showDeleteBassin._id ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </Modal>
        )}
        
        {/* Modal ajout bassin moderne */}
        {showAddBassin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 p-3 rounded-full">
                      <Fish className="w-6 h-6 text-cyan-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Ajouter un bassin</h2>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowAddBassin(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              <form onSubmit={handleAddBassin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <input 
                      type="text" 
                      placeholder="Nom du bassin" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                      value={newBassin.nom} 
                      onChange={e => setNewBassin({ ...newBassin, nom: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Capacité</label>
                    <input 
                      type="number" 
                      placeholder="Capacité en litres" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                      value={newBassin.capacite} 
                      onChange={e => setNewBassin({ ...newBassin, capacite: Number(e.target.value) })} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Espèces</label>
                    <input 
                      type="text" 
                      placeholder="Espèces (séparées par des virgules)" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                      value={newBassin.especes} 
                      onChange={e => setNewBassin({ ...newBassin, especes: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Stade</label>
                <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={newBassin.stade}
                  onChange={e => setNewBassin({ ...newBassin, stade: e.target.value })}
                  required
                >
                  <option value="">Sélectionner le stade</option>
                  <option value="Bassin des géniteurs">Bassin des géniteurs</option>
                  <option value="Bassin des larves">Bassin des larves</option>
                  <option value="Pré-grossissement">Pré-grossissement</option>
                  <option value="Grossissement">Grossissement</option>
                </select>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="newBassinActif"
                      className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-2 focus:ring-cyan-500"
                      checked={newBassin.statut === "actif"}
                      onChange={e => setNewBassin({ ...newBassin, statut: e.target.checked ? "actif" : "inactif" })}
                    />
                    <label htmlFor="newBassinActif" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Bassin actif
                    </label>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4" 
                    disabled={adding}
                  >
                    {adding ? "Ajout..." : "Ajouter le bassin"}
                  </button>
              </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal édition bassin moderne */}
        {showEditBassin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 p-3 rounded-full">
                      <Fish className="w-6 h-6 text-cyan-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Modifier le bassin</h2>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowEditBassin(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              <form onSubmit={handleEditBassin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <input 
                      type="text" 
                      placeholder="Nom du bassin" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                      value={editBassin.nom} 
                      onChange={e => setEditBassin({ ...editBassin, nom: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Capacité</label>
                    <input 
                      type="number" 
                      placeholder="Capacité en litres" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                      value={editBassin.capacite} 
                      onChange={e => setEditBassin({ ...editBassin, capacite: Number(e.target.value) })} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Espèces</label>
                    <input 
                      type="text" 
                      placeholder="Espèces (séparées par des virgules)" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                      value={editBassin.especes} 
                      onChange={e => setEditBassin({ ...editBassin, especes: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Stade</label>
                <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={editBassin.stade}
                  onChange={e => setEditBassin({ ...editBassin, stade: e.target.value })}
                  required
                >
                  <option value="">Sélectionner le stade</option>
                  <option value="Bassin des géniteurs">Bassin des géniteurs</option>
                  <option value="Bassin des larves">Bassin des larves</option>
                  <option value="Pré-grossissement">Pré-grossissement</option>
                  <option value="Grossissement">Grossissement</option>
                </select>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="editBassinActif"
                      className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-2 focus:ring-cyan-500"
                      checked={editBassin.statut === "actif"}
                      onChange={e => setEditBassin({ ...editBassin, statut: e.target.checked ? "actif" : "inactif" })}
                    />
                    <label htmlFor="editBassinActif" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Bassin actif
                    </label>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4" 
                    disabled={editing}
                  >
                    {editing ? "Enregistrement..." : "Enregistrer"}
                  </button>
              </form>
              </div>
            </div>
          </div>
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