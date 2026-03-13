import { MongoClient } from "mongodb";

// Support à la fois MONGO_URL (Railway) et MONGODB_URI (Atlas/autre)
const uri = (process.env.MONGO_URL || process.env.MONGODB_URI) as string;
console.log("[MONGODB] URI Configured:", uri ? "YES" : "NO");
if (uri) console.log("[MONGODB] URI Protocol:", uri.substring(0, 10));

const options = {};
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  console.warn("⚠️ [MONGODB] WARNING: MONGODB_URI is MISSING in process.env");
  // En mode build, on exporte une promesse qui ne résoudra jamais ou qui lancera une erreur plus tard
  // pour éviter de faire planter le build Next.js au chargement des modules.
  clientPromise = new Promise((_, reject) => {
    if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
      // Si on est vraiment en train de tourner en prod sans URI, c'est un problème.
      // Mais on ne veut pas bloquer le build.
    }
  });
} else {
  // Configuration MongoDB pour tous les environnements
  if (process.env.NODE_ENV === "development") {
    if (!(global as any)._mongoClientPromise) {
      client = new MongoClient(uri, options);
      (global as any)._mongoClientPromise = client.connect();
    }
    clientPromise = (global as any)._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise; 