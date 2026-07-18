# AmbiSense

AmbiSense est une application IFT3225 qui collecte des mesures sonores et présente l'ambiance interprétée de lieux publics. La phase 2 ajoute une API descriptive, des comptes utilisateurs et une application React avec carte, portraits de lieux et soumission d'observations.

## Prérequis

- Node.js 18 ou plus récent
- MongoDB Atlas ou une instance MongoDB accessible
- Deux terminaux : un pour l'API et un pour le client React

## Installation

À la racine du dépôt :

```bash
npm install
copy .env.example .env
```

Renseigner ensuite `MONGO_URI` et `JWT_SECRET` dans `.env`.

Installer le client :

```bash
cd client
npm install
copy .env.example .env
```

`client/.env` contient l'adresse publique de l'API :

```env
VITE_API_URL=http://localhost:3000
```

## Lancement

Terminal 1, à la racine :

```bash
npm run dev
```

Terminal 2 :

```bash
cd client
npm run dev
```

Ouvrir ensuite l'adresse affichée par Vite, normalement `http://localhost:5173`.

## Authentification

AmbiSense conserve deux mécanismes distincts :

- `x-api-key` authentifie un dispositif de collecte de la phase 1;
- `Authorization: Bearer <jeton>` authentifie un compte humain de la phase 2.

Dans l'interface, utiliser **Créer un compte**, puis **Ajouter une observation**. Le jeton JWT est conservé dans `localStorage`, validé avec `GET /users/me` au chargement et envoyé uniquement aux actions protégées.

## Endpoints principaux

### Phase 1 préservée

| Méthode | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/devices` | Publique | Créer un dispositif et recevoir sa clé API |
| `GET` | `/devices` | Publique | Lister les dispositifs sans exposer leurs clés |
| `POST` | `/measurements` | `x-api-key` | Enregistrer une mesure sonore |
| `POST` | `/observations` | Clé API ou JWT | Enregistrer une observation |
| `GET` | `/ambiance/:location/status` | Publique | Lire l'ambiance actuelle |
| `GET` | `/ambiance/:location/history?last=3h` | Publique | Lire l'historique existant |

Le champ historique `status` reste présent. La réponse du statut ajoute `classification`, `scale`, `isRecent` et le seuil de fraîcheur de 60 minutes.

### Phase 2

| Méthode | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/places` | Publique | Lieux, coordonnées et ambiance actuelle |
| `GET` | `/places/:slug` | Publique | Portrait actuel d'un lieu |
| `POST` | `/places` | `x-api-key` | Ajouter un lieu avec ses coordonnées |
| `POST` | `/users` | Publique | Créer un compte |
| `POST` | `/users/login` | Publique | Se connecter |
| `GET` | `/users/me` | JWT | Lire l'identité connectée |
| `POST` | `/users/logout` | JWT | Révoquer le jeton courant |
| `GET` | `/users/me/observations` | JWT | Retrouver les observations du compte |

Exemple d'ajout d'un lieu après avoir créé un dispositif :

```bash
curl -X POST http://localhost:3000/places \
  -H "Content-Type: application/json" \
  -H "x-api-key: VOTRE_CLE" \
  -d '{"name":"Bibliotheque","slug":"bibliotheque","latitude":45.5017,"longitude":-73.5673}'
```

Le champ `name` doit correspondre au champ `location` utilisé dans les mesures pour que l'API rattache le portrait au bon lieu.

## Vérification

API :

```bash
npm test
```

Client :

```bash
cd client
npm test
npm run lint
npm run build
```

## Structure

```text
src/
  middlewares/     authentification des dispositifs et utilisateurs
  models/          modèles Mongoose
  routes/          endpoints Express
  services/        connexion MongoDB et classification d'ambiance
tests/             tests de l'API
client/
  src/
    components/    composants d'affichage réutilisables
    context/       état d'authentification partagé
    hooks/         cycle de chargement des données
    pages/         vues liées aux routes
    services/      appels isolés vers l'API
```

## Données à recueillir

La remise doit contenir au moins **12 nouvelles mesures réparties sur 3 lieux différents**. Le lieu de la phase 1 peut compter parmi les trois.

## Fonctionnalités réservées aux coéquipiers

Quatre tickets indépendants restent volontairement à réaliser :

1. Graphe d'historique dans le portrait d'un lieu.
2. Calcul serveur et affichage des créneaux calmes.
3. Persistance et interface des lieux favoris.
4. Récapitulatif visuel des contributions et des lieux visités dans l'espace compte.

L'endpoint d'historique et `GET /users/me/observations` fournissent déjà les points d'intégration nécessaires aux tickets 1 et 4.
