"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Edit2, UserCircle, BadgeCheck, KeyRound, Search, CheckCircle, AlertCircle, Power } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "operateur", actif: true });
  const [editUser, setEditUser] = useState({ _id: "", name: "", email: "", role: "operateur", actif: true });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showResetPwd, setShowResetPwd] = useState<any | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showDelete, setShowDelete] = useState<any | null>(null);

  const { data: session } = useSession();

  // Protection accès : seuls les admins peuvent accéder
  if (session && session.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h1>
          <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  // Fetch users
  async function loadUsers() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/utilisateurs");
      const data = await res.json();
      setUtilisateurs(data);
    } catch (e) {
      setError("Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => { loadUsers(); }, []);

  // Recherche filtrée
  const filteredUsers = utilisateurs.filter((u: any) =>
    (u.name || u.nom || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );
  
  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Ajout utilisateur
  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error();
      setShowAdd(false);
      setNewUser({ name: "", email: "", role: "operateur", actif: true });
      setToast({ type: "success", message: "Utilisateur ajouté" });
      loadUsers();
    } catch {
      setToast({ type: "error", message: "Erreur lors de l'ajout" });
    } finally {
      setAdding(false);
    }
  }

  // Suppression utilisateur
  async function handleDeleteUserConfirmed(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/utilisateurs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: "Utilisateur supprimé" });
      loadUsers();
    } catch {
      setToast({ type: "error", message: "Erreur lors de la suppression" });
    } finally {
      setDeletingId(null);
      setShowDelete(null);
    }
  }

  // Edition utilisateur
  function openEditModal(user: any) {
    setEditUser({ _id: user._id, name: user.name, email: user.email, role: user.role, actif: user.actif !== undefined ? user.actif : true });
    setShowEdit(user._id);
  }
  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    setEditing(true);
    try {
      const res = await fetch(`/api/utilisateurs/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editUser.name, email: editUser.email, role: editUser.role, actif: editUser.actif }),
      });
      if (!res.ok) throw new Error();
      setShowEdit(null);
      setToast({ type: "success", message: "Utilisateur modifié" });
      loadUsers();
    } catch {
      setToast({ type: "error", message: "Erreur lors de la modification" });
    } finally {
      setEditing(false);
    }
  }

  // Réinitialisation du mot de passe
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetting(true);
    try {
      const res = await fetch(`/api/utilisateurs/${showResetPwd._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPwd }),
      });
      if (!res.ok) throw new Error();
      setShowResetPwd(null);
      setResetPwd("");
      setToast({ type: "success", message: "Mot de passe réinitialisé" });
    } catch {
      setToast({ type: "error", message: "Erreur lors de la réinitialisation" });
    } finally {
      setResetting(false);
    }
  }

  // Toast auto-disparition
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Pour badge de rôle
  const roleBadge = (role: string) => {
    switch (role) {
      case "admin": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Administrateur</span>;
      case "operateur": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Opérateur</span>;
      case "distributeur": return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Distributeur</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{role}</span>;
    }
  };

  // Pour badge de statut actif/inactif
  const statutBadge = (actif: boolean | undefined) => {
    if (actif === undefined || actif === true) {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Actif</span>;
    } else {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Inactif</span>;
    }
  };

  // Compter les utilisateurs par rôle
  const nbAdmin = utilisateurs.filter(u => u.role === "admin").length;
  const nbOperateur = utilisateurs.filter(u => u.role === "operateur").length;
  const nbDistributeur = utilisateurs.filter(u => u.role === "distributeur").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header avec titre */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Gestion des Utilisateurs
            </h1>
            <p className="text-gray-600 mt-1">Administration des utilisateurs et permissions</p>
          </div>
        </div>
        
        {/* Cartes statistiques modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{utilisateurs.length}</p>
                <p className="text-sm mt-1 text-green-600">Actifs</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administrateurs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nbAdmin}</p>
                <p className="text-sm mt-1 text-green-600">Accès complet</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white">
                <BadgeCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Opérateurs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nbOperateur}</p>
                <p className="text-sm mt-1 text-blue-600">Gestion ferme</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Distributeurs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nbDistributeur}</p>
                <p className="text-sm mt-1 text-purple-600">Partenaires</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                <CheckCircle className="w-6 h-6" />
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
        
        {/* Utilisateurs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-cyan-600" /> Utilisateurs
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..." 
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
                  onClick={() => setShowAdd(true)}
                >
                  <Plus className="w-4 h-4" /> Ajouter un utilisateur
                </button>
            </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        <span className="text-gray-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-red-600">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedUsers.length === 0 && !isLoading && !error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <UserCircle className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500 text-lg font-medium">Aucun utilisateur trouvé</span>
                        <span className="text-gray-400 text-sm">Essayez de modifier votre recherche</span>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedUsers.map((user: any) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-cyan-600" />
                        <span className="font-semibold text-gray-900">{user.name || user.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{roleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{statutBadge(user.actif)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit2 className="w-4 h-4" /> Modifier
                        </button>
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                          onClick={() => { setShowResetPwd(user); setResetPwd(""); }}
                        >
                          <KeyRound className="w-4 h-4" /> Réinitialiser
                        </button>
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => setShowDelete(user)}
                          disabled={deletingId === user._id}
                        >
                          <Trash2 className="w-4 h-4" /> {deletingId === user._id ? "Suppression..." : "Supprimer"}
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
        
        {/* Modal ajout utilisateur moderne */}
        {showAdd && (
          <Modal onClose={() => setShowAdd(false)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 p-3 rounded-full">
                  <BadgeCheck className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Ajouter un utilisateur</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowAdd(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <input 
                  type="text" 
                  placeholder="Nom complet" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                  value={newUser.name} 
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email" 
                  placeholder="email@exemple.com" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                  value={newUser.email} 
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Rôle</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                  value={newUser.role} 
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                <option value="admin">Administrateur</option>
                <option value="operateur">Opérateur</option>
                <option value="distributeur">Distributeur</option>
              </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="newUserActif"
                  className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-2 focus:ring-cyan-500"
                  checked={newUser.actif}
                  onChange={e => setNewUser({ ...newUser, actif: e.target.checked })}
                />
                <label htmlFor="newUserActif" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Utilisateur actif
                </label>
              </div>
              <button 
                type="submit" 
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4" 
                disabled={adding}
              >
                {adding ? "Ajout..." : "Ajouter l'utilisateur"}
              </button>
            </form>
          </Modal>
        )}
        
        {/* Modal édition utilisateur moderne */}
        {showEdit && (
          <Modal onClose={() => setShowEdit(null)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 p-3 rounded-full">
                  <Edit2 className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Modifier l'utilisateur</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowEdit(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <input 
                  type="text" 
                  placeholder="Nom complet" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                  value={editUser.name} 
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email" 
                  placeholder="email@exemple.com" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                  value={editUser.email} 
                  onChange={e => setEditUser({ ...editUser, email: e.target.value })} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Rôle</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                  value={editUser.role} 
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                >
                <option value="admin">Administrateur</option>
                <option value="operateur">Opérateur</option>
                <option value="distributeur">Distributeur</option>
              </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="editUserActif"
                  className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-2 focus:ring-cyan-500"
                  checked={editUser.actif}
                  onChange={e => setEditUser({ ...editUser, actif: e.target.checked })}
                />
                <label htmlFor="editUserActif" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Utilisateur actif
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
          </Modal>
        )}
        
        {/* Modal réinitialisation mot de passe moderne */}
        {showResetPwd && (
          <Modal onClose={() => setShowResetPwd(null)}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-full">
                  <KeyRound className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Réinitialiser le mot de passe</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowResetPwd(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Minimum 4 caractères" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                  value={resetPwd} 
                  onChange={e => setResetPwd(e.target.value)} 
                  required 
                  minLength={4} 
                />
              </div>
              <button 
                type="submit" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4" 
                disabled={resetting}
              >
                {resetting ? "Réinitialisation..." : "Réinitialiser"}
              </button>
            </form>
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
              Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-semibold text-gray-900">{showDelete.name || showDelete.nom}</span> ?
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
                onClick={() => handleDeleteUserConfirmed(showDelete._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex-1 font-medium transition-colors"
                disabled={deletingId === showDelete._id}
              >
                {deletingId === showDelete._id ? "Suppression..." : "Supprimer"}
              </button>
            </div>
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
