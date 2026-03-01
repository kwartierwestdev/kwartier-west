import fs from "node:fs/promises";
import path from "node:path";

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function sideSafe(value = "") {
  return normalize(value) === "tekno" ? "tekno" : "hiphop";
}

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, "https://kwartierwest.be");
    const side = sideSafe(url.searchParams.get("side"));
    const slug = normalize(url.searchParams.get("slug"));

    if (slug) {
      response.statusCode = 308;
      response.setHeader("location", `/pages/${side}/artist/${encodeURIComponent(slug)}`);
      response.end();
      return;
    }

    const file = path.join(process.cwd(), "pages", side, "artist.html");
    const html = await fs.readFile(file, "utf8");
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.status(200).send(html);
  } catch {
    response.status(500).send("Artist legacy route error.");
  }
}
