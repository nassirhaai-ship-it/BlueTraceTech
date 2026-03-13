import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getMockResponse } from "@/lib/mockData";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const bassins = await db.collection('bassins').find().toArray();
    return NextResponse.json(bassins);
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return getMockResponse('bassins');
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('bassins').insertOne(body);
  return NextResponse.json({ insertedId: result.insertedId });
} 