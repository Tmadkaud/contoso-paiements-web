#!/usr/bin/env node
// Garde-fous Contoso : hook preToolUse des agents Copilot (Copilot app et Copilot CLI).
// Autonomie graduée selon le risque : rien en sortie = comportement normal,
// "ask" = validation humaine, "deny" = refus avec la raison affichée à l'agent.
// Le script ne doit jamais échouer : une erreur ou un code de sortie non nul bloquerait l'outil.
import { pathToFileURL } from "node:url";

const OUTILS_ECRITURE = /^(create|edit|str_replace_editor|apply_patch|write|write_file|multi_edit)$/i;
const ZONES_SENSIBLES = [
  { motif: /(^|\/)\.github\/workflows\//i, zone: "pipelines CI/CD" },
  { motif: /(^|\/)\.github\/hooks\//i, zone: "garde-fous des agents" },
  { motif: /(^|\/)CODEOWNERS$/i, zone: "propriétaires du code" },
];
const SECRET = /(^|[\s"'`=:/\\])(\.env(\.(?!example\b|sample\b|template\b)[\w-]+)?|id_rsa|id_ed25519|[\w-]+\.pem)(?=$|[\s"'`;|&)])/i;

const REGLES_SHELL = [
  {
    teste: (s) => /\bgit\b/.test(s) && /\bpush\b/.test(s) && /(\s)(--force(-with-lease)?|-f)(?=$|[\s=])|\s\+[\w./-]+/.test(s),
    raison: "push forcé interdit : l'historique partagé ne se réécrit pas.",
  },
  {
    teste: (s) => /\bgit\b/.test(s) && /\s--no-verify\b/.test(s),
    raison: "contourner les vérifications (--no-verify) est interdit.",
  },
  {
    teste: (s) => /\bgh\s+pr\s+merge\b/.test(s) && /\s--admin\b/.test(s),
    raison: "fusionner en contournant les règles (--admin) est interdit : les règles décident.",
  },
  {
    teste: (s) =>
      /\bgh\s+api\b/.test(s) &&
      /(rulesets|\/protection\b)/.test(s) &&
      /(-X|--method)[\s=]*(POST|PUT|PATCH|DELETE)\b/i.test(s),
    raison: "les règles de protection sont gérées par l'équipe plateforme, pas par les agents.",
  },
  {
    teste: (s) =>
      /\bgh\s+repo\s+delete\b/.test(s) || (/\bgh\s+api\b/.test(s) && /(-X|--method)[\s=]*DELETE\b/i.test(s) && /\brepos\//.test(s)),
    raison: "supprimer des dépôts ou des ressources GitHub est interdit.",
  },
];
const RAISON_SECRET = "lire ou écrire des secrets (.env, clés privées) est interdit : utilisez les variables d'environnement fournies.";

function lireArguments(toolArgs) {
  if (typeof toolArgs === "string") {
    try {
      return JSON.parse(toolArgs);
    } catch {
      return { brut: toolArgs };
    }
  }
  return toolArgs && typeof toolArgs === "object" ? toolArgs : {};
}

function cheminsDe(args) {
  const chemins = [];
  for (const cle of ["path", "file_path", "filePath", "target_file"]) {
    if (typeof args[cle] === "string") chemins.push(args[cle]);
  }
  if (Array.isArray(args.paths)) chemins.push(...args.paths.filter((c) => typeof c === "string"));
  for (const cle of ["input", "patch", "brut"]) {
    if (typeof args[cle] === "string") {
      for (const ligne of args[cle].matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)) chemins.push(ligne[1].trim());
    }
  }
  return chemins.map((c) => c.replace(/\\/g, "/"));
}

function decision(type, raison) {
  return { permissionDecision: type, permissionDecisionReason: `Garde-fou Contoso : ${raison}` };
}

export function decider(entree) {
  const outil = String(entree?.toolName ?? "");
  const args = lireArguments(entree?.toolArgs);

  if (typeof args.command === "string") {
    const sansTexte = args.command.replace(/"[^"]*"|'[^']*'/g, '""');
    const segments = sansTexte.split(/&&|\|\||[;|\n]/).map((segment) => ` ${segment.trim()} `);
    for (const regle of REGLES_SHELL) {
      if (segments.some((segment) => regle.teste(segment))) return decision("deny", regle.raison);
    }
    if (SECRET.test(` ${args.command} `)) return decision("deny", RAISON_SECRET);
  }

  const chemins = cheminsDe(args);
  if (chemins.some((chemin) => SECRET.test(` ${chemin} `))) {
    return decision("deny", RAISON_SECRET);
  }
  if (OUTILS_ECRITURE.test(outil)) {
    for (const chemin of chemins) {
      const sensible = ZONES_SENSIBLES.find((z) => z.motif.test(chemin));
      if (sensible) return decision("ask", `zone sensible (${sensible.zone}) : modification soumise à validation humaine.`);
    }
  }
  return null;
}

async function principal() {
  let brut = "";
  process.stdin.setEncoding("utf8");
  for await (const morceau of process.stdin) brut += morceau;
  const resultat = decider(JSON.parse(brut || "{}"));
  if (resultat) process.stdout.write(JSON.stringify(resultat));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((erreur) => {
    process.stderr.write(`garde-fous : erreur interne ignorée (${erreur?.message ?? erreur})\n`);
  }).finally(() => {
    process.exitCode = 0;
  });
}
