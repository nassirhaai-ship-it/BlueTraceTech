import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "distributeur"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const clients = await db.collection("clients")
      .find({})
      .sort({ nom: 1 })
      .toArray();

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erreur GET /api/clients:", error);
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
    const { nom, email, telephone, adresse, nif, ai, rc, nis, contact } = body;

    if (!nom) {
      return NextResponse.json({ error: "Le nom du client est requis" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("clients").insertOne({
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
      createdBy: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/clients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
