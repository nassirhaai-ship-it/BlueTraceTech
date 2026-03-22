import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/init-db";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // D'abord, mettre à jour les utilisateurs existants sans mot de passe
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Mettre à jour les utilisateurs existants qui n'ont pas de mot de passe hashé
    const users = await usersCollection.find({}).toArray();
    for (const user of users) {
      if (!user.password) {
        let defaultPassword = "";
        if (user.email === "admin@aqua.com") {
          defaultPassword = "admin";
        } else if (user.email === "operateur@aqua.com") {
          defaultPassword = "operateur";
        } else if (user.email === "distributeur@aqua.com") {
          defaultPassword = "distributeur";
        } else {
          defaultPassword = "password123"; // Mot de passe par défaut
        }
        
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              password: await bcrypt.hash(defaultPassword, 10),
              actif: user.actif !== undefined ? user.actif : true,
              updatedAt: new Date()
            } 
          }
        );
        console.log(`✅ Mot de passe ajouté pour ${user.email}`);
      }
    }
    
    // Ensuite, initialiser la base de données
    const success = await initializeDatabase();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "Base de données initialisée avec succès. Les utilisateurs existants ont été mis à jour avec des mots de passe." 
      });
    } else {
      return NextResponse.json({ 
        error: "Erreur lors de l'initialisation de la base de données" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de l'initialisation" 
    }, { status: 500 });
  }
} 