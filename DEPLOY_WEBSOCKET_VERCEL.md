# 🚀 Guide Pratique : Déployer WebSocket avec Vercel

## ⚠️ Limitation Vercel

**Vercel ne supporte PAS les WebSockets traditionnels** car ses fonctions serverless sont stateless et ne maintiennent pas de connexions persistantes.

## ✅ Solution : Railway pour WebSocket + Vercel pour Next.js

### Architecture

```
┌──────────────────┐         ┌──────────────────┐
│   Next.js App    │         │  WebSocket       │
│   (Vercel)       │────────▶│  Server          │
│   https://...    │  HTTP   │  (Railway)       │
└──────────────────┘         │  wss://...       │
                                      │
                                      │ WebSocket
                                      ▼
                            ┌──────────────────┐
                            │  IoT Devices     │
                            │  (ESP8266, etc)  │
                            └──────────────────┘
```

---

## 📋 Étapes de Déploiement

### Étape 1 : Déployer Next.js sur Vercel (déjà fait)

Votre application Next.js est déjà sur Vercel. ✅

---

### Étape 2 : Créer un Service WebSocket sur Railway

#### 2.1 Créer le projet Railway

1. Allez sur [railway.app](https://railway.app)
2. Connectez-vous avec GitHub
3. Cliquez sur **"New Project"**
4. Sélectionnez **"Deploy from GitHub repo"**
5. Choisissez votre repository `aquaai`

#### 2.2 Configurer le service

1. Railway détectera automatiquement Node.js
2. Dans les **Settings** du service :
   - **Name** : `websocket-server` (ou autre nom)
   - **Root Directory** : `/` (laisser vide pour racine)
   - **Build Command** : (laisser vide - pas de build nécessaire)
   - **Start Command** : `node server/ws-server.js`

#### 2.3 Variables d'environnement Railway

Dans les **Variables** du service Railway, ajoutez :

```bash
# Port (Railway définit automatiquement PORT)
WS_PORT=4001

# Token de sécurité (IMPORTANT - générer un token fort)
IOT_WS_TOKEN=votre_token_secret_tres_long_et_securise

# URL de votre app Next.js sur Vercel
API_BASE_URL=https://votre-app.vercel.app

# MongoDB (utiliser la même base que Vercel)
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/aquaai?retryWrites=true&w=majority

# Environnement
NODE_ENV=production
```

**Comment obtenir les valeurs :**

1. **IOT_WS_TOKEN** : Générer un token secret fort
   ```bash
   # Dans votre terminal
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **API_BASE_URL** : L'URL de votre app Vercel (ex: `https://aquaai.vercel.app`)

3. **MONGO_URL** : La même URL MongoDB que celle utilisée sur Vercel

#### 2.4 Obtenir l'URL du WebSocket

1. Après le déploiement, Railway génère automatiquement une URL publique
2. Allez dans les **Settings** → **Networking**
3. Vous verrez une URL comme : `https://websocket-production-xxxx.up.railway.app`
4. **Pour WebSocket, utilisez** : `wss://websocket-production-xxxx.up.railway.app`
5. **Notez cette URL !** 📝

---

### Étape 3 : Configurer Vercel avec l'URL WebSocket

#### 3.1 Ajouter la variable d'environnement sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Ouvrez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez :

```bash
NEXT_PUBLIC_WS_URL=wss://websocket-production-xxxx.up.railway.app
```

⚠️ **Important** : Utilisez `wss://` (pas `ws://`) car Railway utilise HTTPS.

#### 3.2 Redéployer sur Vercel

1. Allez dans **Deployments**
2. Cliquez sur les trois points (...) du dernier déploiement
3. Sélectionnez **"Redeploy"**
4. Ou faites un commit pour déclencher un nouveau déploiement

---

### Étape 4 : Vérifier le Code Client

Votre code dans `src/components/dashboard/AdminDashboard.tsx` devrait déjà utiliser cette variable :

```typescript
const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? 
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:4001` : 
  'ws://localhost:4001');
```

✅ C'est déjà bon ! Le code utilisera automatiquement `NEXT_PUBLIC_WS_URL` en production.

---

### Étape 5 : Mettre à jour les Devices IoT

Si vous avez des devices IoT (ESP8266, etc.), mettez à jour le code :

```cpp
// Dans votre code Arduino/ESP8266
const char* WS_SERVER = "websocket-production-xxxx.up.railway.app";  // Votre domaine Railway
const uint16_t WS_PORT = 443;  // WSS utilise le port 443
const char* WS_PATH = "/";     // Chemin WebSocket

// Pour la connexion WebSocket
WebSocketsClient webSocket;
webSocket.beginSSL(WS_SERVER, WS_PORT, WS_PATH);
```

---

## 🧪 Tester le Déploiement

### 1. Tester le WebSocket Railway

Installez `wscat` si nécessaire :
```bash
npm install -g wscat
```

Testez la connexion :
```bash
wscat -c wss://websocket-production-xxxx.up.railway.app
```

Si connecté, vous devriez voir :
```
Connected (press CTRL+C to quit)
```

### 2. Tester depuis l'application

1. Ouvrez votre application Vercel : `https://votre-app.vercel.app`
2. Allez sur la page Dashboard
3. Vérifiez les indicateurs WebSocket :
   - L'indicateur "Temps réel actif" devrait être vert
   - Les données IoT devraient se mettre à jour

### 3. Vérifier les logs Railway

1. Allez sur Railway
2. Ouvrez votre service WebSocket
3. Allez dans l'onglet **Logs**
4. Vous devriez voir :
   ```
   🚀 WebSocket Server démarré sur port 4001
   🔐 Token de sécurité: xxxxxxxx...
   📡 Prêt à recevoir les données IoT
   ```

---

## 🐛 Résolution des Problèmes

### Problème 1 : WebSocket ne se connecte pas

**Vérifications :**
- ✅ URL utilise `wss://` (pas `ws://`)
- ✅ Variable `NEXT_PUBLIC_WS_URL` bien configurée sur Vercel
- ✅ Service Railway est déployé et en ligne
- ✅ Variables d'environnement Railway sont correctes

**Solution :**
1. Vérifiez les logs Railway pour voir les erreurs
2. Testez avec `wscat` (voir ci-dessus)
3. Vérifiez que `IOT_WS_TOKEN` est le même partout

### Problème 2 : Erreur "Connection refused"

**Cause :** Le serveur WebSocket n'écoute pas correctement

**Solution :**
Dans `server/ws-server.js`, vérifiez que le port est bien configuré :
```javascript
const WS_PORT = process.env.PORT || process.env.WS_PORT || 4001;
const server = http.createServer();
server.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket Server démarré sur port ${WS_PORT}`);
});
```

### Problème 3 : CORS ou erreurs de connexion

**Solution :**
Le serveur WebSocket doit écouter sur `0.0.0.0` (déjà fait dans votre code).

---

## 📊 Checklist de Déploiement

- [ ] Service WebSocket créé sur Railway
- [ ] Variables d'environnement Railway configurées :
  - [ ] `WS_PORT` ou `PORT` (géré automatiquement)
  - [ ] `IOT_WS_TOKEN` (token secret généré)
  - [ ] `API_BASE_URL` (URL Vercel)
  - [ ] `MONGO_URL` (même que Vercel)
- [ ] URL WebSocket Railway obtenue (format `wss://...`)
- [ ] Variable `NEXT_PUBLIC_WS_URL` ajoutée sur Vercel
- [ ] Application Vercel redéployée
- [ ] Test de connexion avec `wscat` réussi
- [ ] Test depuis l'application Vercel réussi
- [ ] Logs Railway montrent les connexions

---

## 💡 Bonnes Pratiques

1. **Sécurité** :
   - Utilisez un token fort pour `IOT_WS_TOKEN`
   - Ne commitez jamais les tokens dans Git
   - Utilisez `wss://` (HTTPS) en production

2. **Monitoring** :
   - Surveillez les logs Railway régulièrement
   - Configurez des alertes Railway si nécessaire

3. **Scaling** :
   - Railway scale automatiquement
   - Pour plus de ressources, upgradez le plan Railway

4. **Coûts** :
   - Railway : $5 crédit gratuit/mois (suffisant pour commencer)
   - Vercel : Gratuit pour la plupart des projets

---

## 🔗 Ressources Utiles

- [Railway Documentation](https://docs.railway.app)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## ✅ Résumé Rapide

1. **Railway** → Créer nouveau service → Déployer `server/ws-server.js`
2. **Railway** → Ajouter variables d'environnement
3. **Railway** → Obtenir URL WebSocket (`wss://...`)
4. **Vercel** → Ajouter variable `NEXT_PUBLIC_WS_URL`
5. **Vercel** → Redéployer
6. **Tester** → Vérifier la connexion WebSocket

C'est tout ! 🎉

