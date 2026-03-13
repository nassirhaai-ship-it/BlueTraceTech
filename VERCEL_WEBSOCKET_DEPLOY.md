# 🌐 Guide de Déploiement WebSocket sur Vercel

## ⚠️ Limitation Importante

**Vercel ne supporte pas les WebSockets traditionnels** car il utilise des fonctions serverless qui ne maintiennent pas de connexions persistantes. Les fonctions serverless s'activent uniquement lors d'une requête et se terminent après.

## 🔍 Solutions Possibles

### Solution 1 : Déployer le WebSocket sur un Service Séparé (RECOMMANDÉ)

Déployez votre serveur WebSocket sur un service qui supporte les WebSockets persistants, comme Railway, Render, ou Fly.io.

#### Option A : Railway (Recommandé - déjà configuré)

1. **Créer un nouveau service Railway pour le WebSocket**
   - Allez sur Railway
   - Créez un nouveau projet
   - Ajoutez un service Node.js
   - Connectez votre repository

2. **Configurer le service WebSocket**
   - Créez un nouveau fichier `railway-websocket.json` :
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "echo 'No build needed for WS server'"
     },
     "deploy": {
       "startCommand": "node server/ws-server.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. **Variables d'environnement sur Railway**
   ```bash
   WS_PORT=4001
   IOT_WS_TOKEN=votre_token_secret
   API_BASE_URL=https://votre-app-nextjs.railway.app
   MONGO_URL=mongodb://... (ou utiliser MongoDB Railway)
   NODE_ENV=production
   ```

4. **Obtenir l'URL du WebSocket**
   - Railway génère automatiquement une URL publique
   - Exemple : `wss://your-ws-service.railway.app`
   - Utilisez cette URL dans votre code client

#### Option B : Render.com

1. Créez un nouveau service Web Service
2. Build Command : (vide ou `npm install`)
3. Start Command : `node server/ws-server.js`
4. Configurez les variables d'environnement

#### Option C : Fly.io

1. Créez un nouveau fichier `fly.toml` dans un dossier séparé
2. Déployez le serveur WebSocket séparément

---

### Solution 2 : Utiliser Vercel Edge Functions (Expérimental)

Vercel supporte maintenant les WebSockets via Edge Functions (bêta), mais c'est limité.

#### Créer une Edge Function WebSocket

1. **Créer le fichier** `src/app/api/ws/route.ts` :
```typescript
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Vercel Edge Functions support WebSockets
  // Mais la configuration est complexe et limitée
  // Pour un serveur WebSocket complet, utilisez Solution 1
}
```

**⚠️ Note** : Cette solution est limitée et complexe. La Solution 1 est recommandée.

---

### Solution 3 : Utiliser un Service WebSocket Géré

Utilisez un service WebSocket géré comme Pusher, Ably, ou Socket.io Cloud.

#### Exemple avec Pusher

1. **Installer Pusher**
   ```bash
   npm install pusher pusher-js
   ```

2. **Créer une API route** `src/app/api/pusher-auth/route.ts`

3. **Configurer le client** pour utiliser Pusher au lieu de WebSocket direct

**Avantages** : Simple, scalable, géré  
**Inconvénients** : Coût, nécessite de changer le code client

---

### Solution 4 : Convertir en Server-Sent Events (SSE)

Convertir le WebSocket en SSE, que Vercel supporte.

#### Créer une route SSE

```typescript
// src/app/api/events/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Envoyer des événements via SSE
      const encoder = new TextEncoder();
      
      // Envoyer des données périodiquement
      const interval = setInterval(() => {
        const data = JSON.stringify({ type: 'data', payload: '...' });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }, 1000);
      
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 🚀 Solution Recommandée : Railway pour WebSocket

### Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js App   │         │  WebSocket Server│
│   (Vercel)      │────────▶│  (Railway)       │
│   Port 3000     │  HTTP   │  Port 4001       │
└─────────────────┘         └──────────────────┘
                                      │
                                      │ WebSocket
                                      ▼
                            ┌──────────────────┐
                            │  IoT Devices     │
                            │  (ESP8266, etc)  │
                            └──────────────────┘
```

### Étapes de Déploiement

#### 1. Déployer Next.js sur Vercel
- ✅ Déjà fait ou en cours

#### 2. Déployer WebSocket sur Railway

**Créer un nouveau service Railway :**

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Choisissez le même repository
5. Railway détectera automatiquement Node.js

**Configurer le service :**

1. Dans les **Settings** du service :
   - **Root Directory** : `/` (racine)
   - **Build Command** : (vide - pas besoin de build)
   - **Start Command** : `node server/ws-server.js`

2. **Variables d'environnement** :
   ```bash
   WS_PORT=4001
   IOT_WS_TOKEN=votre_token_secret_ici
   API_BASE_URL=https://votre-app.vercel.app
   MONGO_URL=mongodb+srv://...
   NODE_ENV=production
   ```

3. **Obtenir l'URL publique** :
   - Railway génère automatiquement une URL
   - Exemple : `wss://websocket-production.up.railway.app`
   - Notez cette URL !

#### 3. Mettre à jour le Code Client

Dans votre code frontend qui se connecte au WebSocket, utilisez l'URL Railway :

```typescript
// Au lieu de
const ws = new WebSocket('ws://localhost:4001');

// Utilisez
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://your-ws.railway.app';
const ws = new WebSocket(wsUrl);
```

**Variable d'environnement Vercel :**
```bash
NEXT_PUBLIC_WS_URL=wss://your-ws-service.railway.app
```

#### 4. Mettre à jour les Devices IoT

Dans votre code Arduino/ESP8266, utilisez l'URL Railway :

```cpp
// Dans nodemcu_websocket.ino
const char* WS_SERVER = "your-ws-service.railway.app";  // Utiliser le domaine Railway
const uint16_t WS_PORT = 443;  // HTTPS/WSS utilise le port 443
const char* WS_PATH = "/";     // Chemin WebSocket
```

**Important** : Railway utilise HTTPS/WSS, donc port 443.

---

## 📝 Configuration Complète Railway + Vercel

### Variables Vercel (Next.js App)

```bash
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_SECRET=votre_secret
NEXT_PUBLIC_WS_URL=wss://your-ws.railway.app
NODE_ENV=production
```

### Variables Railway (WebSocket Server)

```bash
WS_PORT=4001
IOT_WS_TOKEN=votre_token_secret
API_BASE_URL=https://votre-app.vercel.app
MONGO_URL=mongodb+srv://...  # OU utiliser MongoDB Railway
NODE_ENV=production
```

---

## 🔧 Adapter le Code WebSocket pour Railway

### Modifier `server/ws-server.js`

Railway peut utiliser une variable `PORT` au lieu de `WS_PORT`. Adaptez le code :

```javascript
// Au début de ws-server.js
const WS_PORT = process.env.PORT || process.env.WS_PORT || 4001;
```

Railway définit automatiquement `PORT`, donc cela fonctionnera automatiquement.

---

## 🧪 Tester le Déploiement

### 1. Vérifier que le WebSocket Railway fonctionne

```bash
# Tester avec wscat (installer avec: npm install -g wscat)
wscat -c wss://your-ws-service.railway.app

# Si connecté, vous devriez voir:
# Connected (press CTRL+C to quit)
```

### 2. Tester depuis l'application Next.js

1. Ouvrez votre application Vercel
2. Allez sur la page IoT
3. Vérifiez que la connexion WebSocket fonctionne

### 3. Tester depuis un Device IoT

1. Configurez votre ESP8266 avec l'URL Railway
2. Vérifiez les logs Railway pour voir les connexions

---

## 🐛 Résolution des Problèmes

### Problème 1 : WebSocket ne se connecte pas

**Solution :**
- Vérifiez que l'URL Railway utilise `wss://` (pas `ws://`)
- Vérifiez le port (443 pour WSS)
- Vérifiez les variables d'environnement Railway

### Problème 2 : CORS errors

**Solution :**
Dans `server/ws-server.js`, ajoutez des headers CORS si nécessaire :
```javascript
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
});
```

### Problème 3 : Connexion fermée immédiatement

**Solution :**
- Vérifiez que `IOT_WS_TOKEN` est correctement configuré
- Vérifiez les logs Railway pour voir les erreurs
- Vérifiez que le serveur WebSocket écoute sur le bon port

---

## 💡 Meilleures Pratiques

1. **Séparer les services** : WebSocket sur Railway, Next.js sur Vercel
2. **Utiliser HTTPS/WSS** : Toujours utiliser `wss://` en production
3. **Gérer les reconnexions** : Implémenter une logique de reconnexion dans le client
4. **Monitoring** : Surveiller les logs Railway pour les connexions
5. **Scaling** : Railway scale automatiquement selon la charge

---

## 📊 Coûts

### Railway
- **Free tier** : $5 crédit gratuit par mois
- **Hobby** : $5/mois pour plus de ressources
- WebSocket server consomme peu de ressources

### Vercel
- **Free tier** : Généralement suffisant
- Next.js app reste sur Vercel gratuit

---

## ✅ Checklist

- [ ] Next.js déployé sur Vercel
- [ ] WebSocket service créé sur Railway
- [ ] Variables d'environnement configurées sur Railway
- [ ] URL WebSocket Railway obtenue
- [ ] Variable `NEXT_PUBLIC_WS_URL` configurée sur Vercel
- [ ] Code client mis à jour avec l'URL Railway
- [ ] Code IoT (ESP8266) mis à jour avec l'URL Railway
- [ ] Test de connexion WebSocket réussi
- [ ] Monitoring des logs Railway activé

---

## 🔗 Ressources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js WebSocket](https://github.com/websockets/ws)

---

**Conclusion** : Pour déployer un serveur WebSocket avec Vercel, la meilleure solution est de déployer le serveur WebSocket sur Railway (ou un service similaire) et de le connecter à votre application Next.js sur Vercel via des variables d'environnement.

---

## 📖 Guide Pratique Rapide

Pour un guide pas-à-pas détaillé, consultez : **[DEPLOY_WEBSOCKET_VERCEL.md](./DEPLOY_WEBSOCKET_VERCEL.md)**

Ce guide contient :
- ✅ Étapes détaillées pour Railway
- ✅ Configuration des variables d'environnement
- ✅ Tests et troubleshooting
- ✅ Checklist complète

