import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // 1. Seed Users
    const usersCollection = db.collection("users");
    const adminPassword = await bcrypt.hash("admin", 10);
    const operateurPassword = await bcrypt.hash("operateur", 10);
    const distributeurPassword = await bcrypt.hash("distributeur", 10);

    const users = [
      {
        name: "Admin Principal",
        email: "admin@aqua.com",
        password: adminPassword,
        role: "admin",
        actif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Opérateur 1",
        email: "operateur@aqua.com",
        password: operateurPassword,
        role: "operateur",
        actif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Distributeur 1",
        email: "distributeur@aqua.com",
        password: distributeurPassword,
        role: "distributeur",
        actif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const user of users) {
      await usersCollection.updateOne(
        { email: user.email },
        { $set: user },
        { upsert: true }
      );
    }

    // 2. Seed Bassins
    const bassinsCollection = db.collection("bassins");
    const bassinsData = [
      { nom: "Bassin 1", type: "crevette", stade: "alevinage", capacite: 5000, description: "Bassin nord" },
      { nom: "Bassin 2", type: "poisson", stade: "grossissement", capacite: 3000, description: "Bassin sud" },
      { nom: "Bassin 3", type: "crevette", stade: "reproduction", capacite: 2000, description: "Bassin est" }
    ];

    const seededBassins = [];
    for (const bassin of bassinsData) {
      const result = await bassinsCollection.findOneAndUpdate(
        { nom: bassin.nom },
        { $set: bassin },
        { upsert: true, returnDocument: 'after' }
      );
      seededBassins.push(result.value || await bassinsCollection.findOne({ nom: bassin.nom }));
    }

    // 3. Seed IoT Devices
    const iotCollection = db.collection("iot_devices");
    const devices = [
      { mac: "AA:BB:CC:DD:EE:01", nom: "Capteur Bassin 1", status: "online", type: "sensor", bassinId: seededBassins[0]._id.toString(), bassinNom: seededBassins[0].nom },
      { mac: "AA:BB:CC:DD:EE:02", nom: "Capteur Bassin 2", status: "online", type: "sensor", bassinId: seededBassins[1]._id.toString(), bassinNom: seededBassins[1].nom },
      { mac: "AA:BB:CC:DD:EE:03", nom: "Capteur Bassin 3", status: "offline", type: "sensor", bassinId: seededBassins[2]._id.toString(), bassinNom: seededBassins[2].nom }
    ];

    for (const device of devices) {
      await iotCollection.updateOne(
        { mac: device.mac },
        { $set: device },
        { upsert: true }
      );
    }

    // 4. Seed Mesures
    const mesuresCollection = db.collection("mesures");
    const measurements = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000); // intervalle d'une heure
      const bassinIndex = i % 3;
      const device = devices[bassinIndex];

      measurements.push({
        mac: device.mac,
        bassinId: device.bassinId,
        bassinNom: device.bassinNom,
        temperature: parseFloat((24 + Math.random() * 4).toFixed(1)),
        ph: parseFloat((7 + Math.random() * 1.5).toFixed(1)),
        oxygen: parseFloat((5 + Math.random() * 3).toFixed(1)),
        salinity: parseFloat((30 + Math.random() * 5).toFixed(1)),
        turbidity: parseFloat((10 + Math.random() * 20).toFixed(1)),
        date: date,
        createdAt: date
      });
    }

    // Supprimer les anciennes mesures de test pour repartir sur du propre si l'utilisateur veut un seed complet
    // Mais ici on va juste insérer
    await mesuresCollection.insertMany(measurements);

    // 5. Seed Alertes
    const alertesCollection = db.collection("alertes");
    await alertesCollection.insertMany([
      {
        type: "warning",
        param: "temperature",
        value: 28.5,
        message: "Température élevée dans le Bassin 1",
        date: new Date(),
        bassinId: seededBassins[0]._id.toString(),
        stade: seededBassins[0].stade
      },
      {
        type: "error",
        param: "ph",
        value: 6.2,
        message: "pH critique dans le Bassin 2",
        date: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        bassinId: seededBassins[1]._id.toString(),
        stade: seededBassins[1].stade
      }
    ]);

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
