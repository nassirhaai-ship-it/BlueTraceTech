import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getMockResponse } from "@/lib/mockData";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const alertes = await db.collection("alertes").find({}).sort({ date: -1 }).limit(100).toArray();
    return NextResponse.json(alertes);
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return getMockResponse('alertes');
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("alertes").insertOne({ 
      ...data, 
      date: new Date(),
      createdAt: new Date()
    });
    return NextResponse.json({ 
      success: true, 
      insertedId: result.insertedId,
      message: "Alerte créée avec succès"
    });
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return NextResponse.json({ error: "Erreur lors de la création de l'alerte" }, { status: 500 });
  }
} 