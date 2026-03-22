import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const ventes = await db.collection("ventes")
      .find({})
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(ventes);
  } catch (error) {
    console.error("Erreur GET /api/ventes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "distributeur"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { lotId, lotName, client: clientName, quantite, montant } = body;

    if (!lotId || !clientName || !quantite || !montant) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Vérifier la disponibilité dans le lot
    const lot = await db.collection("lots").findOne({ _id: new ObjectId(lotId as string) });
    if (!lot) {
      return NextResponse.json({ error: "Lot non trouvé" }, { status: 404 });
    }

    const quantiteVendue = Number(quantite);
    if (lot.quantite < quantiteVendue) {
      return NextResponse.json({ 
        error: `Quantité insuffisante. Disponible: ${lot.quantite} kg, Demandé: ${quantiteVendue} kg` 
      }, { status: 400 });
    }

    // 2. Mettre à jour le lot (quantité et historique)
    await db.collection("lots").updateOne(
      { _id: new ObjectId(lotId as string) },
      { 
        $inc: { quantite: -quantiteVendue },
        $push: { 
          historique: {
            date: new Date(),
            action: "vente",
            utilisateurId: session.user.id,
            utilisateurNom: session.user.name,
            details: `Vente de ${quantiteVendue} kg à ${clientName}`
          }
        } as any
      }
    );

    // 3. Ajouter un mouvement de stock
    await db.collection("mouvements").insertOne({
      type: "sortie",
      lotId: new ObjectId(lotId as string),
      lotName,
      quantite: quantiteVendue,
      motif: "vente",
      client: clientName,
      date: new Date(),
      createdBy: session.user.email
    });

    // 4. Enregistrer la vente
    const result = await db.collection("ventes").insertOne({
      lotId,
      lotName,
      client: clientName,
      quantite: quantiteVendue,
      montant: Number(montant),
      date: new Date(),
      statut: "termine",
      certificatGenere: false,
      createdBy: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/ventes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
