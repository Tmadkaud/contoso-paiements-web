import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

import { envoyerVirement } from "../src/api.js";
import { creerServeur } from "../src/serveur.mjs";

function fauxFetch(statut, donnees, appels = []) {
  return async (url, options) => {
    appels.push({ url, options });
    return { ok: statut < 400, status: statut, json: async () => donnees };
  };
}

test("envoyerVirement poste le virement en JSON", async () => {
  const appels = [];
  const reponse = await envoyerVirement(
    { compte: "P-1001", montant_centimes: 1000, jour: "2026-11-17" },
    { fetch: fauxFetch(201, { statut: "accepté", restant_centimes: 499000 }, appels) },
  );
  assert.equal(reponse.restant_centimes, 499000);
  assert.equal(appels[0].url, "/api/virements");
  assert.equal(JSON.parse(appels[0].options.body).montant_centimes, 1000);
});

test("envoyerVirement remonte le message d'erreur de l'API", async () => {
  await assert.rejects(
    envoyerVirement({}, { fetch: fauxFetch(422, { erreur: "Plafond journalier dépassé" }) }),
    /Plafond journalier dépassé/,
  );
});

let fausseApi;
let web;
let base;

before(async () => {
  fausseApi = createServer((req, res) => {
    let corps = "";
    req.on("data", (morceau) => (corps += morceau));
    req.on("end", () => {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ chemin: req.url, recu: JSON.parse(corps || "{}") }));
    });
  });
  await new Promise((resolve) => fausseApi.listen(0, "127.0.0.1", resolve));
  web = creerServeur({ api: `http://127.0.0.1:${fausseApi.address().port}` });
  await new Promise((resolve) => web.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${web.address().port}`;
});

after(() => {
  web.close();
  fausseApi.close();
});

test("le serveur web sert la page et relaie /api vers l'API", async () => {
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Nouveau virement/);

  const relais = await fetch(`${base}/api/virements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ montant_centimes: 42 }),
  });
  assert.equal(relais.status, 201);
  assert.deepEqual(await relais.json(), { chemin: "/virements", recu: { montant_centimes: 42 } });

  assert.equal((await fetch(`${base}/../package.json`)).status, 404);
});
