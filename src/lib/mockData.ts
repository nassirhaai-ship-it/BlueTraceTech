import { NextResponse } from 'next/server';

const mockBassins = [
  { _id: '1', nom: 'Bassin principal (Simulé)', stade: 'Croissance', volume: 5000, type: 'Eau douce' },
  { _id: '2', nom: 'Bassin Alevins (Simulé)', stade: 'Éclosion', volume: 1000, type: 'Eau douce' },
  { _id: '3', nom: 'Bassin Isolement (Simulé)', stade: 'Quarantaine', volume: 500, type: 'Eau douce' },
];

const mockAlertes = [
  { _id: '1', type: 'error', message: 'Température critique basse', bassinId: '1', resolved: false, date: new Date().toISOString() },
  { _id: '2', type: 'warning', message: "Niveau d'oxygène faible", bassinId: '2', resolved: false, date: new Date().toISOString() },
  { _id: '3', type: 'info', message: 'Maintenance planifiée', bassinId: '3', resolved: true, date: new Date(Date.now() - 86400000).toISOString() },
];

const mockUtilisateurs = [
  { _id: '1', name: 'Admin Simulé', email: 'admin@bluetrace.com', role: 'admin' },
  { _id: '2', name: 'Opérateur Simulé', email: 'op@bluetrace.com', role: 'operateur' },
  { _id: '3', name: 'Observateur Simulé', email: 'obs@bluetrace.com', role: 'observateur' },
];

const mockMesures = Array.from({ length: 50 }).map((_, i) => ({
  _id: `m${i}`,
  bassinId: i % 3 === 0 ? '1' : i % 3 === 1 ? '2' : '3',
  mac: `00:11:22:33:44:${55 + (i % 3)}`,
  temperature: 20 + Math.random() * 5,
  ph: 6.5 + Math.random() * 1.5,
  oxygen: 5 + Math.random() * 4,
  salinity: Math.random() * 2,
  turbidity: Math.random() * 10,
  param: i % 2 === 0 ? 'Température' : 'pH',
  value: i % 2 === 0 ? 20 + Math.random() * 5 : 6.5 + Math.random() * 1.5,
  date: new Date(Date.now() - i * 3600000).toISOString(),
}));

const mockIotStatus = {
  stats: { total: 3, online: 2, offline: 1, error: 0, recentlySeen: 2 },
  devices: [
    { mac: '00:11:22:33:44:55', bassinId: '1', status: 'online', lastSeen: new Date().toISOString() },
    { mac: '00:11:22:33:44:56', bassinId: '2', status: 'online', lastSeen: new Date().toISOString() },
    { mac: '00:11:22:33:44:57', bassinId: '3', status: 'offline', lastSeen: new Date(Date.now() - 86400000).toISOString() },
  ],
  timestamp: new Date().toISOString()
};

export function getMockResponse(type: 'mesures' | 'bassins' | 'alertes' | 'utilisateurs' | 'iotStatus') {
  console.log(`⚠️ Mode Simulation: Renvoi de fausses données pour ${type} car MongoDB est inaccessible`);
  
  switch(type) {
    case 'mesures':
      return NextResponse.json({
        mesures: mockMesures,
        total: mockMesures.length,
        limit: 100,
        offset: 0,
        hasMore: false,
        isSimulation: true
      });
    case 'bassins':
      return NextResponse.json(mockBassins);
    case 'alertes':
      return NextResponse.json(mockAlertes);
    case 'utilisateurs':
      return NextResponse.json(mockUtilisateurs);
    case 'iotStatus':
      return NextResponse.json(mockIotStatus);
    default:
      return NextResponse.json([]);
  }
}
