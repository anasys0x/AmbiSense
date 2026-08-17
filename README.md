# AmbiSense

AmbiSense est le projet IFT3225 de collecte et de consultation d'ambiances sonores. La phase 3 consolide l'application développée aux phases précédentes : elle ajoute des recommandations par ambiance et par heure, améliore la séparation des responsabilités, couvre les services par des tests, introduit des caches frontend et backend, optimise le chargement du client et déploie l'ensemble sur Render.

## Application en ligne

- Client React : [https://ambisense-client.onrender.com](https://ambisense-client.onrender.com)
- API Express : [https://ambisense-api.onrender.com](https://ambisense-api.onrender.com)
- Santé de l'API : [https://ambisense-api.onrender.com/health](https://ambisense-api.onrender.com/health)

Les deux applications sont servies en HTTPS. Le client utilise l'URL publique de l'API et l'API limite CORS à l'origine du client déployé.

## Prérequis

- Node.js 20.19 ou plus récent (ou Node.js 22.12+)
- MongoDB Atlas ou une instance MongoDB accessible
- phyphox pour effectuer les collectes réelles

## Installation

À la racine du dépôt :

```bash
npm install
```

Créer ensuite le fichier d'environnement à partir de l'exemple :

```powershell
# Windows (PowerShell ou invite de commandes)
copy .env.example .env
```

```bash
# macOS ou Linux
cp .env.example .env
```

Configurer ensuite `.env` sans publier ses valeurs :

```env
MONGO_URI=mongodb+srv://...
PORT=1234
JWT_SECRET=une-longue-valeur-aleatoire
REMOTE_ACCESS=http://adresse-ip-du-telephone:8080
API_KEY=cle-api-du-dispositif
```

Une valeur JWT peut être générée avec `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
La clé API n'est affichée qu'une fois par `POST /devices`; l'API conserve uniquement son empreinte SHA-256.
Si une valeur a déjà été publiée, il faut la remplacer dans Atlas et dans `.env`, même si le dépôt est privé.

Installer le client :

```bash
cd client
npm install
```

Créer ensuite le fichier d'environnement du client :

```powershell
# Windows (PowerShell ou invite de commandes)
copy .env.example .env
```

```bash
# macOS ou Linux
cp .env.example .env
```

Le fichier `client/.env` doit pointer vers l'API :

```env
VITE_API_URL=http://localhost:1234
```

## Lancement

Utiliser des terminaux séparés.

API, depuis la racine :

```bash
npm run dev
```

Client React :

```bash
npm --prefix client run dev
```

Le client est normalement accessible sur `http://localhost:5173`.

Pour une collecte phyphox, démarrer l'accès à distance dans l'application mobile, configurer `REMOTE_ACCESS` et `API_KEY`, puis lancer :

```bash
npm run bridge
```

## Authentification

Deux mécanismes coexistent :

- `x-api-key` identifie un dispositif de collecte;
- `Authorization: Bearer <jeton>` identifie un compte utilisateur.

Le JWT est créé par l'API lors de l'inscription ou de la connexion. Le client le conserve et l'envoie automatiquement pour les actions protégées. Il ne faut donc pas générer de JWT manuellement pour utiliser le frontend.

## Endpoints principaux

| Méthode | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/devices` | Publique | Créer un dispositif et recevoir sa clé API |
| `GET` | `/devices` | Publique | Lister les dispositifs sans exposer leurs clés |
| `GET` | `/devices/me` | Clé API | Consulter le dispositif courant |
| `POST` | `/measurements` | Clé API | Enregistrer une mesure sonore |
| `POST` | `/observations` | Clé API ou JWT | Enregistrer une observation |
| `GET` | `/health` | Publique | Vérifier que l'API déployée répond |
| `GET` | `/ambiance/:location/status` | Publique | Lire l'ambiance actuelle et sa classification |
| `GET` | `/ambiance/:location/history?last=3` | Publique | Lire l'historique agrégé en tranches horaires |
| `GET` | `/ambiance/:location/quiet-hours` | Publique | Calculer les heures généralement les plus calmes |
| `GET` | `/ambiance/:location/vibe` | Publique | Résumer les dernières observations humaines |
| `GET` | `/places` | Publique | Lister les lieux, coordonnées et ambiances |
| `GET` | `/places/:slug` | Publique | Consulter le portrait d'un lieu |
| `POST` | `/places` | Clé API | Ajouter un lieu avec ses coordonnées |
| `POST` | `/users` | Publique | Créer un compte |
| `POST` | `/users/login` | Publique | Se connecter |
| `GET` | `/users/me` | JWT | Consulter le compte connecté |
| `POST` | `/users/logout` | JWT | Se déconnecter |
| `GET` | `/users/me/observations` | JWT | Consulter ses observations |
| `GET` | `/users/me/favorites` | JWT | Consulter ses lieux favoris |
| `POST` | `/users/me/favorites/:placeId` | JWT | Ajouter un lieu à ses favoris |
| `DELETE` | `/users/me/favorites/:placeId` | JWT | Retirer un lieu de ses favoris |
| `GET` | `/recommendations?ambiance=calm&hour=14` | Publique | Classer les lieux selon l'ambiance et l'heure souhaitées |
| `GET` | `/ambiance/stream?location=...` | Publique | Recevoir les classifications en SSE (bonus) |

L'espace compte présente les observations du compte de la plus récente à la plus ancienne,
en déduit les lieux visités sans doublons et permet de retirer un lieu favori. Un utilisateur
connecté peut aussi ajouter ou retirer le lieu courant depuis son portrait d'ambiance.

Exemple d'ajout d'un lieu :

```bash
curl -X POST http://localhost:1234/places \
  -H "Content-Type: application/json" \
  -H "x-api-key: VOTRE_CLE" \
  -d '{"name":"Bibliotheque","slug":"bibliotheque","locationKey":"biblio_jb","latitude":45.5017,"longitude":-73.5673}'
```

`name` est le libellé public. `locationKey` doit correspondre au champ `location` envoyé dans les mesures et observations. Cette séparation permet de corriger un nom affiché sans casser les collecteurs existants. Les anciens lieux sans `locationKey` continuent d'utiliser leur nom comme repli.

L'historique regroupe les mesures en tranches de 5 minutes pour la période de 3 heures et de 60 minutes pour les périodes plus longues. Pour ne pas casser la phase 1, `data` et `measurements` contiennent les documents bruts; `slices` contient les moyennes utilisées par le graphe. Chaque tranche expose aussi le minimum, le maximum et le nombre de mesures. Une période sans mesure retourne `200` avec des tableaux vides et un compteur à zéro.

## Collecte réelle et solution de repli

Le bridge lit un échantillon fourni par phyphox toutes les cinq secondes. Il conserve cette valeur ponctuelle au lieu de moyenner arbitrairement un lot côté bridge. Les moyennes utiles à la visualisation sont calculées ensuite par l'historique, avec le nombre, le minimum et le maximum pour garder le contexte.

Flux recommandé pour chacun des trois lieux :

1. créer le dispositif avec `POST /devices` et copier la clé retournée dans `API_KEY`;
2. créer le lieu avec `POST /places`, ses coordonnées et le même `locationKey` que le collecteur;
3. démarrer l'accès à distance phyphox et `npm run bridge`;
4. vérifier la réception dans `/ambiance/:location/status`, puis ajouter au besoin une observation depuis le frontend;
5. conserver au total au moins 12 nouvelles mesures réelles réparties sur 3 lieux.

Si phyphox est momentanément indisponible, un envoi manuel permet seulement de tester le pipeline : `POST /measurements` avec `type`, `value`, `location` et `timestamp`, ainsi que `x-api-key`. Cette solution de repli doit être identifiée comme manuelle et ne constitue pas une preuve de collecte physique.

## Données de démonstration

Le script suivant ajoute un dispositif, des mesures réparties sur deux jours et quelques observations pour tester les écrans et les endpoints :

```bash
npm run seed
```

Ces données artificielles servent au développement. Elles ne remplacent pas les données réelles demandées pour la remise : au moins **12 nouvelles mesures réparties sur 3 lieux différents**, recueillies avec phyphox.

## Sécurité et HTTPS

Les mots de passe utilisateurs sont hachés, les comptes utilisent des JWT et les appareils sont recherchés par empreinte de clé. En local, Express et Vite servent en HTTP. En production, Render termine TLS pour les deux adresses HTTPS, CORS est limité par `CLIENT_ORIGIN` et les secrets sont stockés dans les variables d'environnement de l'hébergeur.

## Cache backend

Les lectures publiques coûteuses sont mises en cache en mémoire (`src/services/cache.js`) pour éviter de recalculer la même réponse à chaque visiteur :

| Donnée | Clé | Durée de vie | Invalidation |
|---|---|---|---|
| Historique `/ambiance/:location/history` | `history:<lieu>:<période>:<format>` | 1 min | Nouvelle mesure du lieu |
| Créneaux calmes `/ambiance/:location/quiet-hours` | `quiet-hours:<lieu>` | 5 min | Nouvelle mesure du lieu |
| Recommandations `/recommendations` | `recommendations:<ambiance>:<heure>` | 5 min | Toute nouvelle mesure |

Une nouvelle mesure (`POST /measurements`) vide immédiatement les entrées concernées. **Ne sont jamais mis en cache** : les écritures (`POST`), l'authentification et les comptes, ni le flux SSE `GET /ambiance/stream` (temps réel par nature).

## Cache frontend

Le client conserve pendant 30 secondes les lectures publiques de lieux, d'historique, de créneaux calmes et de recommandations. Le cache est une `Map` en mémoire : il disparaît lorsque l'onglet est fermé et ne place aucune donnée dans `localStorage` ou `sessionStorage`.

La clé correspond à l'URL complète de la requête. Une entrée est supprimée à son expiration, un rechargement explicite ignore la copie, et une observation enregistrée avec succès vide les lectures publiques qui pourraient être devenues anciennes. Les requêtes authentifiées, les comptes, les favoris, les écritures et les réponses en erreur ne sont jamais mis en cache.

## Déploiement sur Render

### Backend

L'API est déployée comme service web Node. Le fichier [`render.yaml`](render.yaml) décrit sa construction, son démarrage, sa route de santé et ses variables.

1. Créer un **Web Service** relié au dépôt (ou « New + » → « Blueprint » pour lire `render.yaml`).
2. Build command : `npm install` — Start command : `npm start`.
3. Variables d'environnement (onglet *Environment*, jamais dans le code) : `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (URL du frontend déployé), `APP_TIMEZONE`. Render fournit `PORT` automatiquement ; le serveur écoute `process.env.PORT`.
4. Dans MongoDB Atlas, autoriser l'accès réseau depuis Render (`0.0.0.0/0` ou les IP de sortie de Render).
5. Health check : `/health`. Vérifier ensuite une route publique (`/health`, `/places`) et une route protégée (`/users/me` avec un JWT).

### Frontend

Le dossier `client/` est déployé comme site statique Render :

- répertoire racine : `client`;
- commande de construction : `npm install && npm run build`;
- répertoire publié : `dist`;
- variable de construction : `VITE_API_URL=https://ambisense-api.onrender.com`;
- réécriture : `/*` vers `/index.html` pour conserver les routes React lors d'un accès direct.

Adresses en ligne vérifiées :

- API : [https://ambisense-api.onrender.com](https://ambisense-api.onrender.com)
- Client : [https://ambisense-client.onrender.com](https://ambisense-client.onrender.com)

> Sur le plan gratuit, le service s'endort après inactivité : la première requête peut prendre quelques secondes à réveiller l'instance.

## Performance frontend

La mesure du build, l'optimisation appliquée et la comparaison avant/après sont
documentées dans [`docs/performance-frontend.md`](docs/performance-frontend.md).

## Vérification

```bash
npm test
npm --prefix client test
npm --prefix client run lint
npm --prefix client run build
```

## Structure

```text
src/
  bridge/          liaison avec phyphox
  middlewares/     authentification des dispositifs et utilisateurs
  models/          modèles Mongoose
  repositories/    accès aux données des recommandations
  routes/          endpoints Express
  services/        logique métier, agrégation, cache et connexion MongoDB
scripts/           données de démonstration
tests/             tests de l'API
client/src/
  components/      composants React réutilisables
  context/         authentification partagée
  hooks/           chargement des données
  pages/           écrans de l'application
  services/        appels vers l'API
```
