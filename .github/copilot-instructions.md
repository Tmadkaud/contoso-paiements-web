# Instructions Copilot : contoso-paiements-web

Interface de virement de Contoso Banque (exemple d'atelier, données synthétiques). Node.js 20 ou plus, aucune dépendance npm.

## Règles
- Les montants sont des **entiers en centimes** ; la conversion se fait uniquement dans `src/plafond.js`.
- Le serveur (`contoso-paiements-api`) reste l'autorité : l'interface vérifie pour le confort de l'utilisateur, l'API décide.
- Textes en français, ton sobre ; montants affichés avec `formaterEuros`.
- Pas de nouvelle dépendance npm sans validation humaine.

## Tests
- Lancer : `node --test`
- Lancer l'interface : `node src/serveur.mjs` (relaie `/api` vers `http://127.0.0.1:8000`, modifiable avec `API_URL`).

## Pull requests
- Suivre le modèle de PR et remplir la section « Preuves » (capture d'écran si l'interface change).
- Lier l'issue (`Closes #N`). Ne jamais contourner les règles de fusion.
