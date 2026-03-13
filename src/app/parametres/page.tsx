"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Edit, Database, Lock, RefreshCcw, Settings, SlidersHorizontal, Activity, CheckCircle } from "lucide-react";

export default function ParametresPage() {
  // States pour chaque section
  const [showDbModal, setShowDbModal] = useState(false);
  const [showUri, setShowUri] = useState(false);
  const [showEditUri, setShowEditUri] = useState(false);
  const [feedback, setFeedback] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  
  // Mongo URI
  const [mongoUri, setMongoUri] = useState<string>("...");
  const [editUri, setEditUri] = useState(mongoUri);

  // Logique floue - paramètres par défaut
  const [fuzzyParams, setFuzzyParams] = useState({
    temperature: { min: 18, max: 30, warning_low: 20, warning_high: 28, critical_low: 18, critical_high: 30 },
    ph: { min: 6.5, max: 8.5, warning_low: 7.0, warning_high: 8.0, critical_low: 6.5, critical_high: 8.5 },
    oxygen: { min: 4, max: 12, warning_low: 5, warning_high: 10, critical_low: 4, critical_high: 12 },
    salinity: { min: 25, max: 35, warning_low: 28, warning_high: 32, critical_low: 25, critical_high: 35 },
    turbidity: { min: 0, max: 50, warning_low: 5, warning_high: 30, critical_low: 0, critical_high: 50 }
  });

  const [showFuzzyModal, setShowFuzzyModal] = useState(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [tempFuzzyVals, setTempFuzzyVals] = useState<any>(null);

  useEffect(() => {
    fetch("/api/parametres/mongodb-uri")
      .then(res => res.json())
      .then(data => {
        if (data.uri) {
          setMongoUri(data.uri);
          setEditUri(data.uri);
        }
      });

    // Charger la configuration de logique floue
    fetch("/api/parametres/fuzzy-logic")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setFuzzyParams(data.config);
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement de la configuration floue:', error);
      });
  }, []);

  const handleEditUri = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    setTimeout(() => {
      setMongoUri(editUri);
      setFeedback("URI MongoDB modifiée avec succès !");
      setLoading(false);
      setShowEditUri(false);
    }, 1000);
  };

  const handleResetDb = async () => {
    setLoading(true);
    setFeedback(null);
    setTimeout(() => {
      setFeedback("Base de données réinitialisée !");
      setLoading(false);
      setShowDbModal(false);
    }, 1200);
  };

  const handleEditFuzzyParam = (paramName: string) => {
    setEditingParam(paramName);
    setTempFuzzyVals({ ...(fuzzyParams as any)[paramName] });
    setShowFuzzyModal(true);
  };

  const handleSaveFuzzyParam = async (paramName: string, newValues: any) => {
    try {
      setLoading(true);
      const updatedConfig = { ...fuzzyParams, [paramName]: newValues };
      const response = await fetch("/api/parametres/fuzzy-logic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig }),
      });
      const data = await response.json();
      if (data.success) {
        setFuzzyParams(updatedConfig);
        setFeedback(`Paramètres ${getParamDisplayName(paramName)} mis à jour !`);
        setShowFuzzyModal(false);
      }
    } catch (error) {
      setFeedback("Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const getParamDisplayName = (p: string) => (({ temperature: 'Température', ph: 'pH', oxygen: 'Oxygène', salinity: 'Salinité', turbidity: 'Turbidité' } as Record<string, string>)[p] || p);
  const getParamUnit = (p: string) => (({ temperature: '°C', ph: '', oxygen: 'mg/L', salinity: 'ppt', turbidity: 'NTU' } as Record<string, string>)[p] || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-5 lg:gap-6">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Configuration Système</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                BlueTrace Tech core
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-600" /> Infrastructure
            </h2>
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Endpoint MongoDB</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-cyan-600 truncate">
                    {showUri ? mongoUri : "••••••••••••••••••••••••"}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowUri(!showUri)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                      {showUri ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => setShowEditUri(true)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowDbModal(true)}
                className="w-full py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold hover:bg-red-100 transition-all flex justify-center items-center gap-2"
              >
                Réinitialiser la base de données
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 lg:p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-600" /> Logique Floue
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(fuzzyParams).map(([name, vals]) => (
                <div key={name} className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-cyan-300 transition-all group">
                   <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-900">{getParamDisplayName(name)}</span>
                    <button onClick={() => handleEditFuzzyParam(name)} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-600 hover:text-cyan-700">
                      <Edit size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">Normal</span>
                    <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      {vals.warning_low} - {vals.warning_high}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 z-50 animate-in slide-in-from-right duration-300">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-gray-900 font-medium">{feedback}</span>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setFeedback(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Editeur Logique Floue */}
      {showFuzzyModal && editingParam && tempFuzzyVals && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-600" />
              Configuration : {getParamDisplayName(editingParam)}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Absolu ({getParamUnit(editingParam)})</label>
                  <input type="number" step="0.1" value={tempFuzzyVals.min} onChange={e => setTempFuzzyVals({...tempFuzzyVals, min: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Maximum Absolu ({getParamUnit(editingParam)})</label>
                  <input type="number" step="0.1" value={tempFuzzyVals.max} onChange={e => setTempFuzzyVals({...tempFuzzyVals, max: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Critique Bas ({getParamUnit(editingParam)})</label>
                  <input type="number" step="0.1" value={tempFuzzyVals.critical_low} onChange={e => setTempFuzzyVals({...tempFuzzyVals, critical_low: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Critique Haut ({getParamUnit(editingParam)})</label>
                  <input type="number" step="0.1" value={tempFuzzyVals.critical_high} onChange={e => setTempFuzzyVals({...tempFuzzyVals, critical_high: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Alerte Basse ({getParamUnit(editingParam)})</label>
                  <input type="number" step="0.1" value={tempFuzzyVals.warning_low} onChange={e => setTempFuzzyVals({...tempFuzzyVals, warning_low: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Alerte Haute ({getParamUnit(editingParam)})</label>
                  <input type="number" step="0.1" value={tempFuzzyVals.warning_high} onChange={e => setTempFuzzyVals({...tempFuzzyVals, warning_high: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-cyan-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowFuzzyModal(false)} 
                className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleSaveFuzzyParam(editingParam, tempFuzzyVals)} 
                className="flex-1 py-2 bg-cyan-600 rounded-lg font-medium text-white hover:bg-cyan-700 transition-all flex justify-center items-center"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals placeholders for brevity */}
      {showEditUri && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Mise à jour URI</h3>
            <input 
              type="text" 
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-cyan-500 outline-none mb-6" 
              value={editUri} 
              onChange={e => setEditUri(e.target.value)} 
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowEditUri(false)} 
                className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleEditUri} 
                className="flex-1 py-2 bg-cyan-600 rounded-lg font-medium text-white hover:bg-cyan-700 transition-all flex justify-center items-center"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}