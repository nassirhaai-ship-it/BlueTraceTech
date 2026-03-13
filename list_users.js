
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://auqua_db_user:aaaabbbb@cluster0.p3sd301.mongodb.net/aquaai_db?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection("users").find({}).toArray();
    console.log("Detailed User Info:");
    users.forEach(u => {
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log(`Actif: ${u.actif}`);
      console.log(`Has Password: ${!!u.password}`);
      console.log('---');
    });
  } finally {
    await client.close();
  }
}

run().catch(console.error);
