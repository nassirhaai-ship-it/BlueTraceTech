import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getMockResponse } from "@/lib/mockData";

// Types pour la validation
interface MesureData {
  mac: string;
  temperature?: number;
  ph?: number;
  oxygen?: number;
  salinity?: number;
  turbidity?: number;
  timestamp?: string;
  receivedAt?: string;
}

// Validation des données de mesure
function validateMesureData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation de base
  if (!data.mac || typeof data.mac !== 'string') {
    errors.push('Adresse MAC requise et doit être une chaîne');
  }

  // Validation des valeurs numériques
  const numericFields = [
    { name: 'temperature', min: -50, max: 100, unit: '°C' },
    { name: 'ph', min: 0, max: 14, unit: '' },
    { name: 'oxygen', min: 0, max: 50, unit: 'mg/L' },
    { name: 'salinity', min: 0, max: 50, unit: 'ppt' },
    { name: 'turbidity', min: 0, max: 1000, unit: 'NTU' }
  ];

  numericFields.forEach(field => {
    if (data[field.name] !== undefined) {
      const value = parseFloat(data[field.name]);
      if (isNaN(value)) {
        errors.push(`${field.name} doit être un nombre valide`);
      } else if (value < field.min || value > field.max) {
        errors.push(`${field.name} doit être entre ${field.min} et ${field.max} ${field.unit}`);
      }
    }
  });

  // Validation du timestamp
  if (data.timestamp) {
    const timestamp = new Date(data.timestamp);
    if (isNaN(timestamp.getTime())) {
      errors.push('Timestamp invalide');
    } else {
      const now = new Date();
      const diff = Math.abs(now.getTime() - timestamp.getTime());
      if (diff > 24 * 60 * 60 * 1000) { // Plus de 24h de différence
        errors.push('Timestamp trop éloigné de l\'heure actuelle');
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Plages floues pour chaque paramètre et chaque stade
const fuzzyThresholds = {
  temperature: {
    alevinage:    { normal: [22, 26], attention: [20, 22, 26, 28], critical: [null, 20, 28, null] },
    grossissement:{ normal: [24, 28], attention: [22, 24, 28, 30], critical: [null, 22, 30, null] },
    reproduction: { normal: [20, 24], attention: [18, 20, 24, 26], critical: [null, 18, 26, null] }
  },
  ph: {
    alevinage:    { normal: [7, 8], attention: [6.5, 7, 8, 8.5], critical: [null, 6.5, 8.5, null] },
    grossissement:{ normal: [7, 8], attention: [6.5, 7, 8, 8.5], critical: [null, 6.5, 8.5, null] },
    reproduction: { normal: [7, 8], attention: [6.5, 7, 8, 8.5], critical: [null, 6.5, 8.5, null] }
  },
  oxygen: {
    alevinage:    { normal: [6, 10], attention: [5, 6, 10, 12], critical: [null, 5, 12, null] },
    grossissement:{ normal: [5, 9],  attention: [4, 5, 9, 11],  critical: [null, 4, 11, null] },
    reproduction: { normal: [7, 11], attention: [6, 7, 11, 13], critical: [null, 6, 13, null] }
  }
  // Ajoutez salinity, turbidity si besoin
};

function fuzzyEvaluate(param: keyof typeof fuzzyThresholds, value: number, stade: keyof typeof fuzzyThresholds[typeof param]): { level: string, score: number } {
  const t = fuzzyThresholds[param]?.[stade];
  if (!t) return { level: 'unknown', score: 0 };
  if (value >= t.normal[0] && value <= t.normal[1]) return { level: 'normal', score: 1 };
  if (t.attention[0] !== null && value >= t.attention[0] && value < t.attention[1]) return { level: 'attention', score: (t.attention[1] - value) / (t.attention[1] - t.attention[0]) };
  if (t.attention[2] !== null && value > t.attention[2] && value <= t.attention[3]) return { level: 'attention', score: (value - t.attention[2]) / (t.attention[3] - t.attention[2]) };
  if (t.critical[1] !== null && value < t.critical[1]) return { level: 'critical', score: 1 };
  if (t.critical[2] !== null && value > t.critical[2]) return { level: 'critical', score: 1 };
  return { level: 'unknown', score: 0 };
}

// Récupération des mesures avec filtres
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bassinId = searchParams.get('bassinId');
    const mac = searchParams.get('mac');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const client = await clientPromise;
    const db = client.db();

    // Construction du filtre
    const filter: any = {};
    
    if (bassinId) filter.bassinId = bassinId;
    if (mac) filter.mac = mac;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    console.log(`📊 Récupération mesures avec filtre:`, filter);

    const mesures = await db.collection("mesures")
      .find(filter)
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await db.collection("mesures").countDocuments(filter);

    return NextResponse.json({
      mesures,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error("❌ Erreur récupération mesures:", error);
    // Retourner les données de simulation si la base de données n'est pas accessible
    return getMockResponse('mesures');
  }
}

// Création d'une nouvelle mesure
export async function POST(req: NextRequest) {
  try {
    const data: MesureData = await req.json();
    
    console.log(`📊 Réception mesure aaaaaaaaaaaa:`, {
      mac: data.mac,
      temperature: data.temperature,
      ph: data.ph,
      oxygen: data.oxygen,
      salinity: data.salinity,
      turbidity: data.turbidity
    });

    // Validation des données
    const validation = validateMesureData(data);
    if (!validation.isValid) {
      console.log(`❌ Validation échouée:`, validation.errors);
      return NextResponse.json({ 
        error: "Données invalides", 
        details: validation.errors 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Préparation de l'objet à insérer
    const mesureToInsert: any = {
      mac: data.mac,
      date: new Date(),
      createdAt: new Date(),
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date()
    };

    // Ajout des valeurs de mesure si présentes
    if (data.temperature !== undefined) mesureToInsert.temperature = parseFloat(data.temperature.toString());
    if (data.ph !== undefined) mesureToInsert.ph = parseFloat(data.ph.toString());
    if (data.oxygen !== undefined) mesureToInsert.oxygen = parseFloat(data.oxygen.toString());
    if (data.salinity !== undefined) mesureToInsert.salinity = parseFloat(data.salinity.toString());
    if (data.turbidity !== undefined) mesureToInsert.turbidity = parseFloat(data.turbidity.toString());

    // Gestion du timestamp
    if (data.timestamp) {
      const timestamp = new Date(data.timestamp);
      mesureToInsert.timestamp = timestamp.toISOString();
      mesureToInsert.deviceTime = timestamp;
    }

    // Recherche du capteur et association au bassin
    const capteur = await db.collection('iot_devices').findOne({ mac: data.mac });
    if (capteur && capteur.bassinId) {
      mesureToInsert.bassinId = capteur.bassinId;
      mesureToInsert.bassinNom = capteur.bassinNom || '';
    }

    // Insertion en base
    const result = await db.collection('mesures').insertOne(mesureToInsert);

    // === Logique floue pour alertes ===
    let stade = 'grossissement';
    if (capteur && capteur.stade) stade = capteur.stade;
    type Stade = 'alevinage' | 'grossissement' | 'reproduction';
    const stadeTyped = (stade as Stade);
    const alertes = [];
    if (mesureToInsert.temperature !== undefined) {
      const evalTemp = fuzzyEvaluate('temperature', mesureToInsert.temperature, stadeTyped);
      if (evalTemp.level === 'critical' || evalTemp.level === 'attention') {
        alertes.push({
          type: evalTemp.level === 'critical' ? 'error' : 'warning',
          param: 'temperature',
          value: mesureToInsert.temperature,
          message: `Temperature ${evalTemp.level} in basin ${mesureToInsert.bassinNom || ''}`,
          date: new Date(),
          bassinId: mesureToInsert.bassinId,
          stade,
        });
      }
    }
    if (mesureToInsert.ph !== undefined) {
      const evalPh = fuzzyEvaluate('ph', mesureToInsert.ph, stadeTyped);
      if (evalPh.level === 'critical' || evalPh.level === 'attention') {
        alertes.push({
          type: evalPh.level === 'critical' ? 'error' : 'warning',
          param: 'ph',
          value: mesureToInsert.ph,
          message: `pH ${evalPh.level} in basin ${mesureToInsert.bassinNom || ''}`,
          date: new Date(),
          bassinId: mesureToInsert.bassinId,
          stade,
        });
      }
    }
    if (mesureToInsert.oxygen !== undefined) {
      const evalOxy = fuzzyEvaluate('oxygen', mesureToInsert.oxygen, stadeTyped);
      if (evalOxy.level === 'critical' || evalOxy.level === 'attention') {
        alertes.push({
          type: evalOxy.level === 'critical' ? 'error' : 'warning',
          param: 'oxygen',
          value: mesureToInsert.oxygen,
          message: `Oxygen ${evalOxy.level} in basin ${mesureToInsert.bassinNom || ''}`,
          date: new Date(),
          bassinId: mesureToInsert.bassinId,
          stade,
        });
      }
    }
    // Ajoutez salinity, turbidity si besoin
    if (alertes.length > 0) {
      await db.collection('alertes').insertMany(alertes);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Mesure créée avec succès",
      insertedId: result.insertedId,
      mesure: {
        id: result.insertedId,
        mac: data.mac,
        bassinId: mesureToInsert.bassinId,
        bassinNom: mesureToInsert.bassinNom,
        timestamp: mesureToInsert.timestamp || mesureToInsert.date,
        values: {
          temperature: mesureToInsert.temperature,
          ph: mesureToInsert.ph,
          oxygen: mesureToInsert.oxygen,
          salinity: mesureToInsert.salinity,
          turbidity: mesureToInsert.turbidity
        }
      }
    });

  } catch (error) {
    console.error("❌ Erreur création mesure:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la création de la mesure",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} 