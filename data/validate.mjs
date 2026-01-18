import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readJSON(rel){
  const p = path.join(ROOT, rel);
  const raw = fs.readFileSync(p, "utf8");
  try{
    return JSON.parse(raw);
  }catch(e){
    throw new Error(`JSON parse error in ${rel}: ${e.message}`);
  }
}

function isISODate(s){
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isTime(s){
  // very loose HH:MM 24h
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

function err(msg){ errors.push(msg); }
function warn(msg){ warnings.push(msg); }

let errors = [];
let warnings = [];

function validateArtists(artists){
  const sides = ["tekno", "hiphop"];
  for(const side of sides){
    const list = artists?.[side];
    if(!Array.isArray(list)){
      err(`artists.json: "${side}" moet een array zijn.`);
      continue;
    }

    const slugs = new Set();
    for(const [i,a] of list.entries()){
      const where = `artists.json:${side}[${i}]`;
      if(!a || typeof a !== "object"){
        err(`${where} is geen object.`);
        continue;
      }

      if(!a.slug || typeof a.slug !== "string") err(`${where}.slug ontbreekt of is geen string.`);
      if(!a.name || typeof a.name !== "string") err(`${where}.name ontbreekt of is geen string.`);
      if(!a.role || typeof a.role !== "string") warn(`${where}.role ontbreekt (mag, maar liefst invullen).`);

      if(a.slug){
        if(slugs.has(a.slug)) err(`${where}.slug "${a.slug}" is dubbel binnen "${side}".`);
        slugs.add(a.slug);
      }

      if(a.links && typeof a.links !== "object") err(`${where}.links moet een object zijn als het bestaat.`);
    }
  }
}

function validateEvents(events, artists){
  const sides = ["tekno", "hiphop"];
  const validTicketModes = new Set(["external", "internal", "tba"]);

  // Build artist slug lookup per side
  const artistSlug = {
    tekno: new Set((artists?.tekno || []).map(a => a.slug).filter(Boolean)),
    hiphop: new Set((artists?.hiphop || []).map(a => a.slug).filter(Boolean))
  };

  for(const side of sides){
    const list = events?.[side];
    if(!Array.isArray(list)){
      err(`events.json: "${side}" moet een array zijn.`);
      continue;
    }

    const ids = new Set();

    for(const [i,e] of list.entries()){
      const where = `events.json:${side}[${i}]`;
      if(!e || typeof e !== "object"){
        err(`${where} is geen object.`);
        continue;
      }

      if(!e.id || typeof e.id !== "string") err(`${where}.id ontbreekt of is geen string.`);
      if(e.id){
        if(ids.has(e.id)) err(`${where}.id "${e.id}" is dubbel binnen "${side}".`);
        ids.add(e.id);
      }

      if(!e.title || typeof e.title !== "string") err(`${where}.title ontbreekt of is geen string.`);
      if(!isISODate(e.date)) err(`${where}.date moet YYYY-MM-DD zijn.`);
      if(e.time && !isTime(e.time)) warn(`${where}.time lijkt niet HH:MM (staat: "${e.time}")`);

      // tickets
      const mode = e?.tickets?.mode ?? "tba";
      if(!validTicketModes.has(mode)){
        err(`${where}.tickets.mode moet one of: external | internal | tba (staat: "${mode}")`);
      }
      if(mode === "external"){
        const url = e?.tickets?.url ?? "";
        if(!url) warn(`${where}: tickets.mode=external maar tickets.url is leeg.`);
      }

      // lineup slugs
      if(e.lineup && !Array.isArray(e.lineup)) err(`${where}.lineup moet een array zijn als het bestaat.`);
      const lineup = Array.isArray(e.lineup) ? e.lineup : [];
      for(const [j,a] of lineup.entries()){
        const lwhere = `${where}.lineup[${j}]`;
        if(!a || typeof a !== "object"){
          err(`${lwhere} is geen object.`);
          continue;
        }
        if(a.slug){
          if(!artistSlug[side].has(a.slug)){
            warn(`${lwhere}.slug "${a.slug}" bestaat niet in artists.json (${side}).`);
          }
        }else{
          warn(`${lwhere}.slug ontbreekt (handig voor doorklik).`);
        }
      }
    }
  }
}

try{
  const artists = readJSON("data/artists.json");
  const events  = readJSON("data/events.json");

  validateArtists(artists);
  validateEvents(events, artists);

}catch(e){
  err(e.message);
}

const ok = errors.length === 0;

console.log("— Kwartier West data validation —");
console.log(`Errors:   ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log("");

if(errors.length){
  console.log("ERRORS:");
  for(const m of errors) console.log(" - " + m);
  console.log("");
}
if(warnings.length){
  console.log("WARNINGS:");
  for(const m of warnings) console.log(" - " + m);
  console.log("");
}

process.exit(ok ? 0 : 1);
