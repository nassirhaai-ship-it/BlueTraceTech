import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Récupérer tous les utilisateurs
    const users = await usersCollection.find({}).toArray();
    
    // Préparer les informations (sans les mots de passe)
    const usersInfo = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      actif: user.actif,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return NextResponse.json({ 
      success: true,
      totalUsers: users.length,
      users: usersInfo
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Vérifier et corriger TOUS les utilisateurs par défaut
    const defaultUsers = [
      {
        email: "admin@aqua.com",
        name: "Admin Principal",
        password: "admin",
        role: "admin"
      },
      {
        email: "operateur@aqua.com",
        name: "Opérateur 1",
        password: "operateur",
        role: "operateur"
      },
      {
        email: "distributeur@aqua.com",
        name: "Distributeur 1",
        password: "distributeur",
        role: "distributeur"
      }
    ];
    
    const results = [];
    
    for (const defaultUser of defaultUsers) {
      const existingUser = await usersCollection.findOne({ email: defaultUser.email });
      
      if (!existingUser) {
        // Créer l'utilisateur s'il n'existe pas
        await usersCollection.insertOne({
          name: defaultUser.name,
          email: defaultUser.email,
          password: await bcrypt.hash(defaultUser.password, 10),
          role: defaultUser.role,
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        results.push({ email: defaultUser.email, action: "créé" });
      } else {
        // Mettre à jour le mot de passe et s'assurer qu'il est actif
        const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
        await usersCollection.updateOne(
          { email: defaultUser.email },
          { 
            $set: { 
              password: hashedPassword,
              actif: true,
              name: defaultUser.name,
              role: defaultUser.role,
              updatedAt: new Date()
            } 
          }
        );
        results.push({ email: defaultUser.email, action: "mis à jour" });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Utilisateurs corrigés avec succès",
      results: results
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de la correction des utilisateurs" 
    }, { status: 500 });
  }
}

