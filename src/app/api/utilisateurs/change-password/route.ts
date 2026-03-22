import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { oldPassword, newPassword } = await req.json();
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("users").findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }
  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Ancien mot de passe incorrect" }, { status: 400 });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.collection("users").updateOne(
    { _id: user._id },
    { $set: { password: hashed, updatedAt: new Date() } }
  );
  return NextResponse.json({ success: true, message: "Mot de passe changé" });
} 