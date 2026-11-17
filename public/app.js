import { envoyerVirement } from "./api.js";
import { PLAFOND_JOURNALIER_CENTIMES, formaterEuros, verifierVirement } from "./plafond.js";

const formulaire = document.querySelector("#virement");
const message = document.querySelector("#message");
const plafond = document.querySelector("#plafond");
const dejaVire = new Map();

function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

function afficherPlafond() {
  const compte = formulaire.compte.value;
  const restant = PLAFOND_JOURNALIER_CENTIMES - (dejaVire.get(compte) ?? 0);
  plafond.textContent = `Plafond journalier : ${formaterEuros(PLAFOND_JOURNALIER_CENTIMES)} · reste aujourd'hui : ${formaterEuros(Math.max(restant, 0))}`;
}

function afficherMessage(texte, type) {
  message.textContent = texte;
  message.className = type;
}

formulaire.compte.addEventListener("change", afficherPlafond);

formulaire.addEventListener("submit", async (evenement) => {
  evenement.preventDefault();
  const compte = formulaire.compte.value;
  const verification = verifierVirement(formulaire.montant.value, PLAFOND_JOURNALIER_CENTIMES, dejaVire.get(compte) ?? 0);
  if (!verification.ok) {
    return afficherMessage(verification.message, "erreur");
  }
  try {
    const reponse = await envoyerVirement({
      compte,
      montant_centimes: verification.montant,
      jour: aujourdhui(),
      libelle: formulaire.libelle.value || "Virement",
    });
    dejaVire.set(compte, (dejaVire.get(compte) ?? 0) + verification.montant);
    afficherMessage(`Virement accepté. Il vous reste ${formaterEuros(reponse.restant_centimes)} aujourd'hui.`, "succes");
    formulaire.montant.value = "";
  } catch (erreur) {
    afficherMessage(erreur.message, "erreur");
  }
  afficherPlafond();
});

afficherPlafond();
