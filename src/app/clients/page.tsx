"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, Plus, Search, Edit2, Trash2, X, CheckCircle2, AlertCircle, 
  MapPin, Phone, Mail, Building2, FileText, Loader2, Filter, 
  Building, CreditCard, Landmark, ClipboardList
} from "lucide-react";

interface Client {
  _id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  contact: string;
  fiscal: {
    nif: string;
    ai: string;
    rc: string;
    nis: string;
  };
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<{type: "success" | "error", message: string} | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    contact: "",
    nif: "",
    ai: "",
    rc: "",
    nis: ""
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      setToast({ type: "error", message: "Erreur lors du chargement des clients" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);
    
    try {
      const url = editingClient ? `/api/clients/${editingClient._id}` : "/api/clients";
      const method = editingClient ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setToast({ 
          type: "success", 
          message: editingClient ? "Client mis à jour" : "Client créé avec succès" 
        });
        setShowModal(false);
        setEditingClient(null);
        setFormData({
          nom: "", email: "", telephone: "", adresse: "", contact: "",
          nif: "", ai: "", rc: "", nis: ""
        });
        fetchClients();
      } else {
        const err = await res.json();
        setModalError(err.error || "Une erreur est survenue");
      }
    } catch (error) {
      setModalError("Erreur serveur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse,
      contact: client.contact,
      nif: client.fiscal.nif || "",
      ai: client.fiscal.ai || "",
      rc: client.fiscal.rc || "",
      nis: client.fiscal.nis || ""
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setClientToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${clientToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: "Client supprimé" });
        setShowDeleteModal(false);
        setClientToDelete(null);
        fetchClients();
      }
    } catch (error) {
      setToast({ type: "error", message: "Erreur lors de la suppression" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.fiscal?.nif?.includes(search)
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
              Gestion des Clients
            </h1>
            <p className="text-gray-600 mt-1">Base de données commerciale et fiscale</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setEditingClient(null);
                setFormData({ nom: "", email: "", telephone: "", adresse: "", contact: "", nif: "", ai: "", rc: "", nis: "" });
                setModalError(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Ajouter un Client
            </button>
          </div>
        </div>



        {/* Filter & Search */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Rechercher par nom, email ou NIF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
              />
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Client / Entreprise</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Coordonnées</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px]">Informations Fiscales</th>
                  <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-8 h-16 bg-gray-50"></td>
                    </tr>
                  ))
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                            <Building2 size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{client.nom}</span>
                            <span className="text-[10px] font-bold text-gray-500">{client.contact || "Dirigeant"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <Mail size={12} className="text-gray-400" />
                            {client.email || "-"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <Phone size={12} className="text-gray-400" />
                            {client.telephone || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {client.fiscal?.nif && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded border flex items-center gap-1">
                              <span className="font-bold text-gray-400">NIF:</span> {client.fiscal.nif}
                            </span>
                          )}
                          {client.fiscal?.rc && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded border flex items-center gap-1">
                              <span className="font-bold text-gray-400">RC:</span> {client.fiscal.rc}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(client)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(client._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                      Aucun client trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Building className="text-cyan-600" size={24} /> {editingClient ? "Modifier Client" : "Nouveau Client"}
                </h2>
                <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Contact Principal</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input 
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Adresse</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium h-20"
                    value={formData.adresse}
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  ></textarea>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-cyan-600" /> Informations Fiscales (DZ)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">NIF</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium text-sm"
                        value={formData.nif}
                        onChange={(e) => setFormData({...formData, nif: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">RC</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium text-sm"
                        value={formData.rc}
                        onChange={(e) => setFormData({...formData, rc: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">AI</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium text-sm"
                        value={formData.ai}
                        onChange={(e) => setFormData({...formData, ai: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">NIS</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium text-sm"
                        value={formData.nis}
                        onChange={(e) => setFormData({...formData, nis: e.target.value})}
                      />
                    </div>
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
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Enregistrer le client"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le client ?</h3>
              <p className="text-gray-500 mb-8">
                Cette action est irréversible. Toutes les données associées à ce client seront définitivement effacées.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
