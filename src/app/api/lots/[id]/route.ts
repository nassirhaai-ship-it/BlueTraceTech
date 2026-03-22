import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/lots/[id] - Récupérer les détails d'un lot
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }
    
    // Récupérer le lot avec les informations du bassin
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
            historique: 1,
            notes: 1
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
    
    return NextResponse.json(lot[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération du lot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du lot" },
      { status: 500 }
    );
  }
}

// PUT /api/lots/[id] - Mettre à jour un lot
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    const data = await req.json();
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }
    
    // Vérifier si le lot existe
    const lotExistant = await db
      .collection("lots")
      .findOne({ _id: new ObjectId(id) });
    
    if (!lotExistant) {
      return NextResponse.json(
        { error: "Lot non trouvé" },
        { status: 404 }
      );
    }
    
    // Vérifier si le bassin existe si on change de bassin
    if (data.bassinId && data.bassinId !== lotExistant.bassinId.toString()) {
      if (!ObjectId.isValid(data.bassinId)) {
        return NextResponse.json(
          { error: "ID de bassin invalide" },
          { status: 400 }
        );
      }
      
      const bassin = await db
        .collection("bassins")
        .findOne({ _id: new ObjectId(data.bassinId) });
      
      if (!bassin) {
        return NextResponse.json(
          { error: "Le bassin spécifié n'existe pas" },
          { status: 400 }
        );
      }
    }
    
    // Préparer les données à mettre à jour
    const miseAJour: any = {};
    
    if (data.nom) miseAJour.nom = data.nom;
    if (data.espece) miseAJour.espece = data.espece;
    if (data.quantite !== undefined) miseAJour.quantite = Number(data.quantite);
    if (data.stade) miseAJour.stade = data.stade;
    if (data.statut) miseAJour.statut = data.statut;
    if (data.poidsMoyen !== undefined) miseAJour.poidsMoyen = Number(data.poidsMoyen);
    if (data.tailleMoyenne !== undefined) miseAJour.tailleMoyenne = Number(data.tailleMoyenne);
    if (data.notes !== undefined) miseAJour.notes = data.notes;
    
    if (data.bassinId && data.bassinId !== lotExistant.bassinId.toString()) {
      miseAJour.bassinId = new ObjectId(data.bassinId);
    }
    
    // Mettre à jour le lot
    await db.collection("lots").updateOne(
      { _id: new ObjectId(id) },
      { $set: miseAJour }
    );
      
      // Ajouter un événement à l'historique pour le changement de bassin
    if (data.bassinId && data.bassinId !== lotExistant.bassinId.toString()) {
      const bassin = await db
        .collection("bassins")
        .findOne({ _id: new ObjectId(data.bassinId) });
      
      if (bassin) {
        const nouvelHistorique = {
          date: new Date(),
          action: "changement_bassin",
          utilisateurId: session.user.id,
          utilisateurNom: session.user.name,
          details: `Transfert du bassin ${lotExistant.bassinNom || "précédent"} vers ${bassin.nom}`
        };
        
    await db.collection("lots").updateOne(
      { _id: new ObjectId(id) },
          { $push: { historique: nouvelHistorique } }
    );
      }
    }
    
    // Récupérer le lot mis à jour
    const lotMisAJour = await db
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
            historique: 1,
            notes: 1
          }
        }
      ])
      .toArray();
    
    return NextResponse.json(lotMisAJour[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du lot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du lot" },
      { status: 500 }
    );
  }
}

// DELETE /api/lots/[id] - Supprimer un lot
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    // Vérifier si l'utilisateur est un administrateur
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer des lots" },
        { status: 403 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }
    
    // Vérifier si le lot existe
    const lot = await db
      .collection("lots")
      .findOne({ _id: new ObjectId(id) });
    
    if (!lot) {
      return NextResponse.json(
        { error: "Lot non trouvé" },
        { status: 404 }
      );
    }
    
    // Supprimer le lot
    await db.collection("lots").deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ message: "Lot supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du lot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du lot" },
      { status: 500 }
    );
  }
} 