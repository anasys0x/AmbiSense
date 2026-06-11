![AmbiSense](https://github.com/anasys0x/AmbiSense/blob/main/AmbiSense.png)

<h1 align="center">AmbiSense</h1>

<p align="center">
  Serveur Express connecté à MongoDB Atlas qui collecte et expose des données d'ambiance (niveau sonore, observations) en quasi temps réel via une API REST authentifiée par clé API.
</p>

---

## Prérequis

- Node.js v18+
- Un cluster MongoDB Atlas
- Phyphox (application mobile pour la collecte audio)

---

## Installation

```bash
git clone https://github.com/anasys0x/AmbiSense.git
cd AmbiSense
npm install
```

Crée un fichier `.env` à la racine :

```env
MONGO_URI=mongodb+srv://<username>:<password>@ambisense.mongodb.net/ambisense?appName=AmbiSense
PORT=1234
```

Lance le serveur :

```bash
npm run dev     # développement (nodemon)
npm start       # production
```

---

## Endpoints

### Gestion des devices

| Méthode | Endpoint | Corps | Réponse |
|---------|----------|-------|---------|
| `POST` | `/devices` | `{ name, location }` | `201 + { id, apiKey }` |
| `GET` | `/devices` | — | `200 + tableau` |

### Collecte

| Méthode | Endpoint | Header | Corps | Réponse |
|---------|----------|--------|-------|---------|
| `POST` | `/measurements` | `x-api-key` | `{ type, value, location, timestamp }` | `201 + document` |
| `POST` | `/observations` | `x-api-key` | `{ location, proximity, vibe, notes }` | `201 + document` |

### Sémantiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/ambiance/:location/status` | Ambiance actuelle du lieu |
| `GET` | `/ambiance/:location/history?last=3h` | Évolution par tranches de temps |
| `GET` | `/ambiance/:location/quiet-hours` | Créneaux typiquement calmes |

> Les routes `POST /measurements` et `POST /observations` requièrent un header `x-api-key` valide.  
> `POST /devices` est public — obtenir une clé API ne nécessite pas d'authentification.

---

## Authentification

1. Enregistre ton device : `POST /devices { name, location }`
2. Récupère l'`apiKey` dans la réponse
3. Inclus-la dans chaque requête d'écriture POST: `x-api-key: <ta-clé>`

---

## Structure du projet

```
src/
├── middlewares/
│   └── auth.js
├── models/
│   ├── Device.js
│   ├── Measurement.js
│   └── Observation.js
├── routes/
│   └── devices.js
├── services/
│   └── mongoose.js
└── index.js
```

---

## IFT3225 — Phase 1
