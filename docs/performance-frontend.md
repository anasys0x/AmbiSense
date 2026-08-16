# Mesure et optimisation des performances du frontend

Mesure effectuée avec le build Vite de production :

```bash
cd client
npm run build
```

Les tailles ci-dessous correspondent aux fichiers générés par Vite. La mesure
initiale a été conservée avant l'optimisation, après l'intégration du cache
frontend de la tâche #38.

## Résultats avant/après

| Indicateur | Avant | Après | Évolution |
|---|---:|---:|---:|
| Chunk `PlacePage` | 358,93 kB | 9,80 kB | -97,3 % |
| Chunk `PlacePage` gzip | 104,52 kB | 3,71 kB | -96,5 % |
| Total des chunks JavaScript | 773,63 kB | 424,37 kB | -45,2 % |
| Total JavaScript gzip | 234,56 kB | 133,71 kB | -43,0 % |
| Modules transformés par Vite | 665 | 103 | -84,5 % |

## Problème principal identifié

Le graphique d'historique importait `Recharts` dans `PlacePage`. Cette seule
dépendance et ses dépendances transitives représentaient presque tout le chunk
de la page, même si le graphique requis par AmbiSense reste relativement
simple.

## Optimisation appliquée

- Remplacement de `Recharts` par un graphique SVG natif et léger.
- Conservation des bandes d'ambiance, axes, ruptures entre mesures éloignées,
  points, infobulles natives et libellé accessible.
- Suppression de `Recharts` et de ses 38 dépendances transitives.
- Conservation du chargement à la demande des pages avec `React.lazy`.

Les 51 tests frontend passent après la modification et le build de production
réussit.

## Faiblesses restantes

- La feuille CSS principale mesure 241,20 kB (33,70 kB gzip), principalement à
  cause de l'import complet de Bootstrap. Une sélection plus fine des modules
  Bootstrap pourrait la réduire, mais demanderait une validation visuelle de
  toutes les pages.
- `MapPage` mesure 156,57 kB (46,27 kB gzip) à cause de Leaflet. Cette page est
  déjà chargée à la demande et son poids n'affecte donc pas la page d'accueil.
- Un rapport Lighthouse complet reste pertinent après le déploiement, car il
  mesurera aussi le réseau, le serveur, les images et le rendu dans un vrai
  navigateur.
