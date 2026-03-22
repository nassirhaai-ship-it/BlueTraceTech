const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
console.log("URI:", uri ? "Defined" : "UNDEFINED");

async function test() {
  if (!uri) return;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connexion réussie à MongoDB");
    const db = client.db();
    const lots = await db.collection("lots").find({}).limit(1).toArray();
    console.log("✅ Lecture réussie collection 'lots':", lots.length, "document(s) trouvé(s)");
    
    const users = await db.collection("users").find({}).limit(3).toArray();
    console.log("✅ Lecture réussie collection 'users':", users.map(u => u.email));
  } catch (err) {
    console.error("❌ Erreur:", err);
  } finally {
    await client.close();
  }
}

test();
