// Règles d'affichage et de saisie des virements. Montants en centimes entiers.

export const PLAFOND_JOURNALIER_CENTIMES = 500_000;

export function formaterEuros(centimes) {
  const signe = centimes < 0 ? "-" : "";
  const absolu = Math.abs(centimes);
  const euros = Math.trunc(absolu / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  const reste = String(absolu % 100).padStart(2, "0");
  return `${signe}${euros},${reste}\u00a0€`;
}

export function montantRestant(plafondCentimes, dejaVireCentimes) {
  return Math.max(plafondCentimes - dejaVireCentimes, 0);
}

export function lireSaisie(texte) {
  if (typeof texte !== "string") return null;
  const nettoye = texte.replace(/[\s\u00a0\u202f€]/g, "").replace(",", ".");
  const correspondance = /^(\d+)(?:\.(\d{1,2}))?$/.exec(nettoye);
  if (!correspondance) return null;
  const total = Number(correspondance[1]) * 100 + Number((correspondance[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(total) && total > 0 ? total : null;
}

export function verifierVirement(saisie, plafondCentimes, dejaVireCentimes) {
  const montant = lireSaisie(saisie);
  if (montant === null) {
    return { ok: false, message: "Saisissez un montant positif, au centime près." };
  }
  const restant = montantRestant(plafondCentimes, dejaVireCentimes);
  if (montant > restant) {
    return { ok: false, message: `Plafond journalier atteint : il vous reste ${formaterEuros(restant)} aujourd'hui.` };
  }
  return { ok: true, montant };
}
