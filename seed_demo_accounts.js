
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const uri = "mongodb+srv://auqua_db_user:aaaabbbb@cluster0.p3sd301.mongodb.net/aquaai_db?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection("users");

    const accounts = [
      { email: "admin@trace.com", password: "admin", role: "admin", name: "Admin Démo" },
      { email: "operateur@trace.com", password: "operateur", role: "operateur", name: "Opérateur Démo" },
      { email: "distributeur@trace.com", password: "distributeur", role: "distributeur", name: "Distributeur Démo" },
    ];

    for (const acc of accounts) {
      const hashedPassword = await bcrypt.hash(acc.password, 10);
      await usersCollection.updateOne(
        { email: acc.email },
        { 
          $set: { 
            email: acc.email,
            password: hashedPassword,
            role: acc.role,
            name: acc.name,
            actif: true,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      console.log(`✅ Account ${acc.email} upserted successfully.`);
    }
  } finally {
    await client.close();
  }
}

run().catch(console.error);
