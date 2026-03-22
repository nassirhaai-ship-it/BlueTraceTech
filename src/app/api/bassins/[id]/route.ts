import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const client = await clientPromise;
  const db = client.db();
  await db.collection('bassins').updateOne({ _id: new ObjectId(id) }, { $set: body });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection('bassins').deleteOne({ _id: new ObjectId(params.id) });
  return NextResponse.json({ success: true });
} 