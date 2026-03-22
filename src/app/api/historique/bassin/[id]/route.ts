import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/historique/bassin/[id]
 * Récupère l'historique des mesures pour un bassin spécifique
 * 
 * Paramètres de requête:
 * - startDate: Date de début (format YYYY-MM-DD)
 * - endDate: Date de fin (format YYYY-MM-DD)
 * - limit: Nombre maximum de mesures à renvoyer (par défaut: 100)
 * - metrics: Liste des métriques à inclure, séparées par des virgules (temperature,ph,oxygen,salinity,turbidity)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const { id: bassinId } = await params;
    
    // Paramètres optionnels
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const metricsParam = searchParams.get('metrics');
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(bassinId)) {
      return NextResponse.json(
        { error: "ID de bassin invalide" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Construction du filtre
    const filter: any = { bassinId: bassinId };
    
    // Filtrage par date
    if (startDateParam || endDateParam) {
      filter.date = {};
      if (startDateParam) {
        const startDate = new Date(startDateParam);
        filter.date.$gte = startDate;
      }
      if (endDateParam) {
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999); // Fin de la journée
        filter.date.$lte = endDate;
      }
    } else {
      // Par défaut, 30 derniers jours
      filter.date = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }
    
    // Projection (quelles métriques renvoyer)
    const projection: any = {
      _id: 1,
      date: 1,
      bassinId: 1,
      bassinNom: 1
    };
    
    // Si des métriques spécifiques sont demandées
    if (metricsParam) {
      const metrics = metricsParam.split(',');
      metrics.forEach(metric => {
        if (['temperature', 'ph', 'oxygen', 'salinity', 'turbidity'].includes(metric)) {
          projection[metric] = 1;
        }
      });
    } else {
      // Sinon, inclure toutes les métriques
      projection.temperature = 1;
      projection.ph = 1;
      projection.oxygen = 1;
      projection.salinity = 1;
      projection.turbidity = 1;
    }
    
    // Récupérer les mesures
    const mesures = await db.collection("mesures")
      .find(filter)
      .project(projection)
      .sort({ date: -1 })
      .limit(limit)
      .toArray();
    
    // Récupérer les informations du bassin
    const bassin = await db.collection("bassins")
      .findOne({ _id: new ObjectId(bassinId) });
      
    // Calculer les statistiques
    const statistics = calculateStatistics(mesures);
    
    return NextResponse.json({
      bassin: bassin ? {
        id: bassin._id,
        nom: bassin.nom,
        type: bassin.type,
        volume: bassin.volume
      } : null,
      count: mesures.length,
      statistics,
      mesures
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des mesures:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des mesures" },
      { status: 500 }
    );
  }
}

// Calcule les statistiques pour chaque métrique
function calculateStatistics(mesures: any[]) {
  const metrics = ['temperature', 'ph', 'oxygen', 'salinity', 'turbidity'];
  const stats: any = {};
  
  metrics.forEach(metric => {
    const values = mesures
      .map(m => m[metric])
      .filter(val => val !== null && val !== undefined && !isNaN(val));
    
    if (values.length === 0) {
      stats[metric] = { min: null, max: null, avg: null, count: 0 };
      return;
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    
    stats[metric] = {
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
      count: values.length
    };
  });
  
  return stats;
} 