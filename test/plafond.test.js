import assert from "node:assert/strict";
import { test } from "node:test";

import { formaterEuros, lireSaisie, montantRestant, verifierVirement } from "../src/plafond.js";

test("formaterEuros affiche les centimes au format français", () => {
  assert.equal(formaterEuros(123456), "1\u202f234,56\u00a0€");
  assert.equal(formaterEuros(5), "0,05\u00a0€");
  assert.equal(formaterEuros(-250), "-2,50\u00a0€");
  assert.equal(formaterEuros(500000), "5\u202f000,00\u00a0€");
});

test("lireSaisie convertit la saisie en centimes entiers", () => {
  assert.equal(lireSaisie("1 234,56"), 123456);
  assert.equal(lireSaisie("1234.5"), 123450);
  assert.equal(lireSaisie("12 €"), 1200);
  for (const invalide of ["", "abc", "-5", "0", "12,345", "1,2,3", null]) {
    assert.equal(lireSaisie(invalide), null, `saisie ${invalide}`);
  }
});

test("montantRestant ne descend jamais sous zéro", () => {
  assert.equal(montantRestant(500000, 120000), 380000);
  assert.equal(montantRestant(500000, 600000), 0);
});

test("verifierVirement bloque au-delà du plafond restant", () => {
  assert.deepEqual(verifierVirement("100", 500000, 0), { ok: true, montant: 10000 });
  assert.deepEqual(verifierVirement("1 000", 500000, 400000), { ok: true, montant: 100000 });
  const refus = verifierVirement("1 000,01", 500000, 400000);
  assert.equal(refus.ok, false);
  assert.match(refus.message, /il vous reste 1\u202f000,00\u00a0€/);
  assert.equal(verifierVirement("n'importe quoi", 500000, 0).ok, false);
});
