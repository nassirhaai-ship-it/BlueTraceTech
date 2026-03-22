import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PUT(request: Request, context: { params: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "distributeur"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { nom, email, telephone, adresse, nif, ai, rc, nis, contact } = body;

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("clients").updateOne(
      { _id: new ObjectId(id as string) },
      {
        $set: {
          nom,
          email: email || "",
          telephone: telephone || "",
          adresse: adresse || "",
          contact: contact || "",
          fiscal: {
            nif: nif || "",
            ai: ai || "",
            rc: rc || "",
            nis: nis || ""
          },
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client mis à jour" });
  } catch (error) {
    console.error("Erreur PUT /api/clients/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "distributeur"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("clients").deleteOne({
      _id: new ObjectId(id as string)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client supprimé" });
  } catch (error) {
    console.error("Erreur DELETE /api/clients/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
