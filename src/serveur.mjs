// Serveur de développement : pages statiques et relais /api vers contoso-paiements-api.
import { readFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("..", import.meta.url));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};
const FICHIERS = {
  "/": "public/index.html",
  "/app.js": "public/app.js",
  "/style.css": "public/style.css",
  "/plafond.js": "src/plafond.js",
  "/api.js": "src/api.js",
};

export function creerServeur({ api = process.env.API_URL ?? "http://127.0.0.1:8000" } = {}) {
  const amontApi = new URL(api);
  return createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      return relayer(req, res, amontApi, url.pathname.slice(4) + url.search);
    }
    const fichier = FICHIERS[url.pathname];
    if (!fichier) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Introuvable");
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(fichier)] });
    res.end(await readFile(join(racine, fichier)));
  });
}

function relayer(req, res, amontApi, chemin) {
  const entetes = { "content-type": req.headers["content-type"] ?? "application/json" };
  if (req.headers["content-length"]) entetes["content-length"] = req.headers["content-length"];
  const amont = request(
    { hostname: amontApi.hostname, port: amontApi.port, path: chemin, method: req.method, headers: entetes },
    (reponse) => {
      res.writeHead(reponse.statusCode, { "Content-Type": reponse.headers["content-type"] ?? "application/json" });
      reponse.pipe(res);
    },
  );
  amont.on("error", () => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ erreur: "API indisponible : lancez contoso-paiements-api." }));
  });
  req.pipe(amont);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  creerServeur().listen(port, "127.0.0.1", () => {
    console.log(`Contoso Paiements (web) : http://127.0.0.1:${port}`);
  });
}
