import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { getMockResponse } from "@/lib/mockData";

export async function GET() {
  try {
    // S'assurer que les utilisateurs initiaux existent en dev
    await seedInitialUsers();
    
    const client = await clientPromise;
    const db = client.db();
    const utilisateurs = await db.collection("users").find({}).toArray();
    return NextResponse.json(utilisateurs);
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return getMockResponse('utilisateurs');
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("users").insertOne({ 
      ...data, 
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return NextResponse.json({ 
      success: true, 
      insertedId: result.insertedId,
      message: "Utilisateur créé avec succès"
    });
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 });
  }
}

async function seedInitialUsers() {
  const client = await clientPromise;
  const db = client.db();
  const users = [
    {
      name: "Administrateur",
      email: "admin@trace.com",
      password: await bcrypt.hash("admin", 10),
      role: "admin",
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Opérateur",
      email: "operateur@trace.com",
      password: await bcrypt.hash("operateur", 10),
      role: "operateur",
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Observateur",
      email: "observateur@trace.com",
      password: await bcrypt.hash("observateur", 10),
      role: "observateur",
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  for (const user of users) {
    const exists = await db.collection("users").findOne({ email: user.email });
    if (!exists) {
      await db.collection("users").insertOne(user);
    }
  }
}
 