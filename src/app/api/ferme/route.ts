import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/ferme - Récupère les informations de la ferme
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const ferme = await db.collection('ferme').findOne({});

    if (!ferme) {
      // Si aucune ferme n'existe, retourner une ferme par défaut
      return NextResponse.json({ nom: "Ferme BlueTrace Tech", localisation: "Bretagne" });
    }

    // Ne pas retourner l'_id MongoDB
    const { _id, ...fermeData } = ferme;
    return NextResponse.json(fermeData);
  } catch (error) {
    console.error("Erreur lors de la récupération de la ferme:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

// PUT /api/ferme - Met à jour les informations de la ferme
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();

    // Chercher si une ferme existe déjà
    const existingFerme = await db.collection('ferme').findOne({});

    if (existingFerme) {
      // Mettre à jour la ferme existante
      await db.collection('ferme').updateOne(
        { _id: existingFerme._id },
        {
          $set: {
            nom: data.nom,
            localisation: data.localisation,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Créer une nouvelle ferme
      await db.collection('ferme').insertOne({
        nom: data.nom,
        localisation: data.localisation,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ success: true, message: "Ferme modifiée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la ferme:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

