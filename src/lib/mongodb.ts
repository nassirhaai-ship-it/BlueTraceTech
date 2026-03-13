import { MongoClient } from "mongodb";

// Support à la fois MONGO_URL (Railway) et MONGODB_URI (Atlas/autre)
const uri = (process.env.MONGO_URL || process.env.MONGODB_URI) as string;
console.log("[MONGODB] URI Configured:", uri ? "YES" : "NO");
if (uri) console.log("[MONGODB] URI Protocol:", uri.substring(0, 10));

const options = {};
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  console.error("❌ [MONGODB] ERROR: MONGODB_URI is MISSING in process.env");
  throw new Error("MongoDB URI is not configured. Please add MONGO_URL or MONGODB_URI to your environment variables");
}

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

export default clientPromise; 