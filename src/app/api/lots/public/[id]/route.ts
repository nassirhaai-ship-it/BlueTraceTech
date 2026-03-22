import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/lots/public/[id] - Récupérer les détails d'un lot de manière publique (sans authentification)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const { id } = await params;
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }
    
    // 1. Récupérer le lot avec les informations du bassin
    const lot = await db
      .collection("lots")
      .aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: {
            from: "bassins",
            localField: "bassinId",
            foreignField: "_id",
            as: "bassin"
          }
        },
        {
          $unwind: {
            path: "$bassin",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            nom: 1,
            espece: 1,
            quantite: 1,
            dateCreation: 1,
            stade: 1,
            statut: 1,
            poidsMoyen: 1,
            tailleMoyenne: 1,
            qrCodeGenere: 1,
            bassinId: 1,
            bassinNom: "$bassin.nom",
            bassinType: "$bassin.type",
            bassinVolume: "$bassin.volume",
            dateRecolteEstimee: "$bassin.dateRecolteEstimee"
          }
        }
      ])
      .toArray();
    
    if (!lot.length) {
      return NextResponse.json(
        { error: "Lot non trouvé" },
        { status: 404 }
      );
    }
    
    const lotData = lot[0];
    
    // 2. Récupérer les mesures associées au bassin du lot (si un bassin est associé)
    if (lotData.bassinId) {
      try {
        const bassinId = lotData.bassinId.toString();
        
        // Récupérer les mesures des 30 derniers jours pour ce bassin
        const mesures = await db.collection("mesures")
          .find({ 
            bassinId: bassinId,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          })
          .sort({ date: -1 })
          .limit(100)
          .toArray();
        
        // Ajouter les mesures au lot
        lotData.mesures = mesures;
        
        // Calculer les statistiques des mesures
        if (mesures && mesures.length > 0) {
          lotData.statistiques = {
            temperature: calculerStats(mesures, 'temperature'),
            ph: calculerStats(mesures, 'ph'),
            oxygen: calculerStats(mesures, 'oxygen'),
            salinity: calculerStats(mesures, 'salinity'),
            turbidity: calculerStats(mesures, 'turbidity')
          };
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des mesures:", error);
        // Continuer sans les mesures en cas d'erreur
      }
    }
    
    return NextResponse.json(lotData);
  } catch (error) {
    console.error("Erreur lors de la récupération du lot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du lot" },
      { status: 500 }
    );
  }
}

// Fonction pour calculer les statistiques (min, max, moyenne) d'une métrique
function calculerStats(mesures: any[], metrique: string) {
  const valeurs = mesures
    .map(m => m[metrique])
    .filter(val => val !== null && val !== undefined && !isNaN(val));
  
  if (valeurs.length === 0) {
    return { min: null, max: null, moyenne: null };
  }
  
  const min = Math.min(...valeurs);
  const max = Math.max(...valeurs);
  const somme = valeurs.reduce((acc, val) => acc + val, 0);
  const moyenne = somme / valeurs.length;
  
  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    moyenne: parseFloat(moyenne.toFixed(2))
  };
} 