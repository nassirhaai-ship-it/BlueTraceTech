import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db();
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 });
    }

    const data = await req.json();
    
    // Préparer les champs à mettre à jour
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Ajouter les champs si présents dans la requête
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.actif !== undefined) updateData.actif = data.actif;

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur modifié avec succès",
      user: updatedUser
    });
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return NextResponse.json({ error: "Erreur lors de la modification de l'utilisateur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db();
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 });
    }

    const result = await db.collection("users").deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur supprimé avec succès",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de l'utilisateur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db();
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 });
    }
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: hashed, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Mot de passe réinitialisé" });
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return NextResponse.json({ error: "Erreur lors de la réinitialisation du mot de passe" }, { status: 500 });
  }
}
 