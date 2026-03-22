import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from 'fs';

export const dynamic = "force-dynamic";

// GET /api/lots - Récupérer tous les lots
export async function GET(req: NextRequest) {
  const logPath = 'D:/aquaAi/aquaai/api-error.log';
  try {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - [GET /api/lots] Handler Start\n`);
    const session = await getServerSession(authOptions);
    const uri = (process.env.MONGO_URL || process.env.MONGODB_URI);
    const debugMsg = `${new Date().toISOString()} - [DEBUG] NODE_ENV: ${process.env.NODE_ENV}, URI found: ${uri ? "YES" : "NO"}\n`;
    fs.appendFileSync(logPath, debugMsg);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    const lots = await db
      .collection("lots")
      .aggregate([
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
            bassinNom: "$bassin.nom"
          }
        },
        {
          $sort: { dateCreation: -1 }
        }
      ])
      .toArray();
    
    return NextResponse.json(lots);
  } catch (error: any) {
    const errorLog = `${new Date().toISOString()} - Error: ${error.message}\nStack: ${error.stack}\n`;
    try {
      fs.appendFileSync('D:/aquaAi/aquaai/api-error.log', errorLog);
    } catch (e) {}
    console.error("Erreur lors de la récupération des lots:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des lots", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/lots - Créer un nouveau lot
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const data = await req.json();
    
    // Validation des données
    if (!data.nom || !data.espece || !data.quantite || !data.bassinId) {
      return NextResponse.json(
        { error: "Veuillez fournir toutes les informations requises" },
        { status: 400 }
      );
    }
    
    // Vérifier si le bassin existe
    const bassin = await db
      .collection("bassins")
      .findOne({ _id: new ObjectId(data.bassinId) });
    
    if (!bassin) {
      return NextResponse.json(
        { error: "Le bassin spécifié n'existe pas" },
        { status: 400 }
      );
    }
    
    // Créer le lot
    const nouveauLot = {
      nom: data.nom,
      espece: data.espece,
      quantite: Number(data.quantite),
      bassinId: new ObjectId(data.bassinId),
      stade: data.stade || "alevin",
      statut: "actif",
      poidsMoyen: data.poidsMoyen ? Number(data.poidsMoyen) : 0,
      tailleMoyenne: data.tailleMoyenne ? Number(data.tailleMoyenne) : 0,
      dateCreation: new Date(),
      qrCodeGenere: false,
      creePar: session.user.id,
      historique: [
        {
          date: new Date(),
          action: "creation",
          utilisateurId: session.user.id,
          utilisateurNom: session.user.name,
          details: "Création du lot"
        }
      ]
    };
    
    const result = await db.collection("lots").insertOne(nouveauLot);
    
    // Récupérer le lot créé avec les informations du bassin
    const lotCree = await db
      .collection("lots")
      .aggregate([
        {
          $match: { _id: result.insertedId }
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
            bassinNom: "$bassin.nom"
          }
        }
      ])
      .toArray();
    
    return NextResponse.json(lotCree[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du lot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du lot" },
      { status: 500 }
    );
  }
}

// PUT /api/lots - Mettre à jour les statistiques des lots
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Récupérer tous les lots actifs
    const lots = await db.collection("lots").find({ statut: "actif" }).toArray();
    
    // Pour chaque lot, calculer les statistiques à partir des mesures
    for (const lot of lots) {
      // Récupérer les mesures du bassin associé au lot
      const mesures = await db.collection("mesures")
        .find({ 
          bassinId: lot.bassinId,
          timestamp: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        })
        .toArray();
      
      if (mesures.length > 0) {
        // Calculer les statistiques
        const stats = {
          temperature: calculerStats(mesures, 'temperature'),
          ph: calculerStats(mesures, 'ph'),
          oxygene: calculerStats(mesures, 'oxygene'),
          salinite: calculerStats(mesures, 'salinite'),
          turbidite: calculerStats(mesures, 'turbidite')
        };
        
        // Mettre à jour le lot
        await db.collection("lots").updateOne(
          { _id: lot._id },
          { $set: { statistiques: stats } }
        );
      }
    }
    
    return NextResponse.json({ message: "Statistiques mises à jour" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statistiques:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Fonction utilitaire pour calculer min, max et moyenne
function calculerStats(mesures: any[], parametre: string) {
  const valeurs = mesures
    .filter(m => m[parametre] !== undefined && m[parametre] !== null)
    .map(m => m[parametre]);
  
  if (valeurs.length === 0) {
    return { min: null, max: null, moyenne: null };
  }
  
  return {
    min: Math.min(...valeurs),
    max: Math.max(...valeurs),
    moyenne: valeurs.reduce((a: number, b: number) => a + b, 0) / valeurs.length
  };
} 