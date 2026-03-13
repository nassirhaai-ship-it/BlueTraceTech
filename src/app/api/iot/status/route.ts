import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getMockResponse } from "@/lib/mockData";

// Mise à jour du statut d'un IoT
export async function POST(req: NextRequest) {
  try {
    const { mac, status, lastSeen } = await req.json();
    
    if (!mac) {
      return NextResponse.json({ error: "Adresse MAC requise" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Mise à jour du statut dans la collection iot_devices
    const result = await db.collection("iot_devices").updateOne(
      { mac: mac },
      { 
        $set: { 
          status: status || "online",
          lastSeen: lastSeen ? new Date(lastSeen) : new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log(`📱 Statut IoT mis à jour: ${mac} -> ${status}`);

    return NextResponse.json({ 
      success: true, 
      message: "Statut mis à jour",
      updated: result.modifiedCount > 0,
      upserted: result.upsertedCount > 0
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour statut IoT:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du statut" }, { status: 500 });
  }
}

// Récupération du statut de tous les IoT
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mac = searchParams.get('mac');

    const client = await clientPromise;
    const db = client.db();

    // Construction du filtre
    const filter: any = {};
    if (mac) filter.mac = mac;

    console.log(`📱 Vérification statut IoT devices avec filtre:`, filter);

    const devices = await db.collection("iot_devices")
      .find(filter)
      .project({
        _id: 1,
        mac: 1,
        nom: 1,
        type: 1,
        status: 1,
        lastSeen: 1,
        ipAddress: 1,
        bassinId: 1
      })
      .sort({ lastSeen: -1 })
      .toArray();

    // Calculer les statistiques
    const stats = {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      error: devices.filter(d => d.status === 'error').length,
      recentlySeen: devices.filter(d => {
        if (!d.lastSeen) return false;
        return Date.now() - new Date(d.lastSeen).getTime() < 5 * 60 * 1000; // 5 minutes
      }).length
    };

    return NextResponse.json({
      devices,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erreur vérification statut IoT devices:", error);
    return getMockResponse('iotStatus');
  }
}

// Mise à jour forcée du statut d'un IoT device
export async function PUT(req: NextRequest) {
  try {
    const { mac, status, force = false } = await req.json();

    if (!mac || !status) {
      return NextResponse.json({ 
        error: "MAC et statut requis" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Rechercher le device
    const device = await db.collection("iot_devices").findOne({ mac });

    if (!device) {
      return NextResponse.json({ 
        error: "IoT device non trouvé" 
      }, { status: 404 });
    }

    // Mise à jour du statut
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Si c'est un statut online, mettre à jour lastSeen
    if (status === 'online') {
      updateData.lastSeen = new Date();
    }

    const result = await db.collection("iot_devices").updateOne(
      { _id: device._id },
      { $set: updateData }
    );

    console.log(`📱 Statut IoT device mis à jour manuellement: ${mac} -> ${status}`);

    return NextResponse.json({ 
      success: true, 
      message: "Statut mis à jour avec succès",
      device: {
        mac,
        status,
        lastSeen: updateData.lastSeen || device.lastSeen
      }
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour statut IoT device:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la mise à jour du statut" 
    }, { status: 500 });
  }
} 