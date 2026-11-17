// Appels à l'API de paiements, relayés par le serveur web sous /api.

export async function envoyerVirement(virement, { fetch: fetchImpl = globalThis.fetch, base = "/api" } = {}) {
  const reponse = await fetchImpl(`${base}/virements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(virement),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.erreur ?? `Erreur ${reponse.status}`);
  }
  return donnees;
}
