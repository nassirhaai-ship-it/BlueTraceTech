"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Calendar, BarChart3, TrendingUp, AlertCircle, CheckCircle, Activity, LayoutDashboard } from "lucide-react";
import useSWR from "swr";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const mockRapports = [
  {
    id: 1,
    type: "Rapport quotidien",
    date: new Date(),
    description: "Synthèse des mesures et alertes du jour.",
    url: "/api/rapports/quotidien.pdf"
  },
  {
    id: 2,
    type: "Rapport hebdomadaire",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    description: "Analyse des tendances sur 7 jours.",
    url: "/api/rapports/hebdo.pdf"
  },
  {
    id: 3,
    type: "Rapport mensuel",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    description: "Tendances et statistiques du mois.",
    url: "/api/rapports/mensuel.pdf"
  }
];

export default function RapportsPage() {
  const [rapports] = useState(mockRapports);
  const [page, setPage] = useState(1);
  
  const { data: mesures, isLoading: mesuresLoading } = useSWR("/api/mesures", fetcher);
  const { data: alertes, isLoading: alertesLoading } = useSWR("/api/alertes", fetcher);

  const itemsPerPage = 9;
  const totalPages = Math.ceil(rapports.length / itemsPerPage);
  const paginatedRapports = rapports.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  const mesuresArray = Array.isArray(mesures?.mesures) ? mesures.mesures : (Array.isArray(mesures) ? mesures : []);
  const alertesArray = Array.isArray(alertes) ? alertes : [];
  
  const temperatureAvg = (() => {
    const tempMesures = mesuresArray.filter((m: any) => m.temperature !== undefined && m.temperature !== null);
    if (tempMesures.length === 0) return 0;
    const sum = tempMesures.reduce((acc: number, m: any) => acc + parseFloat(m.temperature || "0"), 0);
    return (sum / tempMesures.length).toFixed(1);
  })();
  
  const criticalAlerts = alertesArray.filter((a: any) => a.type === "danger" || a.type === "error").length;

  const exportExcel = (type: string) => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Mesures
      const mesuresData = mesuresArray.map((m: any) => ({
        Date: new Date(m.date || Date.now()).toLocaleString('fr-FR'),
        Bassin: m.bassinId || m.bassin || "N/A",
        Temperature: m.temperature || "-",
        pH: m.ph || "-",
        Oxygene: m.oxygen || "-",
        Salinite: m.salinity || "-",
        Turbidite: m.turbidity || "-"
      }));
      const wsMesures = XLSX.utils.json_to_sheet(mesuresData);
      XLSX.utils.book_append_sheet(wb, wsMesures, "Mesures");

      // Alertes
      const alertesData = alertesArray.map((a: any) => ({
        Date: new Date(a.date || Date.now()).toLocaleString('fr-FR'),
        Bassin: a.bassinId || a.bassin || "N/A",
        Type: a.type,
        Message: a.message,
        Statut: a.statut || "non lu"
      }));
      const wsAlertes = XLSX.utils.json_to_sheet(alertesData);
      XLSX.utils.book_append_sheet(wb, wsAlertes, "Alertes");

      XLSX.writeFile(wb, `${type.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
    }
  };

  const exportPDF = (type: string) => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(14, 116, 144);
      doc.text("BlueTrace Tech", 14, 20);
      
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(type.toUpperCase(), 14, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date de génération: ${new Date().toLocaleString('fr-FR')}`, 14, 38);
      
      let yPos = 50;

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Résumé des Indicateurs", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(`Température moyenne globale: ${temperatureAvg}°C`, 20, yPos);
      yPos += 8;
      doc.text(`Alertes critiques recensées: ${criticalAlerts}`, 20, yPos);
      yPos += 8;
      doc.text(`Total des relevés enregistrés: ${mesuresArray.length}`, 20, yPos);
      yPos += 15;

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Dernières Mesures", 14, yPos);
      yPos += 6;

      const tableData = mesuresArray.slice(0, 40).map((m: any) => [
        new Date(m.date || Date.now()).toLocaleString('fr-FR'),
        m.bassinId || m.bassin || "-",
        m.temperature ? `${m.temperature}°C` : "-",
        m.ph || "-",
        m.oxygen ? `${m.oxygen} mg/L` : "-"
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Date', 'Bassin', 'Temp.', 'pH', 'Oxygène']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [14, 116, 144] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;

      if (alertesArray.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Dernières Alertes", 14, yPos);
        yPos += 6;

        const alertesTableData = alertesArray.slice(0, 40).map((a: any) => [
          new Date(a.date || Date.now()).toLocaleString('fr-FR'),
          a.bassinId || a.bassin || "-",
          a.type,
          a.message
        ]);

        (doc as any).autoTable({
          startY: yPos,
          head: [['Date', 'Bassin', 'Type', 'Message']],
          body: alertesTableData,
          theme: 'grid',
          headStyles: { fillColor: [225, 29, 72] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
      }

      doc.save(`${type.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5 lg:gap-6">
        {/* Header avec titre */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Rapports & Export
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Archives et statistiques du système BlueTrace
            </p>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-2">
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Rapports</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{rapports.length}</p>
                <p className="text-xs sm:text-sm mt-1 text-green-600 truncate">Total généré</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Temp. Moyenne</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{temperatureAvg}°C</p>
                <p className="text-xs sm:text-sm mt-1 text-green-600 truncate">Globale</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Critiques</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{criticalAlerts}</p>
                <p className="text-xs sm:text-sm mt-1 text-red-600 truncate">Alertes</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm p-4 sm:p-5 lg:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Performance</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">98.5%</p>
                <p className="text-xs sm:text-sm mt-1 text-green-600 truncate">Uptime</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" /> Archives de rapports
            </h2>
          </div>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 sm:p-3 text-left font-semibold text-gray-700 whitespace-nowrap">Type de Rapport</th>
                  <th className="p-2 sm:p-3 text-left font-semibold text-gray-700 whitespace-nowrap">Date</th>
                  <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Description</th>
                  <th className="p-2 sm:p-3 text-right font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRapports.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-600" />
                        <span className="font-semibold text-gray-900">{r.type}</span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-gray-600 whitespace-nowrap">{r.date.toLocaleDateString('fr-FR')}</td>
                    <td className="p-2 sm:p-3 text-gray-600">{r.description}</td>
                    <td className="p-2 sm:p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => exportExcel(r.type)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          <Download className="w-3 h-3" /> Excel
                        </button>
                        <button 
                          onClick={() => exportPDF(r.type)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <FileText className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedRapports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500 text-lg font-medium">Aucun rapport disponible</span>
                      </div>
                    </td>
                  </tr>
                )}
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
      </div>
    </div>
  );
}
