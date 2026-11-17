# contoso-paiements-web

Interface de virement de **Contoso Banque**, dépôt d'exemple de l'atelier [« Usine logicielle agentique »](https://github.com/Tmadkaud/atelier-usine-agentique). Données et entreprise fictives.

## Lancer

```shell
node --test               # tests
node src/serveur.mjs      # interface sur http://127.0.0.1:3000
```

L'interface relaie `/api` vers le service `contoso-paiements-api` créé avec ce dépôt (`http://127.0.0.1:8000` par défaut, variable `API_URL`). Node.js 20 ou plus, aucune dépendance npm.

## Garde-fous des agents

`.github/hooks/garde-fous.json` déclenche `.github/hooks/garde-fous.mjs` avant chaque outil utilisé par un agent Copilot (Copilot app et Copilot CLI) : actions destructrices refusées, zones sensibles soumises à validation humaine.
